/**
 * Price Service Tests
 * Tests for the PriceService business logic implementation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { priceService } from '../src/services/price.service';
import { productService } from '../src/services/products.service';

describe('PriceService', () => {
    let testProductId: string;

    beforeAll(async () => {
        // Create a test product
        const product = await productService.create({
            name: 'Test Product for Price Calculation',
            unit: 'UN',
            description: 'Test product for price service testing',
            stock: 100,
            purchasePrice: '10.00',
            salePrice: '15.00',
            saleType: 'retail'
        });
        testProductId = product.id;
    });

    afterAll(async () => {
        // Clean up test data
        if (testProductId) {
            await productService.delete(testProductId);
        }
    });

    describe('calculatePrice', () => {
        it('should calculate price for a single product', async () => {
            const result = await priceService.calculatePrice({
                productId: testProductId,
                quantity: 2,
                applyPromotions: false,
                includeTaxes: false
            });

            expect(result).toBeDefined();
            expect(result.productId).toBe(testProductId);
            expect(result.quantity).toBe(2);
            expect(result.basePrice).toBe(15.00);
            expect(result.subtotal).toBe(30.00);
            expect(result.finalPrice).toBe(30.00);
            expect(result.calculationDetails.cost).toBe(10.00);
            expect(result.margin.percentage).toBeGreaterThan(0);
            expect(result.markup.percentage).toBeGreaterThan(0);
        });

        it('should handle custom base price', async () => {
            const customPrice = 20.00;
            const result = await priceService.calculatePrice({
                productId: testProductId,
                quantity: 1,
                basePrice: customPrice,
                applyPromotions: false,
                includeTaxes: false
            });

            expect(result.basePrice).toBe(customPrice);
            expect(result.subtotal).toBe(customPrice);
        });

        it('should throw error for invalid product ID', async () => {
            await expect(priceService.calculatePrice({
                productId: 'invalid-id',
                quantity: 1
            })).rejects.toThrow();
        });

        it('should throw error for invalid quantity', async () => {
            await expect(priceService.calculatePrice({
                productId: testProductId,
                quantity: 0
            })).rejects.toThrow('Quantity must be greater than zero');
        });
    });

    describe('calculateMarginMarkup', () => {
        it('should calculate margin and markup correctly', async () => {
            const result = await priceService.calculateMarginMarkup({
                cost: 10,
                sellingPrice: 15
            });

            expect(result).toBeDefined();
            expect(result.cost).toBe(10);
            expect(result.sellingPrice).toBe(15);
            expect(result.profit).toBe(5);
            expect(result.margin.percentage).toBeCloseTo(33.33, 2);
            expect(result.markup.percentage).toBe(50);
        });

        it('should throw error for zero cost', async () => {
            await expect(priceService.calculateMarginMarkup({
                cost: 0,
                sellingPrice: 15
            })).rejects.toThrow('Cost must be greater than zero');
        });

        it('should throw error for selling price less than cost', async () => {
            await expect(priceService.calculateMarginMarkup({
                cost: 15,
                sellingPrice: 10
            })).rejects.toThrow('Selling price cannot be less than cost');
        });
    });

    describe('suggestPrice', () => {
        it('should suggest price based on target margin', async () => {
            const result = await priceService.suggestPrice({
                productId: testProductId,
                targetMargin: 40
            });

            expect(result).toBeDefined();
            expect(result.productId).toBe(testProductId);
            expect(result.cost).toBe(10);
            expect(result.currentPrice).toBe(15);
            expect(result.suggestedPrice).toBeCloseTo(16.67, 2);
            expect(result.projectedMargin.percentage).toBeCloseTo(40, 1);
            expect(result.recommendations).toBeInstanceOf(Array);
        });

        it('should suggest price based on target markup', async () => {
            const result = await priceService.suggestPrice({
                productId: testProductId,
                targetMarkup: 60
            });

            expect(result).toBeDefined();
            expect(result.suggestedPrice).toBe(16);
            expect(result.projectedMarkup.percentage).toBe(60);
        });

        it('should throw error when both margin and markup are provided', async () => {
            await expect(priceService.suggestPrice({
                productId: testProductId,
                targetMargin: 40,
                targetMarkup: 60
            })).rejects.toThrow('Cannot specify both target margin and target markup');
        });

        it('should throw error when neither margin nor markup is provided', async () => {
            await expect(priceService.suggestPrice({
                productId: testProductId
            })).rejects.toThrow('Must specify either target margin or target markup');
        });
    });
});