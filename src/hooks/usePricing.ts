import { useCallback, useState } from 'react';

export interface PriceCalculationData {
	purchasePrice: number;
	salePrice: number;
	margin: number;
	markup: number;
	profit: number;
}

export interface PricingStrategies {
	suggested: number;
	competitive: number;
	premium: number;
	budget: number;
}

export interface UsePricingReturn {
	calculateMarginMarkup: (
		purchasePrice: number,
		salePrice: number,
	) => PriceCalculationData;
	calculateSuggestedPrices: (
		purchasePrice: number,
		targetMargin?: number,
	) => PricingStrategies;
	calculatePriceFromMargin: (
		purchasePrice: number,
		marginPercentage: number,
	) => number;
	calculatePriceFromMarkup: (
		purchasePrice: number,
		markupPercentage: number,
	) => number;
	formatCurrency: (value: number) => string;
	isLoading: boolean;
	error: string | null;
	// Additional properties expected by ProductsPage
	priceSuggestions: PricingStrategies | null;
	getPriceSuggestions: (purchasePrice: number, targetMargin?: number) => void;
	isCalculating: boolean;
}

/**
 * Hook for pricing calculations and utilities
 */
export const usePricing = (): UsePricingReturn => {
	const [isLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [priceSuggestions, setPriceSuggestions] =
		useState<PricingStrategies | null>(null);
	const [isCalculating, setIsCalculating] = useState(false);

	/**
	 * Calculate margin and markup from purchase and sale prices
	 */
	const calculateMarginMarkup = useCallback(
		(purchasePrice: number, salePrice: number): PriceCalculationData => {
			try {
				setError(null);

				if (purchasePrice <= 0 || salePrice <= 0) {
					throw new Error('Preços devem ser maiores que zero');
				}

				const profit = salePrice - purchasePrice;
				const margin = (profit / salePrice) * 100;
				const markup = (profit / purchasePrice) * 100;

				return {
					purchasePrice,
					salePrice,
					margin: Number(margin.toFixed(2)),
					markup: Number(markup.toFixed(2)),
					profit: Number(profit.toFixed(2)),
				};
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Erro no cálculo';
				setError(errorMessage);
				throw new Error(errorMessage);
			}
		},
		[],
	);

	/**
	 * Calculate suggested prices based on different strategies
	 */
	const calculateSuggestedPrices = useCallback(
		(purchasePrice: number, targetMargin = 30): PricingStrategies => {
			try {
				setError(null);

				if (purchasePrice <= 0) {
					throw new Error('Preço de compra deve ser maior que zero');
				}

				// Different pricing strategies
				const suggested = calculatePriceFromMargin(purchasePrice, targetMargin);
				const competitive = calculatePriceFromMargin(
					purchasePrice,
					targetMargin - 5,
				);
				const premium = calculatePriceFromMargin(
					purchasePrice,
					targetMargin + 10,
				);
				const budget = calculatePriceFromMargin(
					purchasePrice,
					targetMargin - 10,
				);

				return {
					suggested: Number(suggested.toFixed(2)),
					competitive: Number(competitive.toFixed(2)),
					premium: Number(premium.toFixed(2)),
					budget: Number(budget.toFixed(2)),
				};
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: 'Erro no cálculo de preços sugeridos';
				setError(errorMessage);
				throw new Error(errorMessage);
			}
		},
		[],
	);

	/**
	 * Calculate sale price from purchase price and desired margin percentage
	 */
	const calculatePriceFromMargin = useCallback(
		(purchasePrice: number, marginPercentage: number): number => {
			try {
				setError(null);

				if (purchasePrice <= 0) {
					throw new Error('Preço de compra deve ser maior que zero');
				}

				if (marginPercentage < 0 || marginPercentage >= 100) {
					throw new Error('Margem deve estar entre 0% e 99%');
				}

				// Formula: Sale Price = Purchase Price / (1 - Margin%)
				const salePrice = purchasePrice / (1 - marginPercentage / 100);
				return Number(salePrice.toFixed(2));
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Erro no cálculo por margem';
				setError(errorMessage);
				throw new Error(errorMessage);
			}
		},
		[],
	);

	/**
	 * Calculate sale price from purchase price and desired markup percentage
	 */
	const calculatePriceFromMarkup = useCallback(
		(purchasePrice: number, markupPercentage: number): number => {
			try {
				setError(null);

				if (purchasePrice <= 0) {
					throw new Error('Preço de compra deve ser maior que zero');
				}

				if (markupPercentage < 0) {
					throw new Error('Markup deve ser maior ou igual a 0%');
				}

				// Formula: Sale Price = Purchase Price * (1 + Markup%)
				const salePrice = purchasePrice * (1 + markupPercentage / 100);
				return Number(salePrice.toFixed(2));
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Erro no cálculo por markup';
				setError(errorMessage);
				throw new Error(errorMessage);
			}
		},
		[],
	);

	/**
	 * Format number as currency (Brazilian Real)
	 */
	const formatCurrency = useCallback((value: number): string => {
		try {
			return new Intl.NumberFormat('pt-BR', {
				style: 'currency',
				currency: 'BRL',
			}).format(value);
		} catch (err) {
			return `R$ ${value.toFixed(2)}`;
		}
	}, []);

	/**
	 * Get price suggestions and store in state
	 */
	const getPriceSuggestions = useCallback(
		(purchasePrice: number, targetMargin = 30) => {
			try {
				setIsCalculating(true);
				setError(null);

				const suggestions = calculateSuggestedPrices(
					purchasePrice,
					targetMargin,
				);
				setPriceSuggestions(suggestions);
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: 'Erro ao calcular sugestões de preço';
				setError(errorMessage);
				setPriceSuggestions(null);
			} finally {
				setIsCalculating(false);
			}
		},
		[calculateSuggestedPrices],
	);

	return {
		calculateMarginMarkup,
		calculateSuggestedPrices,
		calculatePriceFromMargin,
		calculatePriceFromMarkup,
		formatCurrency,
		isLoading,
		error,
		priceSuggestions,
		getPriceSuggestions,
		isCalculating,
	};
};

export default usePricing;
