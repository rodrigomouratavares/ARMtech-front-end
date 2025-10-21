# Design Document

## Overview

The backend integration design establishes a robust architecture for connecting the Flow CRM frontend with the REST API backend. The design focuses on replacing mock services with real API calls while maintaining type safety, proper error handling, and optimal user experience. The integration will use modern React patterns with TypeScript for type safety and axios for HTTP communication.

## Architecture

### API Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
├─────────────────────────────────────────────────────────────┤
│  React Components (UI Layer)                               │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks (Business Logic)                             │
├─────────────────────────────────────────────────────────────┤
│  API Services Layer                                        │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   Auth      │  Customer   │   Product   │  PreSales   │ │
│  │  Service    │   Service   │   Service   │   Service   │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  HTTP Client (Axios with Interceptors)                     │
├─────────────────────────────────────────────────────────────┤
│  Authentication Context & Token Management                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
│                   (http://localhost:3000)                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Action → Component → Custom Hook → API Service → HTTP Client → Backend API
                ↑                                                        │
                └── Loading/Error States ← Response Processing ←─────────┘
```

## Components and Interfaces

### 1. HTTP Client Configuration

**File:** `src/services/httpClient.ts`

- Axios instance with base configuration
- Request interceptors for authentication headers
- Response interceptors for error handling and token refresh
- Environment-specific base URL configuration

### 2. Authentication Service

**File:** `src/services/authService.ts`

- Login/logout functionality
- Token storage and retrieval
- Token validation and refresh
- User profile management

### 3. API Services

**Files:** 
- `src/services/customerService.ts`
- `src/services/productService.ts`
- `src/services/presaleService.ts`

Each service provides:
- CRUD operations matching API endpoints
- Type-safe request/response handling
- Error transformation for UI consumption
- Pagination and filtering support

### 4. Custom Hooks

**Files:**
- `src/hooks/useAuth.ts`
- `src/hooks/useCustomers.ts`
- `src/hooks/useProducts.ts`
- `src/hooks/usePresales.ts`

Each hook provides:
- Loading states management
- Error handling
- Data caching and synchronization
- Optimistic updates where appropriate

### 5. Type Definitions

**File:** `src/types/api.ts`

- Complete TypeScript interfaces matching API schemas
- Request/response type definitions
- Error response types
- Pagination types

## Data Models

### API Response Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

### Entity Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  description?: string;
  stock: number;
  purchasePrice: string;
  salePrice: string;
  saleType: string;
  createdAt: string;
  updatedAt: string;
}

interface PreSale {
  id: string;
  customerId: string;
  status: 'draft' | 'pending' | 'approved' | 'cancelled' | 'converted';
  total: string;
  discount: string;
  discountType: 'fixed' | 'percentage';
  discountPercentage: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  items: PreSaleItem[];
}
```

## Error Handling

### Error Handling Strategy

1. **Network Errors**: Display generic network error message with retry option
2. **Authentication Errors (401)**: Redirect to login page and clear tokens
3. **Authorization Errors (403)**: Display access denied message
4. **Validation Errors (422)**: Display field-specific error messages
5. **Server Errors (500)**: Display generic server error message
6. **Not Found Errors (404)**: Display resource not found message

### Error Context

```typescript
interface ErrorContext {
  showError: (message: string, type?: 'error' | 'warning' | 'info') => void;
  clearErrors: () => void;
  errors: ErrorMessage[];
}
```

## Testing Strategy

### Unit Testing

- **API Services**: Mock axios responses and test service methods
- **Custom Hooks**: Use React Testing Library to test hook behavior
- **HTTP Client**: Test interceptors and error handling
- **Authentication**: Test token management and refresh logic

### Integration Testing

- **API Integration**: Test actual API calls in development environment
- **Authentication Flow**: Test complete login/logout cycle
- **CRUD Operations**: Test create, read, update, delete operations
- **Error Scenarios**: Test various error conditions and recovery

### Test Files Structure

```
src/
├── services/
│   ├── __tests__/
│   │   ├── authService.test.ts
│   │   ├── customerService.test.ts
│   │   ├── productService.test.ts
│   │   └── presaleService.test.ts
├── hooks/
│   ├── __tests__/
│   │   ├── useAuth.test.ts
│   │   ├── useCustomers.test.ts
│   │   ├── useProducts.test.ts
│   │   └── usePresales.test.ts
```

## Security Considerations

### Token Management

- Store JWT tokens in httpOnly cookies when possible
- Implement automatic token refresh before expiration
- Clear tokens on logout and authentication errors
- Validate token format and expiration client-side

### API Security

- Always include CSRF protection headers
- Validate all user inputs before sending to API
- Sanitize data received from API before displaying
- Implement rate limiting on the client side

### Environment Configuration

- Use environment variables for API endpoints
- Never expose sensitive configuration in client code
- Implement different security levels for different environments
- Use HTTPS in production environments

## Performance Optimizations

### Caching Strategy

- Implement React Query or SWR for intelligent caching
- Cache frequently accessed data (users, products)
- Implement optimistic updates for better UX
- Use pagination for large datasets

### Request Optimization

- Implement request debouncing for search functionality
- Use AbortController for cancelling outdated requests
- Batch multiple requests where possible
- Implement retry logic with exponential backoff

### Loading States

- Show skeleton loaders for better perceived performance
- Implement progressive loading for large lists
- Use optimistic updates for immediate feedback
- Cache previous data while loading new data

## Migration Strategy

### Phase 1: Infrastructure Setup

1. Install and configure axios and related dependencies
2. Set up HTTP client with interceptors
3. Create base API service structure
4. Implement authentication service and context

### Phase 2: Service Implementation

1. Replace mock auth service with real API calls
2. Implement customer service and update components
3. Implement product service and update components
4. Implement presale service and update components

### Phase 3: Testing and Refinement

1. Add comprehensive error handling
2. Implement loading states and user feedback
3. Add unit and integration tests
4. Performance optimization and caching

### Phase 4: Production Readiness

1. Environment configuration for different stages
2. Security hardening and validation
3. Monitoring and logging implementation
4. Documentation and deployment guides