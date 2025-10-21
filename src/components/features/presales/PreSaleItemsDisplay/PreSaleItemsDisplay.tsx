import { Package } from 'lucide-react';
import type React from 'react';
import type { PreSaleItem } from '../../../../types/api';
import { formatCurrency } from '../../../../utils';

interface PreSaleItemsDisplayProps {
	items: PreSaleItem[];
}

const PreSaleItemsDisplay: React.FC<PreSaleItemsDisplayProps> = ({ items }) => {
	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
				<Package className="h-16 w-16 text-gray-300 mb-4" />
				<p className="text-lg font-medium">Nenhum item encontrado</p>
				<p className="text-sm text-gray-400 mt-1">
					Esta pré-venda não possui itens
				</p>
			</div>
		);
	}

	return (
		<div className="w-full">
			{/* Mobile Card Layout (< md) */}
			<ul className="block md:hidden space-y-4">
				{items.map((item, index) => (
					<li
						key={item.id}
						className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 transition-all duration-200"
						aria-label={`Item ${index + 1}: ${item.product.name}, ${item.quantity} ${item.product.unit}, ${formatCurrency(Number(item.totalPrice))}`}
					>
						<div className="flex justify-between items-start mb-4">
							<div className="flex-1 min-w-0">
								<h4 className="font-bold text-gray-900 text-lg leading-tight">
									{item.product.name}
								</h4>
								<p className="text-sm text-gray-500 mt-1 bg-gray-100 px-2 py-1 rounded-md inline-block">
									Código: {item.product.code}
								</p>
							</div>
							<div className="ml-4 text-right">
								<p className="font-bold text-2xl text-green-600 tabular-nums">
									{formatCurrency(Number(item.totalPrice))}
								</p>
								<p className="text-xs text-gray-500 mt-1">Total</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-6">
							<div className="text-center">
								<span className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-2">
									Quantidade
								</span>
								<div className="bg-blue-50 rounded-lg p-3">
									<span className="text-lg font-bold text-blue-700">
										{Number(item.quantity)}
									</span>
									<span className="text-sm text-blue-600 ml-1">
										{item.product.unit}
									</span>
								</div>
							</div>
							<div className="text-center">
								<span className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-2">
									Preço Unit.
								</span>
								<div className="bg-purple-50 rounded-lg p-3">
									<span className="text-lg font-bold text-purple-700 tabular-nums">
										{formatCurrency(Number(item.unitPrice))}
									</span>
								</div>
							</div>
						</div>
					</li>
				))}
			</ul>

			{/* Desktop Table Layout (≥ md) */}
			<div className="hidden md:block">
				<table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
					{/* Table Header */}
					<thead className="bg-gradient-to-r from-gray-50 to-gray-100">
						<tr>
							<th
								scope="col"
								className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
							>
								Produto
							</th>
							<th
								scope="col"
								className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider"
							>
								Quantidade
							</th>
							<th
								scope="col"
								className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider"
							>
								Preço Unit.
							</th>
							<th
								scope="col"
								className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider"
							>
								Total
							</th>
						</tr>
					</thead>

					{/* Table Body */}
					<tbody className="divide-y divide-gray-100">
						{items.map((item, index) => (
							<tr
								key={item.id}
								className={`hover:bg-blue-50 transition-all duration-200 ${
									index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
								}`}
							>
								{/* Product Info */}
								<td className="px-6 py-5">
									<div className="flex-1 min-w-0">
										<h4 className="font-bold text-gray-900 text-lg leading-tight">
											{item.product.name}
										</h4>
										<p className="text-sm text-gray-500 mt-1 bg-gray-100 px-2 py-1 rounded-md inline-block">
											Código: {item.product.code}
										</p>
									</div>
								</td>

								{/* Quantity */}
								<td className="px-6 py-5 text-center">
									<div className="bg-blue-50 rounded-lg px-4 py-2 inline-block">
										<span className="text-xl font-bold text-blue-700">
											{Number(item.quantity)}
										</span>
										<span className="text-sm text-blue-600 ml-1">
											{item.product.unit}
										</span>
									</div>
								</td>

								{/* Unit Price */}
								<td className="px-6 py-5 text-center">
									<div className="bg-purple-50 rounded-lg px-4 py-2 inline-block">
										<span className="text-lg font-bold tabular-nums text-purple-700">
											{formatCurrency(Number(item.unitPrice))}
										</span>
									</div>
								</td>

								{/* Total Price */}
								<td className="px-6 py-5 text-center">
									<div className="bg-green-50 rounded-lg px-4 py-2 inline-block">
										<span className="text-2xl font-bold tabular-nums text-green-700">
											{formatCurrency(Number(item.totalPrice))}
										</span>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default PreSaleItemsDisplay;
