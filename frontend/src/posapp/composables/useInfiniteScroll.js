/**
 * useInfiniteScroll - Progressive loading with Intersection Observer
 * Replaces virtual scrolling with native lazy loading
 */

import { ref, onMounted, onUnmounted } from 'vue';

export function useInfiniteScroll(options = {}) {
	const {
		loadMore,
		threshold = 0.8,
		rootMargin = '200px',
		initialLoad = 20,
		loadIncrement = 20,
		maxItems = Infinity,
	} = options;

	const displayedItems = ref([]);
	const allItems = ref([]);
	const loading = ref(false);
	const hasMore = ref(true);
	const observer = ref(null);
	const sentinelElement = ref(null);

	/**
	 * Initialize with items
	 * @param {Array} items - All available items
	 */
	const initialize = (items) => {
		allItems.value = items || [];
		displayedItems.value = allItems.value.slice(0, initialLoad);
		hasMore.value = displayedItems.value.length < allItems.value.length;
	};

	/**
	 * Load next batch of items
	 */
	const loadNextBatch = async () => {
		if (loading.value || !hasMore.value) return;

		loading.value = true;

		try {
			const currentLength = displayedItems.value.length;
			const nextBatch = allItems.value.slice(
				currentLength,
				currentLength + loadIncrement
			);

			// Simulate async loading (remove in production if not needed)
			await new Promise(resolve => setTimeout(resolve, 10));

			displayedItems.value = [...displayedItems.value, ...nextBatch];
			
			hasMore.value = displayedItems.value.length < allItems.value.length &&
			                displayedItems.value.length < maxItems;

			// Call custom loadMore callback if provided
			if (loadMore && hasMore.value) {
				await loadMore();
			}
		} catch (error) {
			console.error('Failed to load more items:', error);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Setup Intersection Observer
	 */
	const setupObserver = () => {
		if (!sentinelElement.value) return;

		const options = {
			root: null, // viewport
			rootMargin,
			threshold,
		};

		observer.value = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !loading.value && hasMore.value) {
					loadNextBatch();
				}
			});
		}, options);

		observer.value.observe(sentinelElement.value);
	};

	/**
	 * Update all items (e.g., after search/filter)
	 * @param {Array} items - New items array
	 */
	const updateItems = (items) => {
		allItems.value = items || [];
		displayedItems.value = allItems.value.slice(0, initialLoad);
		hasMore.value = displayedItems.value.length < allItems.value.length;
	};

	/**
	 * Reset to initial state
	 */
	const reset = () => {
		displayedItems.value = allItems.value.slice(0, initialLoad);
		hasMore.value = displayedItems.value.length < allItems.value.length;
		loading.value = false;
	};

	/**
	 * Scroll to top
	 */
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	/**
	 * Cleanup
	 */
	const cleanup = () => {
		if (observer.value) {
			observer.value.disconnect();
			observer.value = null;
		}
	};

	onUnmounted(() => {
		cleanup();
	});

	return {
		// State
		displayedItems,
		allItems,
		loading,
		hasMore,
		sentinelElement,

		// Methods
		initialize,
		loadNextBatch,
		setupObserver,
		updateItems,
		reset,
		scrollToTop,
		cleanup,
	};
}

/**
 * useVisibilityObserver - Track element visibility for lazy rendering
 * @param {Object} options - Configuration
 * @returns {Object} - Observer utilities
 */
export function useVisibilityObserver(options = {}) {
	const {
		rootMargin = '50px',
		threshold = 0.1,
		onVisible,
		onHidden,
	} = options;

	const visibleElements = ref(new Set());
	const observer = ref(null);

	/**
	 * Setup observer
	 */
	const setupObserver = () => {
		const observerOptions = {
			root: null,
			rootMargin,
			threshold,
		};

		observer.value = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const element = entry.target;
				
				if (entry.isIntersecting) {
					visibleElements.value.add(element);
					if (onVisible) onVisible(element, entry);
				} else {
					visibleElements.value.delete(element);
					if (onHidden) onHidden(element, entry);
				}
			});
		}, observerOptions);
	};

	/**
	 * Observe element
	 * @param {HTMLElement} element - Element to observe
	 */
	const observe = (element) => {
		if (!observer.value) setupObserver();
		if (element) observer.value.observe(element);
	};

	/**
	 * Unobserve element
	 * @param {HTMLElement} element - Element to unobserve
	 */
	const unobserve = (element) => {
		if (observer.value && element) {
			observer.value.unobserve(element);
			visibleElements.value.delete(element);
		}
	};

	/**
	 * Check if element is visible
	 * @param {HTMLElement} element - Element to check
	 * @returns {Boolean} - True if visible
	 */
	const isVisible = (element) => {
		return visibleElements.value.has(element);
	};

	/**
	 * Cleanup
	 */
	const cleanup = () => {
		if (observer.value) {
			observer.value.disconnect();
			observer.value = null;
		}
		visibleElements.value.clear();
	};

	onUnmounted(() => {
		cleanup();
	});

	return {
		visibleElements,
		observe,
		unobserve,
		isVisible,
		cleanup,
	};
}

