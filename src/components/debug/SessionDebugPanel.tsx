import type React from 'react';
import { useState } from 'react';
import {
	clearFlowCRMStorage,
	detectAndCleanCorruptedData,
	forceCleanOldSessionData,
	getSessionDebugInfo,
	logSessionDebugInfo,
	resetSessionActivity,
} from '../../utils/sessionDebug';

interface SessionDebugPanelProps {
	isVisible?: boolean;
}

const SessionDebugPanel: React.FC<SessionDebugPanelProps> = ({
	isVisible = false,
}) => {
	const [debugInfo, setDebugInfo] = useState(getSessionDebugInfo());
	const [isExpanded, setIsExpanded] = useState(isVisible);

	const refreshDebugInfo = () => {
		setDebugInfo(getSessionDebugInfo());
	};

	const handleLogToConsole = () => {
		logSessionDebugInfo();
	};

	const handleClearStorage = () => {
		clearFlowCRMStorage();
		refreshDebugInfo();
	};

	const handleResetActivity = () => {
		resetSessionActivity();
		refreshDebugInfo();
	};

	const handleCleanCorrupted = () => {
		const wasCorrupted = detectAndCleanCorruptedData();
		if (wasCorrupted) {
			alert('Dados corrompidos foram limpos!');
		} else {
			alert('Nenhum dado corrompido encontrado.');
		}
		refreshDebugInfo();
	};

	const handleForceCleanOld = () => {
		const wasOld = forceCleanOldSessionData();
		if (wasOld) {
			alert('Dados antigos/expirados foram limpos!');
		} else {
			alert('Nenhum dado antigo encontrado.');
		}
		refreshDebugInfo();
	};

	if (!isExpanded) {
		return (
			<div className="fixed bottom-4 right-4 z-50">
				<button
					onClick={() => setIsExpanded(true)}
					className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg hover:bg-blue-700"
				>
					🔍 Debug Session
				</button>
			</div>
		);
	}

	return (
		<div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md">
			<div className="flex justify-between items-center mb-3">
				<h3 className="font-semibold text-gray-800">Session Debug</h3>
				<button
					onClick={() => setIsExpanded(false)}
					className="text-gray-500 hover:text-gray-700"
				>
					✕
				</button>
			</div>

			<div className="space-y-2 text-sm">
				<div className="grid grid-cols-2 gap-2">
					<div>Token:</div>
					<div
						className={debugInfo.hasToken ? 'text-green-600' : 'text-red-600'}
					>
						{debugInfo.hasToken ? '✓' : '✗'}
					</div>

					<div>Refresh Token:</div>
					<div
						className={
							debugInfo.hasRefreshToken ? 'text-green-600' : 'text-red-600'
						}
					>
						{debugInfo.hasRefreshToken ? '✓' : '✗'}
					</div>

					<div>Last Activity:</div>
					<div
						className={
							debugInfo.hasLastActivity ? 'text-green-600' : 'text-red-600'
						}
					>
						{debugInfo.hasLastActivity ? '✓' : '✗'}
					</div>

					<div>Activity Valid:</div>
					<div
						className={
							debugInfo.isActivityValid ? 'text-green-600' : 'text-red-600'
						}
					>
						{debugInfo.isActivityValid ? '✓' : '✗'}
					</div>

					<div>Time Since Activity:</div>
					<div className="text-gray-600">
						{debugInfo.timeSinceActivity.toFixed(1)}m
					</div>
				</div>

				{debugInfo.lastActivity && (
					<div className="text-xs text-gray-500 mt-2">
						Last: {debugInfo.lastActivityDate?.toLocaleString()}
					</div>
				)}
			</div>

			<div className="flex flex-wrap gap-2 mt-4">
				<button
					onClick={refreshDebugInfo}
					className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
				>
					🔄 Refresh
				</button>

				<button
					onClick={handleLogToConsole}
					className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
				>
					📋 Log
				</button>

				<button
					onClick={handleResetActivity}
					className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
				>
					⏰ Reset Activity
				</button>

				<button
					onClick={handleCleanCorrupted}
					className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
				>
					🧹 Clean Corrupted
				</button>

				<button
					onClick={handleForceCleanOld}
					className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
				>
					⚡ Force Clean Old
				</button>

				<button
					onClick={handleClearStorage}
					className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
				>
					🗑️ Clear All
				</button>
			</div>
		</div>
	);
};

export default SessionDebugPanel;
