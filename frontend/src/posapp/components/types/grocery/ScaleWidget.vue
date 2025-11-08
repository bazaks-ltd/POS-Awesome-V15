<template>
	<v-card class="scale-widget" :class="{ 'scale-active': isReading }" elevation="3">
		<v-card-title class="d-flex align-center">
			<v-icon :class="{ 'scale-icon-active': isReading }" class="mr-2">
				mdi-weight
			</v-icon>
			<span>{{ __("Scale") }}</span>

			<v-spacer></v-spacer>

			<!-- Connection Status -->
			<v-chip
				:color="connected ? 'success' : 'error'"
				size="small"
				variant="flat"
			>
				<v-icon start>{{ connected ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
				{{ connected ? __('Connected') : __('Disconnected') }}
			</v-chip>
		</v-card-title>

		<v-divider></v-divider>

		<v-card-text class="pa-4">
			<!-- Weight Display -->
			<div class="weight-display">
				<div class="weight-value" :class="{ 'weight-reading': isReading }">
					{{ formatWeight(currentWeight) }}
				</div>
				<div class="weight-unit">{{ weightUnit }}</div>
			</div>

			<!-- Status Message -->
			<div class="text-center mt-2">
				<v-chip v-if="isReading" color="primary" variant="flat" size="small">
					<v-icon start>mdi-clock-fast</v-icon>
					{{ __("Reading...") }}
				</v-chip>
				<v-chip v-else-if="isStable" color="success" variant="flat" size="small">
					<v-icon start>mdi-check</v-icon>
					{{ __("Stable") }}
				</v-chip>
				<v-chip v-else color="grey" variant="flat" size="small">
					{{ __("Place item on scale") }}
				</v-chip>
			</div>

			<!-- Actions -->
			<div class="mt-4 d-flex gap-2">
				<v-btn
					color="primary"
					variant="elevated"
					:loading="isReading"
					:disabled="!connected || currentWeight <= 0"
					block
					@click="captureWeight"
				>
					<v-icon start>mdi-check-bold</v-icon>
					{{ __("Use Weight") }}
				</v-btn>

				<v-btn
					color="secondary"
					variant="outlined"
					:disabled="!connected || currentWeight <= 0"
					@click="tare"
				>
					<v-icon start>mdi-restart</v-icon>
					{{ __("Tare") }}
				</v-btn>
			</div>

			<!-- Manual Weight Entry -->
			<v-expand-transition>
				<div v-if="showManualEntry" class="mt-4">
					<v-text-field
						v-model.number="manualWeight"
						type="number"
						step="0.001"
						:label="__('Manual Weight')"
						:suffix="weightUnit"
						variant="outlined"
						density="comfortable"
						hide-details
					>
						<template #append>
							<v-btn
								color="primary"
								variant="text"
								@click="useManualWeight"
							>
								{{ __("Use") }}
							</v-btn>
						</template>
					</v-text-field>
				</div>
			</v-expand-transition>

			<v-btn
				variant="text"
				size="small"
				class="mt-2"
				@click="showManualEntry = !showManualEntry"
			>
				{{ showManualEntry ? __("Hide") : __("Manual Entry") }}
			</v-btn>

			<!-- Scale Info -->
			<v-alert v-if="!connected" type="warning" density="compact" class="mt-4">
				{{ __("Scale not connected. Check port settings and connection.") }}
			</v-alert>

			<v-expand-transition>
				<div v-if="errorMessage" class="mt-2">
					<v-alert type="error" density="compact" closable @click:close="errorMessage = ''">
						{{ errorMessage }}
					</v-alert>
				</div>
			</v-expand-transition>
		</v-card-text>
	</v-card>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

export default {
	name: 'ScaleWidget',
	props: {
		scaleConfig: {
			type: Object,
			default: () => ({
				enabled: true,
				type: 'serial',
				protocol: 'mettler_toledo',
				port: 'COM3',
				baud_rate: 9600,
				weight_unit: 'kg',
			}),
		},
		autoRead: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['weight-captured'],
	setup(props, { emit }) {
		const connected = ref(false);
		const currentWeight = ref(0);
		const isReading = ref(false);
		const isStable = ref(false);
		const errorMessage = ref('');
		const showManualEntry = ref(false);
		const manualWeight = ref(0);
		
		let scalePort = null;
		let reader = null;
		let readInterval = null;
		let stabilityTimeout = null;
		let previousWeight = 0;

		const weightUnit = computed(() => props.scaleConfig.weight_unit || 'kg');

		/**
		 * Format weight for display
		 */
		const formatWeight = (weight) => {
			return weight.toFixed(3);
		};

		/**
		 * Connect to scale via Web Serial API
		 */
		const connectScale = async () => {
			if (!('serial' in navigator)) {
				errorMessage.value = 'Web Serial API not supported. Use Chrome/Edge browser.';
				return;
			}

			try {
				// Request port access
				scalePort = await navigator.serial.requestPort();
				
				await scalePort.open({
					baudRate: props.scaleConfig.baud_rate || 9600,
					dataBits: 8,
					stopBits: 1,
					parity: 'none',
				});

				connected.value = true;
				errorMessage.value = '';

				// Start reading
				if (props.autoRead) {
					startReading();
				}

				frappe.show_alert({
					message: __('Scale connected'),
					indicator: 'green',
				});
			} catch (error) {
				console.error('Scale connection error:', error);
				errorMessage.value = `Failed to connect: ${error.message}`;
				connected.value = false;
			}
		};

		/**
		 * Disconnect from scale
		 */
		const disconnectScale = async () => {
			stopReading();
			
			if (scalePort) {
				try {
					await scalePort.close();
					scalePort = null;
					connected.value = false;
				} catch (error) {
					console.error('Scale disconnect error:', error);
				}
			}
		};

		/**
		 * Start continuous reading
		 */
		const startReading = async () => {
			if (!scalePort || !connected.value) return;

			isReading.value = true;

			try {
				reader = scalePort.readable.getReader();
				
				// Continuous read loop
				while (true) {
					const { value, done } = await reader.read();
					
					if (done) break;

					// Parse weight from serial data
					const weight = parseScaleData(value);
					
					if (weight !== null) {
						updateWeight(weight);
					}
				}
			} catch (error) {
				console.error('Scale reading error:', error);
				errorMessage.value = `Reading error: ${error.message}`;
				isReading.value = false;
			}
		};

		/**
		 * Stop reading
		 */
		const stopReading = () => {
			isReading.value = false;
			
			if (reader) {
				reader.releaseLock();
				reader = null;
			}

			if (readInterval) {
				clearInterval(readInterval);
				readInterval = null;
			}
		};

		/**
		 * Parse scale data based on protocol
		 */
		const parseScaleData = (data) => {
			// Convert Uint8Array to string
			const text = new TextDecoder().decode(data);
			
			// Mettler Toledo protocol example: "ST,GS,+00000.123 kg"
			// Parse based on configured protocol
			const protocol = props.scaleConfig.protocol || 'mettler_toledo';

			try {
				if (protocol === 'mettler_toledo') {
					// Mettler Toledo format
					const match = text.match(/([+-]?\d+\.\d+)/);
					if (match) {
						return parseFloat(match[1]);
					}
				} else if (protocol === 'cas') {
					// CAS format
					const match = text.match(/(\d+\.\d+)/);
					if (match) {
						return parseFloat(match[1]);
					}
				} else {
					// Generic - try to extract any decimal number
					const match = text.match(/(\d+\.\d+)/);
					if (match) {
						return parseFloat(match[1]);
					}
				}
			} catch (error) {
				console.error('Parse error:', error);
			}

			return null;
		};

		/**
		 * Update weight and check stability
		 */
		const updateWeight = (weight) => {
			currentWeight.value = weight;

			// Check if weight is stable
			if (stabilityTimeout) {
				clearTimeout(stabilityTimeout);
			}

			const weightDiff = Math.abs(weight - previousWeight);
			
			if (weightDiff < 0.01) { // 10g threshold
				stabilityTimeout = setTimeout(() => {
					isStable.value = true;
				}, 1000); // 1 second stability
			} else {
				isStable.value = false;
			}

			previousWeight = weight;
		};

		/**
		 * Capture current weight
		 */
		const captureWeight = () => {
			if (currentWeight.value <= 0) {
				errorMessage.value = 'No weight detected';
				return;
			}

			emit('weight-captured', {
				weight: currentWeight.value,
				unit: weightUnit.value,
				timestamp: new Date().toISOString(),
			});

			frappe.show_alert({
				message: `${__('Weight captured')}: ${formatWeight(currentWeight.value)} ${weightUnit.value}`,
				indicator: 'green',
			});
		};

		/**
		 * Tare the scale (zero)
		 */
		const tare = () => {
			// Send tare command to scale
			// This depends on the scale protocol
			currentWeight.value = 0;
			isStable.value = false;
			
			frappe.show_alert({
				message: __('Scale tared'),
				indicator: 'blue',
			});
		};

		/**
		 * Use manually entered weight
		 */
		const useManualWeight = () => {
			if (manualWeight.value <= 0) {
				errorMessage.value = 'Invalid weight';
				return;
			}

			emit('weight-captured', {
				weight: manualWeight.value,
				unit: weightUnit.value,
				manual: true,
				timestamp: new Date().toISOString(),
			});

			manualWeight.value = 0;
			showManualEntry.value = false;

			frappe.show_alert({
				message: `${__('Manual weight entered')}: ${manualWeight.value} ${weightUnit.value}`,
				indicator: 'blue',
			});
		};

		onMounted(() => {
			// Auto-connect if configured
			if (props.scaleConfig.enabled) {
				// connectScale(); // Uncomment in production
			}
		});

		onUnmounted(() => {
			disconnectScale();
		});

		return {
			connected,
			currentWeight,
			isReading,
			isStable,
			errorMessage,
			showManualEntry,
			manualWeight,
			weightUnit,
			formatWeight,
			connectScale,
			disconnectScale,
			captureWeight,
			tare,
			useManualWeight,
		};
	},
};
</script>

<style scoped>
.scale-widget {
	min-width: 300px;
}

.scale-active {
	border: 2px solid rgb(var(--v-theme-primary));
}

.scale-icon-active {
	animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

.weight-display {
	display: flex;
	align-items: baseline;
	justify-content: center;
	gap: 8px;
	margin: 16px 0;
}

.weight-value {
	font-size: 3rem;
	font-weight: bold;
	color: rgb(var(--v-theme-primary));
	font-family: 'Roboto Mono', monospace;
	transition: all 0.3s ease;
}

.weight-reading {
	color: rgb(var(--v-theme-info));
	animation: reading 1s ease-in-out infinite;
}

@keyframes reading {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
}

.weight-unit {
	font-size: 1.5rem;
	font-weight: 500;
	color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>

