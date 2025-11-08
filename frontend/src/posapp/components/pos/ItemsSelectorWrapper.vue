<template>
	<div class="items-selector-wrapper">
		<!-- New Modular System (Feature Flag) -->
		<ItemsSelectorEnhanced
			v-if="useModularSystem"
			:items="items"
			:categories="categories"
			:loading="loading"
			@item-selected="$emit('item-selected', $event)"
			@item-added="$emit('item-added', $event)"
			@category-selected="$emit('category-selected', $event)"
		>
			<template #original-grid>
				<!-- Fallback to original RecycleScroller if needed -->
				<slot name="original-grid" />
			</template>
		</ItemsSelectorEnhanced>

		<!-- Original ItemsSelector (Backward Compatibility) -->
		<ItemsSelector
			v-else
			v-bind="$attrs"
		/>
	</div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import ItemsSelector from './ItemsSelector.vue';
import ItemsSelectorEnhanced from './ItemsSelectorEnhanced.vue';

export default {
	name: 'ItemsSelectorWrapper',
	components: {
		ItemsSelector,
		ItemsSelectorEnhanced,
	},
	props: {
		items: Array,
		categories: Array,
		loading: Boolean,
		forceModular: {
			type: Boolean,
			default: null,
		},
	},
	emits: ['item-selected', 'item-added', 'category-selected'],
	setup(props) {
		/**
		 * Determine if we should use modular system
		 * Priority:
		 * 1. forceModular prop (if set)
		 * 2. localStorage flag
		 * 3. POS Profile setting
		 * 4. Default to false (safe backward compatibility)
		 */
		const useModularSystem = computed(() => {
			// Prop override
			if (props.forceModular !== null) {
				return props.forceModular;
			}

			// Check localStorage flag
			try {
				const setting = localStorage.getItem('pos_use_modular_system');
				if (setting !== null) {
					return setting === 'true';
				}
			} catch (e) {
				console.warn('Cannot read localStorage:', e);
			}

			// Check global flag (can be set via POS Profile)
			if (window.posModularSystemEnabled !== undefined) {
				return window.posModularSystemEnabled;
			}

			// Default: false (use original for safety)
			return false;
		});

		// Log which system is being used
		onMounted(() => {
			console.log(
				`[ItemsSelector] Using ${useModularSystem.value ? 'MODULAR' : 'ORIGINAL'} system`
			);
		});

		return {
			useModularSystem,
		};
	},
};
</script>

<style scoped>
.items-selector-wrapper {
	height: 100%;
	width: 100%;
}
</style>

