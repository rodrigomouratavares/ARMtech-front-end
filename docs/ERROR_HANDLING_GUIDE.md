# Error Handling and User Feedback System

This document describes the comprehensive error handling and user feedback system implemented for the Flow CRM application.

## Overview

The system provides:
- Global error handling with context
- Toast notifications for user feedback
- Loading states and skeleton loaders
- Progress indicators
- Retry mechanisms with exponential backoff
- Optimistic updates for better UX
- Network error detection and recovery

## Components

### 1. Error Context (`src/context/ErrorContext.tsx`)

Provides centralized error handling and toast notifications.

```tsx
import { ErrorProvider, useError } from '../context/ErrorContext';

// Wrap your app
<ErrorProvider
  onAuthError={() => navigate('/login')}
  onError={(error, context) => logError(error, context)}
>
  <App />
</ErrorProvider>

// Use in components
const { handleError, showSuccess, showError } = useError();
```

### 2. Loading Context (`src/context/LoadingContext.tsx`)

Manages loading states across the application.

```tsx
import { LoadingProvider, useLoading } from '../context/LoadingContext';

// Wrap your app
<LoadingProvider>
  <App />
</LoadingProvider>

// Use in components
const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

// Example usage
const handleSubmit = withLoading('form-submit', async () => {
  await submitForm();
});
```

### 3. Skeleton Loaders (`src/components/common/SkeletonLoader/`)

Provides skeleton loading states for better perceived performance.

```tsx
import { SkeletonLoader, ListSkeleton, CardSkeleton, TableSkeleton } from '../common/SkeletonLoader';

// Basic skeleton
<SkeletonLoader width="100%" height="20px" />

// Predefined skeletons
<ListSkeleton items={5} showAvatar />
<CardSkeleton />
<TableSkeleton rows={5} columns={4} />
```

### 4. Progress Indicators (`src/components/common/ProgressIndicator/`)

Shows progress for long-running operations.

```tsx
import { ProgressIndicator, LoadingSpinner, LoadingButton } from '../common/ProgressIndicator';

// Linear progress
<ProgressIndicator progress={75} showPercentage label="Uploading..." />

// Circular progress
<ProgressIndicator progress={50} variant="circular" size="lg" />

// Loading button
<LoadingButton loading={isSubmitting} onClick={handleSubmit}>
  Submit
</LoadingButton>
```

### 5. Retry Mechanisms (`src/hooks/useRetry.ts`)

Provides automatic and manual retry functionality.

```tsx
import { useRetry, useApiRetry } from '../hooks/useRetry';

// Basic retry
const { retry, retryState, canRetry } = useRetry({
  maxAttempts: 3,
  baseDelay: 1000,
});

// API-specific retry
const { retryApiCall } = useApiRetry('customers');

const fetchData = async () => {
  return retryApiCall(async () => {
    return await api.getCustomers();
  });
};
```

### 6. Retry Components (`src/components/common/RetryButton/`)

UI components for retry functionality.

```tsx
import { RetryButton, ErrorStateWithRetry, NetworkErrorWithRetry } from '../common/RetryButton';

// Manual retry button
<RetryButton onRetry={refetchData} maxAttempts={3} />

// Error state with retry
<ErrorStateWithRetry
  error={error}
  onRetry={refetchData}
  title="Failed to load data"
/>

// Network error with auto-retry
<NetworkErrorWithRetry onRetry={refetchData} />
```

### 7. Optimistic Updates (`src/hooks/useOptimisticUpdate.ts`)

Provides optimistic UI updates for better user experience.

```tsx
import { useOptimisticUpdate, useOptimisticList } from '../hooks/useOptimisticUpdate';

// Basic optimistic update
const optimistic = useOptimisticUpdate(initialData, {
  onSuccess: (data) => setData(data),
  onError: (error) => showError(error.message),
});

// List operations
const optimisticList = useOptimisticList(items);

const addItem = async (item) => {
  await optimisticList.addItem(item, async () => {
    return await api.createItem(item);
  });
};
```

## HTTP Client Integration

The HTTP client (`src/services/httpClient.ts`) includes automatic retry functionality:

```tsx
import { httpClient } from '../services/httpClient';

// Automatic retry with default options
const response = await httpClient.get('/api/customers');

// Custom retry options
const response = await httpClient.post('/api/customers', data, {
  retryOptions: {
    maxAttempts: 5,
    baseDelay: 2000,
  }
});

// Disable retry for specific requests
const response = await httpClient.getWithoutRetry('/api/health');
```

## Error Boundary Integration

Enhanced error boundary with retry functionality:

```tsx
import ErrorBoundary from '../common/ErrorBoundary/ErrorBoundary';

<ErrorBoundary
  showRetry
  retryOperation={async () => {
    // Custom retry logic
    await refetchData();
  }}
  onError={(error, errorInfo) => {
    logError(error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## Best Practices

### 1. Error Handling

- Always use the error context for consistent error handling
- Provide meaningful error messages to users
- Log errors with context for debugging
- Handle different error types appropriately (network, validation, server)

### 2. Loading States

- Show loading indicators for operations > 200ms
- Use skeleton loaders for initial data loading
- Provide progress indicators for long operations
- Implement optimistic updates for immediate feedback

### 3. Retry Logic

- Use automatic retry for network and server errors
- Don't retry client errors (4xx) except rate limiting (429)
- Implement exponential backoff with jitter
- Provide manual retry options for users
- Set reasonable retry limits (3-5 attempts)

### 4. User Experience

- Show clear error messages with actionable steps
- Provide retry options when appropriate
- Use optimistic updates for better perceived performance
- Implement proper loading states to prevent user confusion

## Integration Example

Here's how to integrate all components in a typical data fetching component:

```tsx
import React from 'react';
import { useError } from '../context/ErrorContext';
import { useApiRetry } from '../hooks/useRetry';
import { useOptimisticList } from '../hooks/useOptimisticUpdate';
import { ListSkeleton } from '../common/SkeletonLoader';
import { ErrorStateWithRetry } from '../common/RetryButton';
import { LoadingButton } from '../common/ProgressIndicator';

const CustomerList: React.FC = () => {
  const { showSuccess } = useError();
  const { retryApiCall } = useApiRetry('customers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const optimisticList = useOptimisticList([], {
    onSuccess: () => showSuccess('Customer updated successfully'),
  });

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    
    const result = await retryApiCall(async () => {
      return await customerService.getAll();
    });

    if (result) {
      optimisticList.updateData(result.data);
    } else {
      setError(new Error('Failed to fetch customers'));
    }
    
    setLoading(false);
  };

  const addCustomer = async (customer: Customer) => {
    await optimisticList.addItem(customer, async () => {
      return await customerService.create(customer);
    });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading && optimisticList.data.length === 0) {
    return <ListSkeleton items={5} showAvatar />;
  }

  if (error) {
    return (
      <ErrorStateWithRetry
        error={error}
        onRetry={fetchCustomers}
        title="Failed to load customers"
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Customers</h2>
        <LoadingButton
          loading={optimisticList.isPending}
          onClick={() => addCustomer(newCustomer)}
        >
          Add Customer
        </LoadingButton>
      </div>
      
      <div className="space-y-2">
        {optimisticList.data.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            isOptimistic={optimisticList.isOptimistic}
          />
        ))}
      </div>
    </div>
  );
};
```

## Testing

The system includes comprehensive error handling that can be tested:

1. **Network Errors**: Disconnect internet to test retry mechanisms
2. **Server Errors**: Mock 5xx responses to test server error handling
3. **Rate Limiting**: Mock 429 responses to test rate limit handling
4. **Optimistic Updates**: Test with slow/failing API calls
5. **Error Boundaries**: Throw errors in components to test error boundaries

## Configuration

You can configure the retry behavior globally:

```tsx
import { httpClient } from '../services/httpClient';

// Update global retry options
httpClient.updateRetryOptions({
  maxAttempts: 5,
  baseDelay: 2000,
  maxDelay: 30000,
});
```

This comprehensive system ensures robust error handling and excellent user experience throughout the application.