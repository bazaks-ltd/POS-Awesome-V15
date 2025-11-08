/**
 * Feature Flags System
 * Allows gradual rollout of new features without breaking existing functionality
 */

const FEATURE_FLAGS = {
	// Modular system flags
	USE_MODULAR_SYSTEM: 'pos_use_modular_system',
	USE_NEW_ITEM_GRID: 'pos_use_new_item_grid',
	USE_DEVICE_LAYOUTS: 'pos_use_device_layouts',
	USE_TOUCH_GESTURES: 'pos_use_touch_gestures',
	
	// Feature-specific flags
	ENABLE_SPLIT_PAYMENTS: 'pos_enable_split_payments',
	ENABLE_PLU_KEYPAD: 'pos_enable_plu_keypad',
	ENABLE_SCALE_WIDGET: 'pos_enable_scale_widget',
	ENABLE_CUSTOMER_DISPLAY: 'pos_enable_customer_display',
	ENABLE_WEB_WORKERS: 'pos_enable_web_workers',
	
	// Performance flags
	ENABLE_LAZY_LOADING: 'pos_enable_lazy_loading',
	ENABLE_CODE_SPLITTING: 'pos_enable_code_splitting',
	ENABLE_SERVICE_WORKER: 'pos_enable_service_worker',
	
	// Debug flags
	DEBUG_MODE: 'pos_debug_mode',
	SHOW_PERFORMANCE_METRICS: 'pos_show_performance_metrics',
};

/**
 * Check if feature is enabled
 * @param {String} flagName - Feature flag name
 * @param {Boolean} defaultValue - Default value if not set
 * @returns {Boolean} - True if enabled
 */
export function isFeatureEnabled(flagName, defaultValue = false) {
	// Check localStorage
	try {
		const stored = localStorage.getItem(flagName);
		if (stored !== null) {
			return stored === 'true';
		}
	} catch (e) {
		console.warn('Cannot read localStorage:', e);
	}

	// Check window global (can be set from backend)
	const globalKey = flagName.replace('pos_', 'pos').replace(/_/g, '');
	if (window[globalKey] !== undefined) {
		return window[globalKey];
	}

	// Check Frappe boot
	if (frappe?.boot?.pos_feature_flags && frappe.boot.pos_feature_flags[flagName] !== undefined) {
		return frappe.boot.pos_feature_flags[flagName];
	}

	return defaultValue;
}

/**
 * Enable feature
 * @param {String} flagName - Feature flag name
 */
export function enableFeature(flagName) {
	try {
		localStorage.setItem(flagName, 'true');
		console.log(`[FeatureFlag] Enabled: ${flagName}`);
		return true;
	} catch (e) {
		console.error('Cannot set localStorage:', e);
		return false;
	}
}

/**
 * Disable feature
 * @param {String} flagName - Feature flag name
 */
export function disableFeature(flagName) {
	try {
		localStorage.setItem(flagName, 'false');
		console.log(`[FeatureFlag] Disabled: ${flagName}`);
		return true;
	} catch (e) {
		console.error('Cannot set localStorage:', e);
		return false;
	}
}

/**
 * Toggle feature
 * @param {String} flagName - Feature flag name
 * @returns {Boolean} - New state
 */
export function toggleFeature(flagName) {
	const currentState = isFeatureEnabled(flagName);
	if (currentState) {
		disableFeature(flagName);
	} else {
		enableFeature(flagName);
	}
	return !currentState;
}

/**
 * Get all feature flags status
 * @returns {Object} - All flags with their status
 */
export function getAllFeatureFlags() {
	const status = {};
	
	Object.entries(FEATURE_FLAGS).forEach(([key, flagName]) => {
		status[key] = isFeatureEnabled(flagName);
	});

	return status;
}

/**
 * Reset all feature flags
 */
export function resetAllFeatureFlags() {
	Object.values(FEATURE_FLAGS).forEach(flagName => {
		try {
			localStorage.removeItem(flagName);
		} catch (e) {
			console.error('Cannot remove from localStorage:', e);
		}
	});
	console.log('[FeatureFlags] All flags reset');
}

/**
 * Enable modular system (convenience function)
 */
export function enableModularSystem() {
	enableFeature(FEATURE_FLAGS.USE_MODULAR_SYSTEM);
	enableFeature(FEATURE_FLAGS.USE_NEW_ITEM_GRID);
	enableFeature(FEATURE_FLAGS.USE_DEVICE_LAYOUTS);
	enableFeature(FEATURE_FLAGS.ENABLE_LAZY_LOADING);
	console.log('[FeatureFlags] Modular system enabled');
}

/**
 * Disable modular system (rollback to original)
 */
export function disableModularSystem() {
	disableFeature(FEATURE_FLAGS.USE_MODULAR_SYSTEM);
	disableFeature(FEATURE_FLAGS.USE_NEW_ITEM_GRID);
	disableFeature(FEATURE_FLAGS.USE_DEVICE_LAYOUTS);
	console.log('[FeatureFlags] Rolled back to original system');
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode() {
	return isFeatureEnabled(FEATURE_FLAGS.DEBUG_MODE);
}

/**
 * Log debug message (only if debug mode enabled)
 */
export function debugLog(...args) {
	if (isDebugMode()) {
		console.log('[POS Debug]', ...args);
	}
}

// Expose to window for easy testing
if (typeof window !== 'undefined') {
	window.posFeatureFlags = {
		isEnabled: isFeatureEnabled,
		enable: enableFeature,
		disable: disableFeature,
		toggle: toggleFeature,
		getAll: getAllFeatureFlags,
		reset: resetAllFeatureFlags,
		enableModular: enableModularSystem,
		disableModular: disableModularSystem,
		FLAGS: FEATURE_FLAGS,
	};
}

export { FEATURE_FLAGS };
export default {
	isFeatureEnabled,
	enableFeature,
	disableFeature,
	toggleFeature,
	getAllFeatureFlags,
	resetAllFeatureFlags,
	enableModularSystem,
	disableModularSystem,
	isDebugMode,
	debugLog,
	FEATURE_FLAGS,
};

