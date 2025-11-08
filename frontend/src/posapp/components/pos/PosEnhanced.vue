<template>
	<div class="pos-enhanced-container" :class="[rtlClasses, containerClasses]">
		<!-- Keep existing dialogs -->
		<ClosingDialog></ClosingDialog>
		<Drafts></Drafts>
		<SalesOrders></SalesOrders>
		<Returns></Returns>
		<NewAddress></NewAddress>
		<MpesaPayments></MpesaPayments>
		<Variants></Variants>
		<OpeningDialog v-if="dialog" :dialog="dialog"></OpeningDialog>

		<!-- Enhanced Layout System -->
		<component
			v-show="!dialog"
			:is="currentLayout"
			v-if="posTypeLoaded"
			:items="items"
			:categories="itemGroups"
			:loading="loadingItems"
			@item-selected="handleItemSelect"
			@category-selected="handleCategorySelect"
			@search="handleSearch"
			@checkout="handleCheckout"
		>
			<!-- Pass existing components as slots -->
			<template #cart>
				<Invoice ref="invoiceRef" />
			</template>

			<template #customer>
				<Customer />
			</template>

			<!-- Grocery-specific features (conditional) -->
			<template v-if="isGroceryStore" #grocery-features>
				<div class="grocery-panel">
					<PLUKeypad
						v-if="isFeatureEnabled('plu_codes')"
						@item-selected="handlePLUItemSelect"
					/>

					<ScaleWidget
						v-if="scaleEnabled"
						:scale-config="scaleConfig"
						@weight-captured="handleWeightCaptured"
					/>
				</div>
			</template>

			<!-- Payment with split payment support -->
			<template #payment>
				<SplitPayment
					v-if="splitPaymentEnabled && showSplitPayment"
					:total-due="grandTotal"
					:payment-methods="paymentMethods"
					@payment-complete="handlePaymentComplete"
					@payment-cancelled="showSplitPayment = false"
				/>
				<Payments v-else-if="payment" />
			</template>

			<!-- Offers and Coupons in side panel -->
			<template #side-panel>
				<PosOffers v-if="showOffers" />
				<PosCoupons v-if="coupons" />
			</template>
		</component>

		<!-- Fallback to original layout if POS Type not loaded -->
		<div v-else-if="!posTypeLoaded && !dialog" class="fallback-layout">
			<v-row dense class="ma-0">
				<v-col xl="5" lg="5" md="5" sm="5" cols="12" class="pos">
					<ItemsSelector></ItemsSelector>
				</v-col>
				<v-col xl="7" lg="7" md="7" sm="7" cols="12" class="pos">
					<Invoice></Invoice>
				</v-col>
			</v-row>
		</div>

		<!-- Customer Display (separate window) -->
		<CustomerDisplay
			v-if="customerDisplayEnabled && isCustomerDisplayWindow"
			:store-name="posProfile.company"
		/>
	</div>
</template>

<script>
import { ref, computed, onMounted, getCurrentInstance, watch } from "vue";
import { usePosType } from "../../composables/types/usePosType.js";
import { useDeviceDetection } from "../../composables/types/useDeviceDetection.js";
import { useLayoutAdapter } from "../../composables/types/useLayoutAdapter.js";
import { useCart } from "../../services/cart/CartService.js";
import { usePosShift } from "../../composables/usePosShift.js";
import { useOffers } from "../../composables/useOffers.js";
import { useResponsive } from "../../composables/useResponsive.js";
import { useRtl } from "../../composables/useRtl.js";
import { clearExpiredCustomerBalances } from "../../../offline/index.js";

// Import existing components
import ItemsSelector from "./ItemsSelector.vue";
import Invoice from "./Invoice.vue";
import Customer from "./Customer.vue";
import OpeningDialog from "./OpeningDialog.vue";
import Payments from "./Payments.vue";
import PosOffers from "./PosOffers.vue";
import PosCoupons from "./PosCoupons.vue";
import Drafts from "./Drafts.vue";
import SalesOrders from "./SalesOrders.vue";
import ClosingDialog from "./ClosingDialog.vue";
import NewAddress from "./NewAddress.vue";
import Variants from "./Variants.vue";
import Returns from "./Returns.vue";
import MpesaPayments from "./Mpesa-Payments.vue";

// Import new modular components
import PLUKeypad from "../types/grocery/PLUKeypad.vue";
import ScaleWidget from "../types/grocery/ScaleWidget.vue";
import SplitPayment from "../types/grocery/SplitPayment.vue";
import CustomerDisplay from "../types/grocery/CustomerDisplay.vue";

export default {
	name: "PosEnhanced",
	components: {
		ItemsSelector,
		Invoice,
		Customer,
		OpeningDialog,
		Payments,
		Drafts,
		ClosingDialog,
		Returns,
		PosOffers,
		PosCoupons,
		NewAddress,
		Variants,
		MpesaPayments,
		SplitPayment,
		PLUKeypad,
		ScaleWidget,
		CustomerDisplay,
	},
	setup() {
		const instance = getCurrentInstance();
		const responsive = useResponsive();
		const rtl = useRtl();
		const cart = useCart();

		// POS Type and device detection
		const {
			loadPosTypeConfig,
			posTypeName,
			isFeatureEnabled,
			scaleEnabled,
			splitPaymentEnabled,
			customerDisplayEnabled,
			getHardwareConfig,
		} = usePosType();

		const { setDeviceOverride, isMobile, isTablet } = useDeviceDetection();
		const { currentLayoutComponent } = useLayoutAdapter();

		const shift = usePosShift(() => {
			if (instance && instance.proxy) {
				instance.proxy.dialog = true;
			}
		});
		const offers = useOffers();

		// State
		const posTypeLoaded = ref(false);
		const loadingItems = ref(false);
		const items = ref([]);
		const itemGroups = ref([]);
		const paymentMethods = ref([]);
		const currentWeightedItem = ref(null);
		const showSplitPayment = ref(false);
		const invoiceRef = ref(null);
		const grandTotal = ref(0);
		const posProfile = ref({});

		// Computed
		const isGroceryStore = computed(() => posTypeName.value === 'Grocery Store');

		const scaleConfig = computed(() => getHardwareConfig('scale'));

		const isCustomerDisplayWindow = computed(() => {
			return window.location.search.includes('customer_display=1');
		});

		const containerClasses = computed(() => ({
			'grocery-mode': isGroceryStore.value,
			'mobile-mode': isMobile.value,
			'tablet-mode': isTablet.value,
		}));

		const currentLayout = computed(() => {
			// If grocery store and we have the grocery layout, use it
			if (isGroceryStore.value && isMobile.value) {
				return () => import('../types/grocery/GroceryLayout.vue');
			}
			
			// Otherwise use standard layout adapter
			return currentLayoutComponent.value;
		});

		/**
		 * Load POS Type configuration
		 */
		const loadPosType = async (profileName) => {
			try {
				await loadPosTypeConfig(profileName);
				posTypeLoaded.value = true;
				console.log('POS Type loaded:', posTypeName.value);

				// Apply device override from POS Profile if set
				if (posProfile.value?.device_target) {
					setDeviceOverride(posProfile.value.device_target);
				}
			} catch (error) {
				console.error('Failed to load POS Type:', error);
				// Use fallback layout
				posTypeLoaded.value = false;
			}
		};

		/**
		 * Handle item selection
		 */
		const handleItemSelect = async (item) => {
			// Check if weighted item and scale enabled
			if (item.is_weighted_item && scaleEnabled.value) {
				currentWeightedItem.value = item;
				// Scale widget will emit weight-captured event
				return;
			}

			// Add to cart via service
			try {
				await cart.addItem(item, 1, {
					warehouse: posProfile.value?.warehouse,
				});

				// Also update legacy invoice component if it exists
				if (invoiceRef.value && invoiceRef.value.add_item) {
					invoiceRef.value.add_item(item);
				}
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
					warehouse: posProfile.value?.warehouse,
				});

				// Update legacy invoice component
				if (invoiceRef.value && invoiceRef.value.add_item) {
					const item = { ...currentWeightedItem.value };
					item.qty = weight;
					item.uom = unit;
					invoiceRef.value.add_item(item);
				}

				currentWeightedItem.value = null;
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
			// Emit to event bus for existing components
			instance.proxy.eventBus.emit('category_selected', category);
		};

		/**
		 * Handle search
		 */
		const handleSearch = (query) => {
			// Emit to event bus for existing components
			instance.proxy.eventBus.emit('search_items', query);
		};

		/**
		 * Handle checkout
		 */
		const handleCheckout = () => {
			// Get totals from cart service
			const totals = cart.getTotals();
			grandTotal.value = totals.grandTotal;

			// Show split payment if enabled
			if (splitPaymentEnabled.value) {
				showSplitPayment.value = true;
			} else {
				// Use existing payment dialog
				instance.proxy.eventBus.emit('show_payment', 'true');
			}
		};

		/**
		 * Handle payment complete
		 */
		const handlePaymentComplete = async (paymentSummary) => {
			showSplitPayment.value = false;

			// Submit invoice with payment data
			if (invoiceRef.value && invoiceRef.value.submit_invoice) {
				// Map payment summary to expected format
				const payments = paymentSummary.payments.map(p => ({
					mode_of_payment: p.mode_of_payment,
					amount: p.amount,
					account: p.account,
					type: p.mode_of_payment,
					default: 0,
				}));

				// Submit via existing invoice component
				invoiceRef.value.payments = payments;
				await invoiceRef.value.submit_invoice();
			}
		};

		/**
		 * Listen to POS profile registration
		 */
		onMounted(() => {
			// Listen for POS profile load from existing system
			instance.proxy.eventBus.on('register_pos_profile', async (data) => {
				if (data && data.pos_profile) {
					posProfile.value = data.pos_profile;
					paymentMethods.value = data.pos_profile.payments || [];

					// Load POS Type configuration
					await loadPosType(data.pos_profile.name);

					// Initialize cart service with profile settings
					cart.validationService.setAllowNegativeStock(
						data.pos_profile.allow_negative_stock || false
					);
				}
			});

			// Listen for items loaded
			instance.proxy.eventBus.on('items_loaded_enhanced', (itemsList) => {
				items.value = itemsList || [];
				loadingItems.value = false;
			});

			// Listen for item groups loaded
			instance.proxy.eventBus.on('item_groups_loaded', (groups) => {
				itemGroups.value = groups || [];
			});

			// Sync cart service with invoice component changes
			instance.proxy.eventBus.on('invoice_item_added', (item) => {
				// Keep services in sync
			});
		});

		return {
			...responsive,
			...rtl,
			...shift,
			...offers,
			// New system
			cart,
			posTypeLoaded,
			loadingItems,
			items,
			itemGroups,
			paymentMethods,
			currentLayout,
			isGroceryStore,
			scaleEnabled,
			splitPaymentEnabled,
			customerDisplayEnabled,
			scaleConfig,
			isCustomerDisplayWindow,
			containerClasses,
			showSplitPayment,
			invoiceRef,
			grandTotal,
			posProfile,
			// Methods
			isFeatureEnabled,
			handleItemSelect,
			handlePLUItemSelect,
			handleWeightCaptured,
			handleCategorySelect,
			handleSearch,
			handleCheckout,
			handlePaymentComplete,
		};
	},
	data() {
		return {
			dialog: false,
			payment: false,
			showOffers: false,
			coupons: false,
			itemsLoaded: false,
			customersLoaded: false,
		};
	},
	mounted() {
		this.$nextTick(() => {
			this.check_opening_entry();
			this.eventBus.on("close_opening_dialog", () => {
				this.dialog = false;
			});
			this.eventBus.on("show_payment", (data) => {
				this.payment = data === "true";
				this.showOffers = false;
				this.coupons = false;
			});
			this.eventBus.on("show_offers", (data) => {
				this.showOffers = data === "true";
				this.payment = false;
				this.coupons = false;
			});
			this.eventBus.on("show_coupons", (data) => {
				this.coupons = data === "true";
				this.showOffers = false;
				this.payment = false;
			});
		});

		clearExpiredCustomerBalances();
	},
	beforeUnmount() {
		this.eventBus.off("close_opening_dialog");
		this.eventBus.off("show_offers");
		this.eventBus.off("show_coupons");
		this.eventBus.off("show_payment");
		this.eventBus.off("register_pos_profile");
		this.eventBus.off("items_loaded_enhanced");
		this.eventBus.off("item_groups_loaded");
	},
};
</script>

<style scoped>
.pos-enhanced-container {
	min-height: 100%;
	height: 100%;
}

.grocery-panel {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
}

.fallback-layout {
	padding: 16px;
}

/* Smooth transitions between layouts */
.pos-enhanced-container {
	transition: all 0.3s ease;
}
</style>

