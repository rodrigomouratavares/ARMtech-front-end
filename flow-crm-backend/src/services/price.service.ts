/**
 * Price Service
 * Handles all price calculation business logic including margin, markup, discounts, and taxes
 */

import { db } from '../db/connection';
import { products } from '../db/schema/products';
import { customers } from '../db/schema/customers';
import { eq } from 'drizzle-orm';
import {
    calculateMarginAndMarkup,
    suggestPrice,
    MarginMarkupResult,
    roundMoney
} from '../utils/price-calculations';
import { PerformanceMonitor } from '../utils/audit-logger';
import {
    productCache,
    customerCache,
    calculationCache,
    generateCalculationCacheKey,
    generateMarginMarkupCacheKey,
    generateSuggestionCacheKey
} from '../utils/cache-manager';

/**
 * Interface for price calculation parameters
 */
export interface PriceCalculationParams {
    productId: string;
    quantity: string | number;
    basePrice?: string | number; // If not provided, uses product's sale price
    customerId?: string; // For customer-specific discounts
    applyPromotions?: boolean;
    includeTaxes?: boolean;
}

/**
 * Interface for price calculation result
 */
export interface PriceCalculationResult {
    productId: string;
    quantity: number;
    basePrice: number;
    subtotal: number;
    discounts: {
        customerDiscount: number;
        promotionalDiscount: number;
        totalDiscount: number;
    };
    taxes: {
        amount: number;
        rate: number;
    };
    finalPrice: number;
    margin: {
        amount: number;
        percentage: number;
    };
    markup: {
        amount: number;
        percentage: number;
    };
    calculationDetails: {
        cost: number;
        profit: number;
        timestamp: Date;
    };
}

/**
 * Interface for margin/markup calculation parameters
 */
export interface MarginMarkupParams {
    cost: string | number;
    sellingPrice: string | number;
}

/**
 * Interface for price suggestion parameters
 */
export interface PriceSuggestionParams {
    productId: string;
    targetMargin?: number; // Target margin percentage (0-100)
    targetMarkup?: number; // Target markup percentage (0+)
    customerId?: string;
    quantity?: string | number;
}

/**
 * Interface for price suggestion result
 */
export interface PriceSuggestionServiceResult {
    productId: string;
    suggestedPrice: number;
    currentPrice: number;
    cost: number;
    projectedMargin: MarginMarkupResult['margin'];
    projectedMarkup: MarginMarkupResult['markup'];
    recommendations: string[];
}

/**
 * Price service class containing all price calculation business logic
 */
export class PriceService {
    /**
     * Calculate price for a single product with all components
     */
    async calculatePrice(params: PriceCalculationParams, requestId?: string): Promise<PriceCalculationResult> {
        const {
            productId,
            quantity,
            basePrice,
            customerId,
            applyPromotions = true,
            includeTaxes = true
        } = params;

        // Validate and convert quantity
        const qty = this.validateAndConvertNumber(quantity, 'quantity');
        if (qty <= 0) {
            throw new Error('Quantity must be greater than zero');
        }

        // Check cache for identical calculation
        const cacheKey = generateCalculationCacheKey({
            productId,
            quantity: qty,
            basePrice: basePrice ? this.validateAndConvertNumber(basePrice, 'base price') : undefined,
            customerId,
            applyPromotions,
            includeTaxes
        });

        const cachedResult = calculationCache.get(cacheKey);
        if (cachedResult) {
            console.log(`[CACHE] Price calculation cache hit for key: ${cacheKey}`);
            return cachedResult;
        }

        // Get product information
        const product = await this.getProductById(productId, requestId);

        // Determine base price (use provided basePrice or product's sale price)
        const unitPrice = basePrice !== undefined
            ? this.validateAndConvertNumber(basePrice, 'base price')
            : parseFloat(product.salePrice);

        if (unitPrice <= 0) {
            throw new Error('Base price must be greater than zero');
        }

        // Calculate subtotal
        const subtotal = roundMoney(qty * unitPrice);

        // Get customer information if customerId is provided
        let customer = null;
        if (customerId) {
            customer = await this.getCustomerById(customerId, requestId);
        }

        // Calculate discounts
        const discounts = await this.calculateDiscounts({
            subtotal,
            productId,
            customerId: customer?.id,
            applyPromotions
        });

        // Calculate price after discounts
        const priceAfterDiscounts = roundMoney(subtotal - discounts.totalDiscount);

        // Calculate taxes
        const taxes = includeTaxes
            ? await this.calculateTaxes({ productId, amount: priceAfterDiscounts })
            : { amount: 0, rate: 0 };

        // Calculate final price
        const finalPrice = roundMoney(priceAfterDiscounts + taxes.amount);

        // Calculate margin and markup
        const cost = parseFloat(product.purchasePrice);
        const finalUnitPrice = finalPrice / qty;

        const marginMarkupResult = calculateMarginAndMarkup({
            cost,
            sellingPrice: finalUnitPrice
        });

        const result: PriceCalculationResult = {
            productId,
            quantity: qty,
            basePrice: unitPrice,
            subtotal,
            discounts,
            taxes,
            finalPrice,
            margin: marginMarkupResult.margin,
            markup: marginMarkupResult.markup,
            calculationDetails: {
                cost,
                profit: marginMarkupResult.profit,
                timestamp: new Date()
            }
        };

        // Cache the result for future identical requests
        calculationCache.set(cacheKey, result);
        console.log(`[CACHE] Price calculation cached with key: ${cacheKey}`);

        return result;
    }

    /**
     * Get product by ID with error handling
     */
    private async getProductById(productId: string, requestId?: string) {
        // Check cache first
        const cachedProduct = productCache.get(productId);
        if (cachedProduct) {
            console.log(`[CACHE] Product cache hit for ID: ${productId}`);
            return cachedProduct;
        }

        const queryStart = Date.now();

        const result = await db
            .select()
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        // Record database query performance
        if (requestId) {
            const queryTime = Date.now() - queryStart;
            PerformanceMonitor.recordDbQuery(requestId, queryTime);
        }

        if (result.length === 0) {
            throw new Error(`Product not found: ${productId}`);
        }

        const product = result[0];

        // Cache the product for future requests
        productCache.set(productId, product);
        console.log(`[CACHE] Product cached with ID: ${productId}`);

        return product;
    }

    /**
     * Get customer by ID with error handling
     */
    private async getCustomerById(customerId: string, requestId?: string) {
        // Check cache first
        const cachedCustomer = customerCache.get(customerId);
        if (cachedCustomer) {
            console.log(`[CACHE] Customer cache hit for ID: ${customerId}`);
            return cachedCustomer;
        }

        const queryStart = Date.now();

        const result = await db
            .select()
            .from(customers)
            .where(eq(customers.id, customerId))
            .limit(1);

        // Record database query performance
        if (requestId) {
            const queryTime = Date.now() - queryStart;
            PerformanceMonitor.recordDbQuery(requestId, queryTime);
        }

        if (result.length === 0) {
            throw new Error(`Customer not found: ${customerId}`);
        }

        const customer = result[0];

        // Cache the customer for future requests
        customerCache.set(customerId, customer);
        console.log(`[CACHE] Customer cached with ID: ${customerId}`);

        return customer;
    }

    /**
     * Calculate discounts (customer-specific and promotional)
     */
    private async calculateDiscounts(params: {
        subtotal: number;
        productId: string;
        customerId?: string;
        applyPromotions: boolean;
    }): Promise<{
        customerDiscount: number;
        promotionalDiscount: number;
        totalDiscount: number;
    }> {
        let customerDiscount = 0;
        let promotionalDiscount = 0;

        // Calculate customer-specific discount
        if (params.customerId) {
            customerDiscount = await this.calculateCustomerDiscount({
                customerId: params.customerId,
                subtotal: params.subtotal,
                productId: params.productId
            });
        }

        // Calculate promotional discount
        if (params.applyPromotions) {
            promotionalDiscount = await this.calculatePromotionalDiscount({
                productId: params.productId,
                subtotal: params.subtotal
            });
        }

        const totalDiscount = roundMoney(customerDiscount + promotionalDiscount);

        return {
            customerDiscount: roundMoney(customerDiscount),
            promotionalDiscount: roundMoney(promotionalDiscount),
            totalDiscount
        };
    }

    /**
     * Calculate customer-specific discount
     * Implements customer discount logic with proper order of operations
     */
    private async calculateCustomerDiscount(params: {
        customerId: string;
        subtotal: number;
        productId: string;
    }): Promise<number> {
        try {
            // Get customer information to check for discount eligibility
            const customer = await this.getCustomerById(params.customerId);

            // Placeholder for customer discount logic
            // In a real implementation, this would:
            // 1. Check customer tier/category
            // 2. Look up customer-specific discount rules
            // 3. Check for volume-based discounts
            // 4. Apply time-based promotions for the customer

            // For now, implement a simple customer loyalty discount
            // This is a basic implementation that can be enhanced later
            const customerDiscountRate = await this.getCustomerDiscountRate(customer.id);

            if (customerDiscountRate > 0) {
                const discountAmount = (params.subtotal * customerDiscountRate) / 100;
                return roundMoney(Math.min(discountAmount, params.subtotal));
            }

            return 0;
        } catch (error) {
            // Log error but don't fail the calculation
            console.warn(`Error calculating customer discount for ${params.customerId}:`, error);
            return 0;
        }
    }

    /**
     * Get customer discount rate based on customer history or tier
     */
    private async getCustomerDiscountRate(customerId: string): Promise<number> {
        // Placeholder implementation for customer discount rate
        // In a real system, this would check:
        // 1. Customer tier (VIP, Premium, Regular)
        // 2. Purchase history
        // 3. Loyalty program status
        // 4. Special agreements

        // For now, return 0 (no customer-specific discount)
        // This can be enhanced when customer tier system is implemented
        return 0;
    }

    /**
     * Calculate promotional discount with automatic detection and application
     * Implements proper order of operations: base price → customer discounts → promotional discounts
     */
    private async calculatePromotionalDiscount(params: {
        productId: string;
        subtotal: number;
    }): Promise<number> {
        try {
            // Get active promotions for the product
            const activePromotions = await this.getActivePromotions(params.productId);

            if (activePromotions.length === 0) {
                return 0;
            }

            // Apply promotions in order of priority
            // Higher priority promotions are applied first
            let totalPromotionalDiscount = 0;
            let remainingAmount = params.subtotal;

            for (const promotion of activePromotions) {
                const discountAmount = this.calculatePromotionDiscount(promotion, remainingAmount);
                totalPromotionalDiscount += discountAmount;
                remainingAmount -= discountAmount;

                // Stop if remaining amount is zero or negative
                if (remainingAmount <= 0) {
                    break;
                }
            }

            return roundMoney(Math.min(totalPromotionalDiscount, params.subtotal));
        } catch (error) {
            // Log error but don't fail the calculation
            console.warn(`Error calculating promotional discount for product ${params.productId}:`, error);
            return 0;
        }
    }

    /**
     * Get active promotions for a product
     */
    private async getActivePromotions(productId: string): Promise<Array<{
        id: string;
        type: 'percentage' | 'fixed';
        value: number;
        priority: number;
        minAmount?: number;
        maxDiscount?: number;
    }>> {
        // Placeholder implementation for promotion detection
        // In a real system, this would query a promotions table with conditions like:
        // 1. Active date range (start_date <= now <= end_date)
        // 2. Product eligibility (specific products, categories, or all products)
        // 3. Customer eligibility (if applicable)
        // 4. Usage limits (per customer, total uses)

        // For now, return empty array (no active promotions)
        // This can be enhanced when promotion system is implemented
        return [];
    }

    /**
     * Calculate discount amount for a specific promotion
     */
    private calculatePromotionDiscount(
        promotion: {
            type: 'percentage' | 'fixed';
            value: number;
            minAmount?: number;
            maxDiscount?: number;
        },
        amount: number
    ): number {
        // Check minimum amount requirement
        if (promotion.minAmount && amount < promotion.minAmount) {
            return 0;
        }

        let discountAmount = 0;

        if (promotion.type === 'percentage') {
            discountAmount = (amount * promotion.value) / 100;

            // Apply maximum discount limit if specified
            if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
                discountAmount = promotion.maxDiscount;
            }
        } else {
            // Fixed discount
            discountAmount = promotion.value;
        }

        // Ensure discount doesn't exceed the amount
        return Math.min(discountAmount, amount);
    }

    /**
     * Calculate taxes based on product tax rates
     * Implements tax calculation with proper order of operations: base price → discounts → taxes
     */
    private async calculateTaxes(params: {
        productId: string;
        amount: number;
    }): Promise<{ amount: number; rate: number }> {
        try {
            // Get product to check for tax configuration
            const product = await this.getProductById(params.productId);

            // Get tax rate for the product
            const taxRate = await this.getProductTaxRate(params.productId, product);

            if (taxRate <= 0) {
                return { amount: 0, rate: 0 };
            }

            // Calculate tax amount
            const taxAmount = (params.amount * taxRate) / 100;

            return {
                amount: roundMoney(taxAmount),
                rate: roundMoney(taxRate)
            };
        } catch (error) {
            // Log error but don't fail the calculation
            console.warn(`Error calculating taxes for product ${params.productId}:`, error);
            return { amount: 0, rate: 0 };
        }
    }

    /**
     * Get tax rate for a product
     */
    private async getProductTaxRate(productId: string, product: any): Promise<number> {
        // Placeholder implementation for tax rate determination
        // In a real system, this would:
        // 1. Check product-specific tax configuration
        // 2. Look up tax rates by product category
        // 3. Consider regional tax rules
        // 4. Handle tax exemptions
        // 5. Apply compound tax calculations if needed

        // For now, return 0 (no tax)
        // This can be enhanced when tax system is implemented
        // Common Brazilian tax rates could be:
        // - ICMS: varies by state (7% to 25%)
        // - IPI: varies by product type (0% to 365%)
        // - PIS/COFINS: typically around 9.25%

        return 0;
    }

    /**
     * Calculate margin and markup for given cost and selling price
     */
    async calculateMarginMarkup(params: MarginMarkupParams): Promise<MarginMarkupResult> {
        const cost = this.validateAndConvertNumber(params.cost, 'cost');
        const sellingPrice = this.validateAndConvertNumber(params.sellingPrice, 'selling price');

        // Validate cost is positive
        if (cost <= 0) {
            throw new Error('Cost must be greater than zero');
        }

        // Validate selling price is positive
        if (sellingPrice <= 0) {
            throw new Error('Selling price must be greater than zero');
        }

        // Validate selling price is greater than or equal to cost
        if (sellingPrice < cost) {
            throw new Error('Selling price cannot be less than cost (would result in negative margin)');
        }

        // Check cache for identical calculation
        const cacheKey = generateMarginMarkupCacheKey(cost, sellingPrice);
        const cachedResult = calculationCache.get(cacheKey);
        if (cachedResult) {
            console.log(`[CACHE] Margin/markup calculation cache hit for key: ${cacheKey}`);
            return cachedResult;
        }

        const result = calculateMarginAndMarkup({ cost, sellingPrice });

        // Cache the result
        calculationCache.set(cacheKey, result);
        console.log(`[CACHE] Margin/markup calculation cached with key: ${cacheKey}`);

        return result;
    }

    /**
     * Suggest price based on target margin or markup
     */
    async suggestPrice(params: PriceSuggestionParams, requestId?: string): Promise<PriceSuggestionServiceResult> {
        const { productId, targetMargin, targetMarkup, customerId, quantity = 1 } = params;

        // Validate that either margin or markup is provided, but not both
        if (targetMargin !== undefined && targetMarkup !== undefined) {
            throw new Error('Cannot specify both target margin and target markup. Choose one.');
        }

        if (targetMargin === undefined && targetMarkup === undefined) {
            throw new Error('Must specify either target margin or target markup');
        }

        // Check cache for identical suggestion
        const normalizedParams = {
            ...params,
            quantity: typeof params.quantity === 'string' ? parseFloat(params.quantity) : params.quantity
        };
        const cacheKey = generateSuggestionCacheKey(normalizedParams);
        const cachedResult = calculationCache.get(cacheKey);
        if (cachedResult) {
            console.log(`[CACHE] Price suggestion cache hit for key: ${cacheKey}`);
            return cachedResult;
        }

        // Get product information
        const product = await this.getProductById(productId, requestId);
        const cost = parseFloat(product.purchasePrice);
        const currentPrice = parseFloat(product.salePrice);

        // Calculate suggested price using utility function
        const suggestion = suggestPrice({
            cost,
            targetMargin,
            targetMarkup
        });

        // Calculate margin and markup for the suggested price
        const marginMarkupResult = calculateMarginAndMarkup({
            cost,
            sellingPrice: suggestion.suggestedPrice
        });

        // Generate recommendations
        const recommendations = this.generatePriceRecommendations({
            cost,
            currentPrice,
            suggestedPrice: suggestion.suggestedPrice,
            targetMargin,
            targetMarkup,
            marginMarkupResult
        });

        const result: PriceSuggestionServiceResult = {
            productId,
            suggestedPrice: suggestion.suggestedPrice,
            currentPrice,
            cost,
            projectedMargin: marginMarkupResult.margin,
            projectedMarkup: marginMarkupResult.markup,
            recommendations
        };

        // Cache the result
        calculationCache.set(cacheKey, result);
        console.log(`[CACHE] Price suggestion cached with key: ${cacheKey}`);

        return result;
    }

    /**
     * Generate price recommendations based on analysis
     */
    private generatePriceRecommendations(params: {
        cost: number;
        currentPrice: number;
        suggestedPrice: number;
        targetMargin?: number;
        targetMarkup?: number;
        marginMarkupResult: MarginMarkupResult;
    }): string[] {
        const { cost, currentPrice, suggestedPrice, targetMargin, targetMarkup, marginMarkupResult } = params;
        const recommendations: string[] = [];

        // Compare suggested price with current price
        const priceDifference = suggestedPrice - currentPrice;
        const priceDifferencePercentage = (priceDifference / currentPrice) * 100;

        if (Math.abs(priceDifferencePercentage) > 20) {
            if (priceDifference > 0) {
                recommendations.push(`Suggested price is ${Math.abs(priceDifferencePercentage).toFixed(1)}% higher than current price. Consider gradual price increase.`);
            } else {
                recommendations.push(`Suggested price is ${Math.abs(priceDifferencePercentage).toFixed(1)}% lower than current price. Review cost structure.`);
            }
        }

        // Margin-based recommendations
        if (marginMarkupResult.margin.percentage < 10) {
            recommendations.push('Low margin detected. Consider increasing price or reducing costs for better profitability.');
        } else if (marginMarkupResult.margin.percentage > 70) {
            recommendations.push('Very high margin. Ensure price remains competitive in the market.');
        }

        // Markup-based recommendations
        if (marginMarkupResult.markup.percentage < 20) {
            recommendations.push('Low markup detected. Ensure all costs and overhead are adequately covered.');
        }

        // Profit recommendations
        if (marginMarkupResult.profit < 1) {
            recommendations.push('Very low profit margin. Review pricing strategy and cost structure.');
        }

        // Target-specific recommendations
        if (targetMargin !== undefined) {
            recommendations.push(`Price calculated to achieve ${targetMargin}% margin. Actual projected margin: ${marginMarkupResult.margin.percentage.toFixed(2)}%`);
        }

        if (targetMarkup !== undefined) {
            recommendations.push(`Price calculated to achieve ${targetMarkup}% markup. Actual projected markup: ${marginMarkupResult.markup.percentage.toFixed(2)}%`);
        }

        return recommendations;
    }

    /**
     * Validate and convert numeric input
     */
    private validateAndConvertNumber(value: string | number, fieldName: string): number {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) {
            throw new Error(`Invalid ${fieldName}: must be a valid number`);
        }

        return numValue;
    }
}

// Export singleton instance
export const priceService = new PriceService();