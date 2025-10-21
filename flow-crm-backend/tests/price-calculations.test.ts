/**
 * Tests for price calculation utilities
 */

import { describe, it, expect } from 'vitest';
import {
    calculateMargin,
    calculateMarkup,
    calculateMarginAndMarkup,
    suggestPriceByMargin,
    suggestPriceByMarkup,
    suggestPrice,
    analyzePricing,
    convertMarginToMarkup,
    convertMarkupToMargin,
    batchCalculateMargins,
} from '../src/utils/price-calculations';

describe('Price Calculations', () => {
    describe('calculateMargin', () => {
        it('should calculate margin correctly', () => {
            const result = calculateMargin({ cost: 100, sellingPrice: 150 });

            expect(result.cost).toBe(100);
            expect(result.sellingPrice).toBe(150);
            expect(result.profit).toBe(50);
            expect(result.marginAmount).toBe(50);
            expect(result.marginPercentage).toBe(33.33);
        });

        it('should handle string inputs', () => {
            const result = calculateMargin({ cost: '100', sellingPrice: '150' });

            expect(result.marginPercentage).toBe(33.33);
        });

        it('should throw error for negative cost', () => {
            expect(() => calculateMargin({ cost: -100, sellingPrice: 150 }))
                .toThrow('Invalid cost: must be greater than zero');
        });

        it('should throw error when selling price is less than cost', () => {
            expect(() => calculateMargin({ cost: 150, sellingPrice: 100 }))
                .toThrow('Selling price cannot be less than cost');
        });
    });

    describe('calculateMarkup', () => {
        it('should calculate markup correctly', () => {
            const result = calculateMarkup({ cost: 100, sellingPrice: 150 });

            expect(result.cost).toBe(100);
            expect(result.sellingPrice).toBe(150);
            expect(result.profit).toBe(50);
            expect(result.markupAmount).toBe(50);
            expect(result.markupPercentage).toBe(50);
        });

        it('should handle zero profit (cost equals selling price)', () => {
            const result = calculateMarkup({ cost: 100, sellingPrice: 100 });

            expect(result.markupPercentage).toBe(0);
            expect(result.profit).toBe(0);
        });
    });

    describe('suggestPriceByMargin', () => {
        it('should suggest correct price for target margin', () => {
            const result = suggestPriceByMargin(100, 20); // 20% margin

            expect(result.cost).toBe(100);
            expect(result.suggestedPrice).toBe(125);
            expect(result.targetMargin).toBe(20);
            expect(result.projectedMargin).toBe(20);
        });

        it('should throw error for invalid margin percentage', () => {
            expect(() => suggestPriceByMargin(100, 100))
                .toThrow('Invalid margin percentage');

            expect(() => suggestPriceByMargin(100, -10))
                .toThrow('Invalid margin percentage');
        });
    });

    describe('suggestPriceByMarkup', () => {
        it('should suggest correct price for target markup', () => {
            const result = suggestPriceByMarkup(100, 50); // 50% markup

            expect(result.cost).toBe(100);
            expect(result.suggestedPrice).toBe(150);
            expect(result.targetMarkup).toBe(50);
            expect(result.projectedMarkup).toBe(50);
        });
    });

    describe('convertMarginToMarkup', () => {
        it('should convert margin to markup correctly', () => {
            const markup = convertMarginToMarkup(33.33); // 33.33% margin
            expect(markup).toBe(49.99); // Should be approximately 50% markup (rounded)
        });

        it('should handle zero margin', () => {
            const markup = convertMarginToMarkup(0);
            expect(markup).toBe(0);
        });
    });

    describe('convertMarkupToMargin', () => {
        it('should convert markup to margin correctly', () => {
            const margin = convertMarkupToMargin(50); // 50% markup
            expect(margin).toBe(33.33); // Should be 33.33% margin
        });

        it('should handle zero markup', () => {
            const margin = convertMarkupToMargin(0);
            expect(margin).toBe(0);
        });
    });

    describe('analyzePricing', () => {
        it('should provide analysis with recommendations', () => {
            const result = analyzePricing(100, 110); // Low margin scenario

            expect(result.margin.percentage).toBe(9.09);
            expect(result.recommendations).toContain('Low margin detected. Consider increasing selling price for better profitability.');
        });
    });

    describe('batchCalculateMargins', () => {
        it('should calculate margins for multiple items', () => {
            const items = [
                { cost: 100, sellingPrice: 150, productId: 'prod1' },
                { cost: 200, sellingPrice: 250, productId: 'prod2' },
            ];

            const results = batchCalculateMargins(items);

            expect(results).toHaveLength(2);
            expect(results[0].margin.percentage).toBe(33.33);
            expect(results[1].margin.percentage).toBe(20);
            expect(results[0].productId).toBe('prod1');
        });
    });
});