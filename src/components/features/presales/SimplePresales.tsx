import type React from 'react';

const SimplePresales: React.FC = () => {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">Pré-vendas</h1>
			<div className="bg-white rounded-lg shadow p-6">
				<p className="text-gray-600">
					Sistema de pré-vendas carregado com sucesso!
				</p>
				<p className="text-sm text-gray-500 mt-2">
					Se você está vendo esta mensagem, a rota está funcionando.
				</p>
			</div>
		</div>
	);
};

export default SimplePresales;
