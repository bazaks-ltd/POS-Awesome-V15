<template>
	<v-card class="split-payment" elevation="3">
		<v-card-title class="bg-primary d-flex align-center">
			<v-icon class="mr-2">mdi-cash-multiple</v-icon>
			<span>{{ __("Split Payment") }}</span>
			
			<v-spacer></v-spacer>

			<v-chip color="white" variant="flat">
				{{ paymentService.payments.length }} {{ __("Method(s)") }}
			</v-chip>
		</v-card-title>

		<v-divider></v-divider>

		<v-card-text class="pa-4">
			<!-- Summary -->
			<div class="payment-summary mb-4">
				<v-row dense>
					<v-col cols="6">
						<div class="text-caption text-medium-emphasis">{{ __("Total Due") }}</div>
						<div class="text-h5 font-weight-bold">
							{{ format_currency(paymentSummary.totalDue) }}
						</div>
					</v-col>
					<v-col cols="6">
						<div class="text-caption text-medium-emphasis">{{ __("Remaining") }}</div>
						<div class="text-h5 font-weight-bold" :class="remainingClass">
							{{ format_currency(paymentSummary.remaining) }}
						</div>
					</v-col>
				</v-row>

				<v-progress-linear
					:model-value="paymentProgress"
					:color="paymentProgress >= 100 ? 'success' : 'primary'"
					height="8"
					rounded
					class="mt-2"
				></v-progress-linear>
			</div>

			<!-- Payment Methods List -->
			<div class="payments-list">
				<div v-if="paymentService.payments.length === 0" class="text-center py-4">
					<v-icon size="48" color="grey-lighten-1">mdi-credit-card-outline</v-icon>
					<div class="text-body-2 text-medium-emphasis mt-2">
						{{ __("No payments added yet") }}
					</div>
				</div>

				<v-card
					v-for="(payment, index) in paymentService.payments"
					:key="payment.id"
					class="payment-item mb-2"
					variant="outlined"
				>
					<v-card-text class="pa-3">
						<v-row align="center" dense>
							<v-col cols="auto">
								<v-avatar :color="getPaymentColor(payment.mode_of_payment)" size="40">
									<v-icon color="white">{{ getPaymentIcon(payment.mode_of_payment) }}</v-icon>
								</v-avatar>
							</v-col>

							<v-col>
								<div class="font-weight-medium">{{ payment.mode_of_payment }}</div>
								<div class="text-caption text-medium-emphasis">
									{{ format_currency(payment.amount) }}
									<span v-if="payment.reference_no">| Ref: {{ payment.reference_no }}</span>
								</div>
							</v-col>

							<v-col cols="auto">
								<v-btn
									icon="mdi-pencil"
									size="small"
									variant="text"
									@click="editPayment(payment)"
								></v-btn>
								<v-btn
									icon="mdi-delete"
									size="small"
									variant="text"
									color="error"
									@click="removePayment(payment.id)"
								></v-btn>
							</v-col>
						</v-row>
					</v-card-text>
				</v-card>
			</div>

			<!-- Add Payment Section -->
			<v-divider class="my-4"></v-divider>

			<div class="add-payment">
				<div class="text-subtitle-2 mb-3">{{ __("Add Payment Method") }}</div>

				<!-- Payment Method Selection -->
				<v-row dense>
					<v-col cols="12" md="7">
						<v-select
							v-model="selectedMethod"
							:items="availablePaymentMethods"
							item-title="mode_of_payment"
							item-value="mode_of_payment"
							:label="__('Payment Method')"
							variant="outlined"
							density="comfortable"
							hide-details
						>
							<template #prepend-inner>
								<v-icon>{{ getPaymentIcon(selectedMethod) }}</v-icon>
							</template>
						</v-select>
					</v-col>

					<v-col cols="12" md="5">
						<v-text-field
							v-model.number="paymentAmount"
							type="number"
							step="0.01"
							:label="__('Amount')"
							variant="outlined"
							density="comfortable"
							hide-details
							:prefix="currency_symbol"
						>
							<template #append>
								<v-btn
									size="small"
									variant="text"
									@click="setRemainingAmount"
								>
									{{ __("All") }}
								</v-btn>
							</template>
						</v-text-field>
					</v-col>
				</v-row>

				<!-- Quick Amount Buttons (for cash) -->
				<v-expand-transition>
					<div v-if="selectedMethod === 'Cash'" class="mt-3">
						<div class="text-caption mb-2">{{ __("Quick Tender") }}</div>
						<div class="quick-tender-grid">
							<v-btn
								v-for="amount in quickCashAmounts"
								:key="amount"
								variant="tonal"
								@click="quickTender(amount)"
							>
								{{ format_currency(amount) }}
							</v-btn>
						</div>
					</div>
				</v-expand-transition>

				<!-- Reference Number (for card/check) -->
				<v-expand-transition>
					<div v-if="needsReference" class="mt-3">
						<v-text-field
							v-model="referenceNo"
							:label="__('Reference / Transaction Number')"
							variant="outlined"
							density="comfortable"
							hide-details
						></v-text-field>
					</div>
				</v-expand-transition>

				<!-- Add Button -->
				<v-btn
					color="primary"
					block
					size="large"
					class="mt-4"
					:disabled="!canAddPayment"
					@click="addPayment"
				>
					<v-icon start>mdi-plus-circle</v-icon>
					{{ __("Add Payment") }}
				</v-btn>
			</div>

			<!-- Change Display -->
			<v-expand-transition>
				<v-alert v-if="paymentSummary.change > 0" type="success" class="mt-4" prominent>
					<div class="d-flex align-center">
						<div class="flex-grow-1">
							<div class="text-h6">{{ __("Change Due") }}</div>
							<div class="text-h4 font-weight-bold">
								{{ format_currency(paymentSummary.change) }}
							</div>
						</div>
						<v-icon size="64">mdi-cash-refund</v-icon>
					</div>
				</v-alert>
			</v-expand-transition>

			<!-- Complete Button -->
			<v-btn
				color="success"
				block
				size="x-large"
				class="mt-4"
				:disabled="!paymentSummary.isFullyPaid"
				@click="completePayment"
			>
				<v-icon start>mdi-check-bold</v-icon>
				{{ __("Complete Payment") }}
			</v-btn>
		</v-card-text>
	</v-card>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { usePayment } from '../../../services/payment/PaymentService';

export default {
	name: 'SplitPayment',
	props: {
		totalDue: {
			type: Number,
			required: true,
		},
		paymentMethods: {
			type: Array,
			required: true,
		},
		quickCashAmounts: {
			type: Array,
			default: () => [5, 10, 20, 50, 100],
		},
	},
	emits: ['payment-complete', 'payment-cancelled'],
	setup(props, { emit }) {
		const paymentService = usePayment();
		const selectedMethod = ref('');
		const paymentAmount = ref(0);
		const referenceNo = ref('');

		// Initialize payment
		paymentService.initializePayment(props.totalDue);

		const paymentSummary = computed(() => paymentService.getPaymentSummary());

		const paymentProgress = computed(() => {
			return (paymentSummary.value.totalPaid / paymentSummary.value.totalDue) * 100;
		});

		const remainingClass = computed(() => {
			const remaining = paymentSummary.value.remaining;
			if (remaining <= 0) return 'text-success';
			if (remaining < props.totalDue / 2) return 'text-warning';
			return 'text-error';
		});

		const availablePaymentMethods = computed(() => {
			return props.paymentMethods.filter(m => m.enabled !== 0);
		});

		const needsReference = computed(() => {
			return ['Card', 'Credit Card', 'Debit Card', 'Check', 'Bank Transfer'].includes(
				selectedMethod.value
			);
		});

		const canAddPayment = computed(() => {
			return selectedMethod.value && paymentAmount.value > 0 && paymentSummary.value.remaining >= 0;
		});

		const currency_symbol = computed(() => {
			return frappe.boot.sysdefaults.currency_symbol || '$';
		});

		/**
		 * Get icon for payment method
		 */
		const getPaymentIcon = (method) => {
			const icons = {
				'Cash': 'mdi-cash',
				'Card': 'mdi-credit-card',
				'Credit Card': 'mdi-credit-card',
				'Debit Card': 'mdi-credit-card-outline',
				'Mobile Money': 'mdi-cellphone',
				'Loyalty Points': 'mdi-star',
				'Check': 'mdi-checkbook',
				'Bank Transfer': 'mdi-bank-transfer',
			};
			return icons[method] || 'mdi-cash';
		};

		/**
		 * Get color for payment method
		 */
		const getPaymentColor = (method) => {
			const colors = {
				'Cash': 'success',
				'Card': 'info',
				'Credit Card': 'info',
				'Debit Card': 'primary',
				'Mobile Money': 'purple',
				'Loyalty Points': 'amber',
				'Check': 'teal',
				'Bank Transfer': 'blue',
			};
			return colors[method] || 'grey';
		};

		/**
		 * Set remaining amount as payment
		 */
		const setRemainingAmount = () => {
			paymentAmount.value = Math.max(0, paymentSummary.value.remaining);
		};

		/**
		 * Quick cash tender
		 */
		const quickTender = (amount) => {
			paymentAmount.value = amount;
			// Auto-add if amount covers remaining
			if (amount >= paymentSummary.value.remaining) {
				addPayment();
			}
		};

		/**
		 * Add payment to list
		 */
		const addPayment = () => {
			try {
				const method = availablePaymentMethods.value.find(
					m => m.mode_of_payment === selectedMethod.value
				);

				if (!method) {
					frappe.throw(__('Invalid payment method'));
				}

				paymentService.addPayment({
					mode_of_payment: selectedMethod.value,
					amount: paymentAmount.value,
					account: method.account,
					reference_no: referenceNo.value || null,
				});

				// Reset form
				paymentAmount.value = 0;
				referenceNo.value = '';

				// Auto-select next method if more payment needed
				if (paymentSummary.value.remaining > 0) {
					setRemainingAmount();
				}

				frappe.show_alert({
					message: __('Payment added'),
					indicator: 'green',
				});
			} catch (error) {
				frappe.show_alert({
					message: error.message,
					indicator: 'red',
				});
			}
		};

		/**
		 * Remove payment
		 */
		const removePayment = (paymentId) => {
			try {
				paymentService.removePayment(paymentId);
				frappe.show_alert({
					message: __('Payment removed'),
					indicator: 'orange',
				});
			} catch (error) {
				frappe.show_alert({
					message: error.message,
					indicator: 'red',
				});
			}
		};

		/**
		 * Edit payment
		 */
		const editPayment = (payment) => {
			selectedMethod.value = payment.mode_of_payment;
			paymentAmount.value = payment.amount;
			referenceNo.value = payment.reference_no || '';
			removePayment(payment.id);
		};

		/**
		 * Complete payment
		 */
		const completePayment = () => {
			if (!paymentSummary.value.isFullyPaid) {
				frappe.show_alert({
					message: __('Payment incomplete'),
					indicator: 'red',
				});
				return;
			}

			emit('payment-complete', paymentSummary.value);
		};

		// Auto-select first payment method
		if (availablePaymentMethods.value.length > 0) {
			selectedMethod.value = availablePaymentMethods.value[0].mode_of_payment;
			setRemainingAmount();
		}

		return {
			paymentService,
			selectedMethod,
			paymentAmount,
			referenceNo,
			paymentSummary,
			paymentProgress,
			remainingClass,
			availablePaymentMethods,
			needsReference,
			canAddPayment,
			currency_symbol,
			getPaymentIcon,
			getPaymentColor,
			setRemainingAmount,
			quickTender,
			addPayment,
			removePayment,
			editPayment,
			completePayment,
			format_currency: window.format_currency,
		};
	},
};
</script>

<style scoped>
.split-payment {
	max-width: 600px;
}

.payment-summary {
	background: rgba(var(--v-theme-surface), 0.5);
	padding: 16px;
	border-radius: 8px;
}

.payment-item {
	transition: all 0.3s ease;
}

.payment-item:hover {
	transform: translateX(4px);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-tender-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
	gap: 8px;
}
</style>

