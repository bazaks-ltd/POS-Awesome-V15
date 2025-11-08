/**
 * Web Worker for heavy cart calculations
 * Runs in separate thread to avoid blocking UI
 */

self.addEventListener('message', (event) => {
	const { type, data } = event.data;

	switch (type) {
		case 'CALCULATE_TOTALS':
			handleCalculateTotals(data);
			break;
		
		case 'APPLY_PROMOTIONS':
			handleApplyPromotions(data);
			break;
		
		case 'CALCULATE_TAX':
			handleCalculateTax(data);
			break;
		
		case 'VALIDATE_CART':
			handleValidateCart(data);
			break;
		
		default:
			self.postMessage({ type: 'ERROR', error: 'Unknown message type' });
	}
});

/**
 * Calculate cart totals
 */
function handleCalculateTotals(data) {
	const { items, taxRules, discountRules } = data;

	let subtotal = 0;
	let totalQty = 0;
	let totalDiscount = 0;
	let totalTax = 0;

	// Calculate line items
	const processedItems = items.map(item => {
		const lineAmount = item.qty * item.rate;
		subtotal += lineAmount;
		totalQty += item.qty;

		// Apply item-level discount
		let itemDiscount = 0;
		if (item.discount_percentage) {
			itemDiscount = lineAmount * (item.discount_percentage / 100);
		}
		totalDiscount += itemDiscount;

		// Calculate tax
		let itemTax = 0;
		if (item.tax_rate) {
			const taxableAmount = lineAmount - itemDiscount;
			itemTax = taxableAmount * (item.tax_rate / 100);
		}
		totalTax += itemTax;

		return {
			...item,
			line_total: lineAmount,
			discount_amount: itemDiscount,
			tax_amount: itemTax,
			net_amount: lineAmount - itemDiscount + itemTax,
		};
	});

	// Cart level calculations
	const netTotal = subtotal - totalDiscount;
	const grandTotal = netTotal + totalTax;

	const totals = {
		subtotal,
		totalQty,
		totalItems: items.length,
		totalDiscount,
		totalTax,
		netTotal,
		grandTotal,
		items: processedItems,
	};

	self.postMessage({
		type: 'TOTALS_CALCULATED',
		data: totals,
	});
}

/**
 * Apply promotion rules to cart
 */
function handleApplyPromotions(data) {
	const { items, promotions } = data;

	const processedItems = items.map(item => {
		let maxDiscount = 0;
		let appliedPromotion = null;

		// Check each promotion
		promotions.forEach(promo => {
			// Check if promotion applies to this item
			if (!promotionApplies(promo, item)) return;

			const discount = calculatePromotionDiscount(item, promo);
			if (discount > maxDiscount) {
				maxDiscount = discount;
				appliedPromotion = promo;
			}
		});

		return {
			...item,
			promotion_discount: maxDiscount,
			applied_promotion: appliedPromotion?.name,
		};
	});

	self.postMessage({
		type: 'PROMOTIONS_APPLIED',
		data: processedItems,
	});
}

/**
 * Check if promotion applies to item
 */
function promotionApplies(promo, item) {
	if (promo.item_code && promo.item_code !== item.item_code) return false;
	if (promo.item_group && promo.item_group !== item.item_group) return false;
	if (promo.min_qty && item.qty < promo.min_qty) return false;
	return true;
}

/**
 * Calculate promotion discount
 */
function calculatePromotionDiscount(item, promo) {
	const baseAmount = item.qty * item.rate;

	switch (promo.type) {
		case 'percentage':
			return baseAmount * (promo.discount_percentage / 100);
		case 'amount':
			return Math.min(promo.discount_amount, baseAmount);
		case 'bogo':
			// Buy X get Y free
			const freeQty = Math.floor(item.qty / (promo.buy_qty + promo.get_qty)) * promo.get_qty;
			return freeQty * item.rate;
		default:
			return 0;
	}
}

/**
 * Calculate tax for all items
 */
function handleCalculateTax(data) {
	const { items, taxRules, taxCategories } = data;

	const processedItems = items.map(item => {
		let taxAmount = 0;
		let taxBreakdown = [];

		// Find applicable tax rules
		const applicableRules = taxRules.filter(rule => 
			!rule.item_group || rule.item_group === item.item_group
		);

		// Calculate tax for each rule
		applicableRules.forEach(rule => {
			const taxableAmount = item.qty * item.rate - (item.discount_amount || 0);
			const tax = taxableAmount * (rule.tax_rate / 100);
			
			taxAmount += tax;
			taxBreakdown.push({
				tax_type: rule.tax_type,
				rate: rule.tax_rate,
				amount: tax,
			});
		});

		return {
			...item,
			tax_amount: taxAmount,
			tax_breakdown: taxBreakdown,
		};
	});

	self.postMessage({
		type: 'TAX_CALCULATED',
		data: processedItems,
	});
}

/**
 * Validate entire cart
 */
function handleValidateCart(data) {
	const { items, stockLevels, businessRules } = data;

	const validationResults = items.map((item, index) => {
		const errors = [];
		const warnings = [];

		// Check stock
		const available = stockLevels[item.item_code] || 0;
		if (item.qty > available) {
			if (businessRules.allow_negative_stock) {
				warnings.push(`Low stock: ${available} available`);
			} else {
				errors.push(`Insufficient stock: ${available} available`);
			}
		}

		// Check minimum order qty
		if (businessRules.min_order_qty && item.qty < businessRules.min_order_qty) {
			errors.push(`Minimum quantity: ${businessRules.min_order_qty}`);
		}

		// Check maximum discount
		if (item.discount_percentage > businessRules.max_discount) {
			errors.push(`Discount exceeds maximum: ${businessRules.max_discount}%`);
		}

		return {
			index,
			item_code: item.item_code,
			valid: errors.length === 0,
			errors,
			warnings,
		};
	});

	const allValid = validationResults.every(r => r.valid);

	self.postMessage({
		type: 'CART_VALIDATED',
		data: {
			valid: allValid,
			results: validationResults,
		},
	});
}

// Log worker initialization
console.log('[Worker] Cart calculations worker initialized');

