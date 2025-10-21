import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SortConfig, TableProps } from '../../../types';

interface ExtendedTableProps<T = Record<string, unknown>>
	extends TableProps<T> {
	sortable?: boolean;
	pagination?: boolean;
	pageSize?: number;
	selectable?: boolean;
	onSelectionChange?: (selectedRows: T[]) => void;
}

const Table = <T extends Record<string, unknown>>({
	columns,
	data,
	onRowClick,
	loading = false,
	sortable = true,
	pagination = true,
	pageSize = 10,
	selectable = false,
	onSelectionChange,
}: ExtendedTableProps<T>) => {
	const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

	// Sort data
	const sortedData = useMemo(() => {
		if (!sortConfig) return data;

		return [...data].sort((a, b) => {
			const aValue = a[sortConfig.field];
			const bValue = b[sortConfig.field];

			// Handle null/undefined values
			if (aValue == null && bValue == null) return 0;
			if (aValue == null) return 1;
			if (bValue == null) return -1;

			// Convert to string for comparison if not primitive
			const aStr =
				typeof aValue === 'string' || typeof aValue === 'number'
					? aValue
					: String(aValue);
			const bStr =
				typeof bValue === 'string' || typeof bValue === 'number'
					? bValue
					: String(bValue);

			if (aStr < bStr) {
				return sortConfig.direction === 'asc' ? -1 : 1;
			}
			if (aStr > bStr) {
				return sortConfig.direction === 'asc' ? 1 : -1;
			}
			return 0;
		});
	}, [data, sortConfig]);

	// Paginate data
	const paginatedData = useMemo(() => {
		if (!pagination) return sortedData;

		const startIndex = (currentPage - 1) * pageSize;
		const endIndex = startIndex + pageSize;
		return sortedData.slice(startIndex, endIndex);
	}, [sortedData, currentPage, pageSize, pagination]);

	const totalPages = Math.ceil(data.length / pageSize);

	const handleSort = (field: keyof T) => {
		const column = columns.find((col) => col.key === field);
		if (!column?.sortable && sortable) return;

		setSortConfig((prevConfig) => {
			if (prevConfig?.field === field) {
				return {
					field: field as string,
					direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
				};
			}
			return { field: field as string, direction: 'asc' };
		});
	};

	const handleRowSelection = (index: number) => {
		if (!selectable) return;

		const newSelectedRows = new Set(selectedRows);
		if (newSelectedRows.has(index)) {
			newSelectedRows.delete(index);
		} else {
			newSelectedRows.add(index);
		}

		setSelectedRows(newSelectedRows);

		if (onSelectionChange) {
			const selectedData = Array.from(newSelectedRows).map(
				(i) => paginatedData[i],
			);
			onSelectionChange(selectedData);
		}
	};

	const handleSelectAll = () => {
		if (!selectable) return;

		const allSelected = selectedRows.size === paginatedData.length;
		const newSelectedRows = allSelected
			? new Set<number>()
			: new Set(paginatedData.map((_, i) => i));

		setSelectedRows(newSelectedRows);

		if (onSelectionChange) {
			const selectedData = allSelected ? [] : paginatedData;
			onSelectionChange(selectedData);
		}
	};

	const getSortIcon = (field: keyof T) => {
		if (!sortConfig || sortConfig.field !== field) {
			return <ChevronUp className="w-4 h-4 opacity-30" />;
		}
		return sortConfig.direction === 'asc' ? (
			<ChevronUp className="w-4 h-4" />
		) : (
			<ChevronDown className="w-4 h-4" />
		);
	};

	if (loading) {
		return (
			<div className="w-full p-8 text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
				<p className="mt-2 text-gray-500">Loading...</p>
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
				<table className="min-w-full divide-y divide-gray-300">
					<thead className="bg-gray-50">
						<tr>
							{selectable && (
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
									<input
										type="checkbox"
										checked={
											selectedRows.size === paginatedData.length &&
											paginatedData.length > 0
										}
										onChange={handleSelectAll}
										className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									/>
								</th>
							)}
							{columns.map((column) => (
								<th
									key={column.key as string}
									className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${
										column.sortable !== false && sortable
											? 'cursor-pointer hover:bg-gray-100'
											: ''
									}`}
									onClick={() =>
										column.sortable !== false &&
										sortable &&
										handleSort(column.key)
									}
								>
									<div className="flex items-center space-x-1">
										<span>{column.title}</span>
										{column.sortable !== false &&
											sortable &&
											getSortIcon(column.key)}
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{paginatedData.length === 0 || columns.length === 0 ? (
							<tr>
								<td
									colSpan={Math.max(columns.length + (selectable ? 1 : 0), 1)}
									className="px-6 py-12 text-center text-gray-500"
								>
									No data available
								</td>
							</tr>
						) : (
							paginatedData.map((row, index) => {
								// Generate a unique key using row data or fallback to index
								const rowKey =
									typeof row === 'object' && row !== null && 'id' in row
										? String(row.id)
										: `row-${index}`;

								return (
									<tr
										key={rowKey}
										className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${
											selectedRows.has(index) ? 'bg-blue-50' : ''
										}`}
										onClick={() => onRowClick?.(row)}
									>
										{selectable && (
											<td className="px-6 py-4 whitespace-nowrap">
												<input
													type="checkbox"
													checked={selectedRows.has(index)}
													onChange={() => handleRowSelection(index)}
													onClick={(e) => e.stopPropagation()}
													className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
												/>
											</td>
										)}
										{columns.map((column) => (
											<td
												key={column.key as string}
												className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
											>
												{column.render
													? column.render(row[column.key], row)
													: String(row[column.key] ?? '')}
											</td>
										))}
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{pagination && totalPages > 1 && (
				<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
					<div className="flex-1 flex justify-between sm:hidden">
						<button
							type="button"
							onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<button
							type="button"
							onClick={() =>
								setCurrentPage((prev) => Math.min(prev + 1, totalPages))
							}
							disabled={currentPage === totalPages}
							className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
					<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
						<div>
							<p className="text-sm text-gray-700">
								Showing{' '}
								<span className="font-medium">
									{(currentPage - 1) * pageSize + 1}
								</span>{' '}
								to{' '}
								<span className="font-medium">
									{Math.min(currentPage * pageSize, data.length)}
								</span>{' '}
								of <span className="font-medium">{data.length}</span> results
							</p>
						</div>
						<div>
							<nav
								className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
								aria-label="Pagination"
							>
								<button
									type="button"
									onClick={() =>
										setCurrentPage((prev) => Math.max(prev - 1, 1))
									}
									disabled={currentPage === 1}
									className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronLeft className="h-5 w-5" />
								</button>

								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(page) => (
										<button
											key={page}
											type="button"
											onClick={() => setCurrentPage(page)}
											className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
												page === currentPage
													? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
													: 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
											}`}
										>
											{page}
										</button>
									),
								)}

								<button
									type="button"
									onClick={() =>
										setCurrentPage((prev) => Math.min(prev + 1, totalPages))
									}
									disabled={currentPage === totalPages}
									className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<ChevronRight className="h-5 w-5" />
								</button>
							</nav>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Table;
