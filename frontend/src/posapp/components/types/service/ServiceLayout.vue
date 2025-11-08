<template>
	<div class="service-layout">
		<DesktopLayout
			:items="items"
			:categories="categories"
			:loading="loading"
			@item-selected="$emit('item-selected', $event)"
			@checkout="$emit('checkout')"
		>
			<!-- Service-specific quick actions -->
			<template #quick-actions>
				<ActionButton
					icon="mdi-calendar-plus"
					color="primary"
					block
					class="mb-2"
					@click="handleBooking"
				>
					{{ __("Book Appointment") }}
				</ActionButton>

				<ActionButton
					icon="mdi-package-variant"
					color="secondary"
					block
					class="mb-2"
					@click="handlePackages"
				>
					{{ __("Service Packages") }}
				</ActionButton>

				<ActionButton
					icon="mdi-account-star"
					color="info"
					block
					@click="handleMembership"
				>
					{{ __("Membership") }}
				</ActionButton>
			</template>

			<!-- Service-specific features -->
			<template #cart-actions>
				<div class="service-actions">
					<!-- Tip entry -->
					<v-text-field
						v-model.number="tipAmount"
						:label="__('Tip Amount')"
						:prefix="currency_symbol"
						type="number"
						variant="outlined"
						density="compact"
						hide-details
						class="mb-2"
					></v-text-field>

					<!-- Standard checkout button -->
					<ActionButton
						icon="mdi-cash-register"
						color="success"
						size="x-large"
						block
						@click="$emit('checkout')"
					>
						{{ __("Checkout") }}
					</ActionButton>
				</div>
			</template>
		</DesktopLayout>
	</div>
</template>

<script>
import { ref, computed } from 'vue';
import DesktopLayout from '../../../layouts/DesktopLayout.vue';
import ActionButton from '../../base/ActionButton.vue';

export default {
	name: 'ServiceLayout',
	components: {
		DesktopLayout,
		ActionButton,
	},
	props: {
		items: Array,
		categories: Array,
		loading: Boolean,
	},
	emits: ['item-selected', 'checkout'],
	setup() {
		const tipAmount = ref(0);

		const currency_symbol = computed(() => {
			return frappe.boot?.sysdefaults?.currency_symbol || '$';
		});

		const handleBooking = () => {
			frappe.show_alert({
				message: __('Appointment booking - Coming soon'),
				indicator: 'blue',
			});
		};

		const handlePackages = () => {
			frappe.show_alert({
				message: __('Service packages - Coming soon'),
				indicator: 'blue',
			});
		};

		const handleMembership = () => {
			frappe.show_alert({
				message: __('Membership management - Coming soon'),
				indicator: 'blue',
			});
		};

		return {
			tipAmount,
			currency_symbol,
			handleBooking,
			handlePackages,
			handleMembership,
		};
	},
};
</script>

<style scoped>
.service-layout {
	height: 100%;
	width: 100%;
}

.service-actions {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
</style>

