/**
 * PricingService - Handle price calculations, discounts, and promotions
 */

export class PricingService {
	constructor() {
		this.pricingRules = [];
		this.promotions = [];
	}

	/**
	 * Apply pricing rules and promotions to a cart item
	 * @param {Object} item - Cart item
	 * @param {Object} customer - Customer object
	 * @returns {Promise<Object>} - Updated item with pricing
	 */
	async applyPricing(item, customer = null) {
		// Base calculation
		item.amount = item.qty * item.rate;

		// Apply customer-specific pricing
		if (customer && customer.price_list) {
			await this.applyPriceList(item, customer.price_list);
		}

		// Apply promotions and offers
		await this.applyPromotions(item, customer);

		// Calculate tax
		await this.calculateTax(item);

		// Final amount
		item.net_amount = item.amount - (item.discount_amount || 0);
		item.total_amount = item.net_amount + (item.tax_amount || 0);

		return item;
	}

	/**
	 * Apply price list to item
	 * @param {Object} item - Cart item
	 * @param {String} priceList - Price list name
	 */
	async applyPriceList(item, priceList) {
		try {
			const response = await frappe.call({
				method: 'erpnext.stock.get_item_details.get_price_list_rate_for',
				args: {
					item_code: item.item_code,
					price_list: priceList,
					customer_price_list: priceList,
					uom: item.uom,
					transaction_date: frappe.datetime.nowdate(),
				},
			});

			if (response.message && response.message.price_list_rate) {
				item.price_list_rate = response.message.price_list_rate;
				// Only update rate if it's different and not manually overridden
				if (!item.manual_rate_override) {
					item.rate = response.message.price_list_rate;
					item.amount = item.qty * item.rate;
				}
			}
		} catch (error) {
			console.warn('Price list lookup failed:', error);
		}
	}

	/**
	 * Apply promotions to item
	 * @param {Object} item - Cart item
	 * @param {Object} customer - Customer
	 */
	async applyPromotions(item, customer) {
		// Check for applicable promotions
		const promotions = await this.getApplicablePromotions(item, customer);

		let maxDiscount = 0;
		let appliedPromotion = null;

		for (const promo of promotions) {
			const discount = this.calculatePromotionDiscount(item, promo);
			if (discount > maxDiscount) {
				maxDiscount = discount;
				appliedPromotion = promo;
			}
		}

		if (appliedPromotion) {
			item.promotion_discount = maxDiscount;
			item.applied_promotion = appliedPromotion.name;
			item.discount_amount = (item.discount_amount || 0) + maxDiscount;
		}
	}

	/**
	 * Get applicable promotions for item
	 * @param {Object} item - Cart item
	 * @param {Object} customer - Customer
	 * @returns {Promise<Array>} - List of applicable promotions
	 */
	async getApplicablePromotions(item, customer) {
		// This would call the backend to get applicable POS Offers
		// Simplified for now
		return this.promotions.filter(promo => {
			// Check if promotion applies to this item
			if (promo.item_code && promo.item_code !== item.item_code) return false;
			if (promo.item_group && promo.item_group !== item.item_group) return false;
			if (promo.customer && customer && promo.customer !== customer.name) return false;
			return true;
		});
	}

	/**
	 * Calculate promotion discount
	 * @param {Object} item - Cart item
	 * @param {Object} promotion - Promotion rule
	 * @returns {Number} - Discount amount
	 */
	calculatePromotionDiscount(item, promotion) {
		const baseAmount = item.qty * item.rate;

		switch (promotion.type) {
			case 'percentage':
				return baseAmount * (promotion.discount_percentage / 100);
			case 'amount':
				return Math.min(promotion.discount_amount, baseAmount);
			case 'fixed_price':
				const normalPrice = item.qty * item.rate;
				const promoPrice = item.qty * promotion.fixed_price;
				return Math.max(0, normalPrice - promoPrice);
			default:
				return 0;
		}
	}

	/**
	 * Calculate tax for item
	 * @param {Object} item - Cart item
	 */
	async calculateTax(item) {
		// Simplified tax calculation
		// Real implementation would use ERPNext tax templates
		if (item.tax_rate) {
			const taxableAmount = item.amount - (item.discount_amount || 0);
			item.tax_amount = taxableAmount * (item.tax_rate / 100);
		} else {
			item.tax_amount = 0;
		}
	}

	/**
	 * Calculate cart-level discount
	 * @param {Number} subtotal - Cart subtotal
	 * @param {Object} discount - Discount configuration
	 * @returns {Number} - Discount amount
	 */
	calculateCartDiscount(subtotal, discount) {
		if (discount.type === 'percentage') {
			return subtotal * (discount.value / 100);
		} else if (discount.type === 'amount') {
			return Math.min(discount.value, subtotal);
		}
		return 0;
	}

	/**
	 * Load pricing rules from backend
	 * @param {String} priceList - Price list name
	 */
	async loadPricingRules(priceList) {
		try {
			const response = await frappe.call({
				method: 'erpnext.accounts.doctype.pricing_rule.pricing_rule.get_pricing_rules',
				args: {
					price_list: priceList,
				},
			});

			if (response.message) {
				this.pricingRules = response.message;
			}
		} catch (error) {
			console.error('Failed to load pricing rules:', error);
		}
	}

	/**
	 * Load promotions from backend
	 */
	async loadPromotions() {
		try {
			const response = await frappe.call({
				method: 'posawesome.posawesome.api.offers.get_active_offers',
			});

			if (response.message) {
				this.promotions = response.message;
			}
		} catch (error) {
			console.error('Failed to load promotions:', error);
		}
	}

	/**
	 * Calculate unit price for weighted items
	 * @param {Number} totalPrice - Total price from barcode
	 * @param {Number} weight - Weight
	 * @returns {Number} - Unit price per weight unit
	 */
	calculateUnitPrice(totalPrice, weight) {
		if (weight <= 0) return 0;
		return totalPrice / weight;
	}

	/**
	 * Parse scale barcode (format: prefix + item_code + weight + check_digit)
	 * @param {String} barcode - Scale barcode
	 * @param {String} prefix - Scale barcode prefix (e.g., "02")
	 * @returns {Object} - Parsed barcode data
	 */
	parseScaleBarcode(barcode, prefix = '02') {
		if (!barcode.startsWith(prefix)) {
			return null;
		}

		// Format: 02 + 5 digit item + 5 digit weight (3 decimal) + check digit
		// Example: 02123450125051 = item 12345, weight 1.250kg
		try {
			const itemCode = barcode.substring(2, 7);
			const weightStr = barcode.substring(7, 12);
			const weight = parseInt(weightStr) / 1000; // Convert to kg

			return {
				itemCode,
				weight,
				isScaleItem: true,
			};
		} catch (error) {
			console.error('Failed to parse scale barcode:', error);
			return null;
		}
	}
}

