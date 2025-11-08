<template>
	<div class="customer-display" :class="displayClasses">
		<!-- Header with Store Info -->
		<div class="display-header">
			<div class="store-info">
				<h1 class="store-name">{{ storeName }}</h1>
				<p class="store-tagline">{{ storeTagline }}</p>
			</div>
			<div class="display-time">
				{{ currentTime }}
			</div>
		</div>

		<!-- Main Content -->
		<div class="display-content">
			<!-- Current Item Being Scanned -->
			<transition name="slide-up" mode="out-in">
				<div v-if="currentItem" :key="currentItem.item_code" class="current-item">
					<div class="item-image">
						<v-img
							v-if="currentItem.image"
							:src="currentItem.image"
							height="200"
							contain
						/>
						<v-icon v-else size="120" color="grey-lighten-1">
							mdi-package-variant
						</v-icon>
					</div>
					<div class="item-details">
						<h2 class="item-name">{{ currentItem.item_name }}</h2>
						<p v-if="currentItem.weight" class="item-weight">
							{{ currentItem.weight }} {{ currentItem.uom }}
						</p>
						<p class="item-price">{{ formatCurrency(currentItem.amount) }}</p>
					</div>
				</div>
			</transition>

			<!-- Cart Summary -->
			<div class="cart-summary">
				<div class="summary-items">
					<transition-group name="list" tag="div">
						<div
							v-for="item in recentItems"
							:key="item.posa_row_id"
							class="summary-item"
						>
							<span class="summary-item-name">{{ item.item_name }}</span>
							<span class="summary-item-qty">× {{ item.qty }}</span>
							<span class="summary-item-amount">{{ formatCurrency(item.amount) }}</span>
						</div>
					</transition-group>
				</div>

				<!-- Totals -->
				<div class="totals-section">
					<div class="total-row subtotal">
						<span>{{ __("Subtotal") }}</span>
						<span>{{ formatCurrency(totals.subtotal) }}</span>
					</div>
					<div v-if="totals.discount > 0" class="total-row discount">
						<span>{{ __("Discount") }}</span>
						<span class="text-success">-{{ formatCurrency(totals.discount) }}</span>
					</div>
					<div class="total-row tax">
						<span>{{ __("Tax") }}</span>
						<span>{{ formatCurrency(totals.tax) }}</span>
					</div>
					<div class="total-row savings" v-if="totals.savings > 0">
						<span>{{ __("You Save") }}</span>
						<span class="text-success">{{ formatCurrency(totals.savings) }}</span>
					</div>
					<div class="total-row grand-total">
						<span>{{ __("TOTAL") }}</span>
						<span>{{ formatCurrency(totals.grandTotal) }}</span>
					</div>
				</div>
			</div>

			<!-- Loyalty Points -->
			<div v-if="loyaltyInfo && loyaltyInfo.points > 0" class="loyalty-section">
				<v-icon size="32" color="amber">mdi-star</v-icon>
				<div class="loyalty-text">
					<p class="loyalty-points">{{ loyaltyInfo.points }} {{ __("Points Available") }}</p>
					<p class="loyalty-value">{{ __("Worth") }}: {{ formatCurrency(loyaltyInfo.value) }}</p>
				</div>
			</div>

			<!-- Promotional Messages -->
			<div v-if="showPromotions" class="promotions-section">
				<transition name="fade" mode="out-in">
					<div :key="currentPromotion" class="promotion-message">
						{{ currentPromotion }}
					</div>
				</transition>
			</div>
		</div>

		<!-- Footer -->
		<div class="display-footer">
			<p class="thank-you-message">{{ thankYouMessage }}</p>
		</div>
	</div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCart } from '../../../services/cart/CartService';

export default {
	name: 'CustomerDisplay',
	props: {
		storeName: {
			type: String,
			default: 'Our Store',
		},
		storeTagline: {
			type: String,
			default: 'Thank you for shopping with us',
		},
		thankYouMessage: {
			type: String,
			default: 'Have a great day!',
		},
		showPromotions: {
			type: Boolean,
			default: true,
		},
		promotions: {
			type: Array,
			default: () => [
				'Special offer: Buy 2 Get 1 Free on selected items!',
				'Sign up for our loyalty program and earn points!',
				'Fresh produce delivered daily!',
			],
		},
		maxRecentItems: {
			type: Number,
			default: 5,
		},
	},
	setup(props) {
		const cart = useCart();
		const currentTime = ref('');
		const currentItem = ref(null);
		const currentPromotionIndex = ref(0);

		let timeInterval = null;
		let promotionInterval = null;
		let unsubscribeItemAdded = null;

		// Recent items (last N items added to cart)
		const recentItems = computed(() => {
			return cart.items.slice(-props.maxRecentItems).reverse();
		});

		// Cart totals
		const totals = computed(() => cart.getTotals());

		// Loyalty info (would come from customer data)
		const loyaltyInfo = computed(() => {
			if (!cart.customer) return null;
			
			return {
				points: cart.customer.loyalty_points || 0,
				value: (cart.customer.loyalty_points || 0) * 0.01, // $0.01 per point
			};
		});

		// Current promotion message
		const currentPromotion = computed(() => {
			if (!props.showPromotions || props.promotions.length === 0) return '';
			return props.promotions[currentPromotionIndex.value];
		});

		// Display classes
		const displayClasses = computed(() => ({
			'has-current-item': currentItem.value !== null,
		}));

		/**
		 * Update current time
		 */
		const updateTime = () => {
			const now = new Date();
			currentTime.value = now.toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit',
			});
		};

		/**
		 * Rotate promotions
		 */
		const rotatePromotion = () => {
			if (props.promotions.length === 0) return;
			
			currentPromotionIndex.value = 
				(currentPromotionIndex.value + 1) % props.promotions.length;
		};

		/**
		 * Show item briefly when added
		 */
		const showItemAdded = (item) => {
			currentItem.value = item;
			
			// Clear after 3 seconds
			setTimeout(() => {
				currentItem.value = null;
			}, 3000);
		};

		/**
		 * Format currency
		 */
		const formatCurrency = (amount) => {
			return window.format_currency ? window.format_currency(amount) : `$${amount.toFixed(2)}`;
		};

		// Lifecycle
		onMounted(() => {
			// Update time every second
			updateTime();
			timeInterval = setInterval(updateTime, 1000);

			// Rotate promotions every 10 seconds
			if (props.showPromotions) {
				promotionInterval = setInterval(rotatePromotion, 10000);
			}

			// Listen to cart events
			unsubscribeItemAdded = cart.on('item_added', showItemAdded);
		});

		onUnmounted(() => {
			if (timeInterval) clearInterval(timeInterval);
			if (promotionInterval) clearInterval(promotionInterval);
			if (unsubscribeItemAdded) unsubscribeItemAdded();
		});

		return {
			currentTime,
			currentItem,
			recentItems,
			totals,
			loyaltyInfo,
			currentPromotion,
			displayClasses,
			formatCurrency,
		};
	},
};
</script>

<style scoped>
.customer-display {
	display: flex;
	flex-direction: column;
	height: 100vh;
	width: 100vw;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	overflow: hidden;
	font-family: 'Roboto', sans-serif;
}

.display-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32px;
	background: rgba(0, 0, 0, 0.2);
}

.store-name {
	font-size: 2.5rem;
	font-weight: 700;
	margin: 0;
	text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.store-tagline {
	font-size: 1.2rem;
	opacity: 0.9;
	margin: 8px 0 0;
}

.display-time {
	font-size: 2rem;
	font-weight: 300;
	opacity: 0.9;
}

.display-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 32px;
	gap: 24px;
	overflow-y: auto;
}

/* Current Item */
.current-item {
	display: flex;
	gap: 32px;
	padding: 32px;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16px;
	color: #333;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.item-image {
	flex-shrink: 0;
}

.item-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.item-name {
	font-size: 2.5rem;
	font-weight: 600;
	margin: 0 0 16px;
	color: #333;
}

.item-weight {
	font-size: 1.5rem;
	color: #666;
	margin: 0 0 8px;
}

.item-price {
	font-size: 3rem;
	font-weight: 700;
	color: #667eea;
	margin: 0;
}

/* Cart Summary */
.cart-summary {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 12px;
	padding: 24px;
	backdrop-filter: blur(10px);
}

.summary-items {
	max-height: 200px;
	overflow-y: auto;
	margin-bottom: 24px;
}

.summary-item {
	display: grid;
	grid-template-columns: 1fr auto auto;
	gap: 16px;
	padding: 12px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	font-size: 1.1rem;
}

.summary-item-name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.summary-item-qty {
	opacity: 0.8;
}

.summary-item-amount {
	font-weight: 600;
}

/* Totals */
.totals-section {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.total-row {
	display: flex;
	justify-content: space-between;
	font-size: 1.3rem;
}

.total-row.grand-total {
	font-size: 2.5rem;
	font-weight: 700;
	padding-top: 16px;
	border-top: 2px solid rgba(255, 255, 255, 0.3);
	color: #FFD700;
}

/* Loyalty */
.loyalty-section {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 24px;
	background: rgba(255, 215, 0, 0.2);
	border-radius: 12px;
}

.loyalty-text {
	flex: 1;
}

.loyalty-points {
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0;
}

.loyalty-value {
	font-size: 1.1rem;
	opacity: 0.9;
	margin: 4px 0 0;
}

/* Promotions */
.promotions-section {
	padding: 24px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 12px;
	text-align: center;
	backdrop-filter: blur(10px);
}

.promotion-message {
	font-size: 1.5rem;
	font-weight: 500;
	line-height: 1.4;
}

/* Footer */
.display-footer {
	padding: 24px 32px;
	background: rgba(0, 0, 0, 0.2);
	text-align: center;
}

.thank-you-message {
	font-size: 1.5rem;
	font-weight: 300;
	margin: 0;
	opacity: 0.9;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.3s ease;
}

.slide-up-enter-from {
	transform: translateY(20px);
	opacity: 0;
}

.slide-up-leave-to {
	transform: translateY(-20px);
	opacity: 0;
}

.list-enter-active,
.list-leave-active {
	transition: all 0.3s ease;
}

.list-enter-from {
	transform: translateX(-20px);
	opacity: 0;
}

.list-leave-to {
	transform: translateX(20px);
	opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

/* Responsive */
@media (max-width: 1024px) {
	.store-name {
		font-size: 2rem;
	}
	
	.item-name {
		font-size: 2rem;
	}
	
	.item-price {
		font-size: 2.5rem;
	}
}

@media (orientation: portrait) {
	.current-item {
		flex-direction: column;
		text-align: center;
	}
}
</style>

