import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useSession } from '../../../hooks/useSession';

interface SessionWarningProps {
	className?: string;
}

const SessionWarning: React.FC<SessionWarningProps> = ({ className = '' }) => {
	const { showWarning, timeRemaining, extendSession, getSessionStatus } =
		useSession();
	const [isVisible, setIsVisible] = useState(false);
	const [countdown, setCountdown] = useState(0);

	// Update countdown every second when warning is shown
	useEffect(() => {
		if (!showWarning) {
			setIsVisible(false);
			return;
		}

		setIsVisible(true);
		setCountdown(Math.ceil(timeRemaining));

		const interval = setInterval(() => {
			const remaining = Math.ceil(timeRemaining);
			setCountdown(remaining);

			if (remaining <= 0) {
				setIsVisible(false);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [showWarning, timeRemaining]);

	const handleExtendSession = () => {
		extendSession();
		setIsVisible(false);
	};

	const formatTime = (minutes: number): string => {
		const mins = Math.floor(minutes);
		const secs = Math.floor((minutes - mins) * 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	if (!isVisible || getSessionStatus() !== 'warning') {
		return null;
	}

	return (
		<div className={`fixed top-4 right-4 z-50 ${className}`}>
			<div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 max-w-sm">
				<div className="flex items-start space-x-3">
					<div className="flex-shrink-0">
						<AlertTriangle className="h-5 w-5 text-amber-600" />
					</div>
					<div className="flex-1">
						<h3 className="text-sm font-medium text-amber-800">
							Sessão expirando
						</h3>
						<div className="mt-1 text-sm text-amber-700">
							<p>Sua sessão expirará em:</p>
							<div className="flex items-center space-x-1 mt-1">
								<Clock className="h-4 w-4" />
								<span className="font-mono font-bold">
									{formatTime(countdown)}
								</span>
							</div>
						</div>
						<div className="mt-3 flex space-x-2">
							<button
								type="button"
								onClick={handleExtendSession}
								className="inline-flex items-center space-x-1 px-3 py-1.5 border border-transparent text-xs font-medium rounded text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
							>
								<RefreshCw className="h-3 w-3" />
								<span>Estender sessão</span>
							</button>
							<button
								type="button"
								onClick={() => setIsVisible(false)}
								className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
							>
								Dispensar
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SessionWarning;
