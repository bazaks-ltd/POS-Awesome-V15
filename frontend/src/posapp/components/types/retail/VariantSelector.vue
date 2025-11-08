<template>
	<v-card>
		<v-card-title>{{ __("Select Variant") }}</v-card-title>
		<v-card-text>
			<v-alert type="info">
				{{ __("Variant selector - Using existing Variants.vue") }}
			</v-alert>
		</v-card-text>
	</v-card>
</template>

<script>
export default {
	name: 'VariantSelector',
};
</script>

