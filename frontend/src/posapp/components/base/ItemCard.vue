<template>
	<v-card
		class="item-card"
		:class="cardClasses"
		:elevation="elevation"
		:ripple="touchCapable"
		@click="handleClick"
		@contextmenu.prevent="handleLongPress"
	>
		<!-- Item Image -->
		<div v-if="showImage" class="item-image-container">
			<v-img
				v-if="item.image"
				:src="item.image"
				:aspect-ratio="imageAspectRatio"
				cover
				class="item-image"
			>
				<template #placeholder>
					<v-skeleton-loader type="image"></v-skeleton-loader>
				</template>
			</v-img>
			<div v-else class="placeholder-image">
				<v-icon size="48" color="grey-lighten-1">mdi-package-variant</v-icon>
			</div>

			<!-- Stock badge -->
			<v-chip
				v-if="showStock"
				class="stock-badge"
				:color="stockColor"
				size="small"
				variant="flat"
			>
				{{ formatNumber(item.actual_qty || 0) }} {{ item.stock_uom }}
			</v-chip>

			<!-- Discount badge -->
			<v-chip
				v-if="hasDiscount"
				class="discount-badge"
				color="error"
				size="small"
				variant="flat"
			>
				-{{ discountPercent }}%
			</v-chip>
		</div>

		<v-card-text class="item-content" :class="{ 'pa-2': useCompactMode }">
			<!-- Item Name -->
			<div class="item-name" :class="nameClasses">
				{{ item.item_name || item.item_code }}
			</div>

			<!-- Item Code (if different from name) -->
			<div v-if="showItemCode && item.item_code !== item.item_name" class="item-code">
				{{ item.item_code }}
			</div>

			<!-- Description -->
			<div v-if="showDescription && item.description" class="item-description">
				{{ truncatedDescription }}
			</div>

			<!-- PLU Code -->
			<div v-if="showPLU && item.plu_code" class="item-plu">
				<v-icon size="small" class="mr-1">mdi-numeric</v-icon>
				PLU: {{ item.plu_code }}
			</div>

			<!-- Price -->
			<div v-if="showPrice" class="item-price">
				<span class="current-price">{{ formatCurrency(item.rate || item.standard_rate) }}</span>
				<span v-if="item.mrp && item.mrp > item.rate" class="original-price">
					{{ formatCurrency(item.mrp) }}
				</span>
				<span v-if="showUnitPrice && item.is_weighted_item" class="unit-price">
					/ {{ item.stock_uom }}
				</span>
			</div>

			<!-- Weight display for weighted items -->
			<div v-if="showWeight && item.is_weighted_item" class="item-weight">
				<v-icon size="small" class="mr-1">mdi-weight</v-icon>
				{{ __("Weighed Item") }}
			</div>

			<!-- Expiry date (pharmacy) -->
			<div v-if="showExpiry && item.expiry_date" class="item-expiry">
				<v-icon size="small" class="mr-1">mdi-calendar-clock</v-icon>
				Exp: {{ formatDate(item.expiry_date) }}
			</div>

			<!-- Additional info -->
			<div v-if="layout.show_additional_info && additionalInfo" class="item-additional">
				{{ additionalInfo }}
			</div>
		</v-card-text>

		<!-- Quick Actions -->
		<v-card-actions v-if="showQuickActions" class="item-actions pa-2">
			<v-btn
				icon="mdi-plus-circle"
				size="small"
				color="primary"
				variant="tonal"
				@click.stop="handleQuickAdd"
			></v-btn>

			<v-spacer></v-spacer>

			<v-btn
				v-if="canFavorite"
				:icon="isFavorite ? 'mdi-heart' : 'mdi-heart-outline'"
				size="small"
				:color="isFavorite ? 'error' : 'default'"
				variant="text"
				@click.stop="toggleFavorite"
			></v-btn>

			<v-btn
				icon="mdi-information-outline"
				size="small"
				variant="text"
				@click.stop="handleInfo"
			></v-btn>
		</v-card-actions>
	</v-card>
</template>

<script>
import { computed } from 'vue';
import { useDeviceDetection } from '../../composables/types/useDeviceDetection';

export default {
	name: 'ItemCard',
	props: {
		item: {
			type: Object,
			required: true,
		},
		layout: {
			type: Object,
			default: () => ({
				show_image: true,
				show_stock: true,
				show_price: true,
				show_description: false,
				show_item_code: false,
				show_plu: false,
				show_weight: false,
				show_unit_price: false,
				show_expiry: false,
				card_size: 'medium',
				show_quick_actions: false,
			}),
		},
		elevation: {
			type: [Number, String],
			default: 2,
		},
		canFavorite: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['click', 'quick-add', 'toggle-favorite', 'info', 'long-press'],
	setup(props, { emit }) {
		const { isMobile, useCompactMode, touchCapable } = useDeviceDetection();

		// Layout configuration
		const showImage = computed(() => props.layout.show_image !== false);
		const showStock = computed(() => props.layout.show_stock !== false);
		const showPrice = computed(() => props.layout.show_price !== false);
		const showDescription = computed(() => props.layout.show_description === true);
		const showItemCode = computed(() => props.layout.show_item_code === true);
		const showPLU = computed(() => props.layout.show_plu === true);
		const showWeight = computed(() => props.layout.show_weight === true);
		const showUnitPrice = computed(() => props.layout.show_unit_price === true);
		const showExpiry = computed(() => props.layout.show_expiry === true);
		const showQuickActions = computed(() => props.layout.show_quick_actions === true);

		// Card classes
		const cardClasses = computed(() => ({
			'card-small': props.layout.card_size === 'small',
			'card-large': props.layout.card_size === 'large',
			'card-compact': useCompactMode.value,
			'card-mobile': isMobile.value,
			'out-of-stock': props.item.actual_qty <= 0,
		}));

		const nameClasses = computed(() => ({
			'text-h6': props.layout.card_size === 'large',
			'text-subtitle-2': props.layout.card_size === 'medium',
			'text-caption': props.layout.card_size === 'small',
		}));

		// Stock color
		const stockColor = computed(() => {
			const qty = props.item.actual_qty || 0;
			if (qty <= 0) return 'error';
			if (qty < 10) return 'warning';
			return 'success';
		});

		// Discount calculation
		const hasDiscount = computed(() => {
			return props.item.mrp && props.item.rate < props.item.mrp;
		});

		const discountPercent = computed(() => {
			if (!hasDiscount.value) return 0;
			return Math.round(((props.item.mrp - props.item.rate) / props.item.mrp) * 100);
		});

		// Truncated description
		const truncatedDescription = computed(() => {
			if (!props.item.description) return '';
			const maxLength = props.layout.card_size === 'large' ? 100 : 50;
			return props.item.description.length > maxLength
				? props.item.description.substring(0, maxLength) + '...'
				: props.item.description;
		});

		// Additional info
		const additionalInfo = computed(() => {
			// Customizable per POS type
			return '';
		});

		// Image aspect ratio
		const imageAspectRatio = computed(() => {
			if (props.layout.card_size === 'small') return 1;
			if (props.layout.card_size === 'large') return 4 / 3;
			return 16 / 9;
		});

		// Favorite status (would come from store/service)
		const isFavorite = computed(() => {
			// TODO: Check from favorites service
			return false;
		});

		// Event handlers
		const handleClick = () => {
			emit('click', props.item);
		};

		const handleQuickAdd = () => {
			emit('quick-add', props.item);
		};

		const toggleFavorite = () => {
			emit('toggle-favorite', props.item);
		};

		const handleInfo = () => {
			emit('info', props.item);
		};

		const handleLongPress = () => {
			emit('long-press', props.item);
		};

		// Utility functions
		const formatCurrency = (amount) => {
			return window.format_currency ? window.format_currency(amount) : amount;
		};

		const formatNumber = (number) => {
			return window.format_number ? window.format_number(number, 2) : number;
		};

		const formatDate = (date) => {
			return window.frappe?.datetime?.str_to_user ? 
				window.frappe.datetime.str_to_user(date) : date;
		};

		return {
			// Layout flags
			showImage,
			showStock,
			showPrice,
			showDescription,
			showItemCode,
			showPLU,
			showWeight,
			showUnitPrice,
			showExpiry,
			showQuickActions,

			// Classes
			cardClasses,
			nameClasses,
			touchCapable,
			useCompactMode,

			// Computed values
			stockColor,
			hasDiscount,
			discountPercent,
			truncatedDescription,
			additionalInfo,
			imageAspectRatio,
			isFavorite,

			// Methods
			handleClick,
			handleQuickAdd,
			toggleFavorite,
			handleInfo,
			handleLongPress,
			formatCurrency,
			formatNumber,
			formatDate,
		};
	},
};
</script>

<style scoped>
.item-card {
	cursor: pointer;
	transition: all 0.2s ease;
	user-select: none;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.item-card:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.item-card.out-of-stock {
	opacity: 0.6;
}

.item-image-container {
	position: relative;
	width: 100%;
}

.placeholder-image {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 150px;
	background: rgba(var(--v-theme-surface-variant), 0.5);
}

.stock-badge {
	position: absolute;
	top: 8px;
	right: 8px;
	z-index: 1;
}

.discount-badge {
	position: absolute;
	top: 8px;
	left: 8px;
	z-index: 1;
	font-weight: bold;
}

.item-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.item-name {
	font-weight: 500;
	line-height: 1.2;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.item-code {
	font-size: 0.75rem;
	color: rgba(var(--v-theme-on-surface), 0.6);
}

.item-description {
	font-size: 0.8rem;
	color: rgba(var(--v-theme-on-surface), 0.7);
	line-height: 1.3;
}

.item-plu {
	font-size: 0.8rem;
	color: rgb(var(--v-theme-primary));
	display: flex;
	align-items: center;
}

.item-price {
	display: flex;
	align-items: baseline;
	gap: 8px;
	margin-top: auto;
}

.current-price {
	font-size: 1.1rem;
	font-weight: 600;
	color: rgb(var(--v-theme-primary));
}

.original-price {
	font-size: 0.9rem;
	text-decoration: line-through;
	color: rgba(var(--v-theme-on-surface), 0.5);
}

.unit-price {
	font-size: 0.8rem;
	color: rgba(var(--v-theme-on-surface), 0.6);
}

.item-weight,
.item-expiry,
.item-additional {
	font-size: 0.75rem;
	color: rgba(var(--v-theme-on-surface), 0.6);
	display: flex;
	align-items: center;
}

.item-actions {
	border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* Card size variations */
.card-small .item-name {
	font-size: 0.875rem;
}

.card-small .current-price {
	font-size: 0.95rem;
}

.card-large .placeholder-image {
	min-height: 200px;
}

/* Compact mode */
.card-compact .item-content {
	gap: 2px;
}

/* Mobile optimizations */
.card-mobile {
	min-height: 120px;
}

.card-mobile .item-name {
	font-size: 0.9rem;
}

/* Touch feedback */
.item-card:active {
	transform: scale(0.98);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
	.item-card {
		transition: none;
	}
}
</style>

