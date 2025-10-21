import type React from 'react';

interface SimplifiedPageProps {
	title: string;
	message?: string;
}

const SimplifiedPage: React.FC<SimplifiedPageProps> = ({
	title,
	message = 'em desenvolvimento...',
}) => (
	<div className="p-6">
		<h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
		<div className="bg-white rounded-lg shadow p-6">
			<p className="text-gray-600">Página {message}</p>
		</div>
	</div>
);

export default SimplifiedPage;
