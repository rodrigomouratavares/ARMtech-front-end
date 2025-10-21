import { useCallback } from 'react';
import { presaleService } from '../services/presaleService';
import type { PreSale } from '../types/api';

interface UsePresaleWorkflowReturn {
	// Status validation
	validateStatusTransition: (
		currentStatus: PreSale['status'],
		newStatus: PreSale['status'],
	) => boolean;
	getValidNextStatuses: (
		currentStatus: PreSale['status'],
	) => PreSale['status'][];

	// Permission checks
	canEditPresale: (status: PreSale['status']) => boolean;
	canDeletePresale: (status: PreSale['status']) => boolean;
	canConvertToSale: (status: PreSale['status']) => boolean;

	// Calculations
	calculateTotals: (
		items: Array<{ quantity: string; unitPrice: string }>,
		discount?: string,
		discountType?: 'fixed' | 'percentage',
	) => { subtotal: number; discountAmount: number; total: number };

	// Status helpers
	getStatusLabel: (status: PreSale['status']) => string;
	getStatusColor: (status: PreSale['status']) => string;
	getStatusIcon: (status: PreSale['status']) => string;

	// Workflow actions
	updatePresaleStatus: (
		id: string,
		newStatus: PreSale['status'],
	) => Promise<PreSale | null>;
	convertPresaleToSale: (id: string) => Promise<PreSale | null>;
}

export const usePresaleWorkflow = (): UsePresaleWorkflowReturn => {
	const validateStatusTransition = useCallback(
		(currentStatus: PreSale['status'], newStatus: PreSale['status']) => {
			return presaleService.validateStatusTransition(currentStatus, newStatus);
		},
		[],
	);

	const getValidNextStatuses = useCallback(
		(currentStatus: PreSale['status']) => {
			return presaleService.getValidNextStatuses(currentStatus);
		},
		[],
	);

	const canEditPresale = useCallback((status: PreSale['status']) => {
		return presaleService.canEditPresale(status);
	}, []);

	const canDeletePresale = useCallback((status: PreSale['status']) => {
		return presaleService.canDeletePresale(status);
	}, []);

	const canConvertToSale = useCallback((status: PreSale['status']) => {
		return presaleService.canConvertToSale(status);
	}, []);

	const calculateTotals = useCallback(
		(
			items: Array<{ quantity: string; unitPrice: string }>,
			discount?: string,
			discountType?: 'fixed' | 'percentage',
		) => {
			return presaleService.calculatePresaleTotals(
				items,
				discount,
				discountType,
			);
		},
		[],
	);

	const getStatusLabel = useCallback((status: PreSale['status']) => {
		const statusLabels: Record<PreSale['status'], string> = {
			draft: 'Rascunho',
			pending: 'Pendente',
			approved: 'Aprovada',
			cancelled: 'Cancelada',
			converted: 'Convertida',
		};
		return statusLabels[status];
	}, []);

	const getStatusColor = useCallback((status: PreSale['status']) => {
		const statusColors: Record<PreSale['status'], string> = {
			draft: 'bg-gray-100 text-gray-800',
			pending: 'bg-yellow-100 text-yellow-800',
			approved: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800',
			converted: 'bg-blue-100 text-blue-800',
		};
		return statusColors[status];
	}, []);

	const getStatusIcon = useCallback((status: PreSale['status']) => {
		const statusIcons: Record<PreSale['status'], string> = {
			draft: '📝',
			pending: '⏳',
			approved: '✅',
			cancelled: '❌',
			converted: '💰',
		};
		return statusIcons[status];
	}, []);

	const updatePresaleStatus = useCallback(
		async (id: string, newStatus: PreSale['status']) => {
			try {
				const response = await presaleService.updateStatus(id, newStatus);
				if (response.success) {
					return response.data;
				}
				throw new Error(response.message || 'Failed to update status');
			} catch (error) {
				console.error('Error updating presale status:', error);
				return null;
			}
		},
		[],
	);

	const convertPresaleToSale = useCallback(async (id: string) => {
		try {
			const response = await presaleService.convertToSale(id);
			if (response.success) {
				return response.data;
			}
			throw new Error(response.message || 'Failed to convert to sale');
		} catch (error) {
			console.error('Error converting presale to sale:', error);
			return null;
		}
	}, []);

	return {
		validateStatusTransition,
		getValidNextStatuses,
		canEditPresale,
		canDeletePresale,
		canConvertToSale,
		calculateTotals,
		getStatusLabel,
		getStatusColor,
		getStatusIcon,
		updatePresaleStatus,
		convertPresaleToSale,
	};
};
