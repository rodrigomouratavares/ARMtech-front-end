# Requirements Document

## Introduction

This feature involves integrating the Flow CRM frontend application with the backend API to replace mock data services with real API calls. The integration will establish proper authentication, data fetching, and error handling mechanisms based on the comprehensive API specification provided in `api.json`.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to configure the frontend to communicate with the backend API, so that the application can fetch and manipulate real data instead of using mock services.

#### Acceptance Criteria

1. WHEN the application starts THEN it SHALL connect to the backend API server at the configured endpoint
2. WHEN API calls are made THEN the system SHALL use proper HTTP methods (GET, POST, PUT, DELETE) as specified in the API documentation
3. WHEN the backend is unavailable THEN the system SHALL display appropriate error messages to users
4. WHEN API responses are received THEN the system SHALL handle both success and error responses according to the API specification

### Requirement 2

**User Story:** As a user, I want to authenticate with the system using real credentials, so that I can securely access the CRM functionality.

#### Acceptance Criteria

1. WHEN a user provides login credentials THEN the system SHALL authenticate against the backend `/api/auth/login` endpoint
2. WHEN authentication is successful THEN the system SHALL store the JWT token for subsequent API calls
3. WHEN the token expires THEN the system SHALL redirect users to the login page
4. WHEN a user logs out THEN the system SHALL call the `/api/auth/logout` endpoint and clear stored tokens
5. WHEN protected routes are accessed THEN the system SHALL include the Bearer token in Authorization headers

### Requirement 3

**User Story:** As a user, I want to manage customers through real API endpoints, so that customer data is persisted and synchronized across the system.

#### Acceptance Criteria

1. WHEN viewing the customers list THEN the system SHALL fetch data from `/api/customers` with pagination support
2. WHEN creating a new customer THEN the system SHALL POST to `/api/customers` with proper validation
3. WHEN updating customer information THEN the system SHALL PUT to `/api/customers/{id}` with the updated data
4. WHEN deleting a customer THEN the system SHALL DELETE from `/api/customers/{id}` with confirmation
5. WHEN searching customers THEN the system SHALL use query parameters for filtering and sorting

### Requirement 4

**User Story:** As a user, I want to manage products through real API endpoints, so that product information is accurate and up-to-date.

#### Acceptance Criteria

1. WHEN viewing the products list THEN the system SHALL fetch data from `/api/products` with filtering capabilities
2. WHEN creating a new product THEN the system SHALL POST to `/api/products` with complete product data
3. WHEN updating product details THEN the system SHALL PUT to `/api/products/{id}` preserving the immutable code field
4. WHEN deleting a product THEN the system SHALL DELETE from `/api/products/{id}` with dependency checks
5. WHEN calculating prices THEN the system SHALL use `/api/products/{id}/calculate-price` for accurate pricing

### Requirement 5

**User Story:** As a user, I want to manage pre-sales through real API endpoints, so that sales data is properly tracked and managed.

#### Acceptance Criteria

1. WHEN viewing pre-sales THEN the system SHALL fetch data from `/api/presales` with status filtering
2. WHEN creating a pre-sale THEN the system SHALL POST to `/api/presales` with complete item details
3. WHEN updating pre-sale status THEN the system SHALL PUT to `/api/presales/{id}` with proper validation
4. WHEN calculating totals THEN the system SHALL use backend calculations for accuracy
5. WHEN converting pre-sales THEN the system SHALL follow the proper status workflow

### Requirement 6

**User Story:** As a developer, I want to implement proper error handling and loading states, so that users have a smooth experience even when API calls fail or take time.

#### Acceptance Criteria

1. WHEN API calls are in progress THEN the system SHALL display loading indicators
2. WHEN API calls fail THEN the system SHALL display user-friendly error messages
3. WHEN network errors occur THEN the system SHALL provide retry mechanisms
4. WHEN validation errors are returned THEN the system SHALL highlight specific form fields
5. WHEN unauthorized errors occur THEN the system SHALL redirect to login page

### Requirement 7

**User Story:** As a developer, I want to configure environment-specific API endpoints, so that the application can work in development, staging, and production environments.

#### Acceptance Criteria

1. WHEN the application builds THEN it SHALL use environment-specific API base URLs
2. WHEN in development mode THEN the system SHALL use `http://localhost:3000` as the API base
3. WHEN API configuration changes THEN the system SHALL not require code changes
4. WHEN debugging is needed THEN the system SHALL provide detailed API request/response logging
5. WHEN CORS issues occur THEN the system SHALL handle them appropriately

### Requirement 8

**User Story:** As a user, I want the application to handle JWT token management automatically, so that I don't need to manually re-authenticate frequently.

#### Acceptance Criteria

1. WHEN tokens are near expiration THEN the system SHALL attempt automatic refresh
2. WHEN tokens are invalid THEN the system SHALL clear them and redirect to login
3. WHEN API calls return 401 errors THEN the system SHALL handle token refresh or logout
4. WHEN the application restarts THEN the system SHALL restore valid tokens from storage
5. WHEN multiple tabs are open THEN token state SHALL be synchronized across tabs