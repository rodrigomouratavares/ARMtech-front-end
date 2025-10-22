// API Type Definitions based on api.json specification

// Base Response Types
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
	timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export interface ErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
	timestamp: string;
	path: string;
}

// Entity Types
export interface User {
	id: string;
	email: string;
	name: string;
	role: 'admin' | 'manager' | 'employee';
	permissions?: any;
	createdAt: string;
	updatedAt: string;
}

export interface Customer {
	id: string;
	name: string;
	email: string;
	phone: string;
	cpf: string;
	address?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Product {
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

export interface PreSaleItem {
	id: string;
	preSaleId: string;
	productId: string;
	quantity: string;
	unitPrice: string;
	totalPrice: string;
	discount: string;
	discountType: 'fixed' | 'percentage';
	discountPercentage: string;
	product: Product;
}

export interface PreSale {
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

// Request Types
export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
	name: string;
	role: 'admin' | 'manager' | 'employee';
}

export interface CreateCustomerRequest {
	name: string;
	email: string;
	phone: string;
	cpf: string;
	address?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CreateProductRequest {
	code?: string;
	name: string;
	unit: string;
	description?: string;
	stock?: number;
	purchasePrice: string;
	salePrice: string;
	saleType: string;
}

export interface UpdateProductRequest
	extends Partial<Omit<CreateProductRequest, 'code'>> {}

export interface CreatePreSaleItemRequest {
	productId: string;
	quantity: string;
	unitPrice: string;
	discount?: string;
	discountType?: 'fixed' | 'percentage';
	discountPercentage?: string;
}

export interface CreatePreSaleRequest {
	customerId: string;
	status: 'draft' | 'pending' | 'approved' | 'cancelled' | 'converted';
	discount?: string;
	discountType?: 'fixed' | 'percentage';
	discountPercentage?: string;
	notes?: string;
	items: CreatePreSaleItemRequest[];
}

export interface UpdatePreSaleRequest
	extends Partial<Omit<CreatePreSaleRequest, 'items'>> {
	items?: CreatePreSaleItemRequest[];
}

export interface CreatePaymentMethodRequest {
	code: string;
	description: string;
	isActive?: boolean;
}

export interface UpdatePaymentMethodRequest
	extends Partial<CreatePaymentMethodRequest> {}

// Price Calculation Types
export interface PriceCalculationRequest {
	quantity: string;
	basePrice?: string;
	customerId?: string;
	applyPromotions?: boolean;
	includeTaxes?: boolean;
}

export interface PriceCalculationResult {
	productId: string;
	quantity: number;
	basePrice: number;
	subtotal: number;
	discounts: {
		customerDiscount: number;
		promotionalDiscount: number;
		totalDiscount: number;
	};
	taxes: {
		amount: number;
		rate: number;
	};
	finalPrice: number;
	margin: {
		amount: number;
		percentage: number;
	};
	markup: {
		amount: number;
		percentage: number;
	};
	calculationDetails: {
		cost: number;
		profit: number;
		timestamp: string;
	};
}

export interface MarginMarkupRequest {
	cost: string;
	sellingPrice: string;
}

export interface MarginMarkupResult {
	cost: number;
	sellingPrice: number;
	margin: {
		amount: number;
		percentage: number;
	};
	markup: {
		amount: number;
		percentage: number;
	};
	profit: number;
	calculationDetails: {
		timestamp: string;
		formula: string;
	};
}

// Authentication Response Types
export interface LoginResponse {
	user: User;
	token: string;
	refreshToken: string;
	expiresIn: number;
}

export interface RefreshTokenResponse {
	token: string;
	refreshToken?: string;
	expiresIn: number;
}

// Query Parameters Types
export interface PaginationParams {
	page?: number;
	limit?: number;
}

export interface CustomerQueryParams extends PaginationParams {
	search?: string;
	sortBy?: 'name' | 'email' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

export interface ProductQueryParams extends PaginationParams {
	search?: string;
	category?: string;
	inStock?: boolean;
	sortBy?: 'name' | 'code' | 'salePrice' | 'createdAt';
	sortOrder?: 'asc' | 'desc';
}

export interface PreSaleQueryParams extends PaginationParams {
	status?: PreSale['status'];
	customerId?: string;
	dateFrom?: string;
	dateTo?: string;
	sortBy?: 'createdAt' | 'total' | 'status';
	sortOrder?: 'asc' | 'desc';
}

// HTTP Client Types
export interface ApiError extends Error {
	status?: number;
	code?: string;
	details?: unknown;
}

export interface RequestConfig {
	timeout?: number;
	retries?: number;
	retryDelay?: number;
}

// Utility Types
export type ApiEndpoint =
	| '/api/auth/login'
	| '/api/auth/logout'
	| '/api/auth/refresh'
	| '/api/auth/me'
	| '/api/customers'
	| '/api/products'
	| '/api/presales'
	| `/api/customers/${string}`
	| `/api/products/${string}`
	| `/api/presales/${string}`
	| `/api/products/${string}/calculate-price`;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Form Data Types (for frontend forms)
export interface CustomerFormData extends Omit<CreateCustomerRequest, 'cpf'> {
	cpf: string; // Allow formatted CPF in forms
}

export interface ProductFormData
	extends Omit<CreateProductRequest, 'purchasePrice' | 'salePrice'> {
	purchasePrice: number | string; // Allow number input in forms
	salePrice: number | string;
}

export interface PreSaleFormData
	extends Omit<
		CreatePreSaleRequest,
		'items' | 'discount' | 'discountPercentage'
	> {
	discount?: number | string;
	discountPercentage?: number | string;
	items: Array<
		Omit<
			CreatePreSaleItemRequest,
			'quantity' | 'unitPrice' | 'discount' | 'discountPercentage'
		> & {
			quantity: number | string;
			unitPrice: number | string;
			discount?: number | string;
			discountPercentage?: number | string;
		}
	>;
}
