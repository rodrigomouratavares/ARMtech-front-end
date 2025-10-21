# Implementation Plan

- [x] 1. Create product code generation service
  - Implement ProductCodeGenerator class with sequence number extraction and code formatting logic
  - Add methods for getting last sequence number from database using regex pattern matching
  - Implement code validation and formatting with PROD prefix and 7-digit zero-padding
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 Write unit tests for code generation service
  - Create tests for sequence number extraction from various code formats
  - Test code formatting with zero-padding and edge cases
  - Test validation logic for PROD code format
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement concurrency-safe code generation
  - Add database transaction handling with row-level locking for atomic code generation
  - Implement retry mechanism for handling concurrent code generation conflicts
  - Add error handling for maximum sequence limit and database errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 2.1 Write unit tests for concurrency handling
  - Mock concurrent requests to verify unique code generation
  - Test retry mechanism with simulated database conflicts
  - Verify proper error handling for maximum retries exceeded
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update product service to integrate automatic code generation
  - Modify CreateProductData interface to make code field optional
  - Update ProductService.create() method to generate codes automatically when not provided
  - Remove manual code requirement from product creation validation
  - Ensure existing manual code provision still works for backward compatibility
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [ ]* 3.1 Write integration tests for updated product service
  - Test product creation without providing code field
  - Test product creation with manual code still works
  - Verify generated codes follow correct format and sequence
  - Test error scenarios and proper rollback behavior
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [x] 4. Update validation schemas for optional code field
  - Modify createProductSchema in products.schemas.ts to make code field optional
  - Update validation error messages to reflect automatic code generation
  - Ensure existing code validation rules apply when code is manually provided
  - Maintain strict validation for code format when provided manually
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 5. Implement code immutability after creation
  - Update ProductService.update() method to prevent code field modifications
  - Add validation to reject any attempts to change product code after creation
  - Update error handling to return appropriate messages for code modification attempts
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 5.1 Write tests for code immutability
  - Test that product update requests ignore code field changes
  - Verify appropriate error messages for code modification attempts
  - Test that other fields can still be updated normally
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Add comprehensive error handling for edge cases
  - Implement handling for maximum sequence limit (PROD9999999)
  - Add proper error messages for database connection issues during code generation
  - Handle cases where existing products have non-standard code formats
  - Ensure graceful degradation when code generation service is unavailable
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Update API response to include generated codes
  - Ensure product creation response includes the automatically generated code
  - Update API documentation examples to show automatic code generation
  - Verify response format maintains backward compatibility
  - _Requirements: 5.3, 5.4_

- [ ]* 7.1 Write end-to-end API tests
  - Test complete product creation flow via HTTP API without providing code
  - Verify response includes generated code in correct format
  - Test concurrent API requests to ensure unique code generation
  - Test API backward compatibility with manual code provision
  - _Requirements: 5.1, 5.2, 5.3, 5.4_