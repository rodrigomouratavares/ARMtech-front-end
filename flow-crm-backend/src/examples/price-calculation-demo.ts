/**
 * Demonstration of price calculation utilities
 * Shows how to use the core math functions for margin, markup, and price suggestions
 */

import {
    calculateMargin,
    calculateMarkup,
    calculateMarginAndMarkup,
    suggestPriceByMargin,
    suggestPriceByMarkup,
    analyzePricing,
    convertMarginToMarkup,
    convertMarkupToMargin,
} from '../utils/price-calculations';

console.log('=== Price Calculation Utilities Demo ===\n');

// Example 1: Basic margin calculation
console.log('1. Margin Calculation:');
const marginResult = calculateMargin({ cost: 100, sellingPrice: 150 });
console.log(`Cost: R$ ${marginResult.cost}`);
console.log(`Selling Price: R$ ${marginResult.sellingPrice}`);
console.log(`Profit: R$ ${marginResult.profit}`);
console.log(`Margin: ${marginResult.marginPercentage}%\n`);

// Example 2: Basic markup calculation
console.log('2. Markup Calculation:');
const markupResult = calculateMarkup({ cost: 100, sellingPrice: 150 });
console.log(`Cost: R$ ${markupResult.cost}`);
console.log(`Selling Price: R$ ${markupResult.sellingPrice}`);
console.log(`Profit: R$ ${markupResult.profit}`);
console.log(`Markup: ${markupResult.markupPercentage}%\n`);

// Example 3: Combined margin and markup analysis
console.log('3. Combined Analysis:');
const combinedResult = calculateMarginAndMarkup({ cost: 100, sellingPrice: 150 });
console.log(`Cost: R$ ${combinedResult.cost}`);
console.log(`Selling Price: R$ ${combinedResult.sellingPrice}`);
console.log(`Profit: R$ ${combinedResult.profit}`);
console.log(`Margin: ${combinedResult.margin.percentage}%`);
console.log(`Markup: ${combinedResult.markup.percentage}%\n`);

// Example 4: Price suggestion based on target margin
console.log('4. Price Suggestion by Margin (30% target):');
const marginSuggestion = suggestPriceByMargin(100, 30);
console.log(`Cost: R$ ${marginSuggestion.cost}`);
console.log(`Suggested Price: R$ ${marginSuggestion.suggestedPrice}`);
console.log(`Target Margin: ${marginSuggestion.targetMargin}%`);
console.log(`Projected Margin: ${marginSuggestion.projectedMargin}%`);
console.log(`Projected Markup: ${marginSuggestion.projectedMarkup}%\n`);

// Example 5: Price suggestion based on target markup
console.log('5. Price Suggestion by Markup (60% target):');
const markupSuggestion = suggestPriceByMarkup(100, 60);
console.log(`Cost: R$ ${markupSuggestion.cost}`);
console.log(`Suggested Price: R$ ${markupSuggestion.suggestedPrice}`);
console.log(`Target Markup: ${markupSuggestion.targetMarkup}%`);
console.log(`Projected Margin: ${markupSuggestion.projectedMargin}%`);
console.log(`Projected Markup: ${markupSuggestion.projectedMarkup}%\n`);

// Example 6: Pricing analysis with recommendations
console.log('6. Pricing Analysis with Recommendations:');
const analysis = analyzePricing(100, 105); // Low margin scenario
console.log(`Cost: R$ ${analysis.cost}`);
console.log(`Selling Price: R$ ${analysis.sellingPrice}`);
console.log(`Margin: ${analysis.margin.percentage}%`);
console.log(`Markup: ${analysis.markup.percentage}%`);
console.log('Recommendations:');
analysis.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
});
console.log();

// Example 7: Conversion between margin and markup
console.log('7. Margin/Markup Conversions:');
const margin25 = 25;
const equivalentMarkup = convertMarginToMarkup(margin25);
console.log(`${margin25}% margin = ${equivalentMarkup}% markup`);

const markup50 = 50;
const equivalentMargin = convertMarkupToMargin(markup50);
console.log(`${markup50}% markup = ${equivalentMargin}% margin\n`);

// Example 8: Error handling demonstration
console.log('8. Error Handling Examples:');
try {
    calculateMargin({ cost: 0, sellingPrice: 100 });
} catch (error) {
    console.log(`Error with zero cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

try {
    calculateMargin({ cost: 150, sellingPrice: 100 });
} catch (error) {
    console.log(`Error with selling price < cost: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

try {
    suggestPriceByMargin(100, 100);
} catch (error) {
    console.log(`Error with 100% margin: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

console.log('\n=== Demo Complete ===');