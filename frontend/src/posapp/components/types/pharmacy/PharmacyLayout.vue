<template>
	<div class="pharmacy-layout">
		<DesktopLayout
			:items="items"
			:categories="categories"
			:loading="loading"
			@item-selected="$emit('item-selected', $event)"
			@checkout="$emit('checkout')"
		>
			<!-- Pharmacy-specific customer section -->
			<template #customer>
				<v-card elevation="0">
					<v-card-title>{{ __("Patient Information") }}</v-card-title>
					<v-card-text>
						<slot name="customer">
							<!-- Customer/Patient component goes here -->
							<v-alert type="info" density="compact">
								{{ __("Pharmacy features coming soon") }}
							</v-alert>
						</slot>
					</v-card-text>
				</v-card>
			</template>

			<!-- Pharmacy quick actions -->
			<template #quick-actions>
				<ActionButton
					icon="mdi-file-document-outline"
					color="primary"
					block
					class="mb-2"
					@click="handlePrescription"
				>
					{{ __("Upload Prescription") }}
				</ActionButton>

				<ActionButton
					icon="mdi-pill"
					color="secondary"
					block
					class="mb-2"
					@click="handleDrugInteraction"
				>
					{{ __("Check Interactions") }}
				</ActionButton>

				<ActionButton
					icon="mdi-shield-check"
					color="info"
					block
					@click="handleInsurance"
				>
					{{ __("Insurance Claim") }}
				</ActionButton>
			</template>
		</DesktopLayout>
	</div>
</template>

<script>
import DesktopLayout from '../../../layouts/DesktopLayout.vue';
import ActionButton from '../../base/ActionButton.vue';

export default {
	name: 'PharmacyLayout',
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
	setup(props, { emit }) {
		const handlePrescription = () => {
			frappe.show_alert({
				message: __('Prescription upload - Coming soon'),
				indicator: 'blue',
			});
		};

		const handleDrugInteraction = () => {
			frappe.show_alert({
				message: __('Drug interaction check - Coming soon'),
				indicator: 'blue',
			});
		};

		const handleInsurance = () => {
			frappe.show_alert({
				message: __('Insurance claim - Coming soon'),
				indicator: 'blue',
			});
		};

		return {
			handlePrescription,
			handleDrugInteraction,
			handleInsurance,
		};
	},
};
</script>

<style scoped>
.pharmacy-layout {
	height: 100%;
	width: 100%;
}
</style>

