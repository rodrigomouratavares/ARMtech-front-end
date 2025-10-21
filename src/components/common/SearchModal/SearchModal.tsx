import { Clock, Search, TrendingUp, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSearch?: (query: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
	isOpen,
	onClose,
	onSearch,
}) => {
	const [query, setQuery] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	// Mock data for recent searches and suggestions
	const recentSearches = [
		'Cliente João Silva',
		'Produto iPhone 14',
		'Vendas dezembro',
	];
	const suggestions = [
		'Produtos em estoque',
		'Clientes ativos',
		'Relatório de vendas',
	];

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, onClose]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (query.trim() && onSearch) {
			onSearch(query.trim());
			onClose();
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		setQuery(suggestion);
		if (onSearch) {
			onSearch(suggestion);
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" />

			{/* Modal */}
			<div className="flex min-h-full items-start justify-center p-4 pt-16">
				<div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 rounded-xl shadow-2xl backdrop-blur-xl">
					{/* Background decoration */}
					<div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-xl" />
					{/* Search Input */}
					<form
						onSubmit={handleSubmit}
						className="relative p-4 border-b border-slate-700/50"
					>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
								<Search className="h-5 w-5 text-slate-400" />
							</div>
							<input
								ref={inputRef}
								type="text"
								placeholder="Buscar produtos, clientes, vendas..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="
									block w-full pl-12 pr-12 py-3 border-0 text-lg bg-transparent text-white
									focus:ring-0 focus:outline-none placeholder-slate-400
								"
							/>
							<button
								type="button"
								onClick={onClose}
								className="absolute inset-y-0 right-0 pr-4 flex items-center"
							>
								<X className="h-5 w-5 text-slate-400 hover:text-white transition-colors" />
							</button>
						</div>
					</form>

					{/* Search Results/Suggestions */}
					<div className="relative max-h-96 overflow-y-auto">
						{query.length === 0 ? (
							<div className="p-4">
								{/* Recent Searches */}
								{recentSearches.length > 0 && (
									<div className="mb-6">
										<h3 className="text-sm font-medium text-white mb-3 flex items-center">
											<Clock className="h-4 w-4 mr-2 text-blue-400" />
											Pesquisas recentes
										</h3>
										<div className="space-y-1">
											{recentSearches.map((search) => (
												<button
													key={search}
													type="button"
													onClick={() => handleSuggestionClick(search)}
													className="
														w-full text-left px-3 py-2 text-sm text-slate-300
														hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors
													"
												>
													{search}
												</button>
											))}
										</div>
									</div>
								)}

								{/* Suggestions */}
								<div>
									<h3 className="text-sm font-medium text-white mb-3 flex items-center">
										<TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
										Sugestões
									</h3>
									<div className="space-y-1">
										{suggestions.map((suggestion) => (
											<button
												key={suggestion}
												type="button"
												onClick={() => handleSuggestionClick(suggestion)}
												className="
													w-full text-left px-3 py-2 text-sm text-slate-300
													hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors
												"
											>
												{suggestion}
											</button>
										))}
									</div>
								</div>
							</div>
						) : (
							<div className="relative p-4">
								<div className="text-sm text-slate-400 mb-2">
									Pressione Enter para buscar por "{query}"
								</div>
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="relative px-4 py-3 bg-slate-800/50 border-t border-slate-700/50 rounded-b-xl">
						<div className="flex items-center justify-between text-xs text-slate-400">
							<div className="flex items-center space-x-4">
								<span>↵ para buscar</span>
								<span>↑↓ para navegar</span>
							</div>
							<span>ESC para fechar</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SearchModal;
