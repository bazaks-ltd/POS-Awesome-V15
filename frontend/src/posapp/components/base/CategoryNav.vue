<template>
	<div class="category-nav" :class="navClasses">
		<!-- Tree Mode -->
		<div v-if="mode === 'tree'" class="tree-mode">
			<!-- Breadcrumbs -->
			<v-breadcrumbs v-if="breadcrumbs.length > 0" :items="breadcrumbItems" class="pa-2">
				<template #divider>
					<v-icon>mdi-chevron-right</v-icon>
				</template>
			</v-breadcrumbs>

			<!-- Tree View -->
			<v-treeview
				:items="treeItems"
				:active="[activeCategory]"
				:open="openCategories"
				item-value="name"
				item-title="title"
				activatable
				open-on-click
				density="compact"
				@update:active="handleCategorySelect"
			>
				<template #prepend="{ item }">
					<v-icon>{{ item.icon || 'mdi-folder' }}</v-icon>
				</template>
			</v-treeview>
		</div>

		<!-- Quick Filters Mode -->
		<div v-else-if="mode === 'quick_filters'" class="quick-filters-mode">
			<div class="filters-container">
				<v-chip-group
					v-model="selectedFilters"
					multiple
					column
					@update:model-value="handleFiltersChange"
				>
					<v-chip
						v-for="filter in filters"
						:key="filter.name"
						:value="filter.name"
						filter
						variant="outlined"
						:prepend-icon="filter.icon"
					>
						{{ filter.title }}
					</v-chip>
				</v-chip-group>

				<!-- Clear button -->
				<v-btn
					v-if="selectedFilters.length > 0"
					variant="text"
					size="small"
					@click="clearFilters"
				>
					<v-icon start>mdi-close-circle</v-icon>
					{{ __("Clear All") }}
				</v-btn>
			</div>
		</div>

		<!-- Tabs Mode -->
		<div v-else-if="mode === 'tabs'" class="tabs-mode">
			<v-tabs
				v-model="activeTab"
				:direction="tabDirection"
				show-arrows
				@update:model-value="handleTabChange"
			>
				<v-tab
					v-for="tab in tabs"
					:key="tab.name"
					:value="tab.name"
				>
					<v-icon v-if="tab.icon" start>{{ tab.icon }}</v-icon>
					{{ tab.title }}
				</v-tab>
			</v-tabs>

			<!-- Tab content (subcategories if any) -->
			<div v-if="currentTabSubcategories.length > 0" class="tab-subcategories">
				<v-chip-group
					v-model="selectedSubcategory"
					mandatory
					selected-class="text-primary"
					@update:model-value="handleSubcategoryChange"
				>
					<v-chip
						v-for="sub in currentTabSubcategories"
						:key="sub.name"
						:value="sub.name"
						variant="outlined"
					>
						{{ sub.title }}
					</v-chip>
				</v-chip-group>
			</div>
		</div>

		<!-- Hybrid Mode (combines tabs + filters) -->
		<div v-else-if="mode === 'hybrid'" class="hybrid-mode">
			<!-- Top level tabs -->
			<v-tabs
				v-model="activeTab"
				show-arrows
				class="mb-2"
				@update:model-value="handleTabChange"
			>
				<v-tab
					v-for="tab in tabs"
					:key="tab.name"
					:value="tab.name"
				>
					<v-icon v-if="tab.icon" start>{{ tab.icon }}</v-icon>
					{{ tab.title }}
				</v-tab>
			</v-tabs>

			<!-- Second level filters -->
			<div v-if="currentTabFilters.length > 0" class="hybrid-filters">
				<v-chip-group
					v-model="selectedFilters"
					multiple
					@update:model-value="handleFiltersChange"
				>
					<v-chip
						v-for="filter in currentTabFilters"
						:key="filter.name"
						:value="filter.name"
						filter
						variant="outlined"
						size="small"
					>
						{{ filter.title }}
					</v-chip>
				</v-chip-group>
			</div>
		</div>
	</div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useDeviceDetection } from '../../composables/types/useDeviceDetection';

export default {
	name: 'CategoryNav',
	props: {
		mode: {
			type: String,
			default: 'tabs',
			validator: (value) => ['tree', 'quick_filters', 'tabs', 'hybrid'].includes(value),
		},
		categories: {
			type: Array,
			default: () => [],
		},
		value: {
			type: [String, Array],
			default: null,
		},
	},
	emits: ['update:value', 'category-selected', 'filters-changed'],
	setup(props, { emit }) {
		const { isMobile } = useDeviceDetection();

		// Tree mode state
		const activeCategory = ref(props.value);
		const openCategories = ref([]);
		const breadcrumbs = ref([]);

		// Quick filters state
		const selectedFilters = ref([]);

		// Tabs mode state
		const activeTab = ref(null);
		const selectedSubcategory = ref(null);

		// Build tree items from flat categories
		const treeItems = computed(() => {
			return buildTreeStructure(props.categories);
		});

		// Filters list
		const filters = computed(() => {
			return props.categories.filter(cat => !cat.parent_item_group);
		});

		// Tabs list
		const tabs = computed(() => {
			return props.categories.filter(cat => !cat.parent_item_group);
		});

		// Current tab's subcategories
		const currentTabSubcategories = computed(() => {
			if (!activeTab.value) return [];
			return props.categories.filter(cat => cat.parent_item_group === activeTab.value);
		});

		// Current tab's filters (for hybrid mode)
		const currentTabFilters = computed(() => {
			if (!activeTab.value) return [];
			const tab = tabs.value.find(t => t.name === activeTab.value);
			return tab?.filters || currentTabSubcategories.value;
		});

		// Breadcrumb items for tree mode
		const breadcrumbItems = computed(() => {
			return breadcrumbs.value.map(crumb => ({
				title: crumb.title,
				disabled: false,
				to: null,
			}));
		});

		// Tab direction (vertical on mobile)
		const tabDirection = computed(() => {
			return isMobile.value ? 'vertical' : 'horizontal';
		});

		// Nav classes
		const navClasses = computed(() => ({
			'mobile-nav': isMobile.value,
			[`mode-${props.mode}`]: true,
		}));

		/**
		 * Build tree structure from flat array
		 */
		function buildTreeStructure(categories) {
			const map = {};
			const roots = [];

			// Create map
			categories.forEach(cat => {
				map[cat.name] = {
					...cat,
					title: cat.item_group_name || cat.name,
					children: [],
				};
			});

			// Build tree
			categories.forEach(cat => {
				if (cat.parent_item_group && map[cat.parent_item_group]) {
					map[cat.parent_item_group].children.push(map[cat.name]);
				} else {
					roots.push(map[cat.name]);
				}
			});

			return roots;
		}

		/**
		 * Update breadcrumbs for tree navigation
		 */
		function updateBreadcrumbs(categoryName) {
			const category = props.categories.find(c => c.name === categoryName);
			if (!category) return;

			const path = [];
			let current = category;

			while (current) {
				path.unshift({
					name: current.name,
					title: current.item_group_name || current.name,
				});
				current = props.categories.find(c => c.name === current.parent_item_group);
			}

			breadcrumbs.value = path;
		}

		/**
		 * Handle category selection (tree mode)
		 */
		const handleCategorySelect = (selected) => {
			if (selected.length > 0) {
				activeCategory.value = selected[0];
				updateBreadcrumbs(selected[0]);
				emit('update:value', selected[0]);
				emit('category-selected', selected[0]);
			}
		};

		/**
		 * Handle filters change (quick filters mode)
		 */
		const handleFiltersChange = (filters) => {
			emit('update:value', filters);
			emit('filters-changed', filters);
		};

		/**
		 * Clear all filters
		 */
		const clearFilters = () => {
			selectedFilters.value = [];
			emit('update:value', []);
			emit('filters-changed', []);
		};

		/**
		 * Handle tab change
		 */
		const handleTabChange = (tab) => {
			activeTab.value = tab;
			selectedSubcategory.value = null;
			emit('update:value', tab);
			emit('category-selected', tab);
		};

		/**
		 * Handle subcategory change
		 */
		const handleSubcategoryChange = (subcategory) => {
			emit('update:value', subcategory);
			emit('category-selected', subcategory);
		};

		// Initialize
		watch(() => props.value, (newValue) => {
			if (props.mode === 'tree') {
				activeCategory.value = newValue;
				if (newValue) updateBreadcrumbs(newValue);
			} else if (props.mode === 'tabs' || props.mode === 'hybrid') {
				activeTab.value = newValue;
			}
		}, { immediate: true });

		// Set first tab as active if none selected
		watch(() => tabs.value, (newTabs) => {
			if (newTabs.length > 0 && !activeTab.value) {
				activeTab.value = newTabs[0].name;
			}
		}, { immediate: true });

		return {
			// State
			activeCategory,
			openCategories,
			breadcrumbs,
			selectedFilters,
			activeTab,
			selectedSubcategory,

			// Computed
			treeItems,
			filters,
			tabs,
			currentTabSubcategories,
			currentTabFilters,
			breadcrumbItems,
			tabDirection,
			navClasses,

			// Methods
			handleCategorySelect,
			handleFiltersChange,
			clearFilters,
			handleTabChange,
			handleSubcategoryChange,
		};
	},
};
</script>

<style scoped>
.category-nav {
	width: 100%;
	height: 100%;
}

/* Tree Mode */
.tree-mode {
	overflow-y: auto;
	height: 100%;
}

/* Quick Filters Mode */
.quick-filters-mode {
	padding: 16px;
}

.filters-container {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

/* Tabs Mode */
.tabs-mode {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.tab-subcategories {
	padding: 12px;
	border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
	overflow-x: auto;
}

/* Hybrid Mode */
.hybrid-mode {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.hybrid-filters {
	padding: 12px;
	border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
	overflow-x: auto;
}

/* Mobile adjustments */
.mobile-nav.mode-tabs :deep(.v-tabs) {
	flex-direction: column;
}

.mobile-nav .tab-subcategories,
.mobile-nav .hybrid-filters {
	padding: 8px;
}

/* Scrollbar styling */
.tree-mode::-webkit-scrollbar,
.tab-subcategories::-webkit-scrollbar,
.hybrid-filters::-webkit-scrollbar {
	height: 6px;
	width: 6px;
}

.tree-mode::-webkit-scrollbar-track,
.tab-subcategories::-webkit-scrollbar-track,
.hybrid-filters::-webkit-scrollbar-track {
	background: transparent;
}

.tree-mode::-webkit-scrollbar-thumb,
.tab-subcategories::-webkit-scrollbar-thumb,
.hybrid-filters::-webkit-scrollbar-thumb {
	background: rgba(var(--v-theme-outline), 0.3);
	border-radius: 3px;
}
</style>

