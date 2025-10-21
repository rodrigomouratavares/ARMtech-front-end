// Service exports for easy importing

export { authService } from './authService';
export { customerService } from './customerService';
export { dashboardService } from './dashboardService';
export { httpClient } from './httpClient';
// Export types from inventory service
export type {
	InventoryError,
	StockAdjustment,
	StockAdjustmentRequest,
	StockHistoryFilters,
} from './inventoryService';
export { inventoryService } from './inventoryService';
export { paymentMethodService } from './paymentMethodService';
export * as permissionsService from './permissionsService';
export { presaleService } from './presaleService';
export { productService } from './productService';
export { reportsService } from './reportsService';
export { ToastService } from './ToastService';
export { userService } from './userService';
