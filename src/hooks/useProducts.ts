import { useCallback, useEffect, useState } from 'react';
import {
	type ProductFilters,
	productService,
} from '../services/productService';
import toastService from '../services/ToastService';
import type { Product } from '../types';
import type {
	CreateProductRequest,
	PaginatedResponse,
	UpdateProductRequest,
} from '../types/api';

export interface UseProductsReturn {
	// State
	products: Product[];
	isLoading: boolean;
	error: string | null;
	pagination: PaginatedResponse<Product>['pagination'] | null;

	// Actions
	fetchProducts: (filters?: ProductFilters) => Promise<void>;
	createProduct: (productData: CreateProductRequest) => Promise<Product | null>;
	updateProduct: (
		id: string,
		productData: UpdateProductRequest,
	) => Promise<Product | null>;
	deleteProduct: (id: string) => Promise<boolean>;
	searchProducts: (query: string) => Promise<Product[]>;
	updateStock: (
		id: string,
		quantity: number,
		operation: 'add' | 'subtract' | 'set',
	) => Promise<Product | null>;
	getLowStockProducts: (threshold?: number) => Promise<Product[]>;
	refreshProducts: () => Promise<void>;
	clearError: () => void;
}

export const useProducts = (
	initialFilters?: ProductFilters,
): UseProductsReturn => {
	const [products, setProducts] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<
		PaginatedResponse<Product>['pagination'] | null
	>(null);
	const [currentFilters, setCurrentFilters] = useState<ProductFilters>(
		initialFilters || {},
	);

	const fetchProducts = useCallback(async (filters: ProductFilters = {}) => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await productService.getProducts(filters);

			// Ensure response.data is an array before mapping
			const apiProducts = Array.isArray(response.data) ? response.data : [];

			// Convert API Product to local Product type
			const convertedProducts: Product[] = apiProducts.map((apiProduct) => ({
				id: apiProduct.id,
				code: apiProduct.code,
				name: apiProduct.name,
				unit: apiProduct.unit,
				description: apiProduct.description,
				stock: apiProduct.stock,
				saleType: apiProduct.saleType as 'unit' | 'fractional',
				purchasePrice:
					typeof apiProduct.purchasePrice === 'string'
						? parseFloat(apiProduct.purchasePrice)
						: apiProduct.purchasePrice,
				salePrice:
					typeof apiProduct.salePrice === 'string'
						? parseFloat(apiProduct.salePrice)
						: apiProduct.salePrice,
				createdAt: new Date(apiProduct.createdAt),
				updatedAt: new Date(apiProduct.updatedAt),
			}));

			setProducts(convertedProducts);
			setPagination(response.pagination);
			setCurrentFilters(filters);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Erro ao carregar produtos';
			setError(errorMessage);
			toastService.error(`Erro ao carregar produtos: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const createProduct = useCallback(
		async (productData: CreateProductRequest): Promise<Product | null> => {
			try {
				setIsLoading(true);
				setError(null);

				const apiProduct = await productService.createProduct(productData);

				// Convert API Product to local Product type
				const newProduct: Product = {
					id: apiProduct.id,
					code: apiProduct.code,
					name: apiProduct.name,
					unit: apiProduct.unit,
					description: apiProduct.description,
					stock: apiProduct.stock,
					saleType: apiProduct.saleType as 'unit' | 'fractional',
					purchasePrice:
						typeof apiProduct.purchasePrice === 'string'
							? parseFloat(apiProduct.purchasePrice)
							: apiProduct.purchasePrice,
					salePrice:
						typeof apiProduct.salePrice === 'string'
							? parseFloat(apiProduct.salePrice)
							: apiProduct.salePrice,
					createdAt: new Date(apiProduct.createdAt),
					updatedAt: new Date(apiProduct.updatedAt),
				};

				// Add to local state
				setProducts((prev) => [newProduct, ...prev]);

				toastService.success('Produto criado com sucesso!');
				return newProduct;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Erro ao criar produto';
				setError(errorMessage);
				toastService.error(`Erro ao criar produto: ${errorMessage}`);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const updateProduct = useCallback(
		async (
			id: string,
			productData: UpdateProductRequest,
		): Promise<Product | null> => {
			try {
				setIsLoading(true);
				setError(null);

				const apiProduct = await productService.updateProduct(id, productData);

				// Convert API Product to local Product type
				const updatedProduct: Product = {
					id: apiProduct.id,
					code: apiProduct.code,
					name: apiProduct.name,
					unit: apiProduct.unit,
					description: apiProduct.description,
					stock: apiProduct.stock,
					saleType: apiProduct.saleType as 'unit' | 'fractional',
					purchasePrice:
						typeof apiProduct.purchasePrice === 'string'
							? parseFloat(apiProduct.purchasePrice)
							: apiProduct.purchasePrice,
					salePrice:
						typeof apiProduct.salePrice === 'string'
							? parseFloat(apiProduct.salePrice)
							: apiProduct.salePrice,
					createdAt: new Date(apiProduct.createdAt),
					updatedAt: new Date(apiProduct.updatedAt),
				};

				// Update in local state
				setProducts((prev) =>
					prev.map((product) => (product.id === id ? updatedProduct : product)),
				);

				toastService.success('Produto atualizado com sucesso!');
				return updatedProduct;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Erro ao atualizar produto';
				setError(errorMessage);
				toastService.error(`Erro ao atualizar produto: ${errorMessage}`);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
		try {
			setIsLoading(true);
			setError(null);

			await productService.deleteProduct(id);

			// Remove from local state
			setProducts((prev) => prev.filter((product) => product.id !== id));

			toastService.success('Produto excluído com sucesso!');
			return true;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Erro ao excluir produto';
			setError(errorMessage);
			// Don't duplicate "Erro ao excluir produto" if it's already in the message
			const toastMessage = errorMessage.toLowerCase().includes('excluir')
				? errorMessage
				: `Erro ao excluir produto: ${errorMessage}`;
			toastService.error(toastMessage);
			return false;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const searchProducts = useCallback(
		async (query: string): Promise<Product[]> => {
			try {
				setIsLoading(true);
				setError(null);

				const apiProducts = await productService.searchProducts({ q: query });

				// Ensure apiProducts is an array before mapping
				const productsArray = Array.isArray(apiProducts) ? apiProducts : [];

				// Convert API Products to local Product type
				const searchResults: Product[] = productsArray.map((apiProduct) => ({
					id: apiProduct.id,
					code: apiProduct.code,
					name: apiProduct.name,
					unit: apiProduct.unit,
					description: apiProduct.description,
					stock: apiProduct.stock,
					saleType: apiProduct.saleType as 'unit' | 'fractional',
					purchasePrice:
						typeof apiProduct.purchasePrice === 'string'
							? parseFloat(apiProduct.purchasePrice)
							: apiProduct.purchasePrice,
					salePrice:
						typeof apiProduct.salePrice === 'string'
							? parseFloat(apiProduct.salePrice)
							: apiProduct.salePrice,
					createdAt: new Date(apiProduct.createdAt),
					updatedAt: new Date(apiProduct.updatedAt),
				}));

				// Update products state with search results
				setProducts(searchResults);
				// Clear pagination when searching
				setPagination(null);

				return searchResults;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Erro ao buscar produtos';
				setError(errorMessage);
				toastService.error(`Erro ao buscar produtos: ${errorMessage}`);
				return [];
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const updateStock = useCallback(
		async (
			id: string,
			quantity: number,
			operation: 'add' | 'subtract' | 'set',
		): Promise<Product | null> => {
			try {
				setIsLoading(true);
				setError(null);

				const apiProduct = await productService.updateStock(
					id,
					quantity,
					operation,
				);

				// Convert API Product to local Product type
				const updatedProduct: Product = {
					id: apiProduct.id,
					code: apiProduct.code,
					name: apiProduct.name,
					unit: apiProduct.unit,
					description: apiProduct.description,
					stock: apiProduct.stock,
					saleType: apiProduct.saleType as 'unit' | 'fractional',
					purchasePrice:
						typeof apiProduct.purchasePrice === 'string'
							? parseFloat(apiProduct.purchasePrice)
							: apiProduct.purchasePrice,
					salePrice:
						typeof apiProduct.salePrice === 'string'
							? parseFloat(apiProduct.salePrice)
							: apiProduct.salePrice,
					createdAt: new Date(apiProduct.createdAt),
					updatedAt: new Date(apiProduct.updatedAt),
				};

				// Update in local state
				setProducts((prev) =>
					prev.map((product) => (product.id === id ? updatedProduct : product)),
				);

				toastService.success('Estoque atualizado com sucesso!');
				return updatedProduct;
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Erro ao atualizar estoque';
				setError(errorMessage);
				toastService.error(`Erro ao atualizar estoque: ${errorMessage}`);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const getLowStockProducts = useCallback(
		async (threshold: number = 10): Promise<Product[]> => {
			try {
				const apiProducts = await productService.getLowStockProducts(threshold);

				// Ensure apiProducts is an array before mapping
				const productsArray = Array.isArray(apiProducts) ? apiProducts : [];

				// Convert API Products to local Product type
				const lowStockProducts: Product[] = productsArray.map((apiProduct) => ({
					id: apiProduct.id,
					code: apiProduct.code,
					name: apiProduct.name,
					unit: apiProduct.unit,
					description: apiProduct.description,
					stock: apiProduct.stock,
					saleType: apiProduct.saleType as 'unit' | 'fractional',
					purchasePrice:
						typeof apiProduct.purchasePrice === 'string'
							? parseFloat(apiProduct.purchasePrice)
							: apiProduct.purchasePrice,
					salePrice:
						typeof apiProduct.salePrice === 'string'
							? parseFloat(apiProduct.salePrice)
							: apiProduct.salePrice,
					createdAt: new Date(apiProduct.createdAt),
					updatedAt: new Date(apiProduct.updatedAt),
				}));

				return lowStockProducts;
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: 'Erro ao buscar produtos com estoque baixo';
				setError(errorMessage);
				toastService.error(
					`Erro ao buscar produtos com estoque baixo: ${errorMessage}`,
				);
				return [];
			}
		},
		[],
	);

	const refreshProducts = useCallback(async () => {
		await fetchProducts(currentFilters);
	}, [fetchProducts, currentFilters]);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Load products on mount
	useEffect(() => {
		fetchProducts(initialFilters);
	}, []); // Only run on mount

	return {
		products,
		isLoading,
		error,
		pagination,
		fetchProducts,
		createProduct,
		updateProduct,
		deleteProduct,
		searchProducts,
		updateStock,
		getLowStockProducts,
		refreshProducts,
		clearError,
	};
};
