/**
 * POS Types Registry
 * Central configuration for all POS types and their components
 */

// Import base layouts
import MobileLayout from '../layouts/MobileLayout.vue';
import TabletLayout from '../layouts/TabletLayout.vue';
import DesktopLayout from '../layouts/DesktopLayout.vue';

// Lazy load type-specific layouts
const GroceryLayout = () => import('../components/types/grocery/GroceryLayout.vue');
const PharmacyLayout = () => import('../components/types/pharmacy/PharmacyLayout.vue');
const ServiceLayout = () => import('../components/types/service/ServiceLayout.vue');

/**
 * POS Type Definitions
 * Each type specifies its layouts for different devices and configuration
 */
export const posTypes = {
	'Grocery Store': {
		name: 'Grocery Store',
		icon: 'mdi-cart',
		description: 'Fast checkout for grocery stores',
		
		// Device-specific layouts
		layouts: {
			mobile: GroceryLayout,
			tablet: GroceryLayout,
			desktop: GroceryLayout,
		},

		// Default configuration
		config: {
			itemsPerRow: {
				mobile: 2,
				tablet: 3,
				desktop: 4,
			},
			categoryStyle: 'quick_filters',
			touchOptimized: true,
			features: [
				'plu_codes',
				'scale_integration',
				'split_payments',
				'quick_tender',
				'customer_display',
			],
		},

		// Component imports (lazy loaded)
		components: {
			PLUKeypad: () => import('../components/types/grocery/PLUKeypad.vue'),
			ScaleWidget: () => import('../components/types/grocery/ScaleWidget.vue'),
			SplitPayment: () => import('../components/types/grocery/SplitPayment.vue'),
			CustomerDisplay: () => import('../components/types/grocery/CustomerDisplay.vue'),
			QuickTouchGrid: () => import('../components/types/grocery/QuickTouchGrid.vue'),
		},
	},

	'Pharmacy': {
		name: 'Pharmacy',
		icon: 'mdi-medical-bag',
		description: 'Pharmacy POS with prescription management',

		layouts: {
			mobile: PharmacyLayout,
			tablet: PharmacyLayout,
			desktop: PharmacyLayout,
		},

		config: {
			itemsPerRow: {
				mobile: 1,
				tablet: 2,
				desktop: 3,
			},
			categoryStyle: 'tree',
			searchFirst: true,
			features: [
				'prescriptions',
				'drug_interactions',
				'batches',
				'expiry_tracking',
				'insurance',
			],
		},

		components: {
			PrescriptionUpload: () => import('../components/types/pharmacy/PrescriptionUpload.vue'),
			DrugInteractionAlert: () => import('../components/types/pharmacy/DrugInteractionAlert.vue'),
			InsuranceForm: () => import('../components/types/pharmacy/InsuranceForm.vue'),
		},
	},

	'Service & Spa': {
		name: 'Service & Spa',
		icon: 'mdi-spa',
		description: 'Service-based POS for spas and salons',

		layouts: {
			mobile: ServiceLayout,
			tablet: ServiceLayout,
			desktop: ServiceLayout,
		},

		config: {
			itemsPerRow: {
				mobile: 1,
				tablet: 2,
				desktop: 3,
			},
			categoryStyle: 'tabs',
			features: [
				'appointments',
				'resources',
				'packages',
				'tips',
				'memberships',
			],
		},

		components: {
			AppointmentBooking: () => import('../components/types/service/AppointmentBooking.vue'),
			ResourceSelector: () => import('../components/types/service/ResourceSelector.vue'),
			PackageBuilder: () => import('../components/types/service/PackageBuilder.vue'),
			TipEntry: () => import('../components/types/service/TipEntry.vue'),
		},
	},

	'Retail': {
		name: 'Retail',
		icon: 'mdi-store',
		description: 'General retail POS',

		layouts: {
			mobile: MobileLayout,
			tablet: TabletLayout,
			desktop: DesktopLayout,
		},

		config: {
			itemsPerRow: {
				mobile: 2,
				tablet: 3,
				desktop: 4,
			},
			categoryStyle: 'hybrid',
			features: [
				'variants',
				'bundles',
				'discounts',
				'gift_cards',
			],
		},

		components: {
			VariantSelector: () => import('../components/types/retail/VariantSelector.vue'),
			BundleBuilder: () => import('../components/types/retail/BundleBuilder.vue'),
			GiftCardEntry: () => import('../components/types/retail/GiftCardEntry.vue'),
		},
	},
};

/**
 * Get POS type configuration
 * @param {String} typeName - POS type name
 * @returns {Object} - Type configuration
 */
export function getPosType(typeName) {
	return posTypes[typeName] || posTypes['Retail'];
}

/**
 * Get layout component for POS type and device
 * @param {String} typeName - POS type name
 * @param {String} device - Device type (mobile, tablet, desktop)
 * @returns {Component} - Layout component
 */
export function getLayoutComponent(typeName, device = 'desktop') {
	const type = getPosType(typeName);
	return type.layouts[device] || type.layouts.desktop || DesktopLayout;
}

/**
 * Get type-specific component
 * @param {String} typeName - POS type name
 * @param {String} componentName - Component name
 * @returns {Function} - Component loader function
 */
export function getTypeComponent(typeName, componentName) {
	const type = getPosType(typeName);
	return type.components[componentName] || null;
}

/**
 * Check if POS type supports feature
 * @param {String} typeName - POS type name
 * @param {String} feature - Feature name
 * @returns {Boolean} - True if supported
 */
export function supportsFeature(typeName, feature) {
	const type = getPosType(typeName);
	return type.config.features.includes(feature);
}

/**
 * Get all available POS types
 * @returns {Array} - List of POS type names
 */
export function getAvailablePosTypes() {
	return Object.keys(posTypes);
}

/**
 * Get POS type metadata
 * @param {String} typeName - POS type name
 * @returns {Object} - Metadata (name, icon, description)
 */
export function getPosTypeMetadata(typeName) {
	const type = getPosType(typeName);
	return {
		name: type.name,
		icon: type.icon,
		description: type.description,
	};
}

/**
 * Get items per row for device
 * @param {String} typeName - POS type name
 * @param {String} device - Device type
 * @returns {Number} - Items per row
 */
export function getItemsPerRow(typeName, device) {
	const type = getPosType(typeName);
	return type.config.itemsPerRow[device] || 3;
}

export default {
	posTypes,
	getPosType,
	getLayoutComponent,
	getTypeComponent,
	supportsFeature,
	getAvailablePosTypes,
	getPosTypeMetadata,
	getItemsPerRow,
};

