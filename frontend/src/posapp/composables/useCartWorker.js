/**
 * useCartWorker - Use Web Worker for heavy calculations
 * Offloads cart calculations to separate thread for better performance
 */

import { ref } from 'vue';

let worker = null;
let messageId = 0;
const pendingCallbacks = new Map();

export function useCartWorker() {
	const isWorkerSupported = ref(typeof Worker !== 'undefined');
	const workerReady = ref(false);
	const error = ref(null);

	/**
	 * Initialize worker
	 */
	const initWorker = () => {
		if (!isWorkerSupported.value || worker) return;

		try {
			// Create worker (Vite will bundle this)
			worker = new Worker(
				new URL('../workers/cartCalculations.worker.js', import.meta.url),
				{ type: 'module' }
			);

			worker.onmessage = handleWorkerMessage;
			worker.onerror = handleWorkerError;

			workerReady.value = true;
			console.log('[CartWorker] Initialized');
		} catch (err) {
			console.error('[CartWorker] Failed to initialize:', err);
			error.value = err.message;
			isWorkerSupported.value = false;
		}
	};

	/**
	 * Handle worker messages
	 */
	const handleWorkerMessage = (event) => {
		const { type, data, messageId: respId } = event.data;

		const callback = pendingCallbacks.get(respId);
		if (callback) {
			callback.resolve({ type, data });
			pendingCallbacks.delete(respId);
		}
	};

	/**
	 * Handle worker errors
	 */
	const handleWorkerError = (err) => {
		console.error('[CartWorker] Error:', err);
		error.value = err.message;

		// Reject all pending callbacks
		pendingCallbacks.forEach((callback) => {
			callback.reject(err);
		});
		pendingCallbacks.clear();
	};

	/**
	 * Send message to worker
	 */
	const postMessage = (type, data) => {
		return new Promise((resolve, reject) => {
			if (!isWorkerSupported.value) {
				// Fallback: calculate in main thread
				reject(new Error('Worker not supported'));
				return;
			}

			if (!worker) {
				initWorker();
			}

			const id = ++messageId;
			pendingCallbacks.set(id, { resolve, reject });

			// Set timeout to prevent hanging
			setTimeout(() => {
				if (pendingCallbacks.has(id)) {
					pendingCallbacks.delete(id);
					reject(new Error('Worker timeout'));
				}
			}, 5000);

			worker.postMessage({ type, data, messageId: id });
		});
	};

	/**
	 * Calculate totals in worker
	 */
	const calculateTotals = async (items, taxRules = [], discountRules = []) => {
		try {
			const result = await postMessage('CALCULATE_TOTALS', {
				items,
				taxRules,
				discountRules,
			});
			return result.data;
		} catch (err) {
			console.warn('[CartWorker] Fallback to main thread calculation');
			// Fallback to main thread
			return calculateTotalsSync(items);
		}
	};

	/**
	 * Apply promotions in worker
	 */
	const applyPromotions = async (items, promotions) => {
		try {
			const result = await postMessage('APPLY_PROMOTIONS', {
				items,
				promotions,
			});
			return result.data;
		} catch (err) {
			console.warn('[CartWorker] Fallback to main thread for promotions');
			return items; // Return unchanged
		}
	};

	/**
	 * Calculate tax in worker
	 */
	const calculateTax = async (items, taxRules, taxCategories) => {
		try {
			const result = await postMessage('CALCULATE_TAX', {
				items,
				taxRules,
				taxCategories,
			});
			return result.data;
		} catch (err) {
			console.warn('[CartWorker] Fallback to main thread for tax');
			return items;
		}
	};

	/**
	 * Validate cart in worker
	 */
	const validateCart = async (items, stockLevels, businessRules) => {
		try {
			const result = await postMessage('VALIDATE_CART', {
				items,
				stockLevels,
				businessRules,
			});
			return result.data;
		} catch (err) {
			console.warn('[CartWorker] Fallback to main thread for validation');
			return { valid: true, results: [] };
		}
	};

	/**
	 * Synchronous fallback calculation (main thread)
	 */
	const calculateTotalsSync = (items) => {
		const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
		const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
		const totalTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
		const grandTotal = subtotal + totalTax;

		return {
			subtotal,
			totalQty,
			totalItems: items.length,
			totalTax,
			grandTotal,
			items,
		};
	};

	/**
	 * Terminate worker
	 */
	const terminateWorker = () => {
		if (worker) {
			worker.terminate();
			worker = null;
			workerReady.value = false;
			pendingCallbacks.clear();
		}
	};

	// Initialize worker on first use
	if (!worker && isWorkerSupported.value) {
		initWorker();
	}

	return {
		isWorkerSupported,
		workerReady,
		error,
		calculateTotals,
		applyPromotions,
		calculateTax,
		validateCart,
		terminateWorker,
	};
}

