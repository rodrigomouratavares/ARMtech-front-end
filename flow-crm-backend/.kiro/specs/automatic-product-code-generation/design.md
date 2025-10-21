# Design Document

## Overview

This design implements automatic product code generation in the existing product management system. The solution integrates seamlessly with the current architecture while ensuring thread-safe, sequential code generation following the pattern "PROD" + 7-digit zero-padded sequence (e.g., PROD0000001, PROD0000002).

The design leverages database-level constraints and atomic operations to handle concurrency while maintaining backward compatibility with the existing API.

## Architecture

### Current System Analysis

The existing product system consists of:
- **Database Schema**: PostgreSQL table with unique code constraint
- **Service Layer**: ProductService class handling business logic
- **Controller Layer**: ProductController handling HTTP requests
- **Validation Layer**: Zod schemas for request/response validation

### Integration Points

The automatic code generation will be integrated at the service layer, specifically in the `ProductService.create()` method, ensuring all product creation flows benefit from this feature regardless of the entry point.

## Components and Interfaces

### 1. Code Generation Service

**Location**: `src/services/product-code-generator.service.ts`

```typescript
interface ProductCodeGenerator {
  generateNextCode(): Promise<string>;
  getLastSequenceNumber(): Promise<number>;
  validateCodeFormat(code: string): boolean;
}
```

**Responsibilities**:
- Generate sequential product codes with proper formatting
- Handle concurrency through database-level atomic operations
- Validate code format compliance
- Manage sequence number retrieval and increment

### 2. Database Integration

**Current Schema**: The existing `products` table already has the required structure:
- `code` field: varchar(50), NOT NULL, UNIQUE
- Unique constraint ensures no duplicate codes

**Query Strategy**:
- Use database transactions for atomic code generation
- Leverage PostgreSQL's row-level locking for concurrency control
- Extract sequence numbers from existing codes using regex patterns

### 3. Service Layer Modifications

**Modified Component**: `src/services/products.service.ts`

**Changes**:
- Update `CreateProductData` interface to make `code` optional
- Modify `create()` method to generate code automatically
- Update `validateCodeUniqueness()` to handle generated codes
- Remove manual code requirement from creation flow

### 4. Validation Schema Updates

**Modified Component**: `src/schemas/products.schemas.ts`

**Changes**:
- Make `code` field optional in `createProductSchema`
- Maintain existing validation for manually provided codes
- Update error messages to reflect automatic generation

## Data Models

### Code Generation Pattern

```typescript
interface CodeGenerationResult {
  code: string;           // Generated code (e.g., "PROD0000001")
  sequenceNumber: number; // Numeric sequence (e.g., 1)
  isGenerated: boolean;   // Flag indicating auto-generation
}

interface CodeSequenceInfo {
  lastSequence: number;   // Last used sequence number
  nextSequence: number;   // Next available sequence
  hasExistingProducts: boolean; // Whether products exist in database
}
```

### Database Queries

**Sequence Number Extraction**:
```sql
-- Get the highest sequence number from existing codes
SELECT COALESCE(
  MAX(
    CAST(
      SUBSTRING(code FROM '^PROD(\d{7})$') AS INTEGER
    )
  ), 0
) as last_sequence
FROM products 
WHERE code ~ '^PROD\d{7}$';
```

**Atomic Code Generation**:
```sql
-- Insert with generated code using database transaction
BEGIN;
-- Lock table to prevent concurrent insertions
LOCK TABLE products IN SHARE ROW EXCLUSIVE MODE;
-- Generate and insert with new code
INSERT INTO products (code, name, ...) VALUES (?, ?, ...);
COMMIT;
```

## Error Handling

### Concurrency Scenarios

1. **Race Condition**: Multiple simultaneous product creations
   - **Solution**: Database-level locking and retry mechanism
   - **Implementation**: Use PostgreSQL advisory locks or table-level locking

2. **Sequence Gap**: Non-sequential existing codes
   - **Solution**: Always query for maximum sequence, ignore gaps
   - **Behavior**: Continue sequence from highest existing number

3. **Maximum Sequence Reached**: Code reaches PROD9999999
   - **Solution**: Throw descriptive error with guidance
   - **Error Message**: "Maximum product code sequence reached (PROD9999999)"

### Error Recovery

```typescript
interface CodeGenerationError extends Error {
  code: 'SEQUENCE_EXHAUSTED' | 'CONCURRENCY_CONFLICT' | 'DATABASE_ERROR';
  retryable: boolean;
  maxRetries?: number;
}
```

**Retry Strategy**:
- Maximum 3 retry attempts for concurrency conflicts
- Exponential backoff: 100ms, 200ms, 400ms
- Fail fast for non-retryable errors (sequence exhausted)

## Testing Strategy

### Unit Tests

1. **Code Generation Logic**
   - Test sequence number extraction from various code formats
   - Test code formatting with zero-padding
   - Test edge cases (empty database, maximum sequence)

2. **Concurrency Handling**
   - Mock concurrent requests to verify unique code generation
   - Test retry mechanism with simulated conflicts
   - Verify proper error handling for maximum retries

3. **Integration with Existing Service**
   - Test backward compatibility with manual code provision
   - Verify existing validation rules remain intact
   - Test error scenarios and rollback behavior

### Integration Tests

1. **Database Integration**
   - Test actual database transactions and locking
   - Verify sequence number queries with real data
   - Test performance with large datasets

2. **API Integration**
   - Test product creation without providing code
   - Verify response includes generated code
   - Test concurrent API requests for race conditions

### Performance Tests

1. **Code Generation Performance**
   - Measure generation time under normal load
   - Test performance with large existing product datasets
   - Verify acceptable response times (< 100ms for generation)

2. **Concurrency Performance**
   - Test throughput with multiple concurrent requests
   - Measure lock contention and wait times
   - Verify system stability under high load

## Implementation Phases

### Phase 1: Core Code Generation Service
- Implement `ProductCodeGenerator` service
- Add sequence number extraction and formatting logic
- Create unit tests for core functionality

### Phase 2: Service Integration
- Modify `ProductService.create()` method
- Update interfaces and type definitions
- Implement error handling and retry logic

### Phase 3: Validation Updates
- Update Zod schemas to make code optional
- Modify validation error messages
- Ensure backward compatibility

### Phase 4: Testing and Validation
- Implement comprehensive test suite
- Performance testing and optimization
- Integration testing with existing system

## Security Considerations

### Code Predictability
- **Risk**: Sequential codes may be predictable
- **Mitigation**: Codes are for internal use, not security tokens
- **Recommendation**: Consider UUID-based codes for sensitive applications

### Database Security
- **Constraint**: Maintain existing unique constraint on code field
- **Validation**: Server-side validation prevents malicious code injection
- **Audit**: Log all code generation activities for tracking

## Backward Compatibility

### API Compatibility
- Existing API endpoints remain unchanged
- Manual code provision still supported (optional)
- Response format includes generated code
- No breaking changes to existing clients

### Data Compatibility
- Existing products with custom codes remain unchanged
- New automatic codes follow different pattern but coexist
- Migration not required for existing data

## Performance Considerations

### Database Impact
- **Query Optimization**: Index on code field (already exists via unique constraint)
- **Lock Duration**: Minimize transaction time for code generation
- **Connection Pooling**: Leverage existing database connection management

### Scalability
- **Bottleneck**: Sequential nature limits theoretical throughput
- **Mitigation**: Database-level locking minimizes contention
- **Monitoring**: Track code generation performance metrics

### Memory Usage
- **Code Generator**: Stateless service with minimal memory footprint
- **Caching**: No caching required due to sequential nature
- **Cleanup**: No additional cleanup or maintenance required