/**
 * useLazyComponent - Lazy load components with loading states
 * Improves initial load time by code splitting
 */

import { ref, shallowRef, onMounted, defineAsyncComponent } from 'vue';

export function useLazyComponent(importFn, options = {}) {
	const {
		loadingComponent = null,
		errorComponent = null,
		delay = 200,
		timeout = 10000,
		onError = null,
	} = options;

	const component = shallowRef(null);
	const loading = ref(false);
	const error = ref(null);
	const loaded = ref(false);

	/**
	 * Load component
	 */
	const load = async () => {
		if (loaded.value || loading.value) return;

		loading.value = true;
		error.value = null;

		try {
			const module = await importFn();
			component.value = module.default || module;
			loaded.value = true;
		} catch (err) {
			error.value = err;
			if (onError) onError(err);
			console.error('[LazyComponent] Load failed:', err);
		} finally {
			loading.value = false;
		}
	};

	return {
		component,
		loading,
		error,
		loaded,
		load,
	};
}

/**
 * Create lazy component with Vue's defineAsyncComponent
 */
export function createLazyComponent(importFn, options = {}) {
	return defineAsyncComponent({
		loader: importFn,
		loadingComponent: options.loadingComponent,
		errorComponent: options.errorComponent,
		delay: options.delay || 200,
		timeout: options.timeout || 10000,
		onError: options.onError,
	});
}

/**
 * Preload component
 */
export function preloadComponent(importFn) {
	return importFn();
}

/**
 * Preload multiple components
 */
export async function preloadComponents(importFns) {
	return Promise.all(importFns.map(fn => fn()));
}

/**
 * useLazyLoad - Lazy load based on intersection
 */
export function useLazyLoad(options = {}) {
	const {
		rootMargin = '100px',
		threshold = 0.1,
	} = options;

	const target = ref(null);
	const isVisible = ref(false);
	const hasLoaded = ref(false);
	let observer = null;

	const observe = (element) => {
		if (!element || observer) return;

		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !hasLoaded.value) {
						isVisible.value = true;
						hasLoaded.value = true;
						
						// Disconnect after first load
						if (observer) {
							observer.disconnect();
							observer = null;
						}
					}
				});
			},
			{ rootMargin, threshold }
		);

		observer.observe(element);
		target.value = element;
	};

	const unobserve = () => {
		if (observer) {
			observer.disconnect();
			observer = null;
		}
	};

	return {
		target,
		isVisible,
		hasLoaded,
		observe,
		unobserve,
	};
}

/**
 * Code splitting helpers for POS types
 */
export const lazyPosTypeComponents = {
	// Grocery
	GroceryLayout: () => import('../components/types/grocery/GroceryLayout.vue'),
	PLUKeypad: () => import('../components/types/grocery/PLUKeypad.vue'),
	ScaleWidget: () => import('../components/types/grocery/ScaleWidget.vue'),
	SplitPayment: () => import('../components/types/grocery/SplitPayment.vue'),
	CustomerDisplay: () => import('../components/types/grocery/CustomerDisplay.vue'),
	QuickTouchGrid: () => import('../components/types/grocery/QuickTouchGrid.vue'),

	// Pharmacy
	PharmacyLayout: () => import('../components/types/pharmacy/PharmacyLayout.vue'),
	PrescriptionUpload: () => import('../components/types/pharmacy/PrescriptionUpload.vue'),
	DrugInteractionAlert: () => import('../components/types/pharmacy/DrugInteractionAlert.vue'),
	InsuranceForm: () => import('../components/types/pharmacy/InsuranceForm.vue'),

	// Service
	ServiceLayout: () => import('../components/types/service/ServiceLayout.vue'),
	AppointmentBooking: () => import('../components/types/service/AppointmentBooking.vue'),
	ResourceSelector: () => import('../components/types/service/ResourceSelector.vue'),
	PackageBuilder: () => import('../components/types/service/PackageBuilder.vue'),
	TipEntry: () => import('../components/types/service/TipEntry.vue'),

	// Retail
	VariantSelector: () => import('../components/types/retail/VariantSelector.vue'),
	BundleBuilder: () => import('../components/types/retail/BundleBuilder.vue'),
	GiftCardEntry: () => import('../components/types/retail/GiftCardEntry.vue'),
};

/**
 * Load POS type components based on type name
 */
export async function loadPosTypeComponents(typeName) {
	const componentMap = {
		'Grocery Store': [
			'GroceryLayout',
			'PLUKeypad',
			'ScaleWidget',
			'SplitPayment',
			'QuickTouchGrid',
		],
		'Pharmacy': [
			'PharmacyLayout',
			'PrescriptionUpload',
			'DrugInteractionAlert',
			'InsuranceForm',
		],
		'Service & Spa': [
			'ServiceLayout',
			'AppointmentBooking',
			'ResourceSelector',
			'PackageBuilder',
			'TipEntry',
		],
		'Retail': [
			'VariantSelector',
			'BundleBuilder',
			'GiftCardEntry',
		],
	};

	const componentsToLoad = componentMap[typeName] || [];
	
	// Preload all components for this POS type
	const loaders = componentsToLoad.map(name => lazyPosTypeComponents[name]);
	
	try {
		await preloadComponents(loaders);
		console.log(`[LazyLoad] Preloaded ${typeName} components`);
	} catch (err) {
		console.error(`[LazyLoad] Failed to preload ${typeName}:`, err);
	}
}

