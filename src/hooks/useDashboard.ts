import { useCallback, useEffect, useState } from 'react';
import {
	type DashboardMetrics,
	dashboardService,
	type InventoryAlert,
	type RecentActivity,
	type SalesData,
} from '../services/dashboardService';

interface UseDashboardReturn {
	metrics: DashboardMetrics | null;
	salesData: SalesData[];
	recentActivities: RecentActivity[];
	inventoryAlerts: InventoryAlert[];
	loading: {
		metrics: boolean;
		sales: boolean;
		activities: boolean;
		alerts: boolean;
	};
	errors: {
		metrics: string;
		sales: string;
		activities: string;
		alerts: string;
	};
	refresh: () => Promise<void>;
	refreshMetrics: () => Promise<void>;
	refreshSales: () => Promise<void>;
	refreshActivities: () => Promise<void>;
	refreshAlerts: () => Promise<void>;
}

/**
 * Hook para gerenciar dados do dashboard
 */
export const useDashboard = (): UseDashboardReturn => {
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
	const [salesData, setSalesData] = useState<SalesData[]>([]);
	const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
		[],
	);
	const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);

	const [loading, setLoading] = useState({
		metrics: true,
		sales: true,
		activities: true,
		alerts: true,
	});

	const [errors, setErrors] = useState({
		metrics: '',
		sales: '',
		activities: '',
		alerts: '',
	});

	const refreshMetrics = useCallback(async () => {
		try {
			setLoading((prev) => ({ ...prev, metrics: true }));
			setErrors((prev) => ({ ...prev, metrics: '' }));

			const data = await dashboardService.getDashboardMetrics();
			setMetrics(data);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Erro ao carregar métricas';
			setErrors((prev) => ({ ...prev, metrics: errorMessage }));
		} finally {
			setLoading((prev) => ({ ...prev, metrics: false }));
		}
	}, []);

	const refreshSales = useCallback(async () => {
		try {
			setLoading((prev) => ({ ...prev, sales: true }));
			setErrors((prev) => ({ ...prev, sales: '' }));

			const data = await dashboardService.getSalesData();
			setSalesData(data);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Erro ao carregar dados de vendas';
			setErrors((prev) => ({ ...prev, sales: errorMessage }));
		} finally {
			setLoading((prev) => ({ ...prev, sales: false }));
		}
	}, []);

	const refreshActivities = useCallback(async () => {
		try {
			setLoading((prev) => ({ ...prev, activities: true }));
			setErrors((prev) => ({ ...prev, activities: '' }));

			const data = await dashboardService.getRecentActivities();
			setRecentActivities(data);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Erro ao carregar atividades recentes';
			setErrors((prev) => ({ ...prev, activities: errorMessage }));
		} finally {
			setLoading((prev) => ({ ...prev, activities: false }));
		}
	}, []);

	const refreshAlerts = useCallback(async () => {
		try {
			setLoading((prev) => ({ ...prev, alerts: true }));
			setErrors((prev) => ({ ...prev, alerts: '' }));

			const data = await dashboardService.getInventoryAlerts();
			setInventoryAlerts(data);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Erro ao carregar alertas de inventário';
			setErrors((prev) => ({ ...prev, alerts: errorMessage }));
		} finally {
			setLoading((prev) => ({ ...prev, alerts: false }));
		}
	}, []);

	const refresh = useCallback(async () => {
		await Promise.all([
			refreshMetrics(),
			refreshSales(),
			refreshActivities(),
			refreshAlerts(),
		]);
	}, [refreshMetrics, refreshSales, refreshActivities, refreshAlerts]);

	// Carregar dados iniciais
	useEffect(() => {
		refresh();
	}, [refresh]);

	return {
		metrics,
		salesData,
		recentActivities,
		inventoryAlerts,
		loading,
		errors,
		refresh,
		refreshMetrics,
		refreshSales,
		refreshActivities,
		refreshAlerts,
	};
};
