<template>
	<div ref="gridContainer" class="item-grid-container" :class="containerClasses">
		<!-- Loading skeleton -->
		<div v-if="loading && displayedItems.length === 0" class="grid-skeleton">
			<div v-for="n in skeletonCount" :key="`skeleton-${n}`" class="skeleton-item">
				<v-skeleton-loader type="card"></v-skeleton-loader>
			</div>
		</div>

		<!-- Item Grid -->
		<div
			v-else
			class="item-grid"
			:style="gridStyles"
		>
			<div
				v-for="item in displayedItems"
				:key="item.item_code"
				class="grid-item"
				:style="itemStyles"
			>
				<slot name="item" :item="item">
					<!-- Default item card if no slot provided -->
					<ItemCard
						:item="item"
						:layout="itemCardLayout"
						@click="$emit('item-selected', item)"
					/>
				</slot>
			</div>

			<!-- Infinite scroll sentinel -->
			<div
				v-if="hasMore"
				ref="sentinelElement"
				class="scroll-sentinel"
			></div>
		</div>

		<!-- Loading indicator -->
		<div v-if="loadingMore" class="loading-more">
			<v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
			<span class="ml-2">{{ __("Loading more items...") }}</span>
		</div>

		<!-- No items message -->
		<div v-if="!loading && displayedItems.length === 0" class="no-items">
			<v-icon size="64" color="grey-lighten-1">mdi-package-variant-closed</v-icon>
			<div class="text-h6 mt-4">{{ noItemsMessage }}</div>
		</div>
	</div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useInfiniteScroll } from '../../composables/useInfiniteScroll';
import { useDeviceDetection } from '../../composables/types/useDeviceDetection';
import { usePosType } from '../../composables/types/usePosType';
import ItemCard from '../base/ItemCard.vue';

export default {
	name: 'ItemGrid',
	components: {
		ItemCard,
	},
	props: {
		items: {
			type: Array,
			default: () => [],
		},
		loading: {
			type: Boolean,
			default: false,
		},
		itemCardLayout: {
			type: Object,
			default: () => ({}),
		},
		noItemsMessage: {
			type: String,
			default: () => frappe._('No items found'),
		},
		minItemWidth: {
			type: Number,
			default: 200,
		},
		gap: {
			type: Number,
			default: 16,
		},
		loadIncrement: {
			type: Number,
			default: 20,
		},
	},
	emits: ['item-selected', 'load-more'],
	setup(props, { emit }) {
		const gridContainer = ref(null);
		const { itemsPerRow, isMobile, useCompactMode } = useDeviceDetection();
		const { getUIConfig } = usePosType();

		// Infinite scroll setup
		const {
			displayedItems,
			loading: loadingMore,
			hasMore,
			sentinelElement,
			initialize,
			setupObserver,
			updateItems,
		} = useInfiniteScroll({
			loadIncrement: props.loadIncrement,
			loadMore: () => emit('load-more'),
		});

		// Initialize with items
		watch(() => props.items, (newItems) => {
			if (newItems) {
				updateItems(newItems);
			}
		}, { immediate: true });

		// Setup observer after mount
		onMounted(async () => {
			await nextTick();
			setupObserver();
		});

		// Grid configuration
		const columnsPerRow = computed(() => {
			const uiConfig = getUIConfig('item_card_layout');
			if (uiConfig?.columns) return uiConfig.columns;
			return itemsPerRow.value;
		});

		const gridStyles = computed(() => {
			return {
				display: 'grid',
				gridTemplateColumns: `repeat(auto-fill, minmax(${props.minItemWidth}px, 1fr))`,
				gap: `${props.gap}px`,
				width: '100%',
			};
		});

		const itemStyles = computed(() => {
			return {
				contentVisibility: 'auto', // Native lazy rendering
				containIntrinsicSize: 'auto 250px', // Estimated height for content-visibility
			};
		});

		const containerClasses = computed(() => ({
			'compact-mode': useCompactMode.value,
			'mobile-view': isMobile.value,
		}));

		const skeletonCount = computed(() => {
			return columnsPerRow.value * 3; // 3 rows of skeletons
		});

		return {
			gridContainer,
			displayedItems,
			loadingMore,
			hasMore,
			sentinelElement,
			gridStyles,
			itemStyles,
			containerClasses,
			skeletonCount,
		};
	},
};
</script>

<style scoped>
.item-grid-container {
	width: 100%;
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	/* Enable smooth scrolling */
	scroll-behavior: smooth;
	/* Hardware acceleration */
	transform: translateZ(0);
	will-change: scroll-position;
}

.item-grid {
	width: 100%;
	min-height: 100%;
}

.grid-item {
	/* Use content-visibility for automatic lazy rendering */
	content-visibility: auto;
	/* Prevent layout shift */
	contain: layout style paint;
	/* Smooth transitions */
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.grid-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.grid-item:active {
	transform: translateY(0);
}

.grid-skeleton {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 16px;
	width: 100%;
}

.skeleton-item {
	height: 250px;
}

.scroll-sentinel {
	grid-column: 1 / -1;
	height: 20px;
	/* Invisible but observable */
	visibility: hidden;
}

.loading-more {
	grid-column: 1 / -1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
}

.no-items {
	grid-column: 1 / -1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	text-align: center;
	color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Compact mode adjustments */
.compact-mode .item-grid-container {
	padding: 8px;
}

.compact-mode .item-grid {
	gap: 8px;
}

/* Mobile optimizations */
.mobile-view .item-grid-container {
	padding: 12px;
}

.mobile-view .grid-item {
	/* Larger touch targets on mobile */
	min-height: 120px;
}

/* Performance optimizations */
@media (prefers-reduced-motion: reduce) {
	.grid-item {
		transition: none;
	}
	
	.item-grid-container {
		scroll-behavior: auto;
	}
}

/* Ensure good scroll performance */
@supports (content-visibility: auto) {
	.grid-item {
		content-visibility: auto;
		contain-intrinsic-size: auto 250px;
	}
}
</style>

