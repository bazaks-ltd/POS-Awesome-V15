/**
 * useTouchGestures - Touch gesture handling
 * Provides swipe, long-press, pinch, and other touch interactions
 */

import { ref, onMounted, onUnmounted } from 'vue';

export function useTouchGestures(element, options = {}) {
	const {
		onSwipeLeft,
		onSwipeRight,
		onSwipeUp,
		onSwipeDown,
		onLongPress,
		onDoubleTap,
		onPinch,
		swipeThreshold = 50,
		longPressDelay = 500,
		doubleTapDelay = 300,
	} = options;

	let touchStartX = 0;
	let touchStartY = 0;
	let touchStartTime = 0;
	let longPressTimer = null;
	let lastTapTime = 0;
	let touchStartDistance = 0;
	let isPinching = false;

	/**
	 * Handle touch start
	 * @param {TouchEvent} event
	 */
	const handleTouchStart = (event) => {
		const touch = event.touches[0];
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		touchStartTime = Date.now();

		// Check for multi-touch (pinch)
		if (event.touches.length === 2) {
			isPinching = true;
			touchStartDistance = getDistance(event.touches[0], event.touches[1]);
		} else {
			isPinching = false;
			
			// Start long press timer
			if (onLongPress) {
				longPressTimer = setTimeout(() => {
					onLongPress(event);
				}, longPressDelay);
			}
		}
	};

	/**
	 * Handle touch move
	 * @param {TouchEvent} event
	 */
	const handleTouchMove = (event) => {
		// Cancel long press if finger moves
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}

		// Handle pinch gesture
		if (isPinching && event.touches.length === 2) {
			const currentDistance = getDistance(event.touches[0], event.touches[1]);
			const scale = currentDistance / touchStartDistance;
			
			if (onPinch) {
				onPinch({
					scale,
					delta: currentDistance - touchStartDistance,
				});
			}
		}
	};

	/**
	 * Handle touch end
	 * @param {TouchEvent} event
	 */
	const handleTouchEnd = (event) => {
		// Clear long press timer
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}

		// Skip swipe detection for pinch
		if (isPinching) {
			isPinching = false;
			return;
		}

		const touch = event.changedTouches[0];
		const touchEndX = touch.clientX;
		const touchEndY = touch.clientY;
		const touchEndTime = Date.now();

		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;
		const deltaTime = touchEndTime - touchStartTime;

		// Detect double tap
		if (deltaTime < doubleTapDelay && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
			const timeSinceLastTap = touchEndTime - lastTapTime;
			
			if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
				onDoubleTap(event);
				lastTapTime = 0; // Reset to prevent triple tap
				return;
			}
			
			lastTapTime = touchEndTime;
		}

		// Detect swipe
		if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				// Horizontal swipe
				if (deltaX > 0 && onSwipeRight) {
					onSwipeRight({ deltaX, deltaY, deltaTime });
				} else if (deltaX < 0 && onSwipeLeft) {
					onSwipeLeft({ deltaX: Math.abs(deltaX), deltaY, deltaTime });
				}
			} else {
				// Vertical swipe
				if (deltaY > 0 && onSwipeDown) {
					onSwipeDown({ deltaX, deltaY, deltaTime });
				} else if (deltaY < 0 && onSwipeUp) {
					onSwipeUp({ deltaX, deltaY: Math.abs(deltaY), deltaTime });
				}
			}
		}
	};

	/**
	 * Get distance between two touch points
	 * @param {Touch} touch1
	 * @param {Touch} touch2
	 * @returns {Number} - Distance
	 */
	const getDistance = (touch1, touch2) => {
		const dx = touch2.clientX - touch1.clientX;
		const dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	};

	/**
	 * Enable touch listeners
	 */
	const enable = () => {
		if (!element.value) return;

		element.value.addEventListener('touchstart', handleTouchStart, { passive: false });
		element.value.addEventListener('touchmove', handleTouchMove, { passive: false });
		element.value.addEventListener('touchend', handleTouchEnd, { passive: false });
	};

	/**
	 * Disable touch listeners
	 */
	const disable = () => {
		if (!element.value) return;

		element.value.removeEventListener('touchstart', handleTouchStart);
		element.value.removeEventListener('touchmove', handleTouchMove);
		element.value.removeEventListener('touchend', handleTouchEnd);

		if (longPressTimer) {
			clearTimeout(longPressTimer);
		}
	};

	onMounted(() => {
		if (element.value) {
			enable();
		}
	});

	onUnmounted(() => {
		disable();
	});

	return {
		enable,
		disable,
	};
}

/**
 * Helper to create swipeable list item
 * @param {Object} options - Configuration
 * @returns {Object} - Swipe helpers
 */
export function useSwipeableItem(options = {}) {
	const {
		onSwipeLeft,
		onSwipeRight,
		threshold = 80,
		maxSwipe = 150,
	} = options;

	const swipeOffset = ref(0);
	const isSwiping = ref(false);
	let startX = 0;

	const handleTouchStart = (event) => {
		startX = event.touches[0].clientX;
		isSwiping.value = true;
	};

	const handleTouchMove = (event) => {
		if (!isSwiping.value) return;

		const currentX = event.touches[0].clientX;
		let offset = currentX - startX;

		// Limit swipe distance
		offset = Math.max(-maxSwipe, Math.min(maxSwipe, offset));
		swipeOffset.value = offset;
	};

	const handleTouchEnd = () => {
		isSwiping.value = false;

		if (Math.abs(swipeOffset.value) > threshold) {
			if (swipeOffset.value < 0 && onSwipeLeft) {
				onSwipeLeft();
			} else if (swipeOffset.value > 0 && onSwipeRight) {
				onSwipeRight();
			}
		}

		// Reset offset
		swipeOffset.value = 0;
	};

	return {
		swipeOffset,
		isSwiping,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
	};
}

