/**
 * PaymentService - Handle payment processing and split payments
 */

export class PaymentService {
	constructor() {
		this.payments = [];
		this.totalDue = 0;
		this.listeners = new Map();
	}

	/**
	 * Initialize payment session
	 * @param {Number} totalDue - Total amount due
	 */
	initializePayment(totalDue) {
		this.totalDue = totalDue;
		this.payments = [];
		this.emit('payment_initialized', { totalDue });
	}

	/**
	 * Add payment method
	 * @param {Object} payment - Payment details
	 * @returns {Object} - Added payment
	 */
	addPayment(payment) {
		const totalPaid = this.getTotalPaid();
		const remaining = this.totalDue - totalPaid;

		// Validate payment amount
		if (payment.amount <= 0) {
			throw new Error('Payment amount must be greater than zero');
		}

		if (payment.amount > remaining + 0.01) { // Allow small rounding difference
			throw new Error(`Payment amount ${payment.amount} exceeds remaining ${remaining.toFixed(2)}`);
		}

		const paymentRecord = {
			id: this.generatePaymentId(),
			mode_of_payment: payment.mode_of_payment,
			amount: payment.amount,
			account: payment.account,
			reference_no: payment.reference_no,
			reference_date: payment.reference_date || frappe.datetime.nowdate(),
			timestamp: new Date().toISOString(),
			...payment,
		};

		this.payments.push(paymentRecord);
		this.emit('payment_added', paymentRecord);

		// Check if fully paid
		if (this.isFullyPaid()) {
			this.emit('payment_complete', this.getPaymentSummary());
		}

		return paymentRecord;
	}

	/**
	 * Remove payment
	 * @param {String} paymentId - Payment ID
	 * @returns {Object} - Removed payment
	 */
	removePayment(paymentId) {
		const index = this.payments.findIndex(p => p.id === paymentId);
		
		if (index === -1) {
			throw new Error('Payment not found');
		}

		const removed = this.payments.splice(index, 1)[0];
		this.emit('payment_removed', removed);

		return removed;
	}

	/**
	 * Update payment amount
	 * @param {String} paymentId - Payment ID
	 * @param {Number} newAmount - New amount
	 * @returns {Object} - Updated payment
	 */
	updatePaymentAmount(paymentId, newAmount) {
		const payment = this.payments.find(p => p.id === paymentId);
		
		if (!payment) {
			throw new Error('Payment not found');
		}

		// Validate new amount
		const otherPayments = this.getTotalPaid() - payment.amount;
		const remaining = this.totalDue - otherPayments;

		if (newAmount > remaining + 0.01) {
			throw new Error(`New amount ${newAmount} exceeds remaining ${remaining.toFixed(2)}`);
		}

		payment.amount = newAmount;
		this.emit('payment_updated', payment);

		return payment;
	}

	/**
	 * Get total paid amount
	 * @returns {Number} - Total paid
	 */
	getTotalPaid() {
		return this.payments.reduce((sum, p) => sum + p.amount, 0);
	}

	/**
	 * Get remaining amount
	 * @returns {Number} - Remaining amount
	 */
	getRemainingAmount() {
		return this.totalDue - this.getTotalPaid();
	}

	/**
	 * Check if fully paid
	 * @returns {Boolean} - True if fully paid
	 */
	isFullyPaid() {
		const remaining = this.getRemainingAmount();
		return Math.abs(remaining) < 0.01; // Account for rounding
	}

	/**
	 * Check if overpaid
	 * @returns {Boolean} - True if overpaid
	 */
	isOverpaid() {
		return this.getTotalPaid() > this.totalDue + 0.01;
	}

	/**
	 * Get change amount (for overpayment)
	 * @returns {Number} - Change amount
	 */
	getChangeAmount() {
		const diff = this.getTotalPaid() - this.totalDue;
		return diff > 0 ? diff : 0;
	}

	/**
	 * Get payment summary
	 * @returns {Object} - Payment summary
	 */
	getPaymentSummary() {
		return {
			totalDue: this.totalDue,
			totalPaid: this.getTotalPaid(),
			remaining: this.getRemainingAmount(),
			change: this.getChangeAmount(),
			payments: [...this.payments],
			isFullyPaid: this.isFullyPaid(),
			paymentCount: this.payments.length,
		};
	}

	/**
	 * Apply quick cash tender
	 * @param {Number} amount - Tendered amount
	 * @param {String} account - Cash account
	 * @returns {Object} - Payment record
	 */
	quickCashTender(amount, account) {
		// Calculate exact amount or use tendered amount
		const remaining = this.getRemainingAmount();
		const paymentAmount = amount || remaining;

		return this.addPayment({
			mode_of_payment: 'Cash',
			amount: paymentAmount,
			account: account,
		});
	}

	/**
	 * Process card payment
	 * @param {Object} cardPayment - Card payment details
	 * @returns {Promise<Object>} - Payment result
	 */
	async processCardPayment(cardPayment) {
		// This would integrate with actual card processing
		// For now, just add as a payment
		
		const payment = {
			mode_of_payment: cardPayment.mode_of_payment || 'Card',
			amount: cardPayment.amount,
			account: cardPayment.account,
			reference_no: cardPayment.transaction_id,
			card_type: cardPayment.card_type,
			last_four_digits: cardPayment.last_four_digits,
		};

		return this.addPayment(payment);
	}

	/**
	 * Redeem loyalty points
	 * @param {Number} points - Points to redeem
	 * @param {Number} pointValue - Value per point
	 * @param {String} account - Loyalty redemption account
	 * @returns {Object} - Payment record
	 */
	redeemLoyaltyPoints(points, pointValue, account) {
		const amount = points * pointValue;
		const remaining = this.getRemainingAmount();

		if (amount > remaining) {
			throw new Error('Loyalty points redemption exceeds remaining amount');
		}

		return this.addPayment({
			mode_of_payment: 'Loyalty Points',
			amount: amount,
			account: account,
			loyalty_points: points,
			point_value: pointValue,
		});
	}

	/**
	 * Split payment equally across multiple methods
	 * @param {Array} paymentMethods - Array of payment methods with accounts
	 * @returns {Array} - Array of payment records
	 */
	splitPaymentEqually(paymentMethods) {
		const remaining = this.getRemainingAmount();
		const amountPerMethod = remaining / paymentMethods.length;

		const payments = [];
		
		for (let i = 0; i < paymentMethods.length; i++) {
			const method = paymentMethods[i];
			// Last payment gets any rounding difference
			const amount = i === paymentMethods.length - 1
				? this.getRemainingAmount()
				: amountPerMethod;

			const payment = this.addPayment({
				mode_of_payment: method.mode_of_payment,
				amount: amount,
				account: method.account,
			});

			payments.push(payment);
		}

		return payments;
	}

	/**
	 * Clear all payments
	 */
	clearPayments() {
		this.payments = [];
		this.emit('payments_cleared');
	}

	/**
	 * Reset payment session
	 */
	reset() {
		this.payments = [];
		this.totalDue = 0;
		this.emit('payment_reset');
	}

	/**
	 * Generate unique payment ID
	 * @returns {String} - Unique ID
	 */
	generatePaymentId() {
		return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Subscribe to payment events
	 * @param {String} event - Event name
	 * @param {Function} callback - Callback function
	 * @returns {Function} - Unsubscribe function
	 */
	on(event, callback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event).push(callback);

		return () => {
			const callbacks = this.listeners.get(event);
			const index = callbacks.indexOf(callback);
			if (index > -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * Emit event
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
	 * Validate payment configuration
	 * @param {Array} paymentMethods - Available payment methods
	 * @returns {Object} - Validation result
	 */
	validatePaymentMethods(paymentMethods) {
		if (!paymentMethods || paymentMethods.length === 0) {
			return {
				valid: false,
				message: 'No payment methods configured',
			};
		}

		// Check that all payment methods have required fields
		for (const method of paymentMethods) {
			if (!method.mode_of_payment) {
				return {
					valid: false,
					message: 'Payment method missing mode_of_payment',
				};
			}
			if (!method.account) {
				return {
					valid: false,
					message: `Payment method ${method.mode_of_payment} missing account`,
				};
			}
		}

		return { valid: true };
	}
}

// Singleton instance
let paymentInstance = null;

export function usePayment() {
	if (!paymentInstance) {
		paymentInstance = new PaymentService();
	}
	return paymentInstance;
}

