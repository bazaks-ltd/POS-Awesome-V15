<template>
	<div class="mobile-layout" :class="layoutClasses">
		<!-- Top App Bar -->
		<v-app-bar flat density="compact" class="mobile-app-bar">
			<template #prepend>
				<v-btn icon="mdi-menu" @click="showDrawer = !showDrawer"></v-btn>
			</template>

			<v-app-bar-title>{{ posTypeName }}</v-app-bar-title>

			<template #append>
				<v-btn icon="mdi-magnify" @click="showSearch = !showSearch"></v-btn>
				<v-btn icon="mdi-cart" @click="showCart = true">
					<v-badge v-if="cartItemsCount > 0" :content="cartItemsCount" color="error">
						<v-icon>mdi-cart</v-icon>
					</v-badge>
					<v-icon v-else>mdi-cart</v-icon>
				</v-btn>
			</template>
		</v-app-bar>

		<!-- Navigation Drawer -->
		<v-navigation-drawer
			v-model="showDrawer"
			temporary
			location="left"
			width="280"
		>
			<slot name="drawer">
				<!-- Default drawer content -->
				<v-list density="compact">
					<v-list-item prepend-icon="mdi-home" title="Home" @click="navigateTo('home')"></v-list-item>
					<v-list-item prepend-icon="mdi-history" title="History" @click="navigateTo('history')"></v-list-item>
					<v-list-item prepend-icon="mdi-cog" title="Settings" @click="navigateTo('settings')"></v-list-item>
				</v-list>
			</slot>
		</v-navigation-drawer>

		<!-- Search Overlay -->
		<v-dialog v-model="showSearch" fullscreen transition="dialog-bottom-transition">
			<v-card>
				<v-toolbar density="compact">
					<SearchBar
						v-model="searchQuery"
						autofocus
						@search="handleSearch"
					/>
					<v-btn icon="mdi-close" @click="showSearch = false"></v-btn>
				</v-toolbar>

				<v-card-text class="search-results">
					<slot name="search-results" :query="searchQuery" />
				</v-card-text>
			</v-card>
		</v-dialog>

		<!-- Main Content Area (Full Screen) -->
		<v-main class="mobile-main">
			<div v-show="!showCart" class="items-view">
				<!-- Category Navigation -->
				<div v-if="showCategories" class="category-section">
					<CategoryNav
						:mode="categoryMode"
						:categories="categories"
						@category-selected="handleCategorySelect"
					/>
				</div>

				<!-- Items Grid/List -->
				<div class="items-section">
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

			<!-- Cart View (Full Screen) -->
			<div v-show="showCart" class="cart-view">
				<slot name="cart">
					<!-- Cart component goes here -->
				</slot>
			</div>
		</v-main>

		<!-- Bottom Navigation (Floating Action Buttons) -->
		<div class="bottom-actions">
			<v-btn
				v-if="!showCart"
				class="cart-fab"
				color="primary"
				size="x-large"
				icon
				elevation="8"
				@click="showCart = true"
			>
				<v-badge v-if="cartItemsCount > 0" :content="cartItemsCount" color="error">
					<v-icon size="large">mdi-cart</v-icon>
				</v-badge>
				<v-icon v-else size="large">mdi-cart</v-icon>
			</v-btn>

			<v-btn
				v-else
				class="back-fab"
				color="secondary"
				size="x-large"
				icon
				elevation="8"
				@click="showCart = false"
			>
				<v-icon size="large">mdi-arrow-left</v-icon>
			</v-btn>
		</div>

		<!-- Bottom Sheet for Actions -->
		<v-bottom-sheet v-model="showActions" inset>
			<v-card>
				<v-card-text>
					<slot name="actions" />
				</v-card-text>
			</v-card>
		</v-bottom-sheet>
	</div>
</template>

<script>
import { ref, computed } from 'vue';
import { usePosType } from '../composables/types/usePosType';
import { useCart } from '../services/cart/CartService';
import ItemGrid from '../components/items/ItemGrid.vue';
import CategoryNav from '../components/base/CategoryNav.vue';
import SearchBar from '../components/base/SearchBar.vue';

export default {
	name: 'MobileLayout',
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
	emits: ['item-selected', 'category-selected', 'search', 'navigate'],
	setup(props, { emit }) {
		const { posTypeName, categoryNavigationStyle, itemCardLayout } = usePosType();
		const cart = useCart();

		const showDrawer = ref(false);
		const showSearch = ref(false);
		const showCart = ref(false);
		const showActions = ref(false);
		const showCategories = ref(true);
		const searchQuery = ref('');
		const selectedCategory = ref(null);

		// Cart items count
		const cartItemsCount = computed(() => cart.items.length);

		// Category mode
		const categoryMode = computed(() => {
			return categoryNavigationStyle.value || 'tabs';
		});

		// Filtered items
		const filteredItems = computed(() => {
			let items = props.items;

			// Filter by category
			if (selectedCategory.value) {
				items = items.filter(item => item.item_group === selectedCategory.value);
			}

			// Filter by search
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
			'cart-visible': showCart.value,
		}));

		/**
		 * Handle item selection
		 */
		const handleItemSelect = (item) => {
			emit('item-selected', item);
			
			// Show cart after adding item
			showCart.value = true;
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
			showDrawer.value = false;
		};

		return {
			posTypeName,
			showDrawer,
			showSearch,
			showCart,
			showActions,
			showCategories,
			searchQuery,
			cartItemsCount,
			categoryMode,
			itemCardLayout,
			filteredItems,
			layoutClasses,
			handleItemSelect,
			handleCategorySelect,
			handleSearch,
			navigateTo,
		};
	},
};
</script>

<style scoped>
.mobile-layout {
	display: flex;
	flex-direction: column;
	height: 100vh;
	width: 100vw;
	overflow: hidden;
}

.mobile-app-bar {
	border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.mobile-main {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.items-view,
.cart-view {
	height: 100%;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.category-section {
	flex-shrink: 0;
	border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
	background: rgb(var(--v-theme-surface));
}

.items-section {
	flex: 1;
	overflow-y: auto;
	-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

.search-results {
	padding: 16px;
	overflow-y: auto;
	height: calc(100vh - 64px);
}

/* Floating Action Buttons */
.bottom-actions {
	position: fixed;
	bottom: 24px;
	right: 24px;
	z-index: 100;
}

.cart-fab,
.back-fab {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

/* Safe area for notched devices */
@supports (padding: env(safe-area-inset-bottom)) {
	.bottom-actions {
		bottom: calc(24px + env(safe-area-inset-bottom));
	}
}

/* Slide transitions */
.items-view,
.cart-view {
	transition: transform 0.3s ease;
}

.mobile-layout.cart-visible .items-view {
	transform: translateX(-100%);
}

/* Pull to refresh indicator */
.items-section {
	overscroll-behavior-y: contain;
}
</style>

