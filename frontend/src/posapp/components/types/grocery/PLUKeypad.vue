<template>
	<v-card class="plu-keypad" elevation="2">
		<v-card-title class="text-h6 bg-primary">
			<v-icon class="mr-2">mdi-numeric</v-icon>
			{{ __("PLU Entry") }}
		</v-card-title>

		<v-card-text class="pa-4">
			<!-- PLU Display -->
			<v-text-field
				v-model="pluCode"
				variant="outlined"
				density="comfortable"
				:label="__('Enter PLU Code')"
				readonly
				class="plu-display mb-4"
				hide-details
				@keydown.enter="searchPLU"
				@keydown.backspace="backspace"
				@keydown.escape="clear"
			>
				<template #append-inner>
					<v-btn
						icon="mdi-backspace"
						size="small"
						variant="text"
						@click="backspace"
					></v-btn>
				</template>
			</v-text-field>

			<!-- Numeric Keypad -->
			<div class="keypad-grid">
				<v-btn
					v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
					:key="num"
					class="keypad-btn"
					:height="touchTargetSize"
					size="x-large"
					variant="elevated"
					@click="appendDigit(num)"
				>
					{{ num }}
				</v-btn>

				<!-- Bottom row -->
				<v-btn
					class="keypad-btn"
					:height="touchTargetSize"
					size="x-large"
					variant="elevated"
					color="warning"
					@click="clear"
				>
					<v-icon>mdi-close</v-icon>
				</v-btn>

				<v-btn
					class="keypad-btn"
					:height="touchTargetSize"
					size="x-large"
					variant="elevated"
					@click="appendDigit(0)"
				>
					0
				</v-btn>

				<v-btn
					class="keypad-btn"
					:height="touchTargetSize"
					size="x-large"
					variant="elevated"
					color="primary"
					:loading="searching"
					@click="searchPLU"
				>
					<v-icon>mdi-magnify</v-icon>
				</v-btn>
			</div>

			<!-- Quick PLU Shortcuts -->
			<div v-if="quickPLUs.length > 0" class="mt-4">
				<div class="text-caption text-medium-emphasis mb-2">{{ __("Quick Access") }}</div>
				<div class="quick-plu-grid">
					<v-chip
						v-for="plu in quickPLUs"
						:key="plu.code"
						class="quick-plu-chip"
						@click="setQuickPLU(plu.code)"
					>
						<v-avatar start>
							<v-img v-if="plu.image" :src="plu.image" />
							<v-icon v-else>mdi-fruit-pineapple</v-icon>
						</v-avatar>
						{{ plu.code }} - {{ plu.name }}
					</v-chip>
				</div>
			</div>

			<!-- Search Results -->
			<div v-if="searchResults.length > 0" class="mt-4">
				<div class="text-caption text-medium-emphasis mb-2">{{ __("Search Results") }}</div>
				<v-list density="compact">
					<v-list-item
						v-for="item in searchResults"
						:key="item.item_code"
						@click="selectItem(item)"
					>
						<template #prepend>
							<v-avatar>
								<v-img v-if="item.image" :src="item.image" />
								<v-icon v-else>mdi-package-variant</v-icon>
							</v-avatar>
						</template>

						<v-list-item-title>{{ item.item_name }}</v-list-item-title>
						<v-list-item-subtitle>
							PLU: {{ item.plu_code }} | {{ format_currency(item.rate) }}
							<span v-if="item.is_weighted_item">/ {{ item.stock_uom }}</span>
						</v-list-item-subtitle>

						<template #append>
							<v-chip v-if="item.actual_qty > 0" size="small" color="success">
								{{ item.actual_qty }} {{ item.stock_uom }}
							</v-chip>
							<v-chip v-else size="small" color="error">
								{{ __("Out of Stock") }}
							</v-chip>
						</template>
					</v-list-item>
				</v-list>
			</div>

			<!-- No Results Message -->
			<v-alert v-if="noResults" type="warning" class="mt-4" density="compact">
				{{ __("No items found with PLU code") }}: {{ pluCode }}
			</v-alert>
		</v-card-text>
	</v-card>
</template>

<script>
import { ref, computed } from 'vue';
import { useDeviceDetection } from '../../../composables/types/useDeviceDetection';

export default {
	name: 'PLUKeypad',
	emits: ['item-selected'],
	setup(props, { emit }) {
		const pluCode = ref('');
		const searching = ref(false);
		const searchResults = ref([]);
		const noResults = ref(false);
		const quickPLUs = ref([]);

		const { touchTargetSize } = useDeviceDetection();

		/**
		 * Append digit to PLU code
		 */
		const appendDigit = (digit) => {
			if (pluCode.value.length < 6) { // Max 6 digits for PLU
				pluCode.value += digit.toString();
				noResults.value = false;

				// Auto-search if PLU is complete (4-5 digits)
				if (pluCode.value.length >= 4) {
					searchPLU();
				}
			}
		};

		/**
		 * Remove last digit
		 */
		const backspace = () => {
			pluCode.value = pluCode.value.slice(0, -1);
			noResults.value = false;
			searchResults.value = [];
		};

		/**
		 * Clear PLU code
		 */
		const clear = () => {
			pluCode.value = '';
			searchResults.value = [];
			noResults.value = false;
		};

		/**
		 * Search for items by PLU code
		 */
		const searchPLU = async () => {
			if (!pluCode.value) return;

			searching.value = true;
			noResults.value = false;

			try {
				const response = await frappe.call({
					method: 'posawesome.posawesome.api.items.search_by_plu',
					args: {
						plu_code: pluCode.value,
					},
				});

				if (response.message && response.message.length > 0) {
					searchResults.value = response.message;
					noResults.value = false;

					// If only one result, auto-select it
					if (response.message.length === 1) {
						selectItem(response.message[0]);
					}
				} else {
					searchResults.value = [];
					noResults.value = true;
				}
			} catch (error) {
				console.error('PLU search error:', error);
				frappe.show_alert({
					message: __('Failed to search PLU'),
					indicator: 'red',
				});
				noResults.value = true;
			} finally {
				searching.value = false;
			}
		};

		/**
		 * Set quick PLU code
		 */
		const setQuickPLU = (code) => {
			pluCode.value = code;
			searchPLU();
		};

		/**
		 * Select item from search results
		 */
		const selectItem = (item) => {
			emit('item-selected', item);
			clear();
		};

		/**
		 * Load quick access PLUs
		 */
		const loadQuickPLUs = async () => {
			try {
				const response = await frappe.call({
					method: 'posawesome.posawesome.api.items.get_quick_plu_items',
				});

				if (response.message) {
					quickPLUs.value = response.message;
				}
			} catch (error) {
				console.error('Failed to load quick PLUs:', error);
			}
		};

		// Load quick PLUs on mount
		loadQuickPLUs();

		return {
			pluCode,
			searching,
			searchResults,
			noResults,
			quickPLUs,
			touchTargetSize,
			appendDigit,
			backspace,
			clear,
			searchPLU,
			setQuickPLU,
			selectItem,
			format_currency: window.format_currency,
		};
	},
};
</script>

<style scoped>
.plu-keypad {
	max-width: 400px;
}

.plu-display :deep(.v-field__input) {
	font-size: 2rem;
	font-weight: bold;
	text-align: center;
	letter-spacing: 0.5rem;
}

.keypad-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
}

.keypad-btn {
	font-size: 1.5rem;
	font-weight: bold;
}

.quick-plu-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.quick-plu-chip {
	cursor: pointer;
	transition: transform 0.2s;
}

.quick-plu-chip:hover {
	transform: scale(1.05);
}

.quick-plu-chip:active {
	transform: scale(0.95);
}
</style>

