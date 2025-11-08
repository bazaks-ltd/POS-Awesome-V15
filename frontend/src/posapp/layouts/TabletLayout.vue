<template>
	<div class="tablet-layout" :class="layoutClasses">
		<!-- App Bar -->
		<v-app-bar flat density="comfortable" class="tablet-app-bar">
			<template #prepend>
				<v-btn icon="mdi-menu" @click="showDrawer = !showDrawer"></v-btn>
			</template>

			<v-app-bar-title>{{ posTypeName }}</v-app-bar-title>

			<!-- Search in app bar for tablet -->
			<template #default>
				<div class="app-bar-search">
					<SearchBar
						v-model="searchQuery"
						:placeholder="__('Search items...')"
						@search="handleSearch"
					/>
				</div>
			</template>

			<template #append>
				<v-btn icon="mdi-history" @click="showHistory = true"></v-btn>
				<v-btn icon="mdi-account" @click="showCustomer = true"></v-btn>
			</template>
		</v-app-bar>

		<!-- Navigation Drawer -->
		<v-navigation-drawer
			v-model="showDrawer"
			:rail="railDrawer"
			:permanent="!isMobileSize"
			:temporary="isMobileSize"
			width="260"
		>
			<v-list density="compact" nav>
				<v-list-item
					prepend-icon="mdi-view-dashboard"
					:title="__('Dashboard')"
					@click="navigateTo('dashboard')"
				></v-list-item>
				<v-list-item
					prepend-icon="mdi-history"
					:title="__('History')"
					@click="navigateTo('history')"
				></v-list-item>
				<v-list-item
					prepend-icon="mdi-account-multiple"
					:title="__('Customers')"
					@click="navigateTo('customers')"
				></v-list-item>
				<v-list-item
					prepend-icon="mdi-cog"
					:title="__('Settings')"
					@click="navigateTo('settings')"
				></v-list-item>
			</v-list>
		</v-navigation-drawer>

		<!-- Main Content -->
		<v-main class="tablet-main">
			<div class="content-wrapper">
				<!-- Left Panel: Items -->
				<div class="items-panel" :class="{ 'panel-collapsed': itemsPanelCollapsed }">
					<!-- Category Navigation -->
					<div class="category-nav-section">
						<CategoryNav
							:mode="categoryMode"
							:categories="categories"
							@category-selected="handleCategorySelect"
						/>
					</div>

					<!-- Items Grid -->
					<div class="items-grid-section">
						<slot name="items">
							<ItemGrid
								:items="filteredItems"
								:loading="loading"
								:item-card-layout="itemCardLayout"
								@item-selected="handleItemSelect"
							/>
						</slot>
					</div>
				</div>

				<!-- Right Panel: Cart & Actions -->
				<div class="cart-panel" :class="{ 'panel-expanded': cartPanelExpanded }">
					<!-- Cart Header -->
					<div class="cart-header">
						<h3 class="text-h6">{{ __("Current Order") }}</h3>
						<v-spacer></v-spacer>
						<v-btn
							icon="mdi-fullscreen"
							size="small"
							variant="text"
							@click="toggleCartPanel"
						></v-btn>
					</div>

					<!-- Cart Content -->
					<div class="cart-content">
						<slot name="cart">
							<!-- Cart component goes here -->
							<div v-if="cartItems.length === 0" class="empty-cart">
								<v-icon size="64" color="grey-lighten-1">mdi-cart-outline</v-icon>
								<p class="text-body-1 mt-4">{{ __("Cart is empty") }}</p>
							</div>
						</slot>
					</div>

					<!-- Cart Actions -->
					<div class="cart-actions">
						<slot name="cart-actions">
							<v-btn
								color="primary"
								block
								size="x-large"
								:disabled="cartItems.length === 0"
								@click="handleCheckout"
							>
								<v-icon start>mdi-cash-register</v-icon>
								{{ __("Checkout") }}
							</v-btn>
						</slot>
					</div>
				</div>
			</div>
		</v-main>

		<!-- Side Panels / Dialogs -->
		<v-dialog v-model="showCustomer" max-width="600">
			<v-card>
				<v-card-title>{{ __("Customer") }}</v-card-title>
				<v-card-text>
					<slot name="customer-dialog" />
				</v-card-text>
			</v-card>
		</v-dialog>

		<v-dialog v-model="showHistory" max-width="800" fullscreen>
			<v-card>
				<v-toolbar density="compact">
					<v-toolbar-title>{{ __("Order History") }}</v-toolbar-title>
					<v-spacer></v-spacer>
					<v-btn icon="mdi-close" @click="showHistory = false"></v-btn>
				</v-toolbar>
				<v-card-text>
					<slot name="history-dialog" />
				</v-card-text>
			</v-card>
		</v-dialog>
	</div>
</template>

<script>
import { ref, computed } from 'vue';
import { usePosType } from '../composables/types/usePosType';
import { useCart } from '../services/cart/CartService';
import { useDeviceDetection } from '../composables/types/useDeviceDetection';
import ItemGrid from '../components/items/ItemGrid.vue';
import CategoryNav from '../components/base/CategoryNav.vue';
import SearchBar from '../components/base/SearchBar.vue';

export default {
	name: 'TabletLayout',
	components: {
		ItemGrid,
		CategoryNav,
		SearchBar,
	},
	props: {
		categories: {
			type: Array,
			default: () => [],
		},
		items: {
			type: Array,
			default: () => [],
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['item-selected', 'category-selected', 'search', 'navigate', 'checkout'],
	setup(props, { emit }) {
		const { posTypeName, categoryNavigationStyle, itemCardLayout } = usePosType();
		const cart = useCart();
		const { isPortrait, screenWidth } = useDeviceDetection();

		const showDrawer = ref(true);
		const railDrawer = ref(false);
		const showCustomer = ref(false);
		const showHistory = ref(false);
		const itemsPanelCollapsed = ref(false);
		const cartPanelExpanded = ref(false);
		const searchQuery = ref('');
		const selectedCategory = ref(null);

		// Check if screen is small enough to be mobile-like
		const isMobileSize = computed(() => screenWidth.value < 768);

		// Cart items
		const cartItems = computed(() => cart.items);

		// Category mode
		const categoryMode = computed(() => {
			return categoryNavigationStyle.value || 'tabs';
		});

		// Filtered items
		const filteredItems = computed(() => {
			let items = props.items;

			if (selectedCategory.value) {
				items = items.filter(item => item.item_group === selectedCategory.value);
			}

			if (searchQuery.value) {
				const query = searchQuery.value.toLowerCase();
				items = items.filter(item =>
					item.item_name?.toLowerCase().includes(query) ||
					item.item_code?.toLowerCase().includes(query)
				);
			}

			return items;
		});

		// Layout classes
		const layoutClasses = computed(() => ({
			'portrait-mode': isPortrait.value,
			'landscape-mode': !isPortrait.value,
		}));

		/**
		 * Handle item selection
		 */
		const handleItemSelect = (item) => {
			emit('item-selected', item);
		};

		/**
		 * Handle category selection
		 */
		const handleCategorySelect = (category) => {
			selectedCategory.value = category;
			emit('category-selected', category);
		};

		/**
		 * Handle search
		 */
		const handleSearch = (query) => {
			emit('search', query);
		};

		/**
		 * Navigate to route
		 */
		const navigateTo = (route) => {
			emit('navigate', route);
			if (isMobileSize.value) {
				showDrawer.value = false;
			}
		};

		/**
		 * Toggle cart panel expansion
		 */
		const toggleCartPanel = () => {
			cartPanelExpanded.value = !cartPanelExpanded.value;
			if (cartPanelExpanded.value) {
				itemsPanelCollapsed.value = true;
			} else {
				itemsPanelCollapsed.value = false;
			}
		};

		/**
		 * Handle checkout
		 */
		const handleCheckout = () => {
			emit('checkout');
		};

		return {
			posTypeName,
			showDrawer,
			railDrawer,
			showCustomer,
			showHistory,
			itemsPanelCollapsed,
			cartPanelExpanded,
			searchQuery,
			isMobileSize,
			cartItems,
			categoryMode,
			itemCardLayout,
			filteredItems,
			layoutClasses,
			handleItemSelect,
			handleCategorySelect,
			handleSearch,
			navigateTo,
			toggleCartPanel,
			handleCheckout,
		};
	},
};
</script>

<style scoped>
.tablet-layout {
	display: flex;
	flex-direction: column;
	height: 100vh;
	width: 100vw;
	overflow: hidden;
}

.tablet-app-bar {
	border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.app-bar-search {
	max-width: 400px;
	margin: 0 auto;
}

.tablet-main {
	flex: 1;
	overflow: hidden;
}

.content-wrapper {
	display: flex;
	height: 100%;
	gap: 1px;
	background: rgba(var(--v-theme-outline), 0.12);
}

/* Items Panel */
.items-panel {
	flex: 1;
	min-width: 300px;
	display: flex;
	flex-direction: column;
	background: rgb(var(--v-theme-surface));
	transition: all 0.3s ease;
}

.items-panel.panel-collapsed {
	flex: 0 0 80px;
	min-width: 80px;
}

.category-nav-section {
	flex-shrink: 0;
	border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
	max-height: 200px;
	overflow-y: auto;
}

.items-grid-section {
	flex: 1;
	overflow-y: auto;
}

/* Cart Panel */
.cart-panel {
	flex: 0 0 420px;
	display: flex;
	flex-direction: column;
	background: rgb(var(--v-theme-surface));
	transition: all 0.3s ease;
}

.cart-panel.panel-expanded {
	flex: 1;
}

.cart-header {
	display: flex;
	align-items: center;
	padding: 16px;
	border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.cart-content {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.empty-cart {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: rgba(var(--v-theme-on-surface), 0.6);
}

.cart-actions {
	flex-shrink: 0;
	padding: 16px;
	border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* Portrait mode adjustments */
.portrait-mode .content-wrapper {
	flex-direction: column;
}

.portrait-mode .items-panel {
	flex: 1;
	min-height: 50%;
}

.portrait-mode .cart-panel {
	flex: 0 0 300px;
}

/* Responsive */
@media (max-width: 960px) {
	.cart-panel {
		flex: 0 0 350px;
	}
}
</style>

