<template>
	<v-btn
		:class="buttonClasses"
		:color="color"
		:variant="variant"
		:size="computedSize"
		:icon="iconOnly"
		:block="block"
		:loading="loading"
		:disabled="disabled"
		:height="computedHeight"
		:min-width="computedMinWidth"
		@click="handleClick"
		@touchstart="handleTouchStart"
		@touchend="handleTouchEnd"
	>
		<v-icon v-if="icon && !iconOnly" :start="!iconOnly">{{ icon }}</v-icon>
		<v-icon v-else-if="icon && iconOnly">{{ icon }}</v-icon>
		<span v-if="!iconOnly"><slot /></span>
	</v-btn>
</template>

<script>
import { computed, ref } from 'vue';
import { useDeviceDetection } from '../../composables/types/useDeviceDetection';

export default {
	name: 'ActionButton',
	props: {
		icon: {
			type: String,
			default: null,
		},
		iconOnly: {
			type: Boolean,
			default: false,
		},
		color: {
			type: String,
			default: 'primary',
		},
		variant: {
			type: String,
			default: 'elevated',
		},
		size: {
			type: String,
			default: 'default',
		},
		block: {
			type: Boolean,
			default: false,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		touchOptimized: {
			type: Boolean,
			default: true,
		},
		hapticFeedback: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['click'],
	setup(props, { emit }) {
		const { isMobile, touchTargetSize, touchCapable } = useDeviceDetection();
		const isTouching = ref(false);

		// Computed size based on device
		const computedSize = computed(() => {
			if (props.size !== 'default') return props.size;
			
			if (props.touchOptimized && touchCapable.value) {
				return isMobile.value ? 'large' : 'default';
			}
			
			return 'default';
		});

		// Computed height for touch optimization
		const computedHeight = computed(() => {
			if (!props.touchOptimized || !touchCapable.value) return undefined;
			
			return touchTargetSize.value;
		});

		// Computed min width for touch optimization
		const computedMinWidth = computed(() => {
			if (!props.touchOptimized || !touchCapable.value || props.iconOnly) return undefined;
			
			return touchTargetSize.value;
		});

		// Button classes
		const buttonClasses = computed(() => ({
			'action-button': true,
			'touch-optimized': props.touchOptimized && touchCapable.value,
			'is-touching': isTouching.value,
			'mobile-button': isMobile.value,
		}));

		/**
		 * Trigger haptic feedback (if supported)
		 */
		const triggerHaptic = () => {
			if (!props.hapticFeedback) return;

			try {
				if (navigator.vibrate) {
					navigator.vibrate(10); // 10ms vibration
				}
			} catch (error) {
				// Silently fail if not supported
			}
		};

		/**
		 * Handle click
		 */
		const handleClick = (event) => {
			if (props.disabled || props.loading) return;

			triggerHaptic();
			emit('click', event);
		};

		/**
		 * Handle touch start
		 */
		const handleTouchStart = () => {
			isTouching.value = true;
		};

		/**
		 * Handle touch end
		 */
		const handleTouchEnd = () => {
			isTouching.value = false;
		};

		return {
			buttonClasses,
			computedSize,
			computedHeight,
			computedMinWidth,
			handleClick,
			handleTouchStart,
			handleTouchEnd,
		};
	},
};
</script>

<style scoped>
.action-button {
	transition: all 0.2s ease;
	user-select: none;
	-webkit-tap-highlight-color: transparent;
}

.touch-optimized {
	/* Ensure proper touch target size */
	padding: 12px 16px;
}

.touch-optimized.v-btn--icon {
	/* Icon buttons maintain aspect ratio */
	padding: 12px;
}

.is-touching {
	transform: scale(0.95);
}

.mobile-button {
	font-size: 1rem;
	font-weight: 500;
}

/* Active state for better feedback */
.action-button:active {
	transform: scale(0.97);
}

/* Disabled state */
.action-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

/* Ensure sufficient spacing for touch */
.touch-optimized + .touch-optimized {
	margin-left: 8px;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
	.action-button {
		transition: none;
	}
	
	.is-touching,
	.action-button:active {
		transform: none;
	}
}
</style>

