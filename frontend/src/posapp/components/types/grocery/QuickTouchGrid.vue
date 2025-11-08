<template>
	<v-card class="quick-touch-grid" elevation="2">
		<v-card-title class="d-flex align-center">
			<v-icon class="mr-2">mdi-grid</v-icon>
			<span>{{ title }}</span>

			<v-spacer></v-spacer>

			<!-- Category selector -->
			<v-menu>
				<template #activator="{ props: menuProps }">
					<v-btn
						variant="tonal"
						size="small"
						v-bind="menuProps"
					>
						{{ currentCategoryName }}
						<v-icon end>mdi-chevron-down</v-icon>
					</v-btn>
				</template>
				<v-list density="compact">
					<v-list-item
						v-for="cat in availableCategories"
						:key="cat.value"
						:value="cat.value"
						@click="selectCategory(cat.value)"
					>
						<template #prepend>
							<v-icon>{{ cat.icon }}</v-icon>
						</template>
						<v-list-item-title>{{ cat.title }}</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</v-card-title>

		<v-divider></v-divider>

		<v-card-text class="grid-container">
			<!-- Quick Touch Grid -->
			<div class="touch-grid" :style="gridStyles">
				<v-card
					v-for="item in gridItems"
					:key="item.item_code"
					class="touch-item"
					:class="{ 'out-of-stock': item.actual_qty <= 0 }"
					:color="item.color"
					@click="handleItemClick(item)"
				>
					<div class="touch-item-content">
						<!-- Item Image or Icon -->
						<div class="item-visual">
							<v-img
								v-if="item.image"
								:src="item.image"
								height="80"
								cover
							/>
							<v-avatar v-else size="80" :color="item.color || 'primary'">
								<v-icon size="48" color="white">
									{{ item.icon || 'mdi-package-variant' }}
								</v-icon>
							</v-avatar>
						</div>

						<!-- Item Info -->
						<div class="item-info">
							<div class="item-name">{{ item.item_name || item.name }}</div>
							<div class="item-price">{{ formatCurrency(item.rate || item.price) }}</div>
							
							<!-- PLU if available -->
							<div v-if="item.plu_code" class="item-plu">
								PLU: {{ item.plu_code }}
							</div>

							<!-- Stock indicator -->
							<v-chip
								v-if="showStock"
								size="x-small"
								:color="getStockColor(item.actual_qty)"
								class="mt-1"
							>
								{{ item.actual_qty || 0 }} {{ item.stock_uom }}
							</v-chip>
						</div>
					</div>

					<!-- Quick Add Badge -->
					<v-btn
						icon="mdi-plus-circle"
						class="quick-add-btn"
						color="primary"
						size="small"
						@click.stop="handleQuickAdd(item)"
					></v-btn>
				</v-card>

				<!-- Empty slots for grid alignment -->
				<div
					v-for="n in emptySlots"
					:key="`empty-${n}`"
					class="empty-slot"
				></div>
			</div>

			<!-- Empty State -->
			<div v-if="gridItems.length === 0" class="empty-state">
				<v-icon size="64" color="grey-lighten-1">mdi-grid-off</v-icon>
				<p class="text-body-1 mt-4">{{ __("No quick access items configured") }}</p>
				<v-btn
					variant="outlined"
					prepend-icon="mdi-cog"
					@click="$emit('configure')"
				>
					{{ __("Configure Quick Items") }}
				</v-btn>
			</div>
		</v-card-text>
	</v-card>
</template>

<script>
import { ref, computed } from 'vue';
import { useDeviceDetection } from '../../../composables/types/useDeviceDetection';

export default {
	name: 'QuickTouchGrid',
	props: {
		title: {
			type: String,
			default: () => frappe._('Quick Access'),
		},
		quickItems: {
			type: Array,
			default: () => [],
		},
		columns: {
			type: Number,
			default: 0, // 0 = auto-calculate
		},
		showStock: {
			type: Boolean,
			default: true,
		},
		categories: {
			type: Array,
			default: () => [
				{ value: 'popular', title: 'Popular', icon: 'mdi-star' },
				{ value: 'produce', title: 'Produce', icon: 'mdi-fruit-pineapple' },
				{ value: 'dairy', title: 'Dairy', icon: 'mdi-cheese' },
				{ value: 'bakery', title: 'Bakery', icon: 'mdi-bread-slice' },
			],
		},
	},
	emits: ['item-selected', 'quick-add', 'configure'],
	setup(props, { emit }) {
		const { isMobile, isTablet, itemsPerRow } = useDeviceDetection();
		const selectedCategory = ref('popular');

		// Available categories
		const availableCategories = computed(() => props.categories);

		// Current category name
		const currentCategoryName = computed(() => {
			const cat = availableCategories.value.find(c => c.value === selectedCategory.value);
			return cat?.title || 'All';
		});

		// Grid columns
		const gridColumns = computed(() => {
			if (props.columns > 0) return props.columns;
			
			if (isMobile.value) return 2;
			if (isTablet.value) return 3;
			return 4;
		});

		// Grid styles
		const gridStyles = computed(() => ({
			gridTemplateColumns: `repeat(${gridColumns.value}, 1fr)`,
		}));

		// Filter items by selected category
		const gridItems = computed(() => {
			let items = props.quickItems;

			// Filter by category if not 'all'
			if (selectedCategory.value && selectedCategory.value !== 'all') {
				items = items.filter(item => 
					item.category === selectedCategory.value ||
					item.item_group?.toLowerCase() === selectedCategory.value
				);
			}

			// Sort by priority or popularity
			return items.sort((a, b) => (b.priority || 0) - (a.priority || 0));
		});

		// Calculate empty slots for grid alignment
		const emptySlots = computed(() => {
			const itemCount = gridItems.value.length;
			const cols = gridColumns.value;
			const remainder = itemCount % cols;
			
			if (remainder === 0) return 0;
			return cols - remainder;
		});

		/**
		 * Select category
		 */
		const selectCategory = (category) => {
			selectedCategory.value = category;
		};

		/**
		 * Handle item click
		 */
		const handleItemClick = (item) => {
			if (item.actual_qty <= 0) {
				frappe.show_alert({
					message: __('Item out of stock'),
					indicator: 'red',
				});
				return;
			}

			emit('item-selected', item);
		};

		/**
		 * Handle quick add (add 1 qty immediately)
		 */
		const handleQuickAdd = (item) => {
			if (item.actual_qty <= 0) {
				frappe.show_alert({
					message: __('Item out of stock'),
					indicator: 'red',
				});
				return;
			}

			emit('quick-add', item);

			// Show visual feedback
			frappe.show_alert({
				message: `${item.item_name} ${__('added')}`,
				indicator: 'green',
			});
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
			return window.format_currency ? window.format_currency(amount) : `$${amount?.toFixed(2) || '0.00'}`;
		};

		return {
			selectedCategory,
			availableCategories,
			currentCategoryName,
			gridColumns,
			gridStyles,
			gridItems,
			emptySlots,
			selectCategory,
			handleItemClick,
			handleQuickAdd,
			getStockColor,
			formatCurrency,
		};
	},
};
</script>

<style scoped>
.quick-touch-grid {
	height: 100%;
	display: flex;
	flex-direction: column;
}

.grid-container {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
}

.touch-grid {
	display: grid;
	gap: 16px;
	width: 100%;
}

.touch-item {
	position: relative;
	cursor: pointer;
	transition: all 0.2s ease;
	min-height: 140px;
	overflow: hidden;
}

.touch-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.touch-item:active {
	transform: scale(0.98);
}

.touch-item.out-of-stock {
	opacity: 0.5;
	cursor: not-allowed;
}

.touch-item-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16px;
	gap: 8px;
	height: 100%;
}

.item-visual {
	flex-shrink: 0;
	margin-bottom: 8px;
}

.item-info {
	text-align: center;
	width: 100%;
}

.item-name {
	font-size: 0.95rem;
	font-weight: 600;
	line-height: 1.2;
	margin-bottom: 4px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.item-price {
	font-size: 1.1rem;
	font-weight: 700;
	color: rgb(var(--v-theme-primary));
	margin-bottom: 4px;
}

.item-plu {
	font-size: 0.75rem;
	opacity: 0.7;
}

.quick-add-btn {
	position: absolute;
	top: 8px;
	right: 8px;
	opacity: 0;
	transition: opacity 0.2s ease;
}

.touch-item:hover .quick-add-btn {
	opacity: 1;
}

/* Always show on touch devices */
@media (hover: none) {
	.quick-add-btn {
		opacity: 1;
	}
}

.empty-slot {
	/* Invisible spacer for grid alignment */
	visibility: hidden;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	text-align: center;
	color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Mobile optimizations */
@media (max-width: 640px) {
	.touch-grid {
		gap: 12px;
	}
	
	.touch-item {
		min-height: 120px;
	}
	
	.touch-item-content {
		padding: 12px;
	}
	
	.item-name {
		font-size: 0.85rem;
	}
}
</style>

