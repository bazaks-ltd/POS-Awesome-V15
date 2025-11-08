<template>
	<div class="desktop-layout">
		<!-- Top App Bar -->
		<v-app-bar flat density="comfortable" class="desktop-app-bar" elevation="1">
			<template #prepend>
				<v-avatar size="36" class="ml-2">
					<v-icon>{{ posTypeIcon }}</v-icon>
				</v-avatar>
				<v-app-bar-title class="ml-2">{{ posTypeName }}</v-app-bar-title>
			</template>

			<!-- Global Search -->
			<template #default>
				<div class="app-bar-search-desktop">
					<SearchBar
						v-model="searchQuery"
						:placeholder="__('Search items, customers, orders...')"
						@search="handleSearch"
					/>
				</div>
			</template>

			<!-- Right Actions -->
			<template #append>
				<v-btn icon="mdi-bell-outline" @click="showNotifications = true">
					<v-badge v-if="notificationCount > 0" :content="notificationCount" color="error">
						<v-icon>mdi-bell-outline</v-icon>
					</v-badge>
					<v-icon v-else>mdi-bell-outline</v-icon>
				</v-btn>

				<v-menu>
					<template #activator="{ props: menuProps }">
						<v-btn icon="mdi-account-circle" v-bind="menuProps"></v-btn>
					</template>
					<v-list>
						<v-list-item prepend-icon="mdi-account" title="Profile"></v-list-item>
						<v-list-item prepend-icon="mdi-cog" title="Settings"></v-list-item>
						<v-divider></v-divider>
						<v-list-item prepend-icon="mdi-logout" title="Logout"></v-list-item>
					</v-list>
				</v-menu>
			</template>
		</v-app-bar>

		<!-- Permanent Navigation Drawer -->
		<v-navigation-drawer
			:model-value="true"
			permanent
			:rail="railDrawer"
			width="260"
			class="desktop-drawer"
		>
			<template #prepend>
				<div class="drawer-toggle">
					<v-btn
						icon
						variant="text"
						@click="railDrawer = !railDrawer"
					>
						<v-icon>{{ railDrawer ? 'mdi-menu' : 'mdi-menu-open' }}</v-icon>
					</v-btn>
				</div>
			</template>

			<v-list density="compact" nav>
				<v-list-item
					prepend-icon="mdi-view-dashboard"
					:title="__('Dashboard')"
					value="dashboard"
					@click="navigateTo('dashboard')"
				></v-list-item>

				<v-list-item
					prepend-icon="mdi-point-of-sale"
					:title="__('POS')"
					value="pos"
					@click="navigateTo('pos')"
				></v-list-item>

				<v-list-item
					prepend-icon="mdi-history"
					:title="__('Orders')"
					value="orders"
					@click="navigateTo('orders')"
				></v-list-item>

				<v-list-item
					prepend-icon="mdi-account-multiple"
					:title="__('Customers')"
					value="customers"
					@click="navigateTo('customers')"
				></v-list-item>

				<v-list-item
					prepend-icon="mdi-package-variant"
					:title="__('Inventory')"
					value="inventory"
					@click="navigateTo('inventory')"
				></v-list-item>

				<v-list-item
					prepend-icon="mdi-chart-line"
					:title="__('Reports')"
					value="reports"
					@click="navigateTo('reports')"
				></v-list-item>

				<v-divider class="my-2"></v-divider>

				<v-list-item
					prepend-icon="mdi-cog"
					:title="__('Settings')"
					value="settings"
					@click="navigateTo('settings')"
				></v-list-item>
			</v-list>
		</v-navigation-drawer>

		<!-- Main Content Area -->
		<v-main class="desktop-main">
			<div class="three-column-layout">
				<!-- Left Column: Categories & Filters -->
				<div class="left-column">
					<v-card elevation="0" class="categories-card">
						<v-card-title class="text-subtitle-1">
							{{ __("Categories") }}
						</v-card-title>
						<v-card-text class="pa-2">
							<CategoryNav
								:mode="categoryMode"
								:categories="categories"
								@category-selected="handleCategorySelect"
							/>
						</v-card-text>
					</v-card>

					<!-- Quick Actions -->
					<v-card elevation="0" class="mt-2">
						<v-card-title class="text-subtitle-1">
							{{ __("Quick Actions") }}
						</v-card-title>
						<v-card-text class="pa-2">
							<slot name="quick-actions">
								<div class="quick-actions-grid">
									<ActionButton
										icon="mdi-plus-circle"
										color="primary"
										block
										@click="handleQuickAction('new_order')"
									>
										{{ __("New Order") }}
									</ActionButton>
									<ActionButton
										icon="mdi-clock-outline"
										color="secondary"
										block
										@click="handleQuickAction('drafts')"
									>
										{{ __("Drafts") }}
									</ActionButton>
								</div>
							</slot>
						</v-card-text>
					</v-card>
				</div>

				<!-- Center Column: Items Grid -->
				<div class="center-column">
					<v-card elevation="0" class="items-card">
						<v-card-title class="d-flex align-center">
							<span>{{ __("Items") }}</span>
							<v-spacer></v-spacer>

							<!-- View Toggle -->
							<v-btn-toggle
								v-model="itemsView"
								mandatory
								density="compact"
								variant="outlined"
							>
								<v-btn value="grid" icon="mdi-view-grid"></v-btn>
								<v-btn value="list" icon="mdi-view-list"></v-btn>
							</v-btn-toggle>
						</v-card-title>

						<v-card-text class="items-container">
							<slot name="items">
								<ItemGrid
									v-if="itemsView === 'grid'"
									:items="filteredItems"
									:loading="loading"
									:item-card-layout="itemCardLayout"
									@item-selected="handleItemSelect"
								/>
								<!-- List view component would go here -->
							</slot>
						</v-card-text>
					</v-card>
				</div>

				<!-- Right Column: Cart & Customer -->
				<div class="right-column">
					<!-- Customer Card -->
					<v-card elevation="0" class="customer-card">
						<v-card-title class="text-subtitle-1">
							{{ __("Customer") }}
						</v-card-title>
						<v-card-text>
							<slot name="customer">
								<div class="customer-info">
									<v-btn
										variant="outlined"
										block
										prepend-icon="mdi-account-plus"
										@click="handleSelectCustomer"
									>
										{{ currentCustomer ? currentCustomer.customer_name : __("Select Customer") }}
									</v-btn>
								</div>
							</slot>
						</v-card-text>
					</v-card>

					<!-- Cart Card -->
					<v-card elevation="0" class="cart-card mt-2">
						<v-card-title class="d-flex align-center">
							<span>{{ __("Cart") }}</span>
							<v-spacer></v-spacer>
							<v-chip size="small">{{ cartItems.length }} {{ __("items") }}</v-chip>
						</v-card-title>

						<v-divider></v-divider>

						<v-card-text class="cart-items">
							<slot name="cart">
								<div v-if="cartItems.length === 0" class="empty-cart">
									<v-icon size="48" color="grey-lighten-1">mdi-cart-outline</v-icon>
									<p class="text-caption mt-2">{{ __("Cart is empty") }}</p>
								</div>
							</slot>
						</v-card-text>

						<!-- Cart Summary -->
						<v-divider></v-divider>

						<v-card-text class="cart-summary">
							<slot name="cart-summary">
								<div class="summary-row">
									<span>{{ __("Subtotal") }}</span>
									<span class="font-weight-bold">{{ formatCurrency(0) }}</span>
								</div>
								<div class="summary-row">
									<span>{{ __("Tax") }}</span>
									<span>{{ formatCurrency(0) }}</span>
								</div>
								<v-divider class="my-2"></v-divider>
								<div class="summary-row total-row">
									<span class="text-h6">{{ __("Total") }}</span>
									<span class="text-h6 text-primary">{{ formatCurrency(0) }}</span>
								</div>
							</slot>
						</v-card-text>

						<!-- Cart Actions -->
						<v-card-actions class="pa-4">
							<slot name="cart-actions">
								<ActionButton
									icon="mdi-cash-register"
									color="primary"
									size="x-large"
									block
									:disabled="cartItems.length === 0"
									@click="handleCheckout"
								>
									{{ __("Checkout") }}
								</ActionButton>
							</slot>
						</v-card-actions>
					</v-card>
				</div>
			</div>
		</v-main>

		<!-- Notifications Drawer -->
		<v-navigation-drawer
			v-model="showNotifications"
			location="right"
			temporary
			width="360"
		>
			<v-list>
				<v-list-item prepend-icon="mdi-bell" title="Notifications">
					<template #append>
						<v-btn icon="mdi-close" size="small" variant="text" @click="showNotifications = false"></v-btn>
					</template>
				</v-list-item>
			</v-list>
			<v-divider></v-divider>
			<slot name="notifications">
				<div class="pa-4 text-center">
					<p>{{ __("No new notifications") }}</p>
				</div>
			</slot>
		</v-navigation-drawer>
	</div>
</template>

<script>
import { ref, computed } from 'vue';
import { usePosType } from '../composables/types/usePosType';
import { useCart } from '../services/cart/CartService';
import ItemGrid from '../components/items/ItemGrid.vue';
import CategoryNav from '../components/base/CategoryNav.vue';
import SearchBar from '../components/base/SearchBar.vue';
import ActionButton from '../components/base/ActionButton.vue';

export default {
	name: 'DesktopLayout',
	components: {
		ItemGrid,
		CategoryNav,
		SearchBar,
		ActionButton,
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
	emits: ['item-selected', 'category-selected', 'search', 'navigate', 'checkout', 'quick-action'],
	setup(props, { emit }) {
		const { posTypeName, icon: posTypeIcon, categoryNavigationStyle, itemCardLayout } = usePosType();
		const cart = useCart();

		const railDrawer = ref(false);
		const showNotifications = ref(false);
		const itemsView = ref('grid');
		const searchQuery = ref('');
		const selectedCategory = ref(null);
		const currentCustomer = ref(null);
		const notificationCount = ref(0);

		// Cart items
		const cartItems = computed(() => cart.items);

		// Category mode
		const categoryMode = computed(() => {
			return categoryNavigationStyle.value || 'tree';
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
		};

		/**
		 * Handle checkout
		 */
		const handleCheckout = () => {
			emit('checkout');
		};

		/**
		 * Handle quick action
		 */
		const handleQuickAction = (action) => {
			emit('quick-action', action);
		};

		/**
		 * Handle customer selection
		 */
		const handleSelectCustomer = () => {
			// Emit event or open dialog
		};

		/**
		 * Format currency
		 */
		const formatCurrency = (amount) => {
			return window.format_currency ? window.format_currency(amount) : amount;
		};

		return {
			posTypeName,
			posTypeIcon,
			railDrawer,
			showNotifications,
			itemsView,
			searchQuery,
			currentCustomer,
			notificationCount,
			cartItems,
			categoryMode,
			itemCardLayout,
			filteredItems,
			handleItemSelect,
			handleCategorySelect,
			handleSearch,
			navigateTo,
			handleCheckout,
			handleQuickAction,
			handleSelectCustomer,
			formatCurrency,
		};
	},
};
</script>

<style scoped>
.desktop-layout {
	display: flex;
	flex-direction: column;
	height: 100vh;
	width: 100vw;
	overflow: hidden;
}

.desktop-app-bar {
	border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.app-bar-search-desktop {
	max-width: 500px;
	margin: 0 auto;
}

.desktop-drawer {
	border-right: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.drawer-toggle {
	padding: 8px;
	text-align: center;
}

.desktop-main {
	flex: 1;
	overflow: hidden;
	background: rgb(var(--v-theme-surface-variant));
}

/* Three Column Layout */
.three-column-layout {
	display: grid;
	grid-template-columns: 280px 1fr 400px;
	gap: 16px;
	height: 100%;
	padding: 16px;
	overflow: hidden;
}

.left-column,
.center-column,
.right-column {
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

/* Left Column */
.left-column {
	gap: 16px;
}

.categories-card {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.categories-card .v-card-text {
	flex: 1;
	overflow-y: auto;
}

.quick-actions-grid {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

/* Center Column */
.center-column {
	min-width: 0; /* Allow grid item to shrink */
}

.items-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.items-container {
	flex: 1;
	overflow-y: auto;
}

/* Right Column */
.right-column {
	gap: 16px;
}

.customer-card {
	flex-shrink: 0;
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
	justify-center;
	height: 100%;
	color: rgba(var(--v-theme-on-surface), 0.6);
}

.cart-summary {
	flex-shrink: 0;
}

.summary-row {
	display: flex;
	justify-content: space-between;
	margin-bottom: 8px;
}

.summary-row.total-row {
	margin-top: 8px;
}

/* Responsive */
@media (max-width: 1400px) {
	.three-column-layout {
		grid-template-columns: 240px 1fr 360px;
	}
}

@media (max-width: 1200px) {
	.three-column-layout {
		grid-template-columns: 200px 1fr 320px;
	}
}
</style>

