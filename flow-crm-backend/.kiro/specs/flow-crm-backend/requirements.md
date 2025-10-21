# Requirements Document

## Introduction

The Flow CRM Backend is a REST API system designed to support a React frontend for customer relationship management. The system will provide comprehensive CRUD operations for customers, products, and pre-sales management, with secure authentication and role-based access control. Built with Node.js, TypeScript, Fastify, and PostgreSQL, it aims to deliver a robust, scalable backend solution for small to medium businesses managing their sales pipeline.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to manage user authentication and authorization, so that only authorized personnel can access the CRM system with appropriate permissions.

#### Acceptance Criteria

1. WHEN a user submits valid credentials THEN the system SHALL return a JWT token with user role information
2. WHEN a user submits invalid credentials THEN the system SHALL return an authentication error
3. WHEN an authenticated user accesses protected endpoints THEN the system SHALL validate the JWT token
4. WHEN a JWT token expires THEN the system SHALL reject requests and require re-authentication
5. IF a user has admin role THEN the system SHALL allow access to all endpoints
6. IF a user has manager role THEN the system SHALL allow access to customer and product management
7. IF a user has employee role THEN the system SHALL allow read-only access to customers and products
8. WHEN an admin creates a new user THEN the system SHALL hash the password using bcrypt

### Requirement 2

**User Story:** As a sales representative, I want to manage customer information, so that I can maintain accurate records of all clients and their contact details.

#### Acceptance Criteria

1. WHEN I create a new customer THEN the system SHALL validate and store customer data including name, email, phone, and CPF
2. WHEN I provide a CPF THEN the system SHALL validate the CPF format and ensure uniqueness
3. WHEN I search for customers THEN the system SHALL support filtering by name, email, or CPF
4. WHEN I update customer information THEN the system SHALL validate the new data and update the record
5. WHEN I delete a customer THEN the system SHALL remove the customer record if no active pre-sales exist
6. WHEN I retrieve customer details THEN the system SHALL return complete customer information
7. IF a customer email already exists THEN the system SHALL prevent duplicate email registration

### Requirement 3

**User Story:** As a product manager, I want to manage the product catalog, so that I can maintain accurate inventory and pricing information.

#### Acceptance Criteria

1. WHEN I create a new product THEN the system SHALL store product code, name, unit, prices, and stock information
2. WHEN I provide a product code THEN the system SHALL ensure uniqueness across all products
3. WHEN I update product information THEN the system SHALL validate and update all product fields
4. WHEN I search for products THEN the system SHALL support filtering by code, name, or category
5. WHEN I delete a product THEN the system SHALL prevent deletion if the product is referenced in active pre-sales
6. WHEN I retrieve product details THEN the system SHALL return complete product information including current stock
7. IF stock quantity changes THEN the system SHALL update the stock value accurately

### Requirement 4

**User Story:** As a sales representative, I want to create and manage pre-sales, so that I can track potential sales opportunities and convert them to actual sales.

#### Acceptance Criteria

1. WHEN I create a pre-sale THEN the system SHALL associate it with a valid customer and calculate totals automatically
2. WHEN I add items to a pre-sale THEN the system SHALL validate product availability and calculate line totals
3. WHEN I apply discounts THEN the system SHALL recalculate totals including discount amounts
4. WHEN I change pre-sale status THEN the system SHALL update the status to draft, pending, approved, cancelled, or converted
5. WHEN I retrieve pre-sale details THEN the system SHALL return complete information including all items
6. WHEN I delete a pre-sale THEN the system SHALL remove the pre-sale and all associated items
7. IF a pre-sale is converted THEN the system SHALL update stock quantities for all products
8. WHEN I search pre-sales THEN the system SHALL support filtering by customer, status, or date range

### Requirement 5

**User Story:** As a developer, I want the API to have proper data validation and error handling, so that the system is robust and provides clear feedback for invalid requests.

#### Acceptance Criteria

1. WHEN invalid data is submitted THEN the system SHALL return detailed validation error messages
2. WHEN a database error occurs THEN the system SHALL return appropriate HTTP status codes
3. WHEN a resource is not found THEN the system SHALL return a 404 error with descriptive message
4. WHEN unauthorized access is attempted THEN the system SHALL return a 401 or 403 error
5. WHEN server errors occur THEN the system SHALL log the error and return a generic error message
6. WHEN API requests are made THEN the system SHALL validate all input using Zod schemas
7. IF required fields are missing THEN the system SHALL return specific field validation errors

### Requirement 6

**User Story:** As a system administrator, I want the API to be properly configured for production deployment, so that it can handle real-world traffic securely and efficiently.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL load configuration from environment variables
2. WHEN cross-origin requests are made THEN the system SHALL handle CORS appropriately
3. WHEN the database connection is established THEN the system SHALL use connection pooling for efficiency
4. WHEN API endpoints are accessed THEN the system SHALL implement proper HTTP methods and status codes
5. WHEN sensitive data is processed THEN the system SHALL ensure passwords are never returned in responses
6. WHEN the application runs THEN the system SHALL be configurable for different environments (dev, staging, prod)
7. IF database migrations are needed THEN the system SHALL support schema evolution through Drizzle migrations