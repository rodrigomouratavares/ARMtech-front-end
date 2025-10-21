import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type React from 'react';
import { config } from '../config';

// Cache configuration
const cacheConfig = {
	defaultStaleTime: 5 * 60 * 1000, // 5 minutes
	defaultCacheTime: 10 * 60 * 1000, // 10 minutes
	defaultRetry: 3,
	retryDelay: 1000,
};

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: cacheConfig.defaultStaleTime,
			gcTime: cacheConfig.defaultCacheTime,
			retry: cacheConfig.defaultRetry,
			retryDelay: cacheConfig.retryDelay,
			refetchOnWindowFocus: config.appEnvironment === 'production',
			refetchOnReconnect: true,
			refetchOnMount: true,
		},
		mutations: {
			retry: 1,
			retryDelay: 1000,
		},
	},
});

interface QueryProviderProps {
	children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{/* ReactQueryDevtools can be added here if needed */}
		</QueryClientProvider>
	);
}

export { queryClient };
