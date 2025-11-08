/**
 * CartService - Core business logic for cart operations
 * Separated from UI to enable reusability across different POS types
 */

import { PricingService } from './PricingService';
import { ValidationService } from './ValidationService';

export class CartService {
	constructor() {
		this.items = [];
		this.customer = null;
		this.pricingService = new PricingService();
		this.validationService = new ValidationService();
		this.listeners = new Map();
	}

	/**
	 * Add item to cart
	 * @param {Object} item - Item to add
	 * @param {Number} qty - Quantity
	 * @param {Object} options - Additional options (batch, serial, weight, etc.)
	 * @returns {Promise<Object>} - Added cart item
	 */
	async addItem(item, qty = 1, options = {}) {
		// Validate stock
		const validation = await this.validationService.validateStock(
			item.item_code,
			qty,
			options.warehouse
		);

		if (!validation.valid) {
			throw new Error(validation.message);
		}

		// Check if item already exists in cart
		const existingIndex = this.findItemIndex(item.item_code, options);

		if (existingIndex !== -1 && !options.force_new_line) {
			// Update existing line
			return this.updateQuantity(existingIndex, this.items[existingIndex].qty + qty);
		}

		// Create new cart item
		const cartItem = {
			posa_row_id: this.generateRowId(),
			item_code: item.item_code,
			item_name: item.item_name,
			qty: qty,
			rate: options.rate || item.rate || item.standard_rate || 0,
			uom: options.uom || item.stock_uom,
			stock_uom: item.stock_uom,
			conversion_factor: options.conversion_factor || 1,
			warehouse: options.warehouse,
			actual_qty: item.actual_qty || 0,
			...options,
		};

		// Apply pricing rules
		await this.pricingService.applyPricing(cartItem, this.customer);

		// Add to cart
		this.items.push(cartItem);
		this.emit('item_added', cartItem);
		this.emit('cart_updated', this.items);

		return cartItem;
	}

	/**
	 * Update item quantity
	 * @param {Number} index - Item index in cart
	 * @param {Number} newQty - New quantity
	 * @returns {Promise<Object>} - Updated cart item
	 */
	async updateQuantity(index, newQty) {
		if (newQty <= 0) {
			return this.removeItem(index);
		}

		const item = this.items[index];

		// Validate new quantity
		const validation = await this.validationService.validateStock(
			item.item_code,
			newQty,
			item.warehouse
		);

		if (!validation.valid) {
			throw new Error(validation.message);
		}

		item.qty = newQty;

		// Recalculate pricing
		await this.pricingService.applyPricing(item, this.customer);

		this.emit('item_updated', { index, item });
		this.emit('cart_updated', this.items);

		return item;
	}

	/**
	 * Update item rate
	 * @param {Number} index - Item index
	 * @param {Number} newRate - New rate
	 * @returns {Object} - Updated item
	 */
	updateRate(index, newRate) {
		const item = this.items[index];
		item.rate = newRate;
		item.amount = item.qty * newRate;

		this.emit('item_updated', { index, item });
		this.emit('cart_updated', this.items);

		return item;
	}

	/**
	 * Update item weight (for weighted items)
	 * @param {Number} index - Item index
	 * @param {Number} weight - Weight in configured unit
	 * @returns {Object} - Updated item
	 */
	updateWeight(index, weight) {
		const item = this.items[index];
		
		if (!item.is_weighted_item) {
			throw new Error('Item is not a weighted item');
		}

		item.weight = weight;
		item.qty = weight; // Qty is the weight for weighted items
		item.amount = item.qty * item.rate;

		this.emit('item_updated', { index, item });
		this.emit('cart_updated', this.items);

		return item;
	}

	/**
	 * Remove item from cart
	 * @param {Number} index - Item index
	 * @returns {Object} - Removed item
	 */
	removeItem(index) {
		const removed = this.items.splice(index, 1)[0];
		
		this.emit('item_removed', { index, item: removed });
		this.emit('cart_updated', this.items);

		return removed;
	}

	/**
	 * Clear entire cart
	 */
	clearCart() {
		this.items = [];
		this.customer = null;
		this.emit('cart_cleared');
		this.emit('cart_updated', this.items);
	}

	/**
	 * Set customer for cart
	 * @param {Object} customer - Customer object
	 */
	async setCustomer(customer) {
		this.customer = customer;

		// Recalculate pricing for all items with new customer context
		for (const item of this.items) {
			await this.pricingService.applyPricing(item, customer);
		}

		this.emit('customer_changed', customer);
		this.emit('cart_updated', this.items);
	}

	/**
	 * Apply discount to entire cart
	 * @param {Object} discount - Discount configuration
	 */
	applyCartDiscount(discount) {
		this.cartDiscount = discount;
		this.emit('discount_applied', discount);
		this.emit('cart_updated', this.items);
	}

	/**
	 * Get cart totals
	 * @returns {Object} - Cart totals
	 */
	getTotals() {
		const subtotal = this.items.reduce((sum, item) => {
			return sum + (item.qty * item.rate);
		}, 0);

		const totalQty = this.items.reduce((sum, item) => sum + item.qty, 0);

		let discount = 0;
		if (this.cartDiscount) {
			discount = this.cartDiscount.type === 'percentage'
				? (subtotal * this.cartDiscount.value / 100)
				: this.cartDiscount.value;
		}

		const discountedTotal = subtotal - discount;

		// Tax calculation (simplified - real implementation would use tax rules)
		const tax = this.items.reduce((sum, item) => {
			return sum + (item.tax_amount || 0);
		}, 0);

		const grandTotal = discountedTotal + tax;

		return {
			subtotal,
			totalQty,
			totalItems: this.items.length,
			discount,
			discountedTotal,
			tax,
			grandTotal,
			savings: discount + (this.getTotalPromotionSavings()),
		};
	}

	/**
	 * Get total promotion savings
	 * @returns {Number} - Total savings from promotions
	 */
	getTotalPromotionSavings() {
		return this.items.reduce((sum, item) => {
			return sum + (item.promotion_discount || 0);
		}, 0);
	}

	/**
	 * Find item index in cart
	 * @param {String} itemCode - Item code
	 * @param {Object} options - Match options (batch, serial, etc.)
	 * @returns {Number} - Item index or -1
	 */
	findItemIndex(itemCode, options = {}) {
		return this.items.findIndex(item => {
			if (item.item_code !== itemCode) return false;
			if (options.batch_no && item.batch_no !== options.batch_no) return false;
			if (options.serial_no && item.serial_no !== options.serial_no) return false;
			return true;
		});
	}

	/**
	 * Generate unique row ID
	 * @returns {String} - Unique ID
	 */
	generateRowId() {
		return `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Subscribe to cart events
	 * @param {String} event - Event name
	 * @param {Function} callback - Callback function
	 * @returns {Function} - Unsubscribe function
	 */
	on(event, callback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event).push(callback);

		// Return unsubscribe function
		return () => {
			const callbacks = this.listeners.get(event);
			const index = callbacks.indexOf(callback);
			if (index > -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * Emit event to listeners
	 * @param {String} event - Event name
	 * @param {*} data - Event data
	 */
	emit(event, data) {
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.forEach(cb => cb(data));
		}
	}

	/**
	 * Get cart state for persistence
	 * @returns {Object} - Serializable cart state
	 */
	getState() {
		return {
			items: this.items,
			customer: this.customer,
			cartDiscount: this.cartDiscount,
			totals: this.getTotals(),
		};
	}

	/**
	 * Restore cart from saved state
	 * @param {Object} state - Saved state
	 */
	restoreState(state) {
		this.items = state.items || [];
		this.customer = state.customer || null;
		this.cartDiscount = state.cartDiscount || null;
		this.emit('cart_updated', this.items);
	}
}

// Singleton instance
let cartInstance = null;

export function useCart() {
	if (!cartInstance) {
		cartInstance = new CartService();
	}
	return cartInstance;
}

