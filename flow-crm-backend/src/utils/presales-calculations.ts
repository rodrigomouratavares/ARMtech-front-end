/**
 * Pre-sales calculation utilities
 * Handles all calculation logic for pre-sales including line totals, discounts, and stock validation
 */

import { db } from '../db/connection';
import { products } from '../db/schema/products';
import { eq } from 'drizzle-orm';

/**
 * Discount type
 */
export type DiscountType = 'fixed' | 'percentage';

/**
 * Interface for pre-sale item calculation data
 */
export interface PreSaleItemCalculation {
  productId: string;
  quantity: string | number;
  unitPrice: string | number;
  discount?: string | number;
  discountType?: DiscountType;
  discountPercentage?: string | number;
}

/**
 * Interface for calculation results
 */
export interface CalculationResult {
  subtotal: number;
  discountAmount: number;
  total: number;
}

/**
 * Interface for line item calculation result
 */
export interface LineItemResult {
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  lineTotalWithDiscount: number;
}

/**
 * Interface for stock validation result
 */
export interface StockValidationResult {
  isValid: boolean;
  errors: string[];
  productDetails: {
    productId: string;
    productName: string;
    availableStock: number;
    requestedQuantity: number;
  }[];
}

/**
 * Calculate line total for a single pre-sale item
 */
export function calculateLineTotal(
  quantity: string | number,
  unitPrice: string | number,
  discount: string | number = 0
): LineItemResult {
  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  const price = typeof unitPrice === 'string' ? parseFloat(unitPrice) : unitPrice;
  const disc = typeof discount === 'string' ? parseFloat(discount) : discount;

  // Validate inputs
  if (isNaN(qty) || qty < 0) {
    throw new Error('Invalid quantity: must be a positive number');
  }

  if (isNaN(price) || price < 0) {
    throw new Error('Invalid unit price: must be a positive number');
  }

  if (isNaN(disc) || disc < 0) {
    throw new Error('Invalid discount: must be a positive number');
  }

  const lineTotal = qty * price;
  const lineTotalWithDiscount = Math.max(0, lineTotal - disc);

  return {
    quantity: qty,
    unitPrice: price,
    discount: disc,
    lineTotal,
    lineTotalWithDiscount,
  };
}

/**
 * Apply discount to a subtotal amount
 */
export function applyDiscount(
  subtotal: number,
  discount: string | number,
  discountType: 'fixed' | 'percentage' = 'fixed'
): CalculationResult {
  if (isNaN(subtotal) || subtotal < 0) {
    throw new Error('Invalid subtotal: must be a positive number');
  }

  const discountValue = typeof discount === 'string' ? parseFloat(discount) : discount;

  if (isNaN(discountValue) || discountValue < 0) {
    throw new Error('Invalid discount: must be a positive number');
  }

  let discountAmount = 0;

  if (discountType === 'percentage') {
    if (discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }
    discountAmount = (subtotal * discountValue) / 100;
  } else {
    discountAmount = discountValue;
  }

  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  const total = Math.max(0, subtotal - discountAmount);

  return {
    subtotal,
    discountAmount,
    total,
  };
}

/**
 * Calculate pre-sale totals with line items and global discount
 */
export function calculatePreSaleTotals(
  items: PreSaleItemCalculation[],
  globalDiscount: string | number = 0,
  globalDiscountType: 'fixed' | 'percentage' = 'fixed'
): CalculationResult & { itemDetails: LineItemResult[] } {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items array cannot be empty');
  }

  const itemDetails: LineItemResult[] = [];
  let subtotal = 0;

  // Calculate each line item
  for (const item of items) {
    const lineResult = calculateLineTotal(item.quantity, item.unitPrice, item.discount);
    itemDetails.push(lineResult);
    subtotal += lineResult.lineTotalWithDiscount;
  }

  // Apply global discount
  const finalResult = applyDiscount(subtotal, globalDiscount, globalDiscountType);

  return {
    ...finalResult,
    itemDetails,
  };
}

/**
 * Recalculate pre-sale totals when items or discounts change
 */
export function recalculatePreSaleTotals(
  currentItems: PreSaleItemCalculation[],
  updatedItems?: PreSaleItemCalculation[],
  newGlobalDiscount?: string | number,
  globalDiscountType: 'fixed' | 'percentage' = 'fixed'
): CalculationResult & { itemDetails: LineItemResult[] } {
  const itemsToCalculate = updatedItems || currentItems;
  const discountToApply = newGlobalDiscount !== undefined ? newGlobalDiscount : 0;

  return calculatePreSaleTotals(itemsToCalculate, discountToApply, globalDiscountType);
}

/**
 * Validate stock availability for pre-sale items
 */
export async function validateStockForPreSale(
  items: PreSaleItemCalculation[]
): Promise<StockValidationResult> {
  const errors: string[] = [];
  const productDetails: StockValidationResult['productDetails'] = [];

  for (const item of items) {
    try {
      // Get product information
      const product = await db
        .select({
          id: products.id,
          name: products.name,
          stock: products.stock,
        })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product.length === 0) {
        errors.push(`Product not found: ${item.productId}`);
        continue;
      }

      const productInfo = product[0];
      const requestedQuantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;

      productDetails.push({
        productId: item.productId,
        productName: productInfo.name,
        availableStock: productInfo.stock,
        requestedQuantity,
      });

      // Check stock availability
      if (requestedQuantity > productInfo.stock) {
        errors.push(
          `Insufficient stock for "${productInfo.name}". Available: ${productInfo.stock}, Requested: ${requestedQuantity}`
        );
      }

      // Validate quantity is positive
      if (requestedQuantity <= 0) {
        errors.push(`Invalid quantity for "${productInfo.name}": must be greater than 0`);
      }
    } catch (error) {
      errors.push(`Error validating product ${item.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    productDetails,
  };
}

/**
 * Calculate total stock value for pre-sale items
 */
export async function calculateStockValue(
  items: PreSaleItemCalculation[]
): Promise<{ totalValue: number; itemValues: { productId: string; value: number }[] }> {
  let totalValue = 0;
  const itemValues: { productId: string; value: number }[] = [];

  for (const item of items) {
    const lineResult = calculateLineTotal(item.quantity, item.unitPrice, item.discount);
    const itemValue = lineResult.lineTotalWithDiscount;
    
    totalValue += itemValue;
    itemValues.push({
      productId: item.productId,
      value: itemValue,
    });
  }

  return {
    totalValue,
    itemValues,
  };
}

/**
 * Utility to format currency values
 */
export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Utility to round monetary values to 2 decimal places
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Validate pre-sale calculation inputs
 */
export function validateCalculationInputs(items: PreSaleItemCalculation[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(items)) {
    errors.push('Items must be an array');
    return { isValid: false, errors };
  }

  if (items.length === 0) {
    errors.push('At least one item is required');
    return { isValid: false, errors };
  }

  items.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`Item ${index + 1}: Product ID is required`);
    }

    const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
    if (isNaN(quantity) || quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be a positive number`);
    }

    const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
    if (isNaN(unitPrice) || unitPrice < 0) {
      errors.push(`Item ${index + 1}: Unit price must be a non-negative number`);
    }

    if (item.discount !== undefined) {
      const discount = typeof item.discount === 'string' ? parseFloat(item.discount) : item.discount;
      if (isNaN(discount) || discount < 0) {
        errors.push(`Item ${index + 1}: Discount must be a non-negative number`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Convert percentage discount to fixed value
 * @param subtotal - The subtotal amount to calculate percentage from
 * @param percentage - The percentage value (0-100)
 * @returns The fixed discount value in currency
 */
export function convertPercentageToFixed(
  subtotal: string | number,
  percentage: string | number
): number {
  const subtotalValue = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
  const percentageValue = typeof percentage === 'string' ? parseFloat(percentage) : percentage;

  if (isNaN(subtotalValue) || subtotalValue < 0) {
    throw new Error('Invalid subtotal: must be a non-negative number');
  }

  if (isNaN(percentageValue) || percentageValue < 0 || percentageValue > 100) {
    throw new Error('Invalid percentage: must be between 0 and 100');
  }

  const fixedDiscount = (subtotalValue * percentageValue) / 100;
  return roundMoney(fixedDiscount);
}

/**
 * Convert fixed discount value to percentage
 * @param subtotal - The subtotal amount to calculate percentage from
 * @param fixedValue - The fixed discount value in currency
 * @returns The percentage discount value (0-100)
 */
export function convertFixedToPercentage(
  subtotal: string | number,
  fixedValue: string | number
): number {
  const subtotalValue = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
  const fixedDiscountValue = typeof fixedValue === 'string' ? parseFloat(fixedValue) : fixedValue;

  if (isNaN(subtotalValue) || subtotalValue < 0) {
    throw new Error('Invalid subtotal: must be a non-negative number');
  }

  if (isNaN(fixedDiscountValue) || fixedDiscountValue < 0) {
    throw new Error('Invalid fixed discount: must be a non-negative number');
  }

  // Prevent division by zero
  if (subtotalValue === 0) {
    return 0;
  }

  // Ensure discount doesn't exceed subtotal
  const actualDiscount = Math.min(fixedDiscountValue, subtotalValue);
  const percentage = (actualDiscount / subtotalValue) * 100;
  
  return roundMoney(percentage);
}

/**
 * Calculate discount with automatic conversion between types
 * @param subtotal - The subtotal amount
 * @param discountValue - The discount value (fixed or percentage)
 * @param discountType - The type of discount ('fixed' or 'percentage')
 * @returns Object with both fixed value and percentage
 */
export function calculateDiscountWithConversion(
  subtotal: string | number,
  discountValue: string | number,
  discountType: DiscountType = 'fixed'
): { fixedValue: number; percentage: number; discountAmount: number } {
  const subtotalValue = typeof subtotal === 'string' ? parseFloat(subtotal) : subtotal;
  const discount = typeof discountValue === 'string' ? parseFloat(discountValue) : discountValue;

  if (discountType === 'percentage') {
    const fixedValue = convertPercentageToFixed(subtotalValue, discount);
    return {
      fixedValue,
      percentage: roundMoney(discount),
      discountAmount: fixedValue,
    };
  } else {
    const percentage = convertFixedToPercentage(subtotalValue, discount);
    return {
      fixedValue: roundMoney(discount),
      percentage,
      discountAmount: roundMoney(discount),
    };
  }
}