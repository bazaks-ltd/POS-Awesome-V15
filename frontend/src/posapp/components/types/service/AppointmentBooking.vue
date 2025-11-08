<template>
	<v-card>
		<v-card-title>{{ __("Book Appointment") }}</v-card-title>
		<v-card-text>
			<v-alert type="info">
				{{ __("Appointment booking - Coming soon") }}
			</v-alert>
		</v-card-text>
	</v-card>
</template>

<script>
export default {
	name: 'AppointmentBooking',
};
</script>

