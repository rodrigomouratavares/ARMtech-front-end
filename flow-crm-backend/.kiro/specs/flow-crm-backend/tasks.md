# Implementation Plan

- [x] 1. Set up project structure and core configuration
  - Initialize Node.js project with TypeScript configuration
  - Install all required dependencies (Fastify, Drizzle ORM, PostgreSQL, Zod, JWT, bcrypt)
  - Create project directory structure as defined in design
  - Configure TypeScript compiler options for Node.js development
  - Set up development scripts in package.json
  - _Requirements: 6.1, 6.6_

- [x] 2. Configure environment and database connection
  - Create environment configuration with Zod validation
  - Implement database connection setup using Drizzle ORM
  - Configure PostgreSQL connection with proper error handling
  - Set up database migration system with Drizzle Kit
  - _Requirements: 6.1, 6.3_

- [x] 3. Implement database schemas and models
  - Create Drizzle schema definitions for users table
  - Create Drizzle schema definitions for customers table
  - Create Drizzle schema definitions for products table
  - Create Drizzle schema definitions for presales and presale_items tables
  - Define proper relationships and constraints between tables
  - _Requirements: 1.8, 2.1, 3.1, 4.1_

- [x] 4. Create utility functions and helpers
  - Implement CPF validation utility function
  - Create password hashing utilities using bcrypt
  - Implement JWT token generation and validation utilities
  - Create standard response helper functions
  - _Requirements: 1.8, 2.2, 5.6_

- [x] 5. Implement authentication system
- [x] 5.1 Create authentication service
  - Implement user login with email/password validation
  - Create JWT token generation with user role information
  - Implement password hashing and comparison functions
  - Create user registration functionality (admin only)
  - _Requirements: 1.1, 1.2, 1.8_

- [x] 5.2 Create authentication middleware and plugin
  - Implement JWT validation middleware for protected routes
  - Create Fastify authentication plugin
  - Implement role-based access control middleware
  - Handle token expiration and authentication errors
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 5.3 Create authentication routes and controllers
  - Implement POST /api/auth/login endpoint
  - Implement GET /api/auth/me endpoint
  - Implement POST /api/auth/register endpoint (admin only)
  - Add proper Zod validation for authentication requests
  - _Requirements: 1.1, 1.2, 1.5_

- [ ]* 5.4 Write authentication tests
  - Create unit tests for authentication service methods
  - Write integration tests for authentication endpoints
  - Test JWT token validation and role-based access
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Implement customer management system
- [x] 6.1 Create customer service layer
  - Implement customer CRUD operations using Drizzle ORM
  - Add customer search and filtering functionality
  - Implement CPF validation and uniqueness checks
  - Create customer data validation and sanitization
  - _Requirements: 2.1, 2.2, 2.3, 2.7_

- [x] 6.2 Create customer routes and controllers
  - Implement GET /api/customers endpoint with filtering
  - Implement GET /api/customers/:id endpoint
  - Implement POST /api/customers endpoint with validation
  - Implement PUT /api/customers/:id endpoint
  - Implement DELETE /api/customers/:id endpoint with constraint checks
  - _Requirements: 2.1, 2.4, 2.5, 2.6_

- [x] 6.3 Add customer validation schemas
  - Create Zod schemas for customer creation and updates
  - Implement CPF format validation in schemas
  - Add email uniqueness validation
  - Create proper error messages for validation failures
  - _Requirements: 2.1, 2.2, 2.7, 5.1_

- [ ]* 6.4 Write customer management tests
  - Create unit tests for customer service operations
  - Write integration tests for customer API endpoints
  - Test CPF validation and uniqueness constraints
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 7. Implement product management system
- [x] 7.1 Create product service layer
  - Implement product CRUD operations using Drizzle ORM
  - Add product search and filtering functionality
  - Implement product code uniqueness validation
  - Create stock management operations
  - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.7_

- [x] 7.2 Create product routes and controllers
  - Implement GET /api/products endpoint with filtering
  - Implement GET /api/products/:id endpoint
  - Implement POST /api/products endpoint with validation
  - Implement PUT /api/products/:id endpoint
  - Implement DELETE /api/products/:id endpoint with reference checks
  - _Requirements: 3.1, 3.3, 3.5, 3.6_

- [x] 7.3 Add product validation schemas
  - Create Zod schemas for product creation and updates
  - Implement product code uniqueness validation
  - Add price and stock validation rules
  - Create proper error messages for validation failures
  - _Requirements: 3.1, 3.2, 5.1_

- [ ]* 7.4 Write product management tests
  - Create unit tests for product service operations
  - Write integration tests for product API endpoints
  - Test product code uniqueness and stock management
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 8. Implement pre-sales management system
- [x] 8.1 Create pre-sales service layer
  - Implement pre-sales CRUD operations using Drizzle ORM
  - Create pre-sale items management with cascade operations
  - Implement automatic total calculations with discounts
  - Add pre-sales search and filtering functionality
  - Implement status management and validation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.8_

- [x] 8.2 Create pre-sales calculation utilities
  - Implement line total calculations for pre-sale items
  - Create discount application logic
  - Implement pre-sale total recalculation functions
  - Add stock validation for pre-sale items
  - _Requirements: 4.2, 4.3, 4.7_

- [x] 8.3 Create pre-sales routes and controllers
  - Implement GET /api/presales endpoint with filtering
  - Implement GET /api/presales/:id endpoint with items
  - Implement POST /api/presales endpoint with items creation
  - Implement PUT /api/presales/:id endpoint with items updates
  - Implement DELETE /api/presales/:id endpoint with cascade
  - Implement PUT /api/presales/:id/status endpoint
  - _Requirements: 4.1, 4.4, 4.5, 4.6, 4.8_

- [x] 8.4 Add pre-sales validation schemas
  - Create Zod schemas for pre-sales creation and updates
  - Implement pre-sale items validation
  - Add customer and product reference validation
  - Create status transition validation rules
  - _Requirements: 4.1, 4.4, 5.1_

- [ ]* 8.5 Write pre-sales management tests
  - Create unit tests for pre-sales service operations
  - Write integration tests for pre-sales API endpoints
  - Test calculation logic and status transitions
  - Test cascade operations for pre-sale items
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 9. Implement comprehensive error handling and validation
- [x] 9.1 Create global error handler
  - Implement Fastify error handler for consistent error responses
  - Create error response formatting utilities
  - Add proper HTTP status code mapping
  - Implement error logging for debugging
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 9.2 Add request validation middleware
  - Integrate Zod validation with Fastify routes
  - Create validation error formatting
  - Implement field-specific error messages
  - Add request sanitization for security
  - _Requirements: 5.1, 5.6, 5.7_

- [ ]* 9.3 Write error handling tests
  - Create tests for various error scenarios
  - Test validation error responses
  - Test authentication and authorization errors
  - Test database constraint violations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 10. Configure application plugins and middleware
- [x] 10.1 Set up Fastify application
  - Create main Fastify application instance
  - Configure CORS plugin for cross-origin requests
  - Register authentication plugin
  - Register database connection plugin
  - Set up request logging and monitoring
  - _Requirements: 6.2, 6.4_

- [x] 10.2 Register all routes and middleware
  - Register authentication routes with proper middleware
  - Register customer routes with role-based access control
  - Register product routes with role-based access control
  - Register pre-sales routes with role-based access control
  - Configure route-specific middleware and validation
  - _Requirements: 1.5, 1.6, 1.7, 6.4_

- [x] 10.3 Create application entry point
  - Implement server startup with proper error handling
  - Add graceful shutdown handling
  - Configure environment-specific settings
  - Add database connection health checks
  - _Requirements: 6.1, 6.3, 6.6_

- [ ]* 10.4 Write application integration tests
  - Create end-to-end API tests covering all endpoints
  - Test complete user workflows (login, CRUD operations)
  - Test role-based access control across all endpoints
  - Test error handling and edge cases
  - _Requirements: 1.1, 1.5, 1.6, 1.7, 2.1-2.7, 3.1-3.7, 4.1-4.8, 5.1-5.7_