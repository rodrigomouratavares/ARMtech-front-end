import { AlertTriangle, Package } from 'lucide-react';
import type React from 'react';
import type { InventoryAlert } from '../../../services/dashboardService';

interface InventoryAlertsProps {
	alerts: InventoryAlert[];
	loading: boolean;
	error: string;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({
	alerts,
	loading,
	error,
}) => {
	const getSeverityColor = (severity: InventoryAlert['severity']) => {
		switch (severity) {
			case 'critical':
				return 'text-red-600 bg-red-50 border-red-200';
			case 'low':
				return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	};

	const getSeverityIcon = (severity: InventoryAlert['severity']) => {
		switch (severity) {
			case 'critical':
				return <AlertTriangle className="w-4 h-4 text-red-600" />;
			case 'low':
				return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
			default:
				return <Package className="w-4 h-4 text-gray-600" />;
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						Alertas de Estoque
					</h2>
				</div>
				<div className="p-6">
					<div className="animate-pulse space-y-3">
						{[...Array(3)].map((_, i) => (
							<div key={i} className="p-3 border rounded-lg">
								<div className="flex items-center space-x-3">
									<div className="w-4 h-4 bg-gray-200 rounded" />
									<div className="flex-1">
										<div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
										<div className="h-3 bg-gray-200 rounded w-1/2" />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						Alertas de Estoque
					</h2>
				</div>
				<div className="p-6">
					<div className="text-center py-8">
						<AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
						<p className="text-gray-600">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
			<div className="px-6 py-4 border-b border-gray-200">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-gray-900">
						Alertas de Estoque
					</h2>
					{alerts.length > 0 && (
						<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
							{alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
						</span>
					)}
				</div>
			</div>
			<div className="p-6">
				{alerts.length === 0 ? (
					<div className="text-center py-8">
						<Package className="w-12 h-12 text-green-400 mx-auto mb-4" />
						<p className="text-gray-600">
							Todos os produtos estão com estoque adequado
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{alerts.map((alert) => (
							<div
								key={alert.id}
								className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}
							>
								<div className="flex items-center space-x-3">
									<div className="flex-shrink-0">
										{getSeverityIcon(alert.severity)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium">{alert.productName}</p>
										<p className="text-xs mt-1">
											Estoque atual: {alert.currentStock} unidades
											{alert.severity === 'critical' && ' (Crítico!)'}
										</p>
									</div>
									<div className="flex-shrink-0">
										<span className="text-xs font-medium">
											Min: {alert.minimumStock}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default InventoryAlerts;
