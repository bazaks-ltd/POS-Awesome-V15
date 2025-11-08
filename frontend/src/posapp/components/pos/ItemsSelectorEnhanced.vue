<template>
	<div class="items-selector-enhanced" :style="responsiveStyles">
		<v-card class="selection-card pos-card" :class="cardClasses">
			<v-progress-linear
				:active="loading"
				:indeterminate="loading"
				absolute
				location="top"
				color="info"
			></v-progress-linear>

			<div class="card-content">
				<!-- Header with Search -->
				<div class="sticky-header">
					<SearchBar
						v-model="searchQuery"
						:placeholder="__('Search Items')"
						:loading="loading"
						@search="handleSearch"
						@clear="handleClearSearch"
					/>

					<!-- View toggle and filters -->
					<div class="header-actions mt-2">
						<v-btn-toggle
							v-model="itemsView"
							mandatory
							density="compact"
							variant="outlined"
						>
							<v-btn value="grid" icon="mdi-view-grid"></v-btn>
							<v-btn value="list" icon="mdi-view-list"></v-btn>
						</v-btn-toggle>

						<v-spacer></v-spacer>

						<!-- Rendering mode toggle (for testing) -->
						<v-switch
							v-if="showDebugOptions"
							v-model="useNewRenderer"
							:label="__('New Renderer')"
							density="compact"
							hide-details
							class="ml-2"
						></v-switch>
					</div>

					<!-- Category Navigation -->
					<div v-if="showCategoryNav" class="category-nav-section mt-2">
						<CategoryNav
							:mode="categoryMode"
							:categories="categories"
							@category-selected="handleCategorySelect"
							@filters-changed="handleFiltersChanged"
						/>
					</div>
				</div>

				<!-- Items Display -->
				<div class="items-display">
					<!-- Grid View -->
					<div v-if="itemsView === 'grid'" class="grid-view">
						<!-- New ItemGrid (CSS Grid based) -->
						<ItemGrid
							v-if="useNewRenderer"
							:items="displayedItems"
							:loading="loading"
							:item-card-layout="itemCardLayout"
							:min-item-width="minItemWidth"
							@item-selected="handleItemClick"
						>
							<template #item="{ item }">
								<ItemCard
									:item="item"
									:layout="itemCardLayout"
									@click="handleItemClick(item)"
									@quick-add="handleQuickAdd(item)"
									@toggle-favorite="handleToggleFavorite(item)"
								/>
							</template>
						</ItemGrid>

						<!-- Original RecycleScroller (fallback) -->
						<div v-else class="original-grid">
							<slot name="original-grid">
								<!-- Original grid rendering would go here -->
								<p class="text-center pa-4">Original RecycleScroller rendering</p>
							</slot>
						</div>
					</div>

					<!-- List View -->
					<div v-else class="list-view">
						<v-data-table-virtual
							:headers="tableHeaders"
							:items="displayedItems"
							:loading="loading"
							class="items-table"
							item-key="item_code"
							@click:row="handleItemClick"
						>
							<template #item.image="{ item }">
								<v-avatar size="40">
									<v-img v-if="item.image" :src="item.image" />
									<v-icon v-else>mdi-package-variant</v-icon>
								</v-avatar>
							</template>

							<template #item.rate="{ item }">
								{{ formatCurrency(item.rate || item.standard_rate) }}
							</template>

							<template #item.actual_qty="{ item }">
								<v-chip
									:color="getStockColor(item.actual_qty)"
									size="small"
								>
									{{ item.actual_qty || 0 }}
								</v-chip>
							</template>

							<template #item.actions="{ item }">
								<v-btn
									icon="mdi-plus"
									size="small"
									color="primary"
									variant="text"
									@click.stop="handleQuickAdd(item)"
								></v-btn>
							</template>
						</v-data-table-virtual>
					</div>
				</div>
			</div>
		</v-card>
	</div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { usePosType } from '../../composables/types/usePosType.js';
import { useDeviceDetection } from '../../composables/types/useDeviceDetection.js';
import { useItemGrouping } from '../../composables/types/useItemGrouping.js';
import { useResponsive } from '../../composables/useResponsive.js';

// Import new components
import ItemGrid from '../items/ItemGrid.vue';
import ItemCard from '../base/ItemCard.vue';
import CategoryNav from '../base/CategoryNav.vue';
import SearchBar from '../base/SearchBar.vue';

export default {
	name: 'ItemsSelectorEnhanced',
	components: {
		ItemGrid,
		ItemCard,
		CategoryNav,
		SearchBar,
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
	},
	emits: ['item-selected', 'item-added', 'category-selected'],
	setup(props, { emit }) {
		const responsive = useResponsive();
		const { itemCardLayout, categoryNavigationStyle } = usePosType();
		const { isMobile, itemsPerRow } = useDeviceDetection();
		const {
			filteredItems,
			searchQuery,
			setSearchQuery,
			selectCategory,
			clearFilters,
		} = useItemGrouping(computed(() => props.items));

		// State
		const useNewRenderer = ref(true); // Set to true to use new system
		const showDebugOptions = ref(false); // Show debug toggle
		const itemsView = ref('grid');
		const showCategoryNav = ref(true);

		// Computed
		const categoryMode = computed(() => {
			return categoryNavigationStyle.value || 'quick_filters';
		});

		const displayedItems = computed(() => {
			return filteredItems.value;
		});

		const minItemWidth = computed(() => {
			if (isMobile.value) return 160;
			return 200;
		});

		const cardClasses = computed(() => ({
			'mobile-card': isMobile.value,
			'new-renderer': useNewRenderer.value,
		}));

		// Table headers for list view
		const tableHeaders = ref([
			{ title: '', key: 'image', sortable: false, width: 60 },
			{ title: 'Item', key: 'item_name', sortable: true },
			{ title: 'Price', key: 'rate', sortable: true },
			{ title: 'Stock', key: 'actual_qty', sortable: true },
			{ title: '', key: 'actions', sortable: false, width: 60 },
		]);

		/**
		 * Handle search
		 */
		const handleSearch = (query) => {
			setSearchQuery(query);
		};

		/**
		 * Handle clear search
		 */
		const handleClearSearch = () => {
			setSearchQuery('');
		};

		/**
		 * Handle category selection
		 */
		const handleCategorySelect = (category) => {
			selectCategory(category);
			emit('category-selected', category);
		};

		/**
		 * Handle filters changed
		 */
		const handleFiltersChanged = (filters) => {
			// Filters are applied automatically by useItemGrouping
		};

		/**
		 * Handle item click
		 */
		const handleItemClick = (item) => {
			emit('item-selected', item);
		};

		/**
		 * Handle quick add
		 */
		const handleQuickAdd = (item) => {
			emit('item-added', { item, qty: 1 });
		};

		/**
		 * Handle toggle favorite
		 */
		const handleToggleFavorite = (item) => {
			// TODO: Implement favorites
			console.log('Toggle favorite:', item.item_code);
		};

		/**
		 * Get stock color
		 */
		const getStockColor = (qty) => {
			if (qty <= 0) return 'error';
			if (qty < 10) return 'warning';
			return 'success';
		};

		/**
		 * Format currency
		 */
		const formatCurrency = (amount) => {
			return window.format_currency ? window.format_currency(amount) : `$${amount?.toFixed(2)}`;
		};

		return {
			...responsive,
			useNewRenderer,
			showDebugOptions,
			itemsView,
			showCategoryNav,
			searchQuery,
			categoryMode,
			itemCardLayout,
			displayedItems,
			minItemWidth,
			cardClasses,
			tableHeaders,
			handleSearch,
			handleClearSearch,
			handleCategorySelect,
			handleFiltersChanged,
			handleItemClick,
			handleQuickAdd,
			handleToggleFavorite,
			getStockColor,
			formatCurrency,
		};
	},
};
</script>

<style scoped>
.items-selector-enhanced {
	height: 100%;
	width: 100%;
}

.selection-card {
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.card-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.sticky-header {
	flex-shrink: 0;
	padding: 16px;
	border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
	background: rgb(var(--v-theme-surface));
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.category-nav-section {
	max-height: 200px;
	overflow-y: auto;
}

.items-display {
	flex: 1;
	overflow: hidden;
}

.grid-view,
.list-view {
	height: 100%;
	overflow-y: auto;
}

.items-table {
	height: 100%;
}

/* Mobile adjustments */
.mobile-card .sticky-header {
	padding: 12px;
}
</style>

