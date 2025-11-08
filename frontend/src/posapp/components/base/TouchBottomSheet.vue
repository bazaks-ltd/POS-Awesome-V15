<template>
	<v-bottom-sheet
		v-model="isOpen"
		:inset="inset"
		:persistent="persistent"
		:max-width="maxWidth"
		:class="sheetClasses"
		@update:model-value="handleUpdate"
	>
		<v-card class="bottom-sheet-card" :style="cardStyles">
			<!-- Handle Bar for swipe indication -->
			<div v-if="showHandle" class="sheet-handle" @touchstart="handleDragStart" @touchmove="handleDragMove" @touchend="handleDragEnd">
				<div class="handle-bar"></div>
			</div>

			<!-- Header -->
			<v-card-title v-if="title || $slots.title" class="sheet-header">
				<slot name="title">
					<div class="d-flex align-center w-100">
						<v-icon v-if="icon" class="mr-2">{{ icon }}</v-icon>
						<span>{{ title }}</span>
						<v-spacer></v-spacer>
						<v-btn
							v-if="showCloseButton"
							icon="mdi-close"
							variant="text"
							size="small"
							@click="close"
						></v-btn>
					</div>
				</slot>
			</v-card-title>

			<v-divider v-if="title || $slots.title"></v-divider>

			<!-- Content -->
			<v-card-text
				ref="contentRef"
				class="sheet-content"
				:style="contentStyles"
			>
				<slot />
			</v-card-text>

			<!-- Actions -->
			<v-card-actions v-if="$slots.actions" class="sheet-actions">
				<slot name="actions" :close="close" />
			</v-card-actions>
		</v-card>
	</v-bottom-sheet>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
	name: 'TouchBottomSheet',
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			default: '',
		},
		icon: {
			type: String,
			default: null,
		},
		inset: {
			type: Boolean,
			default: false,
		},
		persistent: {
			type: Boolean,
			default: false,
		},
		maxWidth: {
			type: [String, Number],
			default: 600,
		},
		maxHeight: {
			type: [String, Number],
			default: '90vh',
		},
		showHandle: {
			type: Boolean,
			default: true,
		},
		showCloseButton: {
			type: Boolean,
			default: true,
		},
		swipeToClose: {
			type: Boolean,
			default: true,
		},
		snapPoints: {
			type: Array,
			default: () => [0.5, 0.9], // 50% and 90% of screen height
		},
	},
	emits: ['update:model-value', 'close', 'open'],
	setup(props, { emit }) {
		const isOpen = ref(props.modelValue);
		const contentRef = ref(null);
		const isDragging = ref(false);
		const dragStartY = ref(0);
		const dragCurrentY = ref(0);
		const currentSnapPoint = ref(1); // Start at highest snap point

		// Sync with parent
		watch(() => props.modelValue, (newValue) => {
			isOpen.value = newValue;
			if (newValue) {
				emit('open');
			}
		});

		// Card styles
		const cardStyles = computed(() => ({
			maxHeight: props.maxHeight,
			transition: isDragging.value ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
		}));

		// Content styles with dynamic height
		const contentStyles = computed(() => {
			let height = '100%';
			
			if (isDragging.value) {
				const dragDelta = dragCurrentY.value - dragStartY.value;
				const heightPercent = 90 - (dragDelta / window.innerHeight) * 100;
				height = `${Math.max(20, Math.min(90, heightPercent))}vh`;
			} else {
				const snapPercent = props.snapPoints[currentSnapPoint.value] * 100;
				height = `${snapPercent}vh`;
			}

			return {
				maxHeight: height,
				overflowY: 'auto',
			};
		});

		// Sheet classes
		const sheetClasses = computed(() => ({
			'dragging': isDragging.value,
		}));

		/**
		 * Handle drag start
		 */
		const handleDragStart = (event) => {
			if (!props.swipeToClose) return;
			
			isDragging.value = true;
			dragStartY.value = event.touches[0].clientY;
			dragCurrentY.value = dragStartY.value;
		};

		/**
		 * Handle drag move
		 */
		const handleDragMove = (event) => {
			if (!isDragging.value) return;
			
			dragCurrentY.value = event.touches[0].clientY;

			// Prevent scrolling while dragging
			if (dragCurrentY.value > dragStartY.value) {
				event.preventDefault();
			}
		};

		/**
		 * Handle drag end
		 */
		const handleDragEnd = () => {
			if (!isDragging.value) return;

			const dragDistance = dragCurrentY.value - dragStartY.value;
			const dragThreshold = window.innerHeight * 0.2; // 20% of screen height

			if (dragDistance > dragThreshold) {
				// Swiped down enough to close
				close();
			} else {
				// Snap to nearest snap point
				const dragPercent = dragDistance / window.innerHeight;
				const currentHeightPercent = props.snapPoints[currentSnapPoint.value] - dragPercent;

				// Find nearest snap point
				let nearestPoint = 0;
				let minDiff = Infinity;

				props.snapPoints.forEach((point, index) => {
					const diff = Math.abs(point - currentHeightPercent);
					if (diff < minDiff) {
						minDiff = diff;
						nearestPoint = index;
					}
				});

				currentSnapPoint.value = nearestPoint;
			}

			isDragging.value = false;
		};

		/**
		 * Close the bottom sheet
		 */
		const close = () => {
			isOpen.value = false;
			emit('update:model-value', false);
			emit('close');
		};

		/**
		 * Open the bottom sheet
		 */
		const open = () => {
			isOpen.value = true;
			emit('update:model-value', true);
			emit('open');
		};

		/**
		 * Handle model value update
		 */
		const handleUpdate = (value) => {
			emit('update:model-value', value);
			if (!value) {
				emit('close');
			}
		};

		/**
		 * Snap to specific point
		 * @param {Number} pointIndex - Index in snapPoints array
		 */
		const snapTo = (pointIndex) => {
			if (pointIndex >= 0 && pointIndex < props.snapPoints.length) {
				currentSnapPoint.value = pointIndex;
			}
		};

		/**
		 * Expand to full height
		 */
		const expand = () => {
			snapTo(props.snapPoints.length - 1);
		};

		/**
		 * Collapse to minimum height
		 */
		const collapse = () => {
			snapTo(0);
		};

		return {
			isOpen,
			contentRef,
			cardStyles,
			contentStyles,
			sheetClasses,
			handleDragStart,
			handleDragMove,
			handleDragEnd,
			handleUpdate,
			close,
			open,
			snapTo,
			expand,
			collapse,
		};
	},
};
</script>

<style scoped>
.bottom-sheet-card {
	border-radius: 16px 16px 0 0 !important;
	overflow: hidden;
}

.sheet-handle {
	padding: 12px 0 4px;
	cursor: grab;
	touch-action: none;
	display: flex;
	justify-content: center;
}

.sheet-handle:active {
	cursor: grabbing;
}

.handle-bar {
	width: 40px;
	height: 4px;
	background: rgba(var(--v-theme-on-surface), 0.3);
	border-radius: 2px;
}

.sheet-header {
	padding: 12px 16px;
}

.sheet-content {
	padding: 16px;
	-webkit-overflow-scrolling: touch;
}

.sheet-actions {
	padding: 12px 16px;
	border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* Dragging state */
.dragging .bottom-sheet-card {
	transition: none !important;
}

/* Smooth transitions */
:deep(.v-overlay__content) {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
</style>

