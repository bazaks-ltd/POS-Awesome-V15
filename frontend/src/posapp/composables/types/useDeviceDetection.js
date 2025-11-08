/**
 * useDeviceDetection - Detect device type and capabilities
 * Provides device-aware layout and interaction modes
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';

const deviceType = ref('desktop');
const orientation = ref('landscape');
const screenWidth = ref(window.innerWidth);
const screenHeight = ref(window.innerHeight);
const touchCapable = ref('ontouchstart' in window);
const pixelRatio = ref(window.devicePixelRatio || 1);
const deviceOverride = ref(null);

export function useDeviceDetection() {
	let resizeObserver = null;

	/**
	 * Detect device type based on screen width
	 */
	const detectDeviceType = () => {
		// Check for override first
		if (deviceOverride.value) {
			deviceType.value = deviceOverride.value;
			return;
		}

		const width = screenWidth.value;

		if (width < 640) {
			deviceType.value = 'mobile';
		} else if (width < 1024) {
			deviceType.value = 'tablet';
		} else {
			deviceType.value = 'desktop';
		}
	};

	/**
	 * Detect screen orientation
	 */
	const detectOrientation = () => {
		orientation.value = screenWidth.value > screenHeight.value ? 'landscape' : 'portrait';
	};

	/**
	 * Handle window resize
	 */
	const handleResize = () => {
		screenWidth.value = window.innerWidth;
		screenHeight.value = window.innerHeight;
		detectDeviceType();
		detectOrientation();
	};

	/**
	 * Set device override (from POS Profile setting)
	 * @param {String} device - Device type (mobile, tablet, desktop, auto)
	 */
	const setDeviceOverride = (device) => {
		if (device === 'auto' || device === 'Auto' || !device) {
			deviceOverride.value = null;
		} else {
			deviceOverride.value = device.toLowerCase();
		}
		detectDeviceType();
	};

	/**
	 * Check if device is mobile
	 * @returns {Boolean}
	 */
	const isMobile = computed(() => deviceType.value === 'mobile');

	/**
	 * Check if device is tablet
	 * @returns {Boolean}
	 */
	const isTablet = computed(() => deviceType.value === 'tablet');

	/**
	 * Check if device is desktop
	 * @returns {Boolean}
	 */
	const isDesktop = computed(() => deviceType.value === 'desktop');

	/**
	 * Check if in portrait mode
	 * @returns {Boolean}
	 */
	const isPortrait = computed(() => orientation.value === 'portrait');

	/**
	 * Check if in landscape mode
	 * @returns {Boolean}
	 */
	const isLandscape = computed(() => orientation.value === 'landscape');

	/**
	 * Get optimal touch target size
	 * @returns {Number} - Touch target size in pixels
	 */
	const touchTargetSize = computed(() => {
		if (isMobile.value) return 48;
		if (isTablet.value) return 44;
		return 40;
	});

	/**
	 * Get optimal font scale
	 * @returns {Number} - Font scale multiplier
	 */
	const fontScale = computed(() => {
		if (isMobile.value) return 1.1;
		if (isTablet.value) return 1.05;
		return 1;
	});

	/**
	 * Get items per row based on device
	 * @returns {Number} - Number of items per row
	 */
	const itemsPerRow = computed(() => {
		if (isMobile.value) return isPortrait.value ? 2 : 3;
		if (isTablet.value) return isPortrait.value ? 3 : 4;
		return 4;
	});

	/**
	 * Get columns for layout
	 * @returns {Number} - Number of columns
	 */
	const layoutColumns = computed(() => {
		if (isMobile.value) return 1;
		if (isTablet.value) return 2;
		return 3;
	});

	/**
	 * Check if should use bottom sheets instead of dialogs
	 * @returns {Boolean}
	 */
	const useBottomSheets = computed(() => {
		return isMobile.value || (isTablet.value && isPortrait.value);
	});

	/**
	 * Check if should use compact mode
	 * @returns {Boolean}
	 */
	const useCompactMode = computed(() => {
		return isMobile.value || screenWidth.value < 768;
	});

	/**
	 * Get device info object
	 * @returns {Object} - Complete device information
	 */
	const deviceInfo = computed(() => ({
		type: deviceType.value,
		orientation: orientation.value,
		width: screenWidth.value,
		height: screenHeight.value,
		touchCapable: touchCapable.value,
		pixelRatio: pixelRatio.value,
		isMobile: isMobile.value,
		isTablet: isTablet.value,
		isDesktop: isDesktop.value,
		isPortrait: isPortrait.value,
		isLandscape: isLandscape.value,
		touchTargetSize: touchTargetSize.value,
		fontScale: fontScale.value,
		itemsPerRow: itemsPerRow.value,
		layoutColumns: layoutColumns.value,
		useBottomSheets: useBottomSheets.value,
		useCompactMode: useCompactMode.value,
	}));

	/**
	 * Check if single-hand mode would be beneficial
	 * @returns {Boolean}
	 */
	const suggestSingleHandMode = computed(() => {
		return isMobile.value && isPortrait.value && screenHeight.value > 600;
	});

	/**
	 * Get viewport dimensions
	 * @returns {Object} - Viewport dimensions
	 */
	const viewport = computed(() => ({
		width: screenWidth.value,
		height: screenHeight.value,
		availableHeight: screenHeight.value - 64, // Subtract navbar height
	}));

	/**
	 * Initialize device detection
	 */
	onMounted(() => {
		detectDeviceType();
		detectOrientation();

		// Listen to resize events
		window.addEventListener('resize', handleResize);

		// Listen to orientation change
		window.addEventListener('orientationchange', handleResize);
	});

	/**
	 * Cleanup
	 */
	onUnmounted(() => {
		window.removeEventListener('resize', handleResize);
		window.removeEventListener('orientationchange', handleResize);
		
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
	});

	return {
		// State
		deviceType,
		orientation,
		screenWidth,
		screenHeight,
		touchCapable,
		pixelRatio,

		// Methods
		setDeviceOverride,

		// Computed
		isMobile,
		isTablet,
		isDesktop,
		isPortrait,
		isLandscape,
		touchTargetSize,
		fontScale,
		itemsPerRow,
		layoutColumns,
		useBottomSheets,
		useCompactMode,
		deviceInfo,
		suggestSingleHandMode,
		viewport,
	};
}

