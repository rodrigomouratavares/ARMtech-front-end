import { DatabaseError as PgDatabaseError } from 'pg';
import { AppError, ERROR_CODES, HTTP_STATUS_CODES } from '../types/error.types';

/**
 * PostgreSQL error codes mapping
 * Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const POSTGRES_ERROR_CODES = {
    // Connection errors
    CONNECTION_EXCEPTION: '08000',
    CONNECTION_DOES_NOT_EXIST: '08003',
    CONNECTION_FAILURE: '08006',
    SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION: '08001',
    SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION: '08004',

    // Constraint violations
    INTEGRITY_CONSTRAINT_VIOLATION: '23000',
    RESTRICT_VIOLATION: '23001',
    NOT_NULL_VIOLATION: '23502',
    FOREIGN_KEY_VIOLATION: '23503',
    UNIQUE_VIOLATION: '23505',
    CHECK_VIOLATION: '23514',
    EXCLUSION_VIOLATION: '23P01',

    // Data exceptions
    DATA_EXCEPTION: '22000',
    STRING_DATA_RIGHT_TRUNCATION: '22001',
    NUMERIC_VALUE_OUT_OF_RANGE: '22003',
    INVALID_DATETIME_FORMAT: '22007',
    DATETIME_FIELD_OVERFLOW: '22008',
    DIVISION_BY_ZERO: '22012',
    INVALID_PARAMETER_VALUE: '22023',

    // Syntax errors
    SYNTAX_ERROR: '42601',
    UNDEFINED_COLUMN: '42703',
    UNDEFINED_FUNCTION: '42883',
    UNDEFINED_TABLE: '42P01',
    DUPLICATE_COLUMN: '42701',
    DUPLICATE_TABLE: '42P07',

    // Insufficient resources
    INSUFFICIENT_RESOURCES: '53000',
    DISK_FULL: '53100',
    OUT_OF_MEMORY: '53200',
    TOO_MANY_CONNECTIONS: '53300',

    // System errors
    SYSTEM_ERROR: '58000',
    IO_ERROR: '58030',
    UNDEFINED_FILE: '58P01',
    DUPLICATE_FILE: '58P02',

    // Transaction errors
    TRANSACTION_ROLLBACK: '40000',
    SERIALIZATION_FAILURE: '40001',
    DEADLOCK_DETECTED: '40P01',
} as const;

/**
 * Database error interface extending the base PostgreSQL error
 */
export interface DatabaseErrorInfo {
    code: string;
    message: string;
    statusCode: number;
    userMessage: string;
    details?: any;
}

/**
 * Maps PostgreSQL error codes to user-friendly messages and HTTP status codes
 */
export const mapPostgresError = (error: any): DatabaseErrorInfo => {
    const pgError = error as PgDatabaseError;
    const errorCode = pgError.code;
    const constraint = pgError.constraint;
    const table = pgError.table;
    const column = pgError.column;

    switch (errorCode) {
        // Connection errors
        case POSTGRES_ERROR_CODES.CONNECTION_EXCEPTION:
        case POSTGRES_ERROR_CODES.CONNECTION_DOES_NOT_EXIST:
        case POSTGRES_ERROR_CODES.CONNECTION_FAILURE:
        case POSTGRES_ERROR_CODES.SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION:
        case POSTGRES_ERROR_CODES.SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION:
            return {
                code: ERROR_CODES.CONNECTION_ERROR,
                message: 'Database connection failed',
                statusCode: HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
                userMessage: 'Service temporarily unavailable. Please try again later.',
                details: { errorCode, originalMessage: pgError.message }
            };

        // Unique constraint violations
        case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION:
            return handleUniqueViolation(pgError, constraint, table, column);

        // Foreign key violations
        case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION:
            return {
                code: ERROR_CODES.CONSTRAINT_VIOLATION,
                message: 'Referenced resource does not exist',
                statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
                userMessage: getForeignKeyErrorMessage(constraint, table),
                details: { constraint, table, errorCode }
            };

        // Not null violations
        case POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION:
            return {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Required field is missing',
                statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
                userMessage: `Field '${column || 'unknown'}' is required`,
                details: { column, table, errorCode }
            };

        // Check constraint violations
        case POSTGRES_ERROR_CODES.CHECK_VIOLATION:
            return {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Data validation failed',
                statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
                userMessage: getCheckConstraintErrorMessage(constraint, table),
                details: { constraint, table, errorCode }
            };

        // Data type errors
        case POSTGRES_ERROR_CODES.STRING_DATA_RIGHT_TRUNCATION:
            return {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Data too long for field',
                statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
                userMessage: `Value is too long for field '${column || 'unknown'}'`,
                details: { column, table, errorCode }
            };

        case POSTGRES_ERROR_CODES.NUMERIC_VALUE_OUT_OF_RANGE:
            return {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Numeric value out of range',
                statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
                userMessage: `Numeric value is out of range for field '${column || 'unknown'}'`,
                details: { column, table, errorCode }
            };

        case POSTGRES_ERROR_CODES.INVALID_DATETIME_FORMAT:
        case POSTGRES_ERROR_CODES.DATETIME_FIELD_OVERFLOW:
            return {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Invalid date/time format',
                statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
                userMessage: `Invalid date/time format for field '${column || 'unknown'}'`,
                details: { column, table, errorCode }
            };

        // Resource errors
        case POSTGRES_ERROR_CODES.TOO_MANY_CONNECTIONS:
            return {
                code: ERROR_CODES.SERVICE_UNAVAILABLE,
                message: 'Too many database connections',
                statusCode: HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
                userMessage: 'Service is currently busy. Please try again in a moment.',
                details: { errorCode }
            };

        case POSTGRES_ERROR_CODES.OUT_OF_MEMORY:
        case POSTGRES_ERROR_CODES.DISK_FULL:
            return {
                code: ERROR_CODES.SERVICE_UNAVAILABLE,
                message: 'Insufficient system resources',
                statusCode: HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
                userMessage: 'Service temporarily unavailable due to system resources.',
                details: { errorCode }
            };

        // Transaction errors
        case POSTGRES_ERROR_CODES.DEADLOCK_DETECTED:
            return {
                code: ERROR_CODES.CONFLICT,
                message: 'Database deadlock detected',
                statusCode: HTTP_STATUS_CODES.CONFLICT,
                userMessage: 'Operation conflicted with another request. Please try again.',
                details: { errorCode }
            };

        case POSTGRES_ERROR_CODES.SERIALIZATION_FAILURE:
            return {
                code: ERROR_CODES.CONFLICT,
                message: 'Transaction serialization failure',
                statusCode: HTTP_STATUS_CODES.CONFLICT,
                userMessage: 'Operation conflicted with concurrent changes. Please try again.',
                details: { errorCode }
            };

        // Syntax and schema errors (should not happen in production)
        case POSTGRES_ERROR_CODES.SYNTAX_ERROR:
        case POSTGRES_ERROR_CODES.UNDEFINED_COLUMN:
        case POSTGRES_ERROR_CODES.UNDEFINED_TABLE:
        case POSTGRES_ERROR_CODES.UNDEFINED_FUNCTION:
            return {
                code: ERROR_CODES.INTERNAL_ERROR,
                message: 'Database schema error',
                statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
                userMessage: 'An internal error occurred. Please contact support.',
                details: process.env.NODE_ENV !== 'production' ? { errorCode, originalMessage: pgError.message } : undefined
            };

        // Default case for unknown errors
        default:
            return {
                code: ERROR_CODES.DATABASE_ERROR,
                message: 'Database operation failed',
                statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
                userMessage: 'A database error occurred. Please try again.',
                details: process.env.NODE_ENV !== 'production' ? { errorCode, originalMessage: pgError.message } : undefined
            };
    }
};

/**
 * Handle unique constraint violations with specific messages
 */
function handleUniqueViolation(
    pgError: PgDatabaseError,
    constraint?: string,
    table?: string,
    column?: string
): DatabaseErrorInfo {
    let userMessage = 'A record with this information already exists';

    // Provide specific messages based on constraint names
    if (constraint) {
        switch (constraint) {
            case 'customers_cpf_unique':
            case 'customers_cpf_key':
                userMessage = 'A customer with this CPF already exists';
                break;
            case 'customers_email_unique':
            case 'customers_email_key':
                userMessage = 'A customer with this email already exists';
                break;
            case 'products_code_unique':
            case 'products_code_key':
                userMessage = 'A product with this code already exists';
                break;
            case 'users_email_unique':
            case 'users_email_key':
                userMessage = 'A user with this email already exists';
                break;
            default:
                // Try to extract field name from constraint
                if (constraint.includes('email')) {
                    userMessage = 'This email address is already in use';
                } else if (constraint.includes('cpf')) {
                    userMessage = 'This CPF is already registered';
                } else if (constraint.includes('code')) {
                    userMessage = 'This code is already in use';
                }
        }
    }

    return {
        code: ERROR_CODES.DUPLICATE_RESOURCE,
        message: 'Unique constraint violation',
        statusCode: HTTP_STATUS_CODES.CONFLICT,
        userMessage,
        details: { constraint, table, column, errorCode: pgError.code }
    };
}

/**
 * Get user-friendly message for foreign key constraint violations
 */
function getForeignKeyErrorMessage(constraint?: string, table?: string): string {
    if (!constraint) {
        return 'Referenced resource does not exist';
    }

    // Map constraint names to user-friendly messages
    const constraintMessages: Record<string, string> = {
        'presales_customer_id_fkey': 'The specified customer does not exist',
        'presale_items_presale_id_fkey': 'The specified pre-sale does not exist',
        'presale_items_product_id_fkey': 'The specified product does not exist',
    };

    return constraintMessages[constraint] || 'Referenced resource does not exist';
}

/**
 * Get user-friendly message for check constraint violations
 */
function getCheckConstraintErrorMessage(constraint?: string, table?: string): string {
    if (!constraint) {
        return 'Data validation failed';
    }

    // Map constraint names to user-friendly messages
    const constraintMessages: Record<string, string> = {
        'products_stock_check': 'Product stock cannot be negative',
        'products_price_check': 'Product price must be greater than zero',
        'presale_items_quantity_check': 'Quantity must be greater than zero',
        'presale_items_price_check': 'Price must be greater than zero',
    };

    return constraintMessages[constraint] || 'Data validation failed';
}

/**
 * Check if an error is a PostgreSQL database error
 */
export function isPostgresError(error: any): error is PgDatabaseError {
    return error &&
        typeof error === 'object' &&
        'code' in error &&
        'severity' in error &&
        typeof error.code === 'string' &&
        error.code.length === 5; // PostgreSQL error codes are always 5 characters
}

/**
 * Create an AppError from a PostgreSQL error
 */
export function createDatabaseError(error: any): AppError {
    if (isPostgresError(error)) {
        const errorInfo = mapPostgresError(error);
        return new AppError(
            errorInfo.userMessage,
            errorInfo.statusCode,
            errorInfo.code,
            errorInfo.details
        );
    }

    // Fallback for non-PostgreSQL database errors
    return new AppError(
        'A database error occurred',
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        ERROR_CODES.DATABASE_ERROR,
        process.env.NODE_ENV !== 'production' ? { originalError: error.message } : undefined
    );
}