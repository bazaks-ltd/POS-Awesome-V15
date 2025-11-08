/**
 * useLayoutAdapter - Map POS Type + Device to optimal layout
 * Dynamically loads the right layout component based on configuration
 */

import { computed, markRaw } from 'vue';
import { usePosType } from './usePosType';
import { useDeviceDetection } from './useDeviceDetection';

// Import all layouts
import MobileLayout from '../../layouts/MobileLayout.vue';
import TabletLayout from '../../layouts/TabletLayout.vue';
import DesktopLayout from '../../layouts/DesktopLayout.vue';

// Import type-specific layouts (lazy loaded)
const GroceryMobileLayout = () => import('../../components/types/grocery/GroceryLayout.vue');
const PharmacyLayout = () => import('../../components/types/pharmacy/PharmacyLayout.vue');
const ServiceLayout = () => import('../../components/types/service/ServiceLayout.vue');

/**
 * POS Type layout registry
 * Maps POS types to device-specific layout components
 */
const posTypeLayouts = {
	'Grocery Store': {
		mobile: GroceryMobileLayout,
		tablet: TabletLayout, // Can be customized per type
		desktop: DesktopLayout,
	},
	'Pharmacy': {
		mobile: PharmacyLayout,
		tablet: PharmacyLayout,
		desktop: PharmacyLayout,
	},
	'Service & Spa': {
		mobile: ServiceLayout,
		tablet: ServiceLayout,
		desktop: ServiceLayout,
	},
	'Retail': {
		mobile: MobileLayout,
		tablet: TabletLayout,
		desktop: DesktopLayout,
	},
	// Default fallback
	'default': {
		mobile: MobileLayout,
		tablet: TabletLayout,
		desktop: DesktopLayout,
	},
};

export function useLayoutAdapter() {
	const { posTypeName, layoutMode } = usePosType();
	const { deviceType, isMobile, isTablet, isDesktop } = useDeviceDetection();

	/**
	 * Get current layout component
	 * @returns {Component} - Vue component for current layout
	 */
	const currentLayoutComponent = computed(() => {
		const typeName = posTypeName.value || 'default';
		const device = deviceType.value;

		// Get layouts for this POS type
		const typeLayouts = posTypeLayouts[typeName] || posTypeLayouts['default'];

		// Get layout for current device
		let layout = typeLayouts[device] || typeLayouts['desktop'];

		// Handle special layout modes
		if (layoutMode.value === 'Single Hand' && isMobile.value) {
			// Use specialized single-hand layout
			layout = () => import('../../layouts/SingleHandLayout.vue');
		}

		return markRaw(layout);
	});

	/**
	 * Get layout configuration
	 * @returns {Object} - Layout metadata
	 */
	const layoutConfig = computed(() => {
		const baseConfig = {
			device: deviceType.value,
			mode: layoutMode.value,
			posType: posTypeName.value,
		};

		// Device-specific defaults
		if (isMobile.value) {
			return {
				...baseConfig,
				columns: 1,
				showDrawer: false,
				useBottomSheets: true,
				compactMode: true,
			};
		} else if (isTablet.value) {
			return {
				...baseConfig,
				columns: 2,
				showDrawer: true,
				useBottomSheets: false,
				compactMode: false,
			};
		} else {
			return {
				...baseConfig,
				columns: 3,
				showDrawer: true,
				useBottomSheets: false,
				compactMode: false,
			};
		}
	});

	/**
	 * Check if layout supports feature
	 * @param {String} feature - Feature name
	 * @returns {Boolean} - True if supported
	 */
	const supportsFeature = (feature) => {
		const features = {
			'split_screen': !isMobile.value,
			'rail_drawer': isDesktop.value,
			'bottom_sheets': isMobile.value,
			'floating_actions': isMobile.value,
			'quick_actions_panel': isDesktop.value,
			'expandable_panels': isTablet.value || isDesktop.value,
		};

		return features[feature] || false;
	};

	/**
	 * Register custom layout for POS type
	 * @param {String} posType - POS type name
	 * @param {Object} layouts - Layout components { mobile, tablet, desktop }
	 */
	const registerLayout = (posType, layouts) => {
		posTypeLayouts[posType] = {
			mobile: layouts.mobile || MobileLayout,
			tablet: layouts.tablet || TabletLayout,
			desktop: layouts.desktop || DesktopLayout,
		};
	};

	/**
	 * Get layout for specific POS type and device
	 * @param {String} posType - POS type name
	 * @param {String} device - Device type
	 * @returns {Component} - Layout component
	 */
	const getLayout = (posType, device) => {
		const typeLayouts = posTypeLayouts[posType] || posTypeLayouts['default'];
		return markRaw(typeLayouts[device] || typeLayouts['desktop']);
	};

	return {
		// Computed
		currentLayoutComponent,
		layoutConfig,

		// Methods
		supportsFeature,
		registerLayout,
		getLayout,

		// Device flags (re-exported for convenience)
		isMobile,
		isTablet,
		isDesktop,
	};
}

/**
 * Layout transition helper
 * Provides smooth transitions between layouts
 */
export function useLayoutTransition() {
	const transitionName = computed(() => {
		return 'layout-fade';
	});

	const transitionMode = computed(() => {
		return 'out-in';
	});

	return {
		transitionName,
		transitionMode,
	};
}

