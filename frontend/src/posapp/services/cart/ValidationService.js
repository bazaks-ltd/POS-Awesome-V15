/**
 * ValidationService - Stock and business rule validation
 */

export class ValidationService {
	constructor() {
		this.allowNegativeStock = false;
		this.stockCache = new Map();
	}

	/**
	 * Validate stock availability
	 * @param {String} itemCode - Item code
	 * @param {Number} qty - Requested quantity
	 * @param {String} warehouse - Warehouse
	 * @returns {Promise<Object>} - Validation result
	 */
	async validateStock(itemCode, qty, warehouse) {
		// Check cache first
		const cacheKey = `${itemCode}_${warehouse}`;
		let actualQty = this.stockCache.get(cacheKey);

		if (actualQty === undefined) {
			// Fetch from backend
			actualQty = await this.fetchStock(itemCode, warehouse);
			this.stockCache.set(cacheKey, actualQty);

			// Cache for 30 seconds
			setTimeout(() => {
				this.stockCache.delete(cacheKey);
			}, 30000);
		}

		if (qty > actualQty && !this.allowNegativeStock) {
			return {
				valid: false,
				message: `Insufficient stock. Available: ${actualQty}`,
				actualQty,
			};
		}

		return {
			valid: true,
			actualQty,
		};
	}

	/**
	 * Fetch actual stock from backend
	 * @param {String} itemCode - Item code
	 * @param {String} warehouse - Warehouse
	 * @returns {Promise<Number>} - Actual quantity
	 */
	async fetchStock(itemCode, warehouse) {
		try {
			const response = await frappe.call({
				method: 'erpnext.stock.utils.get_latest_stock_qty',
				args: {
					item_code: itemCode,
					warehouse: warehouse,
				},
			});

			return response.message || 0;
		} catch (error) {
			console.error('Stock fetch failed:', error);
			return 0;
		}
	}

	/**
	 * Validate batch requirements
	 * @param {Object} item - Item object
	 * @param {String} batchNo - Batch number
	 * @returns {Promise<Object>} - Validation result
	 */
	async validateBatch(item, batchNo) {
		if (!item.has_batch_no) {
			return { valid: true };
		}

		if (!batchNo) {
			return {
				valid: false,
				message: 'Batch number is required for this item',
			};
		}

		// Validate batch exists and has stock
		try {
			const response = await frappe.call({
				method: 'erpnext.stock.doctype.batch.batch.get_batch_qty',
				args: {
					batch_no: batchNo,
					warehouse: item.warehouse,
					item_code: item.item_code,
				},
			});

			const batchQty = response.message || 0;

			if (batchQty <= 0) {
				return {
					valid: false,
					message: `Batch ${batchNo} has no stock`,
				};
			}

			return {
				valid: true,
				batchQty,
			};
		} catch (error) {
			return {
				valid: false,
				message: `Invalid batch number: ${batchNo}`,
			};
		}
	}

	/**
	 * Validate serial number
	 * @param {Object} item - Item object
	 * @param {String} serialNo - Serial number
	 * @returns {Promise<Object>} - Validation result
	 */
	async validateSerial(item, serialNo) {
		if (!item.has_serial_no) {
			return { valid: true };
		}

		if (!serialNo) {
			return {
				valid: false,
				message: 'Serial number is required for this item',
			};
		}

		// Validate serial exists and is available
		try {
			const response = await frappe.call({
				method: 'erpnext.stock.doctype.serial_no.serial_no.get_serial_no_details',
				args: {
					serial_no: serialNo,
					item_code: item.item_code,
				},
			});

			if (!response.message) {
				return {
					valid: false,
					message: `Serial number ${serialNo} not found`,
				};
			}

			if (response.message.status !== 'Active') {
				return {
					valid: false,
					message: `Serial number ${serialNo} is not active`,
				};
			}

			return {
				valid: true,
				serialData: response.message,
			};
		} catch (error) {
			return {
				valid: false,
				message: `Invalid serial number: ${serialNo}`,
			};
		}
	}

	/**
	 * Validate age-restricted item
	 * @param {Object} item - Item object
	 * @param {Number} customerAge - Customer age
	 * @returns {Object} - Validation result
	 */
	validateAgeRestriction(item, customerAge) {
		if (!item.age_restricted) {
			return { valid: true };
		}

		const minAge = item.minimum_age || 21;

		if (!customerAge || customerAge < minAge) {
			return {
				valid: false,
				requiresVerification: true,
				message: `Age verification required (minimum age: ${minAge})`,
				minAge,
			};
		}

		return { valid: true };
	}

	/**
	 * Validate maximum discount allowed
	 * @param {Number} discountPercent - Discount percentage
	 * @param {Number} maxAllowed - Maximum allowed discount
	 * @param {String} userRole - User role
	 * @returns {Object} - Validation result
	 */
	validateDiscount(discountPercent, maxAllowed, userRole) {
		if (discountPercent <= maxAllowed) {
			return { valid: true };
		}

		// Check if user has manager override permission
		const canOverride = ['POS Manager', 'System Manager'].includes(userRole);

		return {
			valid: false,
			requiresOverride: true,
			canOverride,
			message: `Discount ${discountPercent}% exceeds maximum allowed ${maxAllowed}%`,
		};
	}

	/**
	 * Validate minimum order value
	 * @param {Number} orderTotal - Order total
	 * @param {Number} minValue - Minimum order value
	 * @returns {Object} - Validation result
	 */
	validateMinimumOrder(orderTotal, minValue) {
		if (!minValue || orderTotal >= minValue) {
			return { valid: true };
		}

		return {
			valid: false,
			message: `Minimum order value is ${minValue}. Current total: ${orderTotal}`,
			shortfall: minValue - orderTotal,
		};
	}

	/**
	 * Clear stock cache
	 */
	clearCache() {
		this.stockCache.clear();
	}

	/**
	 * Update cache with new stock value
	 * @param {String} itemCode - Item code
	 * @param {String} warehouse - Warehouse
	 * @param {Number} qty - New quantity
	 */
	updateCache(itemCode, warehouse, qty) {
		const cacheKey = `${itemCode}_${warehouse}`;
		this.stockCache.set(cacheKey, qty);
	}

	/**
	 * Set allow negative stock flag
	 * @param {Boolean} allow - Allow negative stock
	 */
	setAllowNegativeStock(allow) {
		this.allowNegativeStock = allow;
	}
}

