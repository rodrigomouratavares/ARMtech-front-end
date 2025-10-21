import {
	Activity,
	AlertTriangle,
	Package,
	ShoppingCart,
	Users,
} from 'lucide-react';
import type React from 'react';
import type { RecentActivity } from '../../../services/dashboardService';

interface RecentActivitiesProps {
	activities: RecentActivity[];
	loading: boolean;
	error: string;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({
	activities,
	loading,
	error,
}) => {
	const getActivityIcon = (type: RecentActivity['type']) => {
		switch (type) {
			case 'sale':
				return <ShoppingCart className="w-4 h-4 text-green-600" />;
			case 'product':
				return <Package className="w-4 h-4 text-blue-600" />;
			case 'customer':
				return <Users className="w-4 h-4 text-purple-600" />;
			case 'inventory':
				return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
			default:
				return <Activity className="w-4 h-4 text-gray-600" />;
		}
	};

	const formatTimestamp = (timestamp: Date) => {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 1) return 'Agora mesmo';
		if (minutes < 60) return `${minutes}min atrás`;
		if (hours < 24) return `${hours}h atrás`;
		if (days < 7) return `${days}d atrás`;

		return timestamp.toLocaleDateString('pt-BR');
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="px-6 py-4 border-b border-gray-200">
					<h2 className="text-lg font-semibold text-gray-900">
						Atividades Recentes
					</h2>
				</div>
				<div className="p-6">
					<div className="animate-pulse space-y-4">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="flex items-center space-x-3">
								<div className="w-8 h-8 bg-gray-200 rounded-full" />
								<div className="flex-1">
									<div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
									<div className="h-3 bg-gray-200 rounded w-1/2" />
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
						Atividades Recentes
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
				<h2 className="text-lg font-semibold text-gray-900">
					Atividades Recentes
				</h2>
			</div>
			<div className="p-6">
				{activities.length === 0 ? (
					<div className="text-center py-8">
						<Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-600">Nenhuma atividade recente</p>
					</div>
				) : (
					<div className="space-y-4">
						{activities.map((activity) => (
							<div key={activity.id} className="flex items-start space-x-3">
								<div className="flex-shrink-0 mt-1">
									{getActivityIcon(activity.type)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm text-gray-900 leading-5">
										{activity.description}
									</p>
									<p className="text-xs text-gray-500 mt-1">
										{formatTimestamp(activity.timestamp)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default RecentActivities;
