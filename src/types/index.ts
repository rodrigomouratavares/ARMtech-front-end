// Simplified core data types for the sales management system

// Base entity interface
export interface BaseEntity {
	id: string;
	createdAt: Date;
	updatedAt: Date;
}

// Basic entity interfaces for future development
export interface Product extends BaseEntity {
	name: string;
	code: string;
	unit: string;
	description?: string;
	stock: number;
	saleType: 'unit' | 'fractional';
	purchasePrice: number;
	salePrice: number;
	suggestedSalePrice?: number;
	category?: string;
}

// Tipos auxiliares para cálculo de preços
export interface PriceCalculation {
	purchasePrice: number;
	markupPercentage: number;
	suggestedPrice: number;
	finalPrice: number;
}

export interface SaleTypeOption {
	value: 'unit' | 'fractional';
	label: string;
	description: string;
}

export interface Customer extends BaseEntity {
	name: string;
	email: string;
	phone: string;
	cpf: string;
	address?: string;
}

export interface PaymentMethod extends BaseEntity {
	code: string;
	description: string;
	isActive: boolean;
}

export interface PreSale extends BaseEntity {
	customer: Customer;
	items: PreSaleItem[];
	total: number;
	status: 'draft' | 'pending' | 'approved' | 'cancelled' | 'converted';
	notes?: string;
	discount?: number;
	discountType?: 'percentage' | 'fixed';
	salesperson?: string;
	salespersonId?: string;
	paymentMethodId?: string;
}

export interface PreSaleItem {
	id: string;
	product: Product;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	discount?: number;
	notes?: string;
}

export interface StockAdjustment extends BaseEntity {
	productCode: string;
	productName: string;
	adjustmentType: 'add' | 'remove';
	quantity: number;
	reason: string;
	date: string;
}

// Common UI component prop types
export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'danger';
	size?: 'sm' | 'md' | 'lg';
	children: React.ReactNode;
	loading?: boolean;
}

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
	value: string;
	onChange: (value: string) => void;
	error?: string;
	label?: string;
}

export interface TableColumn<T = Record<string, unknown>> {
	key: keyof T | 'actions';
	title: string;
	sortable?: boolean;
	render?: (value: unknown, record: T) => React.ReactNode;
}

export interface TableProps<T = Record<string, unknown>> {
	columns: TableColumn<T>[];
	data: T[];
	onRowClick?: (row: T) => void;
	loading?: boolean;
}

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

// Navigation and menu types
export interface MenuItem {
	id: string;
	label: string;
	icon?: string;
	path?: string;
	children?: MenuItem[];
	isActive?: boolean;
}

// Search and filter types
export interface SortConfig {
	field: string;
	direction: 'asc' | 'desc';
}

// User and authentication types - Expanded for access control system

// User permissions interface for granular access control
export interface UserPermissions {
	modules: {
		products: boolean;
		customers: boolean;
		reports: boolean;
		paymentMethods: boolean; // Apenas para admins
		userManagement: boolean; // Apenas para admins
	};
	presales: {
		canCreate: boolean;
		canViewOwn: boolean;
		canViewAll: boolean; // Apenas para admins
	};
}

// Expanded User interface with access control
export interface User extends BaseEntity {
	name: string;
	email: string;
	password: string; // Hash da senha
	userType: 'admin' | 'employee';
	permissions: UserPermissions;
	isActive: boolean;
	avatar?: string; // Avatar image URL or path
	lastLoginAt?: Date;
	createdBy?: string; // ID do administrador que criou
}

// User session interface for tracking active sessions
export interface UserSession {
	userId: string;
	userType: 'admin' | 'employee';
	permissions: UserPermissions;
	loginTime: Date;
	lastActivity: Date;
}

// Audit log interface for tracking user actions
export interface AuditLog extends BaseEntity {
	userId: string;
	userName: string;
	action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view';
	resource: string; // 'user', 'product', 'customer', etc.
	resourceId?: string;
	details?: string;
	ipAddress?: string;
	userAgent?: string;
}

// Request types for user management operations
export interface CreateUserRequest {
	name: string;
	email: string;
	password: string;
	userType: 'admin' | 'employee';
	permissions?: Partial<UserPermissions>;
	avatar?: string;
}

export interface UpdateUserRequest {
	name?: string;
	email?: string;
	password?: string;
	userType?: 'admin' | 'employee';
	permissions?: UserPermissions;
	isActive?: boolean;
	avatar?: string;
}

// Authentication credentials for login
export interface UserCredentials {
	email: string;
	password: string;
}

// Extended user type for authentication context
export interface AuthUser extends User {
	lastLoginAt?: Date;
}

// Authentication error type - expanded with more error codes
export interface AuthError {
	message: string;
	code?:
		| 'INVALID_CREDENTIALS'
		| 'NETWORK_ERROR'
		| 'PERMISSION_DENIED'
		| 'USER_INACTIVE'
		| 'UNKNOWN_ERROR'
		| 'SESSION_EXPIRED'
		| 'ACCOUNT_LOCKED';
}

// User management error type
export interface UserManagementError extends Error {
	code:
		| 'PERMISSION_DENIED'
		| 'USER_NOT_FOUND'
		| 'EMAIL_EXISTS'
		| 'INVALID_DATA';
	details?: string;
}

// Expanded authentication context type with permissions
export interface AuthContextType {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: AuthError | null;
	login: (credentials: UserCredentials) => Promise<void>;
	logout: () => void;
	clearError: () => void;
	// New permission-related properties
	permissions: UserPermissions;
	hasPermission: (permission: string) => boolean;
	isAdmin: boolean;
	isEmployee: boolean;
}

export interface AuthState {
	user?: User;
	isAuthenticated: boolean;
	isLoading: boolean;
	permissions?: UserPermissions;
}

// Audit log filters for querying logs
export interface AuditLogFilters {
	userId?: string;
	action?: AuditLog['action'];
	resource?: string;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
	offset?: number;
}
// Permission-related utility types
export type UserType = 'admin' | 'employee';
export type ModulePermission = keyof UserPermissions['modules'];
export type PresalePermission = keyof UserPermissions['presales'];
export type AuditAction = AuditLog['action'];

// Reports data structures
export interface Sale extends BaseEntity {
	customerId: string;
	customerName: string;
	paymentMethodId: string;
	paymentMethodCode: string;
	paymentMethodDescription: string;
	totalAmount: number;
	saleDate: Date;
	status: 'completed' | 'cancelled';
	isFromPresale: boolean;
	presaleId?: string;
}

export interface ReportFilters {
	dateRange: {
		startDate: Date;
		endDate: Date;
	};
	paymentMethodId?: string;
}

export interface PaymentMethodReportData {
	paymentMethod: PaymentMethod;
	totalAmount: number;
	salesCount: number;
	convertedPresalesCount: number;
	convertedPresalesAmount: number;
}

export interface ReportSummary {
	totalAmount: number;
	totalSalesCount: number;
	totalConvertedPresales: number;
	totalConvertedPresalesAmount: number;
	period: {
		startDate: Date;
		endDate: Date;
	};
}

export interface ReportError {
	message: string;
	code:
		| 'NETWORK_ERROR'
		| 'DATA_PROCESSING_ERROR'
		| 'INVALID_FILTERS'
		| 'NO_DATA_FOUND'
		| 'VALIDATION_ERROR'
		| 'SERVER_ERROR'
		| 'TIMEOUT_ERROR';
	details?: string;
}

// Default permissions by user type
export interface DefaultPermissions {
	admin: UserPermissions;
	employee: UserPermissions;
}

// Protected route props
export interface ProtectedRouteProps {
	children: React.ReactNode;
	requiredPermission?: string;
	requiredUserType?: UserType;
	fallback?: React.ReactNode;
	redirectTo?: string;
}

// User management service interface
export interface UserManagementService {
	getAllUsers(): Promise<User[]>;
	createUser(userData: CreateUserRequest): Promise<User>;
	updateUser(userId: string, userData: UpdateUserRequest): Promise<User>;
	deleteUser(userId: string): Promise<void>;
	updateUserPermissions(
		userId: string,
		permissions: UserPermissions,
	): Promise<void>;
	getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]>;
}

// Auth service interface - expanded
export interface AuthService {
	// Existing methods
	login(credentials: UserCredentials): Promise<AuthUser>;
	logout(): void;
	getStoredUser(): AuthUser | null;
	isAuthenticated(): boolean;

	// New permission methods
	hasPermission(permission: string): boolean;
	getUserPermissions(): UserPermissions | null;
	logActivity(action: string, resource: string, details?: string): void;
	isAdmin(): boolean;
	isEmployee(): boolean;
	canAccessModule(module: string): boolean;
}

// Permissions hook interface
export interface UsePermissions {
	// Core permission methods
	hasPermission: (permission: string) => boolean;
	canAccessModule: (module: string) => boolean;
	isAdmin: () => boolean;
	isEmployee: () => boolean;
	permissions: UserPermissions;

	// Convenience methods for common permission checks
	canPerformPresaleAction: (
		action: 'create' | 'viewOwn' | 'viewAll',
		presaleUserId?: string,
	) => boolean;
	canCreatePresales: () => boolean;
	canViewOwnPresales: () => boolean;
	canViewAllPresales: () => boolean;
	canViewPresale: (presaleUserId: string) => boolean;
	canAccessProducts: () => boolean;
	canAccessCustomers: () => boolean;
	canAccessReports: () => boolean;
	canAccessPaymentMethods: () => boolean;
	canAccessUserManagement: () => boolean;
	getAccessibleNavigationItems: () => string[];
}
