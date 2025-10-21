// Auto code generation service for products, payment methods, etc.

interface CodeConfig {
	prefix: string;
	currentCount: number;
	padLength: number;
}

class AutoCodeService {
	private static configs: Record<string, CodeConfig> = {
		product: { prefix: 'PROD', currentCount: 0, padLength: 7 },
		paymentMethod: { prefix: 'PAG', currentCount: 0, padLength: 8 },
	};

	/**
	 * Generate next code for a given entity type
	 */
	static generateCode(
		entityType: keyof typeof AutoCodeService.configs,
	): string {
		const config = AutoCodeService.configs[entityType];
		if (!config) {
			throw new Error(`Entity type ${entityType} not configured`);
		}

		config.currentCount += 1;
		const paddedNumber = config.currentCount
			.toString()
			.padStart(config.padLength, '0');
		return `${config.prefix}${paddedNumber}`;
	}

	/**
	 * Set the current count for an entity type (useful for initialization)
	 */
	static setCurrentCount(
		entityType: keyof typeof AutoCodeService.configs,
		count: number,
	): void {
		const config = AutoCodeService.configs[entityType];
		if (config) {
			config.currentCount = count;
		}
	}

	/**
	 * Get the next code without incrementing the counter
	 */
	static previewNextCode(
		entityType: keyof typeof AutoCodeService.configs,
	): string {
		const config = AutoCodeService.configs[entityType];
		if (!config) {
			throw new Error(`Entity type ${entityType} not configured`);
		}

		const nextCount = config.currentCount + 1;
		const paddedNumber = nextCount.toString().padStart(config.padLength, '0');
		return `${config.prefix}${paddedNumber}`;
	}

	/**
	 * Initialize count based on existing data (e.g., on app startup)
	 */
	static initializeFromExisting(
		entityType: keyof typeof AutoCodeService.configs,
		existingCodes: string[],
	): void {
		const config = AutoCodeService.configs[entityType];
		if (!config) return;

		// Ensure we have a valid array and filter out invalid codes
		const validCodes = existingCodes || [];

		// Extract numbers from existing codes and find the highest one
		const numbers = validCodes
			.filter(
				(code) =>
					code && typeof code === 'string' && code.startsWith(config.prefix),
			)
			.map((code) => parseInt(code.replace(config.prefix, ''), 10))
			.filter((num) => !isNaN(num));

		const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
		AutoCodeService.setCurrentCount(entityType, maxNumber);
	}
}

export default AutoCodeService;
