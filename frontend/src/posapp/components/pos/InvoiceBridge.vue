<template>
	<div class="invoice-bridge">
		<!-- Render existing Invoice component -->
		<slot :cart-items="cartItems" :totals="totals" :methods="bridgeMethods" />
	</div>
</template>

<script>
/**
 * InvoiceBridge - Connects CartService with existing Invoice component
 * This bridge allows gradual migration without breaking existing functionality
 */

import { computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { useCart } from '../../services/cart/CartService.js';

export default {
	name: 'InvoiceBridge',
	setup() {
		const instance = getCurrentInstance();
		const cart = useCart();

		// Subscriptions
		let unsubscribeItemAdded = null;
		let unsubscribeItemRemoved = null;
		let unsubscribeItemUpdated = null;
		let unsubscribeCartUpdated = null;

		// Computed properties exposed to slot
		const cartItems = computed(() => cart.items);
		const totals = computed(() => cart.getTotals());

		/**
		 * Sync cart service → legacy component
		 */
		const syncToLegacy = () => {
			if (instance && instance.proxy && instance.proxy.eventBus) {
				instance.proxy.eventBus.emit('cart_updated_from_service', {
					items: cart.items,
					totals: cart.getTotals(),
				});
			}
		};

		/**
		 * Add item to cart (called from legacy components)
		 */
		const addItemToCart = async (item, qty = 1, options = {}) => {
			try {
				await cart.addItem(item, qty, options);
				return { success: true };
			} catch (error) {
				return { success: false, error: error.message };
			}
		};

		/**
		 * Update item quantity
		 */
		const updateItemQty = async (index, newQty) => {
			try {
				await cart.updateQuantity(index, newQty);
				return { success: true };
			} catch (error) {
				return { success: false, error: error.message };
			}
		};

		/**
		 * Update item rate
		 */
		const updateItemRate = (index, newRate) => {
			try {
				cart.updateRate(index, newRate);
				return { success: true };
			} catch (error) {
				return { success: false, error: error.message };
			}
		};

		/**
		 * Remove item from cart
		 */
		const removeItem = (index) => {
			try {
				cart.removeItem(index);
				return { success: true };
			} catch (error) {
				return { success: false, error: error.message };
			}
		};

		/**
		 * Clear cart
		 */
		const clearCart = () => {
			cart.clearCart();
		};

		/**
		 * Set customer
		 */
		const setCustomer = async (customer) => {
			await cart.setCustomer(customer);
		};

		/**
		 * Apply discount
		 */
		const applyDiscount = (discount) => {
			cart.applyCartDiscount(discount);
		};

		/**
		 * Get cart state
		 */
		const getCartState = () => {
			return cart.getState();
		};

		/**
		 * Restore cart state
		 */
		const restoreCartState = (state) => {
			cart.restoreState(state);
		};

		// Methods object exposed to slot
		const bridgeMethods = {
			addItem: addItemToCart,
			updateQty: updateItemQty,
			updateRate: updateItemRate,
			removeItem: removeItem,
			clearCart: clearCart,
			setCustomer: setCustomer,
			applyDiscount: applyDiscount,
			getState: getCartState,
			restoreState: restoreCartState,
		};

		/**
		 * Setup event listeners
		 */
		onMounted(() => {
			// Listen to cart service events
			unsubscribeItemAdded = cart.on('item_added', (item) => {
				syncToLegacy();
				
				// Notify via event bus
				if (instance && instance.proxy && instance.proxy.eventBus) {
					instance.proxy.eventBus.emit('service_item_added', item);
				}
			});

			unsubscribeItemRemoved = cart.on('item_removed', ({ index, item }) => {
				syncToLegacy();
				
				if (instance && instance.proxy && instance.proxy.eventBus) {
					instance.proxy.eventBus.emit('service_item_removed', { index, item });
				}
			});

			unsubscribeItemUpdated = cart.on('item_updated', ({ index, item }) => {
				syncToLegacy();
				
				if (instance && instance.proxy && instance.proxy.eventBus) {
					instance.proxy.eventBus.emit('service_item_updated', { index, item });
				}
			});

			unsubscribeCartUpdated = cart.on('cart_updated', (items) => {
				syncToLegacy();
			});

			// Listen to legacy component events (if they update cart directly)
			if (instance && instance.proxy && instance.proxy.eventBus) {
				instance.proxy.eventBus.on('legacy_add_item', async ({ item, qty, options }) => {
					await addItemToCart(item, qty, options);
				});

				instance.proxy.eventBus.on('legacy_remove_item', ({ index }) => {
					removeItem(index);
				});

				instance.proxy.eventBus.on('legacy_update_qty', ({ index, qty }) => {
					updateItemQty(index, qty);
				});

				instance.proxy.eventBus.on('legacy_clear_cart', () => {
					clearCart();
				});
			}
		});

		/**
		 * Cleanup
		 */
		onUnmounted(() => {
			if (unsubscribeItemAdded) unsubscribeItemAdded();
			if (unsubscribeItemRemoved) unsubscribeItemRemoved();
			if (unsubscribeItemUpdated) unsubscribeItemUpdated();
			if (unsubscribeCartUpdated) unsubscribeCartUpdated();

			if (instance && instance.proxy && instance.proxy.eventBus) {
				instance.proxy.eventBus.off('legacy_add_item');
				instance.proxy.eventBus.off('legacy_remove_item');
				instance.proxy.eventBus.off('legacy_update_qty');
				instance.proxy.eventBus.off('legacy_clear_cart');
			}
		});

		return {
			cartItems,
			totals,
			bridgeMethods,
		};
	},
};
</script>

<style scoped>
.invoice-bridge {
	height: 100%;
	width: 100%;
}
</style>

