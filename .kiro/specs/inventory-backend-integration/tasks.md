# Implementation Plan

- [x] 1. Create backend stock adjustment infrastructure
  - Create stock adjustment controller with endpoints for adjusting stock and retrieving history
  - Create stock adjustment service with business logic for stock operations and audit integration
  - Add validation schemas for stock adjustment requests and filters
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2_

- [x] 1.1 Create stock adjustment controller
  - Implement `POST /api/products/:id/stock-adjustment` endpoint
  - Implement `GET /api/stock-adjustments` endpoint for history
  - Add proper error handling and response formatting
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 1.2 Create stock adjustment service
  - Implement `adjustStock` method with transaction support
  - Implement `getAdjustmentHistory` method with filtering and pagination
  - Integrate with existing audit service for logging
  - _Requirements: 2.3, 4.1, 4.2, 4.3_

- [x] 1.3 Add validation schemas
  - Create Zod schemas for stock adjustment requests
  - Create validation for stock history filters
  - Add parameter validation for product ID
  - _Requirements: 2.6, 5.3_

- [ ]* 1.4 Write backend unit tests
  - Test stock adjustment service methods
  - Test controller endpoints with various scenarios
  - Test validation schemas and error cases
  - _Requirements: 2.5, 2.6_

- [x] 2. Create frontend inventory service
  - Create inventory service to handle API communication for stock operations
  - Implement methods for product search, stock adjustment, and history retrieval
  - Add proper error handling and response transformation
  - _Requirements: 1.1, 1.2, 2.1, 3.1_

- [x] 2.1 Implement inventory service methods
  - Create `searchProducts` method using existing product API
  - Create `adjustStock` method for stock adjustments
  - Create `getStockHistory` method for retrieving adjustment history
  - _Requirements: 1.1, 1.2, 2.1, 3.1_

- [x] 2.2 Add error handling and response transformation
  - Implement proper error handling for network and API errors
  - Transform API responses to match frontend data structures
  - Add retry logic for failed requests
  - _Requirements: 1.4, 2.5, 5.3_

- [ ]* 2.3 Write frontend service unit tests
  - Test inventory service methods with mock API responses
  - Test error handling scenarios
  - Test response transformation logic
  - _Requirements: 2.5, 5.3_

- [x] 3. Update inventory page to use backend integration
  - Replace mock data with real API calls in InventoryPage component
  - Implement loading states and error handling in the UI
  - Update product search functionality to use backend
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2_

- [x] 3.1 Replace mock data with API integration
  - Remove hardcoded product and adjustment arrays
  - Integrate inventory service for product search
  - Integrate inventory service for stock adjustments
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 3.2 Implement loading states and error handling
  - Add loading indicators during API operations
  - Implement error state display with user-friendly messages
  - Add form validation and submission state management
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3.3 Update product search functionality
  - Connect search modal to backend product API
  - Implement debounced search for better performance
  - Add proper filtering and result display
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 4. Implement stock adjustment history integration
  - Connect history tab to backend stock adjustment API
  - Implement pagination or infinite scroll for large datasets
  - Add filtering capabilities for history view
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4.1 Connect history tab to backend API
  - Replace mock adjustment data with API calls
  - Implement proper data loading and state management
  - Add error handling for history retrieval
  - _Requirements: 3.1, 3.2_

- [x] 4.2 Add pagination and filtering
  - Implement pagination controls for adjustment history
  - Add date range filtering for history
  - Add product-specific filtering options
  - _Requirements: 3.3_

- [ ]* 4.3 Write integration tests for history functionality
  - Test history loading with various filters
  - Test pagination functionality
  - Test error scenarios for history retrieval
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Add comprehensive error handling and user feedback
  - Implement toast notifications for all operations
  - Add form validation with real-time feedback
  - Handle edge cases like network failures and concurrent updates
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5.1 Implement toast notifications
  - Add success notifications for completed stock adjustments
  - Add error notifications with specific error messages
  - Integrate with existing ToastService
  - _Requirements: 5.2, 5.3_

- [x] 5.2 Add comprehensive form validation
  - Implement client-side validation for all form fields
  - Add real-time validation feedback
  - Prevent form submission with invalid data
  - _Requirements: 5.3, 5.4_

- [x] 5.3 Handle edge cases and network issues
  - Implement retry logic for failed API calls
  - Handle concurrent stock adjustment scenarios
  - Add offline state detection and messaging
  - _Requirements: 5.3, 5.4_

- [ ]* 5.4 Write end-to-end tests
  - Test complete stock adjustment workflow
  - Test error scenarios and recovery
  - Test user feedback and notification systems
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Add backend routes and middleware integration
  - Register new stock adjustment routes in the routing system
  - Ensure authentication middleware is applied to all endpoints
  - Add rate limiting for stock adjustment operations
  - _Requirements: 2.1, 2.2, 4.1_

- [x] 6.1 Register stock adjustment routes
  - Add routes to main router configuration
  - Apply authentication middleware to all stock endpoints
  - Configure proper HTTP methods and path parameters
  - _Requirements: 2.1, 2.2_

- [x] 6.2 Add security and rate limiting
  - Implement rate limiting for stock adjustment endpoints
  - Add request validation middleware
  - Ensure audit logging is properly configured
  - _Requirements: 4.1, 4.2_

- [ ]* 6.3 Write integration tests for routes
  - Test route registration and middleware application
  - Test authentication and authorization
  - Test rate limiting functionality
  - _Requirements: 2.1, 2.2, 4.1_

- [x] 7. Implement automatic stock reduction for completed sales
  - Integrate stock adjustment service with presales service
  - Automatically reduce stock when presale status changes to "converted"
  - Add transaction support to ensure data consistency
  - _Requirements: 2.1, 2.3, 4.1_

- [x] 7.1 Add stock reduction logic to presales service
  - Modify `updateStatus` method to reduce stock when status becomes "converted"
  - Use existing stock adjustment service for consistency
  - Add proper error handling for insufficient stock scenarios
  - _Requirements: 2.1, 2.3_

- [x] 7.2 Add transaction support for sales completion
  - Wrap status update and stock reduction in database transaction
  - Ensure rollback if stock reduction fails
  - Add audit logging for automatic stock adjustments
  - _Requirements: 2.3, 4.1, 4.2_

- [x] 7.3 Handle edge cases for sales stock integration
  - Prevent status change if insufficient stock available
  - Add validation to check stock before conversion
  - Handle concurrent sales scenarios properly
  - _Requirements: 2.3, 5.3_