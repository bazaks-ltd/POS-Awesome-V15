<template>
	<div class="grocery-layout" :class="layoutClasses">
		<!-- Mobile: Use MobileLayout wrapper -->
		<MobileLayout
			v-if="isMobile"
			:categories="categories"
			:items="items"
			:loading="loading"
			@item-selected="handleItemSelect"
			@category-selected="handleCategorySelect"
			@checkout="handleCheckout"
		>
			<!-- Custom slots for grocery features -->
			<template #items>
				<div class="grocery-items-view">
					<!-- Quick Touch Grid for popular items -->
					<QuickTouchGrid
						v-if="showQuickGrid"
						:quick-items="popularItems"
						:title="__('Quick Access')"
						class="mb-4"
						@item-selected="handleItemSelect"
						@quick-add="handleQuickAdd"
					/>

					<!-- Main Items Grid -->
					<ItemGrid
						:items="filteredItems"
						:loading="loading"
						:item-card-layout="groceryItemLayout"
						@item-selected="handleItemSelect"
					/>
				</div>
			</template>

			<template #actions>
				<!-- PLU Keypad in bottom sheet -->
				<PLUKeypad
					v-if="showPLUKeypad"
					@item-selected="handlePLUItemSelect"
				/>
			</template>
		</MobileLayout>

		<!-- Tablet/Desktop: Custom grocery-optimized layout -->
		<div v-else class="grocery-desktop-layout">
			<!-- Top Bar -->
			<v-app-bar flat density="comfortable" elevation="1">
				<template #prepend>
					<v-icon size="32" class="ml-2">mdi-cart</v-icon>
					<v-app-bar-title class="ml-2">{{ __("Grocery POS") }}</v-app-bar-title>
				</template>

				<!-- Search -->
				<template #default>
					<SearchBar
						v-model="searchQuery"
						:placeholder="__('Scan or search items...')"
						@search="handleSearch"
					/>
				</template>

				<!-- Actions -->
				<template #append>
					<v-btn icon="mdi-barcode-scan" @click="focusSearch"></v-btn>
					<v-btn icon="mdi-scale-balance" @click="toggleScale"></v-btn>
					<v-btn icon="mdi-history" @click="showHistory = true"></v-btn>
				</template>
			</v-app-bar>

			<!-- Main Content -->
			<div class="grocery-content">
				<!-- Left Panel: Quick Access + Categories -->
				<div class="left-panel">
					<!-- Quick Touch Grid -->
					<QuickTouchGrid
						:quick-items="popularItems"
						:title="__('Popular Items')"
						:columns="2"
						class="mb-3"
						@item-selected="handleItemSelect"
						@quick-add="handleQuickAdd"
					/>

					<!-- PLU Keypad -->
					<PLUKeypad
						v-if="isFeatureEnabled('plu_codes')"
						@item-selected="handlePLUItemSelect"
					/>
				</div>

				<!-- Center Panel: Items Grid -->
				<div class="center-panel">
					<v-card elevation="0" class="items-card">
						<v-card-title class="d-flex align-center">
							<span>{{ __("Items") }}</span>
							<v-chip v-if="selectedCategory" size="small" class="ml-2" closable @click:close="clearCategory">
								{{ selectedCategory }}
							</v-chip>
							<v-spacer></v-spacer>
							<span class="text-caption">{{ filteredItems.length }} {{ __("items") }}</span>
						</v-card-title>

						<!-- Category Filters -->
						<div class="category-filters">
							<CategoryNav
								mode="quick_filters"
								:categories="categories"
								@category-selected="handleCategorySelect"
								@filters-changed="handleFiltersChanged"
							/>
						</div>

						<v-divider></v-divider>

						<v-card-text class="items-container">
							<ItemGrid
								:items="filteredItems"
								:loading="loading"
								:item-card-layout="groceryItemLayout"
								@item-selected="handleItemSelect"
							/>
						</v-card-text>
					</v-card>
				</div>

				<!-- Right Panel: Cart + Scale -->
				<div class="right-panel">
					<!-- Scale Widget -->
					<ScaleWidget
						v-if="scaleEnabled && showScaleWidget"
						:scale-config="scaleConfig"
						class="mb-3"
						@weight-captured="handleWeightCaptured"
					/>

					<!-- Cart -->
					<v-card elevation="0" class="cart-card">
						<v-card-title class="d-flex align-center">
							<span>{{ __("Cart") }}</span>
							<v-spacer></v-spacer>
							<v-chip size="small">{{ cartItems.length }} {{ __("items") }}</v-chip>
						</v-card-title>

						<v-divider></v-divider>

						<v-card-text class="cart-items">
							<slot name="cart">
								<!-- Cart items would go here -->
								<div v-if="cartItems.length === 0" class="empty-cart">
									<v-icon size="48">mdi-cart-outline</v-icon>
									<p class="text-caption mt-2">{{ __("Scan items to begin") }}</p>
								</div>
							</slot>
						</v-card-text>

						<v-divider></v-divider>

						<!-- Cart Summary -->
						<v-card-text class="cart-summary">
							<div class="summary-row">
								<span>{{ __("Subtotal") }}</span>
								<span>{{ formatCurrency(totals.subtotal) }}</span>
							</div>
							<div v-if="totals.savings > 0" class="summary-row savings">
								<span>{{ __("Savings") }}</span>
								<span class="text-success">-{{ formatCurrency(totals.savings) }}</span>
							</div>
							<div class="summary-row">
								<span>{{ __("Tax") }}</span>
								<span>{{ formatCurrency(totals.tax) }}</span>
							</div>
							<v-divider class="my-2"></v-divider>
							<div class="summary-row total">
								<span class="text-h6">{{ __("Total") }}</span>
								<span class="text-h6 text-primary">{{ formatCurrency(totals.grandTotal) }}</span>
							</div>
						</v-card-text>

						<!-- Checkout Action -->
						<v-card-actions class="pa-4">
							<ActionButton
								icon="mdi-cash-register"
								color="success"
								size="x-large"
								block
								:disabled="cartItems.length === 0"
								@click="handleCheckout"
							>
								{{ __("Checkout") }}
								<span v-if="splitPaymentEnabled" class="ml-2 text-caption">
									({{ __("Split Payment") }})
								</span>
							</ActionButton>
						</v-card-actions>
					</v-card>
				</div>
			</div>
		</div>

		<!-- Payment Dialog -->
		<v-dialog v-model="showPaymentDialog" max-width="800" persistent>
			<SplitPayment
				v-if="splitPaymentEnabled"
				:total-due="totals.grandTotal"
				:payment-methods="paymentMethods"
				@payment-complete="handlePaymentComplete"
				@payment-cancelled="showPaymentDialog = false"
			/>
		</v-dialog>
	</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useCart } from '../../../services/cart/CartService';
import { usePosType } from '../../../composables/types/usePosType';
import { useDeviceDetection } from '../../../composables/types/useDeviceDetection';
import { useItemGrouping } from '../../../composables/types/useItemGrouping';

// Import components
import MobileLayout from '../../../layouts/MobileLayout.vue';
import ItemGrid from '../../items/ItemGrid.vue';
import CategoryNav from '../../base/CategoryNav.vue';
import SearchBar from '../../base/SearchBar.vue';
import ActionButton from '../../base/ActionButton.vue';
import PLUKeypad from './PLUKeypad.vue';
import ScaleWidget from './ScaleWidget.vue';
import QuickTouchGrid from './QuickTouchGrid.vue';
import SplitPayment from './SplitPayment.vue';

export default {
	name: 'GroceryLayout',
	components: {
		MobileLayout,
		ItemGrid,
		CategoryNav,
		SearchBar,
		ActionButton,
		PLUKeypad,
		ScaleWidget,
		QuickTouchGrid,
		SplitPayment,
	},
	props: {
		items: {
			type: Array,
			default: () => [],
		},
		categories: {
			type: Array,
			default: () => [],
		},
		loading: {
			type: Boolean,
			default: false,
		},
		paymentMethods: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['item-selected', 'checkout-complete'],
	setup(props, { emit }) {
		const cart = useCart();
		const {
			isFeatureEnabled,
			scaleEnabled,
			splitPaymentEnabled,
			getHardwareConfig,
		} = usePosType();
		const { isMobile, isTablet } = useDeviceDetection();
		const {
			filteredItems,
			selectedCategories,
			searchQuery,
			selectCategory,
			setSearchQuery,
			clearFilters,
		} = useItemGrouping(computed(() => props.items));

		const showPLUKeypad = ref(true);
		const showScaleWidget = ref(false);
		const showQuickGrid = ref(true);
		const showPaymentDialog = ref(false);
		const showHistory = ref(false);
		const selectedCategory = ref(null);
		const currentWeightedItem = ref(null);

		// Grocery-specific item layout
		const groceryItemLayout = computed(() => ({
			show_image: true,
			show_stock: true,
			show_price: true,
			show_unit_price: true,
			show_plu: true,
			show_weight: true,
			card_size: isMobile.value ? 'medium' : 'large',
			show_quick_actions: true,
		}));

		// Cart items
		const cartItems = computed(() => cart.items);

		// Cart totals
		const totals = computed(() => cart.getTotals());

		// Scale configuration
		const scaleConfig = computed(() => getHardwareConfig('scale'));

		// Popular items for quick grid
		const popularItems = computed(() => {
			// Would load from backend or filter by sales frequency
			return props.items.slice(0, 12); // Top 12 items
		});

		// Layout classes
		const layoutClasses = computed(() => ({
			'mobile-layout': isMobile.value,
			'tablet-layout': isTablet.value,
			'scale-visible': showScaleWidget.value,
		}));

		/**
		 * Handle item selection
		 */
		const handleItemSelect = async (item) => {
			// Check if weighted item
			if (item.is_weighted_item && scaleEnabled.value) {
				currentWeightedItem.value = item;
				showScaleWidget.value = true;
				return;
			}

			// Add to cart
			try {
				await cart.addItem(item, 1);
				emit('item-selected', item);
			} catch (error) {
				frappe.show_alert({
					message: error.message,
					indicator: 'red',
				});
			}
		};

		/**
		 * Handle quick add (add without opening details)
		 */
		const handleQuickAdd = async (item) => {
			try {
				await cart.addItem(item, 1);
			} catch (error) {
				frappe.show_alert({
					message: error.message,
					indicator: 'red',
				});
			}
		};

		/**
		 * Handle PLU item selection
		 */
		const handlePLUItemSelect = (item) => {
			handleItemSelect(item);
		};

		/**
		 * Handle weight captured from scale
		 */
		const handleWeightCaptured = async ({ weight, unit }) => {
			if (!currentWeightedItem.value) return;

			try {
				await cart.addItem(currentWeightedItem.value, weight, {
					is_weighted_item: true,
					weight: weight,
					uom: unit,
				});

				currentWeightedItem.value = null;
				showScaleWidget.value = false;
			} catch (error) {
				frappe.show_alert({
					message: error.message,
					indicator: 'red',
				});
			}
		};

		/**
		 * Handle category selection
		 */
		const handleCategorySelect = (category) => {
			selectedCategory.value = category;
			selectCategory(category);
		};

		/**
		 * Handle filters changed
		 */
		const handleFiltersChanged = (filters) => {
			// Update item grouping
		};

		/**
		 * Clear category filter
		 */
		const clearCategory = () => {
			selectedCategory.value = null;
			clearFilters();
		};

		/**
		 * Handle search
		 */
		const handleSearch = (query) => {
			setSearchQuery(query);
		};

		/**
		 * Toggle scale widget
		 */
		const toggleScale = () => {
			showScaleWidget.value = !showScaleWidget.value;
		};

		/**
		 * Focus search (for barcode scanning)
		 */
		const focusSearch = () => {
			// Would focus the search input
		};

		/**
		 * Handle checkout
		 */
		const handleCheckout = () => {
			if (splitPaymentEnabled.value) {
				showPaymentDialog.value = true;
			} else {
				// Proceed with single payment
				handlePaymentComplete();
			}
		};

		/**
		 * Handle payment complete
		 */
		const handlePaymentComplete = (paymentSummary) => {
			showPaymentDialog.value = false;
			emit('checkout-complete', {
				cart: cart.getState(),
				payment: paymentSummary,
			});

			// Clear cart for next transaction
			cart.clearCart();
		};

		/**
		 * Format currency
		 */
		const formatCurrency = (amount) => {
			return window.format_currency ? window.format_currency(amount) : `$${amount?.toFixed(2) || '0.00'}`;
		};

		// Load POS type configuration on mount
		onMounted(async () => {
			// Configuration would be loaded by parent component
		});

		return {
			// Device detection
			isMobile,
			isTablet,

			// State
			showPLUKeypad,
			showScaleWidget,
			showQuickGrid,
			showPaymentDialog,
			showHistory,
			searchQuery,
			selectedCategory,

			// Computed
			groceryItemLayout,
			cartItems,
			totals,
			scaleConfig,
			popularItems,
			filteredItems,
			layoutClasses,

			// Methods
			handleItemSelect,
			handleQuickAdd,
			handlePLUItemSelect,
			handleWeightCaptured,
			handleCategorySelect,
			handleFiltersChanged,
			clearCategory,
			handleSearch,
			toggleScale,
			focusSearch,
			handleCheckout,
			handlePaymentComplete,
			formatCurrency,
			isFeatureEnabled,
			scaleEnabled,
			splitPaymentEnabled,
		};
	},
};
</script>

<style scoped>
.grocery-layout {
	display: flex;
	flex-direction: column;
	height: 100vh;
	width: 100vw;
	overflow: hidden;
}

/* Desktop Layout */
.grocery-desktop-layout {
	display: flex;
	flex-direction: column;
	height: 100vh;
	overflow: hidden;
}

.grocery-content {
	flex: 1;
	display: grid;
	grid-template-columns: 320px 1fr 400px;
	gap: 16px;
	padding: 16px;
	overflow: hidden;
	background: rgb(var(--v-theme-surface-variant));
}

.left-panel,
.center-panel,
.right-panel {
	display: flex;
	flex-direction: column;
	gap: 16px;
	overflow: hidden;
}

.left-panel {
	overflow-y: auto;
}

.center-panel {
	min-width: 0;
}

.items-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.category-filters {
	padding: 12px 16px;
	border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.items-container {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.right-panel {
	overflow-y: auto;
}

.cart-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.cart-items {
	flex: 1;
	overflow-y: auto;
	min-height: 200px;
}

.empty-cart {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: rgba(var(--v-theme-on-surface), 0.5);
}

.cart-summary {
	flex-shrink: 0;
	padding: 16px;
}

.summary-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: 8px;
	font-size: 1rem;
}

.summary-row.savings {
	color: rgb(var(--v-theme-success));
	font-weight: 500;
}

.summary-row.total {
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* Mobile specific */
.grocery-items-view {
	height: 100%;
	overflow-y: auto;
	padding: 12px;
}

/* Scale visible state */
.scale-visible .center-panel {
	grid-column: span 2;
}

.scale-visible .left-panel {
	display: none;
}

/* Responsive */
@media (max-width: 1400px) {
	.grocery-content {
		grid-template-columns: 280px 1fr 360px;
	}
}

@media (max-width: 1200px) {
	.grocery-content {
		grid-template-columns: 240px 1fr 320px;
	}
}
</style>

