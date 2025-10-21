# Implementation Plan

- [x] 1. Implement backend API for reports
  - [x] 1.1 Create reports database schema and queries
    - Analyze existing database structure for sales and presales tables
    - Create SQL queries for payment methods aggregation with presales conversion data
    - Add database indexes for optimal query performance on date and payment method filters
    - _Requirements: 3.1, 3.3, 4.1, 4.2_

  - [x] 1.2 Create reports service layer
    - Implement ReportsService class with getPaymentMethodsReport and getReportSummary methods
    - Add proper data aggregation logic for payment methods with presales conversion tracking
    - Implement filter application for date ranges and specific payment methods
    - Add error handling for database connection and query failures
    - _Requirements: 3.1, 3.3, 3.4, 4.1, 4.3_

  - [x] 1.3 Create reports controller and routes
    - Implement ReportsController with endpoints for payment methods report and summary
    - Add input validation and sanitization for query parameters (dates, payment method IDs)
    - Implement proper HTTP status codes and error responses
    - Add authentication middleware to protect report endpoints
    - _Requirements: 3.1, 3.2, 6.1, 6.3_

  - [x] 1.4 Add request/response schemas and validation
    - Create Zod schemas for report request parameters validation
    - Define TypeScript interfaces for API responses
    - Add comprehensive input validation with meaningful error messages
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 2. Update frontend service layer
  - [x] 2.1 Replace mock reports service with real API calls
    - Update reportsService.ts to make HTTP requests to backend endpoints
    - Remove all mock data generation and mockReportsService dependencies
    - Implement proper error handling for network failures and API errors
    - Add request timeout and retry logic for improved reliability
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 Update error handling for API integration
    - Enhance error handling to distinguish between network, validation, and server errors
    - Update error messages to be user-friendly and actionable
    - Add retry functionality for transient network errors
    - _Requirements: 2.2, 2.4_

- [x] 3. Simplify frontend reports page
  - [x] 3.1 Simplify ReportsPage component structure
    - Remove activeReport state and report type selection logic
    - Update page title to "Relatório de Formas de Pagamento"
    - Simplify component to directly render PaymentMethodsReport without navigation
    - Update breadcrumb navigation to reflect simplified structure
    - _Requirements: 1.1, 1.2, 5.1, 5.3, 5.4_

  - [x] 3.2 Update navigation and routing
    - Ensure /reports route directly shows payment methods report
    - Remove any report type selection from navigation menus
    - Update breadcrumb component to show simplified path
    - _Requirements: 5.1, 5.4_

  - [x] 3.3 Clean up unused components and code
    - Remove any report type selection UI components
    - Clean up unused imports and dependencies
    - Remove mock data files and services
    - Update component exports and index files
    - _Requirements: 1.2, 5.2_

- [x] 4. Test backend integration
  - [x] 4.1 Test API endpoints with real data
    - Verify payment methods report endpoint returns correct aggregated data
    - Test summary endpoint calculations for totals and presales conversions
    - Validate filter functionality for date ranges and payment method selection
    - Test error handling for invalid parameters and edge cases
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Test authentication and authorization
    - Verify that report endpoints require valid authentication
    - Test that users without reports permission are properly denied access
    - Validate that permission checks work correctly with different user types
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 4.3 Write backend unit tests
    - Create unit tests for ReportsService data aggregation logic
    - Test ReportsController input validation and error handling
    - Add tests for database query correctness and performance
    - _Requirements: 3.1, 3.3, 4.1_

- [ ] 5. Test frontend integration
  - [x] 5.1 Test API integration in frontend
    - Verify that frontend correctly calls backend endpoints
    - Test loading states and error handling for API failures
    - Validate that filters are properly sent to backend and results updated
    - Test export functionality with real data from backend
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 5.2 Test simplified UI functionality
    - Verify that simplified reports page loads correctly
    - Test that all existing functionality (filters, export, summary) still works
    - Validate responsive design and mobile compatibility
    - Test accessibility features and keyboard navigation
    - _Requirements: 1.1, 1.3, 1.4, 5.1, 5.2, 5.3_

  - [ ]* 5.3 Write frontend integration tests
    - Create tests for complete user workflow from page load to data display
    - Test error scenarios and recovery mechanisms
    - Add tests for permission-based access control
    - _Requirements: 1.1, 2.2, 6.1_

- [ ] 6. Performance optimization and final polish
  - [ ] 6.1 Optimize database queries and add caching
    - Add appropriate database indexes for report queries
    - Implement query optimization based on performance analysis
    - Consider adding Redis caching for frequently accessed reports
    - _Requirements: 3.3, 4.4_

  - [ ] 6.2 Add monitoring and logging
    - Implement proper logging for report generation and API calls
    - Add performance monitoring for slow queries
    - Set up error tracking for production issues
    - _Requirements: 2.4, 3.4_

  - [ ] 6.3 Final testing and validation
    - Perform end-to-end testing of complete simplified reports workflow
    - Validate data accuracy by comparing with previous mock implementation
    - Test performance with realistic data volumes
    - Verify all requirements are met in the integrated solution
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_