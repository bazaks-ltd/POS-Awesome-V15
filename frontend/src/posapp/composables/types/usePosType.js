/**
 * usePosType - Composable for POS Type configuration
 * Provides POS type-specific configuration and behavior
 */

import { ref, computed, watch } from 'vue';

const posTypeConfig = ref(null);
const loading = ref(false);
const error = ref(null);

export function usePosType() {
	/**
	 * Load POS Type configuration
	 * @param {String} posProfile - POS Profile name
	 */
	const loadPosTypeConfig = async (posProfile = null) => {
		loading.value = true;
		error.value = null;

		try {
			const response = await frappe.call({
				method: 'posawesome.posawesome.api.pos_type.get_pos_type_config',
				args: { pos_profile: posProfile },
			});

			if (response.message) {
				posTypeConfig.value = response.message;
				console.log('POS Type loaded:', response.message.name);
			}
		} catch (err) {
			error.value = err.message || 'Failed to load POS Type configuration';
			console.error('POS Type load error:', err);
			
			// Fallback to default configuration
			posTypeConfig.value = getDefaultConfig();
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Check if feature is enabled
	 * @param {String} featureName - Feature name
	 * @returns {Boolean} - True if enabled
	 */
	const isFeatureEnabled = (featureName) => {
		if (!posTypeConfig.value) return false;
		const features = posTypeConfig.value.ui_configuration?.enabled_features || [];
		return features.includes(featureName);
	};

	/**
	 * Get hardware configuration
	 * @param {String} hardwareName - Hardware device name
	 * @returns {Object} - Hardware configuration
	 */
	const getHardwareConfig = (hardwareName) => {
		if (!posTypeConfig.value) return { enabled: false };
		return posTypeConfig.value.hardware_configuration?.[hardwareName] || { enabled: false };
	};

	/**
	 * Get workflow configuration
	 * @param {String} configKey - Configuration key
	 * @returns {*} - Configuration value
	 */
	const getWorkflowConfig = (configKey) => {
		if (!posTypeConfig.value) return null;
		return posTypeConfig.value.workflow_configuration?.[configKey];
	};

	/**
	 * Get UI configuration
	 * @param {String} configKey - Configuration key
	 * @returns {*} - Configuration value
	 */
	const getUIConfig = (configKey) => {
		if (!posTypeConfig.value) return null;
		return posTypeConfig.value.ui_configuration?.[configKey];
	};

	// Computed properties
	const posTypeName = computed(() => posTypeConfig.value?.name || 'Unknown');
	
	const icon = computed(() => posTypeConfig.value?.icon || 'mdi-point-of-sale');
	
	const description = computed(() => posTypeConfig.value?.description || '');

	const categoryNavigationStyle = computed(() => 
		getUIConfig('category_navigation_style') || 'tabs'
	);

	const layoutMode = computed(() => 
		getUIConfig('layout_mode') || 'standard'
	);

	const enabledFeatures = computed(() => 
		getUIConfig('enabled_features') || []
	);

	const touchGestureMappings = computed(() => 
		getUIConfig('touch_gesture_mappings') || {}
	);

	const quickActions = computed(() => 
		getUIConfig('quick_actions') || []
	);

	const itemCardLayout = computed(() => 
		getUIConfig('item_card_layout') || {}
	);

	// Hardware enabled flags
	const barcodeScannerEnabled = computed(() => 
		getHardwareConfig('barcode_scanner').enabled || false
	);

	const scaleEnabled = computed(() => 
		getHardwareConfig('scale').enabled || false
	);

	const printerEnabled = computed(() => 
		getHardwareConfig('printer').enabled || false
	);

	const customerDisplayEnabled = computed(() => 
		getHardwareConfig('customer_display').enabled || false
	);

	const cardReaderEnabled = computed(() => 
		getHardwareConfig('card_reader').enabled || false
	);

	// Workflow flags
	const requireCustomer = computed(() => 
		getWorkflowConfig('require_customer') || false
	);

	const splitPaymentEnabled = computed(() => 
		getWorkflowConfig('split_payment_enabled') || false
	);

	const loyaltyProgramEnabled = computed(() => 
		getWorkflowConfig('loyalty_program_enabled') || false
	);

	const offlineModeEnabled = computed(() => 
		getWorkflowConfig('offline_mode_enabled') || false
	);

	const autoPrintReceipt = computed(() => 
		getWorkflowConfig('auto_print_receipt') || false
	);

	return {
		// State
		posTypeConfig,
		loading,
		error,

		// Methods
		loadPosTypeConfig,
		isFeatureEnabled,
		getHardwareConfig,
		getWorkflowConfig,
		getUIConfig,

		// Computed properties
		posTypeName,
		icon,
		description,
		categoryNavigationStyle,
		layoutMode,
		enabledFeatures,
		touchGestureMappings,
		quickActions,
		itemCardLayout,

		// Hardware flags
		barcodeScannerEnabled,
		scaleEnabled,
		printerEnabled,
		customerDisplayEnabled,
		cardReaderEnabled,

		// Workflow flags
		requireCustomer,
		splitPaymentEnabled,
		loyaltyProgramEnabled,
		offlineModeEnabled,
		autoPrintReceipt,
	};
}

/**
 * Get default configuration when loading fails
 */
function getDefaultConfig() {
	return {
		name: 'Retail',
		description: 'Default retail POS',
		icon: 'mdi-cart',
		ui_configuration: {
			enabled_features: ['variants', 'discounts'],
			item_card_layout: {
				show_image: true,
				show_stock: true,
				show_price: true,
			},
			quick_actions: ['add_to_cart', 'view_details'],
			category_navigation_style: 'tabs',
			layout_mode: 'standard',
			touch_gesture_mappings: {},
		},
		hardware_configuration: {
			barcode_scanner: { enabled: true },
			printer: { enabled: false },
			scale: { enabled: false },
			customer_display: { enabled: false },
			card_reader: { enabled: false },
		},
		workflow_configuration: {
			require_customer: false,
			split_payment_enabled: false,
			loyalty_program_enabled: true,
			offline_mode_enabled: true,
			auto_print_receipt: false,
		},
	};
}

