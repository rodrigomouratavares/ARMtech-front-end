/**
 * Price calculation utilities
 * Handles margin, markup calculations and price suggestions for products
 */

/**
 * Interface for margin calculation parameters
 */
export interface MarginCalculationParams {
    cost: string | number;
    sellingPrice: string | number;
}

/**
 * Interface for markup calculation parameters
 */
export interface MarkupCalculationParams {
    cost: string | number;
    sellingPrice: string | number;
}

/**
 * Interface for price suggestion parameters
 */
export interface PriceSuggestionParams {
    cost: string | number;
    targetMargin?: number; // Target margin percentage (0-100)
    targetMarkup?: number; // Target markup percentage (0+)
}

/**
 * Interface for margin calculation result
 */
export interface MarginResult {
    cost: number;
    sellingPrice: number;
    profit: number;
    marginAmount: number;
    marginPercentage: number;
}

/**
 * Interface for markup calculation result
 */
export interface MarkupResult {
    cost: number;
    sellingPrice: number;
    profit: number;
    markupAmount: number;
    markupPercentage: number;
}

/**
 * Interface for combined margin and markup result
 */
export interface MarginMarkupResult {
    cost: number;
    sellingPrice: number;
    profit: number;
    margin: {
        amount: number;
        percentage: number;
    };
    markup: {
        amount: number;
        percentage: number;
    };
}

/**
 * Interface for price suggestion result
 */
export interface PriceSuggestionResult {
    cost: number;
    suggestedPrice: number;
    targetMargin?: number;
    targetMarkup?: number;
    projectedMargin: MarginResult['marginPercentage'];
    projectedMarkup: MarkupResult['markupPercentage'];
    profit: number;
}

/**
 * Utility to round monetary values to 2 decimal places
 */
export function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Validate numeric input and convert to number
 */
function validateAndConvertNumber(value: string | number, fieldName: string): number {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        throw new Error(`Invalid ${fieldName}: must be a valid number`);
    }

    return numValue;
}

/**
 * Validate cost input (must be positive)
 */
function validateCost(cost: string | number): number {
    const costValue = validateAndConvertNumber(cost, 'cost');

    if (costValue <= 0) {
        throw new Error('Invalid cost: must be greater than zero');
    }

    return costValue;
}

/**
 * Validate selling price input (must be positive)
 */
function validateSellingPrice(sellingPrice: string | number): number {
    const priceValue = validateAndConvertNumber(sellingPrice, 'selling price');

    if (priceValue <= 0) {
        throw new Error('Invalid selling price: must be greater than zero');
    }

    return priceValue;
}

/**
 * Validate margin percentage (must be between 0 and 100)
 */
function validateMarginPercentage(margin: number): void {
    if (margin < 0 || margin >= 100) {
        throw new Error('Invalid margin percentage: must be between 0 and 99.99');
    }
}

/**
 * Validate markup percentage (must be positive)
 */
function validateMarkupPercentage(markup: number): void {
    if (markup < 0) {
        throw new Error('Invalid markup percentage: must be greater than or equal to 0');
    }
}

/**
 * Calculate margin using formula: margin = (selling_price - cost) / selling_price * 100
 */
export function calculateMargin(params: MarginCalculationParams): MarginResult {
    const cost = validateCost(params.cost);
    const sellingPrice = validateSellingPrice(params.sellingPrice);

    // Validate that selling price is greater than or equal to cost
    if (sellingPrice < cost) {
        throw new Error('Selling price cannot be less than cost (would result in negative margin)');
    }

    const profit = sellingPrice - cost;
    const marginAmount = profit;
    const marginPercentage = (profit / sellingPrice) * 100;

    return {
        cost: roundMoney(cost),
        sellingPrice: roundMoney(sellingPrice),
        profit: roundMoney(profit),
        marginAmount: roundMoney(marginAmount),
        marginPercentage: roundMoney(marginPercentage),
    };
}

/**
 * Calculate markup using formula: markup = (selling_price - cost) / cost * 100
 */
export function calculateMarkup(params: MarkupCalculationParams): MarkupResult {
    const cost = validateCost(params.cost);
    const sellingPrice = validateSellingPrice(params.sellingPrice);

    const profit = sellingPrice - cost;
    const markupAmount = profit;
    const markupPercentage = (profit / cost) * 100;

    return {
        cost: roundMoney(cost),
        sellingPrice: roundMoney(sellingPrice),
        profit: roundMoney(profit),
        markupAmount: roundMoney(markupAmount),
        markupPercentage: roundMoney(markupPercentage),
    };
}

/**
 * Calculate both margin and markup for given cost and selling price
 */
export function calculateMarginAndMarkup(params: MarginCalculationParams): MarginMarkupResult {
    const marginResult = calculateMargin(params);
    const markupResult = calculateMarkup(params);

    return {
        cost: marginResult.cost,
        sellingPrice: marginResult.sellingPrice,
        profit: marginResult.profit,
        margin: {
            amount: marginResult.marginAmount,
            percentage: marginResult.marginPercentage,
        },
        markup: {
            amount: markupResult.markupAmount,
            percentage: markupResult.markupPercentage,
        },
    };
}

/**
 * Suggest price based on target margin percentage
 * Formula: selling_price = cost / (1 - target_margin/100)
 */
export function suggestPriceByMargin(cost: string | number, targetMargin: number): PriceSuggestionResult {
    const costValue = validateCost(cost);
    validateMarginPercentage(targetMargin);

    // Calculate suggested price using margin formula
    const suggestedPrice = costValue / (1 - targetMargin / 100);
    const profit = suggestedPrice - costValue;

    // Calculate actual margin and markup for the suggested price
    const marginResult = calculateMargin({ cost: costValue, sellingPrice: suggestedPrice });
    const markupResult = calculateMarkup({ cost: costValue, sellingPrice: suggestedPrice });

    return {
        cost: roundMoney(costValue),
        suggestedPrice: roundMoney(suggestedPrice),
        targetMargin,
        projectedMargin: marginResult.marginPercentage,
        projectedMarkup: markupResult.markupPercentage,
        profit: roundMoney(profit),
    };
}

/**
 * Suggest price based on target markup percentage
 * Formula: selling_price = cost * (1 + target_markup/100)
 */
export function suggestPriceByMarkup(cost: string | number, targetMarkup: number): PriceSuggestionResult {
    const costValue = validateCost(cost);
    validateMarkupPercentage(targetMarkup);

    // Calculate suggested price using markup formula
    const suggestedPrice = costValue * (1 + targetMarkup / 100);
    const profit = suggestedPrice - costValue;

    // Calculate actual margin and markup for the suggested price
    const marginResult = calculateMargin({ cost: costValue, sellingPrice: suggestedPrice });
    const markupResult = calculateMarkup({ cost: costValue, sellingPrice: suggestedPrice });

    return {
        cost: roundMoney(costValue),
        suggestedPrice: roundMoney(suggestedPrice),
        targetMarkup,
        projectedMargin: marginResult.marginPercentage,
        projectedMarkup: markupResult.markupPercentage,
        profit: roundMoney(profit),
    };
}

/**
 * Suggest price based on either target margin or markup
 */
export function suggestPrice(params: PriceSuggestionParams): PriceSuggestionResult {
    const { cost, targetMargin, targetMarkup } = params;

    // Validate that either margin or markup is provided, but not both
    if (targetMargin !== undefined && targetMarkup !== undefined) {
        throw new Error('Cannot specify both target margin and target markup. Choose one.');
    }

    if (targetMargin === undefined && targetMarkup === undefined) {
        throw new Error('Must specify either target margin or target markup');
    }

    if (targetMargin !== undefined) {
        return suggestPriceByMargin(cost, targetMargin);
    } else {
        return suggestPriceByMarkup(cost, targetMarkup!);
    }
}

/**
 * Calculate price with margin/markup analysis
 * Combines price calculation with detailed margin and markup breakdown
 */
export function analyzePricing(cost: string | number, sellingPrice: string | number): MarginMarkupResult & {
    recommendations: string[];
} {
    const analysis = calculateMarginAndMarkup({ cost, sellingPrice });
    const recommendations: string[] = [];

    // Add recommendations based on the analysis
    if (analysis.margin.percentage < 10) {
        recommendations.push('Low margin detected. Consider increasing selling price for better profitability.');
    }

    if (analysis.margin.percentage > 70) {
        recommendations.push('Very high margin. Consider if price is competitive in the market.');
    }

    if (analysis.markup.percentage < 20) {
        recommendations.push('Low markup detected. Ensure all costs are covered.');
    }

    if (analysis.profit < 1) {
        recommendations.push('Very low profit margin. Review cost structure and pricing strategy.');
    }

    return {
        ...analysis,
        recommendations,
    };
}

/**
 * Batch calculate margins for multiple products
 */
export function batchCalculateMargins(
    items: Array<{ cost: string | number; sellingPrice: string | number; productId?: string }>
): Array<MarginMarkupResult & { productId?: string }> {
    return items.map((item) => {
        try {
            const result = calculateMarginAndMarkup(item);
            return {
                ...result,
                productId: item.productId,
            };
        } catch (error) {
            throw new Error(
                `Error calculating margin for product ${item.productId || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        }
    });
}

/**
 * Convert margin percentage to markup percentage
 * Formula: markup = margin / (1 - margin/100) * 100
 */
export function convertMarginToMarkup(marginPercentage: number): number {
    validateMarginPercentage(marginPercentage);

    if (marginPercentage === 0) {
        return 0;
    }

    const markupPercentage = (marginPercentage / (100 - marginPercentage)) * 100;
    return roundMoney(markupPercentage);
}

/**
 * Convert markup percentage to margin percentage
 * Formula: margin = markup / (1 + markup/100) * 100
 */
export function convertMarkupToMargin(markupPercentage: number): number {
    validateMarkupPercentage(markupPercentage);

    if (markupPercentage === 0) {
        return 0;
    }

    const marginPercentage = (markupPercentage / (100 + markupPercentage)) * 100;
    return roundMoney(marginPercentage);
}