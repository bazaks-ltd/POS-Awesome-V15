<template>
	<v-card>
		<v-card-title>{{ __("Add Tip") }}</v-card-title>
		<v-card-text>
			<v-text-field
				v-model.number="tipAmount"
				:label="__('Tip Amount')"
				type="number"
				prefix="$"
			></v-text-field>
		</v-card-text>
	</v-card>
</template>

<script>
import { ref } from 'vue';

export default {
	name: 'TipEntry',
	setup() {
		const tipAmount = ref(0);
		return { tipAmount };
	},
};
</script>

