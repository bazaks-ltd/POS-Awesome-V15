<template>
	<v-card>
		<v-card-title>{{ __("Insurance Claim") }}</v-card-title>
		<v-card-text>
			<v-alert type="info">
				{{ __("Insurance claim processing - Coming soon") }}
			</v-alert>
		</v-card-text>
	</v-card>
</template>

<script>
export default {
	name: 'InsuranceForm',
};
</script>

