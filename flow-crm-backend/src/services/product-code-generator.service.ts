import { sql } from 'drizzle-orm';
import { db, executeWithRetry, getDatabase } from '../db/connection';
import { products } from '../db/schema/products';
import { getDatabaseConnectionManager } from '../utils/database-connection-manager';

/**
 * Interface for code generation results
 */
export interface CodeGenerationResult {
    code: string;           // Generated code (e.g., "PROD0000001")
    sequenceNumber: number; // Numeric sequence (e.g., 1)
    isGenerated: boolean;   // Flag indicating auto-generation
}

/**
 * Interface for sequence information
 */
export interface CodeSequenceInfo {
    lastSequence: number;   // Last used sequence number
    nextSequence: number;   // Next available sequence
    hasExistingProducts: boolean; // Whether products exist in database
}

/**
 * Custom error types for code generation
 */
export class CodeGenerationError extends Error {
    constructor(
        message: string,
        public code: 'SEQUENCE_EXHAUSTED' | 'CONCURRENCY_CONFLICT' | 'DATABASE_ERROR' | 'MAX_RETRIES_EXCEEDED' | 'SERVICE_UNAVAILABLE' | 'INVALID_CODE_FORMAT' | 'CONNECTION_ERROR',
        public retryable: boolean = false,
        public maxRetries?: number,
        public details?: any
    ) {
        super(message);
        this.name = 'CodeGenerationError';
    }
}

/**
 * Product code generator service
 * Handles automatic generation of sequential product codes with format PROD + 7-digit zero-padded sequence
 */
export class ProductCodeGenerator {
    private static readonly CODE_PREFIX = 'PROD';
    private static readonly SEQUENCE_LENGTH = 7;
    private static readonly MAX_SEQUENCE = 9999999; // Maximum 7-digit number
    private static readonly CODE_REGEX = /^PROD(\d{7})$/;

    /**
     * Generate the next sequential product code with concurrency safety
     * @returns Promise<string> The generated code (e.g., "PROD0000001")
     */
    async generateNextCode(): Promise<string> {
        try {
            const result = await this.generateCodeWithConcurrencySafety();
            return result.code;
        } catch (error) {
            // Enhanced error handling for service unavailability
            if (this.isServiceUnavailableError(error)) {
                throw new CodeGenerationError(
                    'Product code generation service is temporarily unavailable. Please try again later or contact support if the issue persists.',
                    'SERVICE_UNAVAILABLE',
                    true,
                    undefined,
                    { originalError: (error as Error).message }
                );
            }
            throw error;
        }
    }

    /**
     * Generate code with full concurrency safety using database transactions and locking
     * @param maxRetries Maximum number of retry attempts for concurrency conflicts
     * @returns Promise<CodeGenerationResult> The generation result with metadata
     */
    async generateCodeWithConcurrencySafety(maxRetries: number = 3): Promise<CodeGenerationResult> {
        let attempts = 0;
        let lastError: Error | null = null;

        while (attempts < maxRetries) {
            try {
                return await this.generateCodeWithTransaction();
            } catch (error) {
                lastError = error as Error;
                attempts++;

                // Check if this is a retryable concurrency error
                if (this.isConcurrencyError(error)) {
                    if (attempts < maxRetries) {
                        // Exponential backoff with jitter for concurrency conflicts
                        const baseDelay = 100 * Math.pow(2, attempts - 1);
                        const jitter = Math.random() * 50;
                        const delay = baseDelay + jitter;

                        console.warn(`Code generation conflict (attempt ${attempts}/${maxRetries}), retrying in ${delay}ms`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }

                // For non-retryable errors or max retries exceeded, throw immediately
                break;
            }
        }

        // All retries exhausted or non-retryable error
        if (lastError) {
            if (this.isConcurrencyError(lastError)) {
                throw new CodeGenerationError(
                    `Failed to generate unique code after ${maxRetries} attempts due to concurrency conflicts`,
                    'MAX_RETRIES_EXCEEDED',
                    false,
                    maxRetries
                );
            }
            throw lastError;
        }

        throw new CodeGenerationError(
            `Code generation failed after ${maxRetries} attempts`,
            'MAX_RETRIES_EXCEEDED',
            false,
            maxRetries
        );
    }

    /**
     * Get the last sequence number from the database
     * @returns Promise<number> The last sequence number (0 if no products exist)
     */
    async getLastSequenceNumber(): Promise<number> {
        const sequenceInfo = await this.getSequenceInfo();
        return sequenceInfo.lastSequence;
    }

    /**
     * Validate if a code follows the correct PROD format
     * @param code The code to validate
     * @returns boolean True if the code is valid
     */
    validateCodeFormat(code: string): boolean {
        if (!code || typeof code !== 'string') {
            return false;
        }

        return ProductCodeGenerator.CODE_REGEX.test(code);
    }

    /**
     * Extract sequence number from a product code
     * @param code The product code (e.g., "PROD0000001")
     * @returns number The sequence number (e.g., 1) or 0 if invalid
     */
    extractSequenceNumber(code: string): number {
        if (!this.validateCodeFormat(code)) {
            return 0;
        }

        const match = code.match(ProductCodeGenerator.CODE_REGEX);
        return match ? parseInt(match[1], 10) : 0;
    }

    /**
     * Format a sequence number into a product code
     * @param sequenceNumber The sequence number to format
     * @returns string The formatted code (e.g., "PROD0000001")
     */
    formatCode(sequenceNumber: number): string {
        if (sequenceNumber < 1 || sequenceNumber > ProductCodeGenerator.MAX_SEQUENCE) {
            throw new Error(`Sequence number must be between 1 and ${ProductCodeGenerator.MAX_SEQUENCE}`);
        }

        const paddedSequence = sequenceNumber.toString().padStart(ProductCodeGenerator.SEQUENCE_LENGTH, '0');
        return `${ProductCodeGenerator.CODE_PREFIX}${paddedSequence}`;
    }

    /**
     * Generate code using database transaction with row-level locking for atomicity
     * Enhanced with comprehensive error handling for edge cases
     * @returns Promise<CodeGenerationResult> The generation result
     */
    private async generateCodeWithTransaction(): Promise<CodeGenerationResult> {
        let client: any = null;

        try {
            const connectionManager = getDatabaseConnectionManager();
            const pool = connectionManager.getPool();

            // Enhanced connection handling with timeout
            try {
                client = await Promise.race([
                    pool.connect(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Connection timeout')), 5000)
                    )
                ]);
            } catch (connectionError) {
                throw new CodeGenerationError(
                    'Failed to establish database connection for code generation. Please check database availability.',
                    'CONNECTION_ERROR',
                    true,
                    undefined,
                    { originalError: (connectionError as Error).message }
                );
            }

            try {
                await client.query('BEGIN');

                // Lock the products table to prevent concurrent insertions during code generation
                // Using SHARE ROW EXCLUSIVE mode to allow reads but prevent concurrent writes
                await client.query('LOCK TABLE products IN SHARE ROW EXCLUSIVE MODE');

                // Enhanced query to handle non-standard codes and get comprehensive analysis
                const analysisResult = await client.query(`
                    WITH code_analysis AS (
                        SELECT 
                            code,
                            CASE 
                                WHEN code ~ '^PROD\\d{7}$' THEN 
                                    CAST(SUBSTRING(code FROM '^PROD(\\d{7})$') AS INTEGER)
                                ELSE NULL
                            END as sequence_number,
                            CASE 
                                WHEN code ~ '^PROD\\d{7}$' THEN true
                                ELSE false
                            END as is_standard_format
                        FROM products
                    )
                    SELECT 
                        COALESCE(MAX(sequence_number), 0) as last_sequence,
                        COUNT(*) as total_products,
                        COUNT(CASE WHEN is_standard_format THEN 1 END) as standard_products,
                        COUNT(CASE WHEN NOT is_standard_format THEN 1 END) as non_standard_products
                    FROM code_analysis
                `);

                const analysis = analysisResult.rows[0];
                const lastSequence = analysis?.last_sequence || 0;
                const nextSequence = lastSequence + 1;
                const totalProducts = analysis?.total_products || 0;
                const standardProducts = analysis?.standard_products || 0;
                const nonStandardProducts = analysis?.non_standard_products || 0;

                // Log analysis for monitoring
                if (nonStandardProducts > 0) {
                    console.warn('Non-standard product codes detected during generation:', {
                        totalProducts,
                        standardProducts,
                        nonStandardProducts,
                        lastStandardSequence: lastSequence,
                        nextSequence
                    });
                }

                // Check for maximum sequence limit with detailed error
                if (nextSequence > ProductCodeGenerator.MAX_SEQUENCE) {
                    await client.query('ROLLBACK');
                    throw new CodeGenerationError(
                        `Maximum product code sequence limit reached (${this.formatCode(ProductCodeGenerator.MAX_SEQUENCE)}). Cannot generate more codes. Please contact system administrator for sequence expansion or cleanup.`,
                        'SEQUENCE_EXHAUSTED',
                        false,
                        undefined,
                        {
                            maxSequence: ProductCodeGenerator.MAX_SEQUENCE,
                            currentSequence: lastSequence,
                            nextSequence,
                            totalProducts,
                            standardProducts,
                            nonStandardProducts,
                            recommendedAction: 'Contact system administrator for sequence expansion or cleanup of non-standard codes'
                        }
                    );
                }

                const generatedCode = this.formatCode(nextSequence);

                // Double-check that the code doesn't exist (additional safety)
                const existsResult = await client.query(
                    'SELECT 1 FROM products WHERE code = $1 LIMIT 1',
                    [generatedCode]
                );

                if (existsResult.rows.length > 0) {
                    await client.query('ROLLBACK');
                    throw new CodeGenerationError(
                        `Generated code ${generatedCode} already exists. This indicates a concurrency conflict.`,
                        'CONCURRENCY_CONFLICT',
                        true,
                        undefined,
                        {
                            generatedCode,
                            sequence: nextSequence,
                            lastSequence
                        }
                    );
                }

                await client.query('COMMIT');

                return {
                    code: generatedCode,
                    sequenceNumber: nextSequence,
                    isGenerated: true
                };

            } catch (error) {
                // Ensure rollback on any error
                try {
                    await client.query('ROLLBACK');
                } catch (rollbackError) {
                    console.error('Failed to rollback transaction:', rollbackError);
                }
                throw error;
            } finally {
                if (client) {
                    client.release();
                }
            }

        } catch (error) {
            // Enhanced error handling for different scenarios

            // If connection manager is not available, use fallback method
            if ((error as Error).message?.includes('Database connection manager not initialized')) {
                console.warn('Connection manager not available, using fallback transaction method');
                return await this.generateCodeWithFallbackTransaction();
            }

            // Re-throw CodeGenerationError as-is
            if (error instanceof CodeGenerationError) {
                throw error;
            }

            // Handle specific database connection errors
            if (this.isDatabaseConnectionError(error)) {
                throw new CodeGenerationError(
                    'Database connection failed during code generation. Please check database connectivity and try again.',
                    'CONNECTION_ERROR',
                    true,
                    undefined,
                    { originalError: (error as Error).message }
                );
            }

            // Handle general database errors
            if (this.isDatabaseError(error)) {
                throw new CodeGenerationError(
                    'Database error occurred during code generation transaction. Please try again or contact support if the issue persists.',
                    'DATABASE_ERROR',
                    true,
                    undefined,
                    { originalError: (error as Error).message }
                );
            }

            // Handle timeout errors
            if ((error as Error).message?.includes('timeout')) {
                throw new CodeGenerationError(
                    'Code generation timed out. The database may be under heavy load. Please try again.',
                    'SERVICE_UNAVAILABLE',
                    true,
                    undefined,
                    { originalError: (error as Error).message }
                );
            }

            // Wrap unknown errors
            throw new CodeGenerationError(
                'Unexpected error during code generation transaction. Please try again.',
                'SERVICE_UNAVAILABLE',
                true,
                undefined,
                { originalError: (error as Error).message }
            );
        }
    }

    /**
     * Fallback transaction method when connection manager is not available
     * Enhanced with comprehensive error handling
     * @returns Promise<CodeGenerationResult> The generation result
     */
    private async generateCodeWithFallbackTransaction(): Promise<CodeGenerationResult> {
        try {
            return await executeWithRetry(async (database) => {
                // Get sequence info using the existing method (which now has enhanced error handling)
                const sequenceInfo = await this.getSequenceInfo();

                // The getSequenceInfo method now handles sequence exhaustion, so this is additional safety
                if (sequenceInfo.nextSequence > ProductCodeGenerator.MAX_SEQUENCE) {
                    throw new CodeGenerationError(
                        `Maximum product code sequence limit reached (${this.formatCode(ProductCodeGenerator.MAX_SEQUENCE)}). Cannot generate more codes.`,
                        'SEQUENCE_EXHAUSTED',
                        false,
                        undefined,
                        {
                            maxSequence: ProductCodeGenerator.MAX_SEQUENCE,
                            nextSequence: sequenceInfo.nextSequence,
                            lastSequence: sequenceInfo.lastSequence
                        }
                    );
                }

                const generatedCode = this.formatCode(sequenceInfo.nextSequence);

                // Check if code already exists
                const exists = await this.codeExists(generatedCode);
                if (exists) {
                    throw new CodeGenerationError(
                        `Generated code ${generatedCode} already exists. This indicates a concurrency conflict.`,
                        'CONCURRENCY_CONFLICT',
                        true,
                        undefined,
                        {
                            generatedCode,
                            sequence: sequenceInfo.nextSequence,
                            lastSequence: sequenceInfo.lastSequence
                        }
                    );
                }

                return {
                    code: generatedCode,
                    sequenceNumber: sequenceInfo.nextSequence,
                    isGenerated: true
                };
            }, 'generateCodeWithFallbackTransaction');
        } catch (error) {
            // Enhanced error handling for fallback method

            // Re-throw CodeGenerationError as-is
            if (error instanceof CodeGenerationError) {
                throw error;
            }

            // Handle database connection errors
            if (this.isDatabaseConnectionError(error)) {
                throw new CodeGenerationError(
                    'Database connection failed during fallback code generation. Please check database connectivity.',
                    'CONNECTION_ERROR',
                    true,
                    undefined,
                    { originalError: (error as Error).message, method: 'fallback' }
                );
            }

            // Handle general database errors
            if (this.isDatabaseError(error)) {
                throw new CodeGenerationError(
                    'Database error occurred during fallback code generation. Please try again.',
                    'DATABASE_ERROR',
                    true,
                    undefined,
                    { originalError: (error as Error).message, method: 'fallback' }
                );
            }

            // Handle service unavailability
            if (this.isServiceUnavailableError(error)) {
                throw new CodeGenerationError(
                    'Code generation service is temporarily unavailable. Please try again later.',
                    'SERVICE_UNAVAILABLE',
                    true,
                    undefined,
                    { originalError: (error as Error).message, method: 'fallback' }
                );
            }

            // Wrap unknown errors
            throw new CodeGenerationError(
                'Unexpected error during fallback code generation. Please try again or contact support.',
                'SERVICE_UNAVAILABLE',
                true,
                undefined,
                { originalError: (error as Error).message, method: 'fallback' }
            );
        }
    }

    /**
     * Get comprehensive sequence information from the database
     * Handles non-standard code formats gracefully
     * @returns Promise<CodeSequenceInfo> Information about current sequence state
     */
    private async getSequenceInfo(): Promise<CodeSequenceInfo> {
        try {
            return await executeWithRetry(async (database) => {
                // Enhanced query to handle non-standard code formats
                // First, get all products to analyze code patterns
                const allProducts = await database
                    .select({ code: products.code })
                    .from(products);

                let lastSequence = 0;
                let hasExistingProducts = allProducts.length > 0;
                let nonStandardCodes: string[] = [];

                // Analyze existing codes
                for (const product of allProducts) {
                    if (this.validateCodeFormat(product.code)) {
                        // Standard PROD format - extract sequence
                        const sequence = this.extractSequenceNumber(product.code);
                        if (sequence > lastSequence) {
                            lastSequence = sequence;
                        }
                    } else {
                        // Non-standard format - log for monitoring
                        nonStandardCodes.push(product.code);
                    }
                }

                // Log non-standard codes for monitoring (but don't fail)
                if (nonStandardCodes.length > 0) {
                    console.warn(`Found ${nonStandardCodes.length} products with non-standard code formats:`, {
                        count: nonStandardCodes.length,
                        examples: nonStandardCodes.slice(0, 5), // Log first 5 examples
                        totalProducts: allProducts.length,
                        standardProducts: allProducts.length - nonStandardCodes.length
                    });
                }

                const nextSequence = lastSequence + 1;

                // Check for sequence exhaustion
                if (nextSequence > ProductCodeGenerator.MAX_SEQUENCE) {
                    throw new CodeGenerationError(
                        `Maximum product code sequence limit reached. Cannot generate codes beyond ${this.formatCode(ProductCodeGenerator.MAX_SEQUENCE)}. Please contact system administrator for sequence expansion or cleanup.`,
                        'SEQUENCE_EXHAUSTED',
                        false,
                        undefined,
                        {
                            maxSequence: ProductCodeGenerator.MAX_SEQUENCE,
                            currentSequence: lastSequence,
                            totalProducts: allProducts.length,
                            standardProducts: allProducts.length - nonStandardCodes.length,
                            nonStandardProducts: nonStandardCodes.length
                        }
                    );
                }

                return {
                    lastSequence,
                    nextSequence,
                    hasExistingProducts
                };
            }, 'getSequenceInfo');
        } catch (error) {
            // Enhanced database error handling
            if (this.isDatabaseConnectionError(error)) {
                throw new CodeGenerationError(
                    'Unable to connect to database for code generation. Please check database connectivity and try again.',
                    'CONNECTION_ERROR',
                    true,
                    undefined,
                    { originalError: (error as Error).message }
                );
            }

            if (this.isDatabaseError(error)) {
                throw new CodeGenerationError(
                    'Database error occurred during code sequence analysis. Please try again or contact support if the issue persists.',
                    'DATABASE_ERROR',
                    true,
                    undefined,
                    { originalError: (error as Error).message }
                );
            }

            // Re-throw CodeGenerationError as-is
            if (error instanceof CodeGenerationError) {
                throw error;
            }

            // Wrap unknown errors
            throw new CodeGenerationError(
                'Unexpected error during code sequence analysis. Please try again.',
                'SERVICE_UNAVAILABLE',
                true,
                undefined,
                { originalError: (error as Error).message }
            );
        }
    }

    /**
     * Check if a specific code already exists in the database
     * @param code The code to check
     * @returns Promise<boolean> True if the code exists
     */
    async codeExists(code: string): Promise<boolean> {
        return executeWithRetry(async (database) => {
            const result = await database
                .select({ id: products.id })
                .from(products)
                .where(sql`${products.code} = ${code}`)
                .limit(1);

            return result.length > 0;
        }, 'codeExists');
    }

    /**
     * Generate a code with retry logic for concurrency handling
     * @deprecated Use generateCodeWithConcurrencySafety instead for better transaction handling
     * @param maxRetries Maximum number of retry attempts
     * @returns Promise<CodeGenerationResult> The generation result
     */
    async generateCodeWithRetry(maxRetries: number = 3): Promise<CodeGenerationResult> {
        return this.generateCodeWithConcurrencySafety(maxRetries);
    }

    /**
     * Check if an error is related to concurrency conflicts
     * @param error The error to check
     * @returns boolean True if the error is a concurrency-related error
     */
    private isConcurrencyError(error: any): boolean {
        if (error instanceof CodeGenerationError) {
            return error.code === 'CONCURRENCY_CONFLICT';
        }

        const errorMessage = error?.message?.toLowerCase() || '';
        const concurrencyPatterns = [
            'duplicate key',
            'unique constraint',
            'already exists',
            'serialization failure',
            'deadlock detected',
            'could not serialize access',
            'concurrent update'
        ];

        return concurrencyPatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Check if an error is a database-related error
     * @param error The error to check
     * @returns boolean True if the error is database-related
     */
    private isDatabaseError(error: any): boolean {
        if (error instanceof CodeGenerationError) {
            return error.code === 'DATABASE_ERROR';
        }

        // Check for PostgreSQL error codes and common database error patterns
        const errorCode = error?.code;
        const errorMessage = error?.message?.toLowerCase() || '';

        const databaseErrorCodes = [
            '08000', // connection_exception
            '08003', // connection_does_not_exist
            '08006', // connection_failure
            '53300', // too_many_connections
            '57P01', // admin_shutdown
            '57P02', // crash_shutdown
            '57P03', // cannot_connect_now
            '23000', // integrity_constraint_violation
            '23505', // unique_violation
            '23503', // foreign_key_violation
            '40001', // serialization_failure
            '40P01', // deadlock_detected
        ];

        const databaseErrorPatterns = [
            'connection terminated',
            'connection refused',
            'connection timeout',
            'connection reset',
            'network error',
            'econnreset',
            'econnrefused',
            'pool is ending',
            'client has encountered a connection error',
            'database error',
            'constraint violation',
            'duplicate key',
            'foreign key',
            'serialization failure',
            'deadlock detected'
        ];

        return databaseErrorCodes.includes(errorCode) ||
            databaseErrorPatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Check if an error is specifically a database connection error
     * @param error The error to check
     * @returns boolean True if the error is a connection-related error
     */
    private isDatabaseConnectionError(error: any): boolean {
        if (error instanceof CodeGenerationError) {
            return error.code === 'CONNECTION_ERROR';
        }

        const errorCode = error?.code;
        const errorMessage = error?.message?.toLowerCase() || '';

        const connectionErrorCodes = [
            '08000', // connection_exception
            '08001', // sqlclient_unable_to_establish_sqlconnection
            '08003', // connection_does_not_exist
            '08004', // sqlserver_rejected_establishment_of_sqlconnection
            '08006', // connection_failure
            '08007', // resolution_failure
            '53300', // too_many_connections
        ];

        const connectionErrorPatterns = [
            'connection timeout',
            'connection refused',
            'connection terminated',
            'connection reset',
            'connection failure',
            'connection error',
            'econnreset',
            'econnrefused',
            'enotfound',
            'network error',
            'pool is ending',
            'client has encountered a connection error',
            'unable to connect',
            'connection lost',
            'connection closed',
            'too many connections'
        ];

        return connectionErrorCodes.includes(errorCode) ||
            connectionErrorPatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Check if an error indicates service unavailability
     * @param error The error to check
     * @returns boolean True if the error indicates service unavailability
     */
    private isServiceUnavailableError(error: any): boolean {
        if (error instanceof CodeGenerationError) {
            return error.code === 'SERVICE_UNAVAILABLE';
        }

        const errorMessage = error?.message?.toLowerCase() || '';
        const errorCode = error?.code;

        const serviceUnavailablePatterns = [
            'service unavailable',
            'service not available',
            'temporarily unavailable',
            'server unavailable',
            'system overloaded',
            'resource exhausted',
            'out of memory',
            'disk full',
            'insufficient resources',
            'system error',
            'internal error',
            'timeout',
            'timed out'
        ];

        const serviceUnavailableCodes = [
            '53000', // insufficient_resources
            '53100', // disk_full
            '53200', // out_of_memory
            '53300', // too_many_connections
            '58000', // system_error
            '58030', // io_error
        ];

        return serviceUnavailableCodes.includes(errorCode) ||
            serviceUnavailablePatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Validate that the generated code meets all requirements
     * @param code The code to validate
     * @param expectedSequence The expected sequence number
     * @returns boolean True if the code is valid
     */
    private validateGeneratedCode(code: string, expectedSequence: number): boolean {
        if (!this.validateCodeFormat(code)) {
            return false;
        }

        const actualSequence = this.extractSequenceNumber(code);
        return actualSequence === expectedSequence;
    }

    /**
     * Get system health information for code generation service
     * Useful for monitoring and diagnostics
     * @returns Promise<object> Health information
     */
    async getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unavailable';
        sequenceInfo: CodeSequenceInfo | null;
        errors: string[];
        warnings: string[];
        recommendations: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];
        let sequenceInfo: CodeSequenceInfo | null = null;
        let status: 'healthy' | 'degraded' | 'unavailable' = 'healthy';

        try {
            // Test database connectivity and get sequence info
            sequenceInfo = await this.getSequenceInfo();

            // Check for sequence exhaustion warning (90% of max)
            const warningThreshold = Math.floor(ProductCodeGenerator.MAX_SEQUENCE * 0.9);
            if (sequenceInfo.nextSequence > warningThreshold) {
                warnings.push(`Approaching maximum sequence limit. Current: ${sequenceInfo.lastSequence}, Max: ${ProductCodeGenerator.MAX_SEQUENCE}`);
                recommendations.push('Consider implementing sequence expansion or cleanup of unused codes');
                status = 'degraded';
            }

            // Check for high percentage of non-standard codes
            try {
                const allProducts = await executeWithRetry(async (database) => {
                    return await database.select({ code: products.code }).from(products);
                }, 'healthCheck');

                if (allProducts.length > 0) {
                    const nonStandardCount = allProducts.filter(p => !this.validateCodeFormat(p.code)).length;
                    const nonStandardPercentage = (nonStandardCount / allProducts.length) * 100;

                    if (nonStandardPercentage > 10) {
                        warnings.push(`High percentage of non-standard product codes: ${nonStandardPercentage.toFixed(1)}%`);
                        recommendations.push('Consider standardizing existing product codes for better system consistency');
                    }
                }
            } catch (error) {
                warnings.push('Unable to analyze existing product codes for health check');
            }

        } catch (error) {
            status = 'unavailable';

            if (error instanceof CodeGenerationError) {
                switch (error.code) {
                    case 'CONNECTION_ERROR':
                        errors.push('Database connection unavailable');
                        recommendations.push('Check database connectivity and connection pool settings');
                        break;
                    case 'SEQUENCE_EXHAUSTED':
                        errors.push('Maximum sequence limit reached');
                        recommendations.push('Immediate action required: Contact system administrator for sequence expansion');
                        break;
                    case 'DATABASE_ERROR':
                        errors.push('Database error during health check');
                        recommendations.push('Check database logs and system resources');
                        break;
                    case 'SERVICE_UNAVAILABLE':
                        errors.push('Code generation service unavailable');
                        recommendations.push('Check system resources and database availability');
                        break;
                    default:
                        errors.push(`Code generation error: ${error.message}`);
                }
            } else {
                errors.push('Unknown error during health check');
                recommendations.push('Check system logs for detailed error information');
            }
        }

        return {
            status,
            sequenceInfo,
            errors,
            warnings,
            recommendations
        };
    }

    /**
     * Perform a test code generation without actually creating a product
     * Useful for system validation and testing
     * @returns Promise<boolean> True if code generation is working properly
     */
    async testCodeGeneration(): Promise<boolean> {
        try {
            // Get current sequence info
            const sequenceInfo = await this.getSequenceInfo();

            // Validate that we can format the next code
            const testCode = this.formatCode(sequenceInfo.nextSequence);

            // Validate the formatted code
            if (!this.validateCodeFormat(testCode)) {
                return false;
            }

            // Validate sequence extraction
            const extractedSequence = this.extractSequenceNumber(testCode);
            if (extractedSequence !== sequenceInfo.nextSequence) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Code generation test failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const productCodeGenerator = new ProductCodeGenerator();