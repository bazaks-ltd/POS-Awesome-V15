/**
 * useItemGrouping - Dynamic item grouping and filtering based on POS type
 * Handles category hierarchies, quick filters, and search
 */

import { ref, computed, watch } from 'vue';
import { usePosType } from './usePosType';

export function useItemGrouping(allItems) {
	const { categoryNavigationStyle, getUIConfig } = usePosType();

	const selectedCategories = ref([]);
	const selectedFilters = ref([]);
	const searchQuery = ref('');
	const sortBy = ref('name'); // name, price, stock
	const sortOrder = ref('asc'); // asc, desc
	const categoryHierarchy = ref([]);

	/**
	 * Get unique categories from items
	 * @returns {Array} - List of categories
	 */
	const categories = computed(() => {
		if (!allItems.value || allItems.value.length === 0) return [];

		const categoryMap = new Map();

		allItems.value.forEach(item => {
			if (item.item_group && !categoryMap.has(item.item_group)) {
				categoryMap.set(item.item_group, {
					name: item.item_group,
					item_group_name: item.item_group,
					parent_item_group: item.parent_item_group || null,
					icon: getCategoryIcon(item.item_group),
					count: 0,
				});
			}
		});

		// Count items per category
		allItems.value.forEach(item => {
			if (item.item_group && categoryMap.has(item.item_group)) {
				categoryMap.get(item.item_group).count++;
			}
		});

		return Array.from(categoryMap.values());
	});

	/**
	 * Get filtered items based on selections
	 * @returns {Array} - Filtered items
	 */
	const filteredItems = computed(() => {
		if (!allItems.value) return [];

		let items = [...allItems.value];

		// Filter by categories
		if (selectedCategories.value.length > 0) {
			items = items.filter(item => 
				selectedCategories.value.includes(item.item_group)
			);
		}

		// Filter by additional filters (brand, tags, etc.)
		if (selectedFilters.value.length > 0) {
			items = items.filter(item => {
				return selectedFilters.value.some(filter => {
					// Check various filterable fields
					return item.brand === filter ||
					       item.tags?.includes(filter) ||
					       item.item_group === filter;
				});
			});
		}

		// Filter by search query
		if (searchQuery.value) {
			const query = searchQuery.value.toLowerCase();
			items = items.filter(item => 
				item.item_name?.toLowerCase().includes(query) ||
				item.item_code?.toLowerCase().includes(query) ||
				item.barcode?.toLowerCase().includes(query) ||
				item.plu_code?.includes(query) ||
				item.description?.toLowerCase().includes(query)
			);
		}

		// Sort items
		items = sortItems(items);

		return items;
	});

	/**
	 * Sort items based on current sort settings
	 * @param {Array} items - Items to sort
	 * @returns {Array} - Sorted items
	 */
	const sortItems = (items) => {
		const sorted = [...items];

		sorted.sort((a, b) => {
			let aVal, bVal;

			switch (sortBy.value) {
				case 'name':
					aVal = a.item_name || a.item_code;
					bVal = b.item_name || b.item_code;
					break;
				case 'price':
					aVal = a.rate || a.standard_rate || 0;
					bVal = b.rate || b.standard_rate || 0;
					break;
				case 'stock':
					aVal = a.actual_qty || 0;
					bVal = b.actual_qty || 0;
					break;
				default:
					return 0;
			}

			const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
			return sortOrder.value === 'asc' ? comparison : -comparison;
		});

		return sorted;
	};

	/**
	 * Get category icon based on name
	 * @param {String} categoryName - Category name
	 * @returns {String} - Material Design Icon name
	 */
	const getCategoryIcon = (categoryName) => {
		const iconMap = {
			// Grocery
			'Produce': 'mdi-fruit-pineapple',
			'Fruits': 'mdi-food-apple',
			'Vegetables': 'mdi-carrot',
			'Dairy': 'mdi-cheese',
			'Meat': 'mdi-food-steak',
			'Bakery': 'mdi-bread-slice',
			'Beverages': 'mdi-cup',
			'Snacks': 'mdi-food',
			'Frozen': 'mdi-snowflake',
			
			// Pharmacy
			'Medicines': 'mdi-pill',
			'Supplements': 'mdi-medication',
			'Medical Devices': 'mdi-medical-bag',
			'Personal Care': 'mdi-face-woman',
			
			// Service
			'Services': 'mdi-hand-heart',
			'Treatments': 'mdi-spa',
			'Packages': 'mdi-package-variant',
			
			// Default
			'default': 'mdi-folder',
		};

		return iconMap[categoryName] || iconMap['default'];
	};

	/**
	 * Select category
	 * @param {String|Array} category - Category or categories
	 */
	const selectCategory = (category) => {
		if (Array.isArray(category)) {
			selectedCategories.value = category;
		} else {
			const navStyle = categoryNavigationStyle.value;
			
			if (navStyle === 'quick_filters') {
				// Multi-select for quick filters
				const index = selectedCategories.value.indexOf(category);
				if (index > -1) {
					selectedCategories.value.splice(index, 1);
				} else {
					selectedCategories.value.push(category);
				}
			} else {
				// Single select for tree/tabs
				selectedCategories.value = category ? [category] : [];
			}
		}
	};

	/**
	 * Clear all categories
	 */
	const clearCategories = () => {
		selectedCategories.value = [];
	};

	/**
	 * Set search query
	 * @param {String} query - Search query
	 */
	const setSearchQuery = (query) => {
		searchQuery.value = query || '';
	};

	/**
	 * Clear search
	 */
	const clearSearch = () => {
		searchQuery.value = '';
	};

	/**
	 * Set sort criteria
	 * @param {String} field - Field to sort by
	 * @param {String} order - Sort order (asc/desc)
	 */
	const setSorting = (field, order = 'asc') => {
		sortBy.value = field;
		sortOrder.value = order;
	};

	/**
	 * Toggle sort order
	 */
	const toggleSortOrder = () => {
		sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
	};

	/**
	 * Add filter
	 * @param {String} filter - Filter value
	 */
	const addFilter = (filter) => {
		if (!selectedFilters.value.includes(filter)) {
			selectedFilters.value.push(filter);
		}
	};

	/**
	 * Remove filter
	 * @param {String} filter - Filter value
	 */
	const removeFilter = (filter) => {
		const index = selectedFilters.value.indexOf(filter);
		if (index > -1) {
			selectedFilters.value.splice(index, 1);
		}
	};

	/**
	 * Clear all filters
	 */
	const clearFilters = () => {
		selectedFilters.value = [];
		selectedCategories.value = [];
		searchQuery.value = '';
	};

	/**
	 * Get grouped items (by category)
	 * @returns {Object} - Items grouped by category
	 */
	const groupedItems = computed(() => {
		const groups = {};

		filteredItems.value.forEach(item => {
			const group = item.item_group || 'Uncategorized';
			if (!groups[group]) {
				groups[group] = [];
			}
			groups[group].push(item);
		});

		return groups;
	});

	/**
	 * Get item count per category
	 * @returns {Object} - Category counts
	 */
	const categoryCounts = computed(() => {
		const counts = {};

		allItems.value.forEach(item => {
			const cat = item.item_group || 'Uncategorized';
			counts[cat] = (counts[cat] || 0) + 1;
		});

		return counts;
	});

	/**
	 * Check if any filters are active
	 * @returns {Boolean} - True if filters active
	 */
	const hasActiveFilters = computed(() => {
		return selectedCategories.value.length > 0 ||
		       selectedFilters.value.length > 0 ||
		       searchQuery.value !== '';
	});

	/**
	 * Get filter summary
	 * @returns {Object} - Filter summary
	 */
	const filterSummary = computed(() => {
		return {
			totalItems: allItems.value.length,
			filteredItems: filteredItems.value.length,
			categories: selectedCategories.value.length,
			filters: selectedFilters.value.length,
			hasSearch: searchQuery.value !== '',
		};
	});

	return {
		// State
		selectedCategories,
		selectedFilters,
		searchQuery,
		sortBy,
		sortOrder,

		// Computed
		categories,
		filteredItems,
		groupedItems,
		categoryCounts,
		hasActiveFilters,
		filterSummary,

		// Methods
		selectCategory,
		clearCategories,
		setSearchQuery,
		clearSearch,
		setSorting,
		toggleSortOrder,
		addFilter,
		removeFilter,
		clearFilters,
	};
}

/**
 * useQuickFilters - Preset filter configurations
 * @param {Array} items - Items to filter
 * @returns {Object} - Quick filter utilities
 */
export function useQuickFilters(items) {
	const quickFilters = ref([]);

	/**
	 * Generate quick filters based on items
	 */
	const generateQuickFilters = () => {
		const filters = [];

		// Popular categories
		const categoryCount = {};
		items.value.forEach(item => {
			const cat = item.item_group;
			categoryCount[cat] = (categoryCount[cat] || 0) + 1;
		});

		// Top 5 categories
		const topCategories = Object.entries(categoryCount)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([name, count]) => ({
				type: 'category',
				name,
				label: name,
				count,
				icon: 'mdi-folder',
			}));

		filters.push(...topCategories);

		// Stock filters
		filters.push(
			{ type: 'stock', name: 'in_stock', label: 'In Stock', icon: 'mdi-check-circle' },
			{ type: 'stock', name: 'low_stock', label: 'Low Stock', icon: 'mdi-alert-circle' },
			{ type: 'stock', name: 'out_of_stock', label: 'Out of Stock', icon: 'mdi-close-circle' }
		);

		// Price filters
		filters.push(
			{ type: 'price', name: 'discounted', label: 'On Sale', icon: 'mdi-tag-percent' },
			{ type: 'price', name: 'premium', label: 'Premium', icon: 'mdi-star' }
		);

		quickFilters.value = filters;
	};

	/**
	 * Apply quick filter
	 * @param {Object} filter - Filter to apply
	 * @param {Function} filterFn - Filter function to update
	 */
	const applyQuickFilter = (filter, filterFn) => {
		let predicate = () => true;

		if (filter.type === 'stock') {
			if (filter.name === 'in_stock') {
				predicate = item => item.actual_qty > 0;
			} else if (filter.name === 'low_stock') {
				predicate = item => item.actual_qty > 0 && item.actual_qty < 10;
			} else if (filter.name === 'out_of_stock') {
				predicate = item => item.actual_qty <= 0;
			}
		} else if (filter.type === 'price') {
			if (filter.name === 'discounted') {
				predicate = item => item.mrp && item.rate < item.mrp;
			} else if (filter.name === 'premium') {
				predicate = item => item.rate > 100; // Configurable threshold
			}
		} else if (filter.type === 'category') {
			predicate = item => item.item_group === filter.name;
		}

		filterFn(predicate);
	};

	// Auto-generate filters when items change
	watch(() => items.value, () => {
		if (items.value && items.value.length > 0) {
			generateQuickFilters();
		}
	}, { immediate: true });

	return {
		quickFilters,
		generateQuickFilters,
		applyQuickFilter,
	};
}

