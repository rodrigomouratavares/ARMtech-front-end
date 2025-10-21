# Implementation Plan

- [x] 1. Create price calculation utilities and core math functions
  - Implement margin calculation function using formula: margin = (selling_price - cost) / selling_price * 100
  - Implement markup calculation function using formula: markup = (selling_price - cost) / cost * 100
  - Create price suggestion algorithms based on target margin/markup
  - Add input validation and error handling for mathematical operations
  - _Requirements: 3.1, 3.2_

- [ ]* 1.1 Write unit tests for price calculation utilities
  - Test margin and markup formulas with various input scenarios
  - Test edge cases like zero cost, negative values, and extreme percentages
  - Verify calculation accuracy and rounding behavior
  - _Requirements: 6.1, 6.3_

- [x] 2. Implement PriceService with business logic
  - Create PriceService class with methods for price calculations
  - Implement integration with existing product and customer data
  - Add support for applying customer-specific discounts and promotions
  - Implement tax calculation and application logic
  - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 2.1 Create price calculation method for single products
  - Implement calculatePrice method that accepts product ID, quantity, and optional parameters
  - Integrate with existing product database queries to fetch cost and base price
  - Apply customer discounts when customer ID is provided
  - Return comprehensive calculation result with all components
  - _Requirements: 1.1, 3.1, 5.1_

- [x] 2.2 Implement margin and markup calculation service methods
  - Create calculateMarginMarkup method for cost and selling price analysis
  - Implement price suggestion method based on target margin or markup
  - Add validation to ensure cost is positive and selling price is greater than cost
  - Include profit calculation and detailed breakdown in results
  - _Requirements: 3.1, 3.2_

- [x] 2.3 Add promotion and tax integration
  - Implement automatic promotion detection and application
  - Create tax calculation based on product tax rates
  - Ensure proper order of operations: base price → discounts → taxes
  - Handle multiple discount types and tax scenarios
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 2.4 Write unit tests for PriceService business logic
  - Test price calculation with various product and customer combinations
  - Test promotion and tax application scenarios
  - Test error handling for invalid inputs and missing data
  - _Requirements: 6.1, 6.2_

- [x] 3. Create price calculation schemas and validation
  - Define Zod schemas for price calculation request parameters
  - Create response schemas for calculation results and price suggestions
  - Implement validation for margin/markup calculation inputs
  - Add error response schemas with detailed validation messages
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.1 Implement request validation schemas
  - Create PriceCalculationParams schema with product ID, quantity, and optional fields
  - Define MarginMarkupParams schema for cost and selling price validation
  - Add PriceSuggestionParams schema with target margin/markup validation
  - Include proper decimal validation and range constraints
  - _Requirements: 2.1, 2.2_

- [x] 3.2 Create response schemas and type definitions
  - Define PriceCalculationResult schema with all calculation components
  - Create MarginMarkupResult schema for margin/markup analysis
  - Implement PriceSuggestionResult schema with recommendations
  - Export TypeScript types for all schemas
  - _Requirements: 2.3, 2.4_

- [ ]* 3.3 Write validation tests for schemas
  - Test schema validation with valid and invalid inputs
  - Test edge cases and boundary conditions
  - Verify error messages are clear and helpful
  - _Requirements: 6.1, 6.4_

- [x] 4. Implement PriceController with HTTP endpoints
  - Create PriceController class following existing controller patterns
  - Implement POST /api/products/:id/calculate-price endpoint
  - Add POST /api/price/margin-markup endpoint for margin/markup calculations
  - Create POST /api/products/:id/suggest-price endpoint for price suggestions
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.1 Create price calculation endpoint
  - Implement calculatePrice controller method with proper validation
  - Handle product ID parameter validation and request body parsing
  - Integrate with PriceService for calculation logic
  - Return structured response with calculation breakdown
  - _Requirements: 1.1, 2.1, 2.3_

- [x] 4.2 Implement margin/markup calculation endpoint
  - Create calculateMarginMarkup controller method
  - Validate cost and selling price inputs using schemas
  - Call PriceService margin/markup calculation methods
  - Handle business logic errors and return appropriate HTTP status codes
  - _Requirements: 3.1, 3.2, 2.2_

- [x] 4.3 Add price suggestion endpoint
  - Implement suggestPrice controller method with product ID validation
  - Support target margin or markup parameters for price suggestions
  - Include customer context when provided for personalized suggestions
  - Return comprehensive suggestion with reasoning and alternatives
  - _Requirements: 3.1, 3.2, 5.4_

- [x] 4.4 Add comprehensive error handling to all endpoints
  - Implement proper HTTP status codes for different error scenarios
  - Handle validation errors with detailed field-level messages
  - Add business logic error handling (product not found, invalid calculations)
  - Include request logging and error tracking
  - _Requirements: 2.2, 4.1, 4.2_

- [ ]* 4.5 Write integration tests for price endpoints
  - Test all endpoints with valid requests and verify responses
  - Test error scenarios and HTTP status codes
  - Test parameter validation and error message clarity
  - _Requirements: 6.2, 6.4_

- [x] 5. Create price routes and integrate with application
  - Define price routes following existing routing patterns
  - Register routes with Fastify application
  - Add route-level middleware for validation and rate limiting
  - Update API documentation with new endpoints
  - _Requirements: 2.1, 4.3_

- [x] 5.1 Define and register price routes
  - Create price.routes.ts file with all endpoint definitions
  - Register routes in main application with proper prefixes
  - Add OpenAPI/Swagger documentation for all endpoints
  - Include request/response examples in documentation
  - _Requirements: 2.4, 4.4_

- [x] 5.2 Implement rate limiting and security middleware
  - Add rate limiting to prevent abuse (100 requests per minute per IP)
  - Implement request size limits and timeout handling
  - Add security headers and input sanitization
  - Include audit logging for all price calculation requests
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 5.3 Write end-to-end tests for complete price calculation flow
  - Test complete request/response cycle through HTTP endpoints
  - Test rate limiting and security middleware functionality
  - Verify audit logging and monitoring integration
  - _Requirements: 6.2, 6.4_

- [x] 6. Add logging, monitoring and performance optimization
  - Implement comprehensive logging for all price calculations
  - Add performance monitoring and metrics collection
  - Create audit trail for calculation history and compliance
  - Optimize database queries and implement caching where appropriate
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.1 Implement audit logging and monitoring
  - Log all price calculation requests with parameters and results
  - Add performance metrics tracking (response time, throughput)
  - Create audit trail with user context and timestamp information
  - Implement log retention and cleanup policies
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6.2 Add performance optimization and caching
  - Implement caching for frequently accessed product data
  - Optimize database queries for product and customer lookups
  - Add response caching for identical calculation requests
  - Monitor and optimize memory usage and response times
  - _Requirements: 4.3_

- [ ]* 6.3 Write performance tests and benchmarks
  - Create load tests for high-volume calculation scenarios
  - Test response time requirements (< 2 seconds for complex calculations)
  - Verify rate limiting and throttling behavior under load
  - _Requirements: 6.1, 6.2_