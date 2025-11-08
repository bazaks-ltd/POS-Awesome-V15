<template>
	<v-card class="feature-flags-panel" elevation="2">
		<v-card-title class="bg-primary">
			<v-icon class="mr-2">mdi-flag-variant</v-icon>
			{{ __("Feature Flags Control Panel") }}
		</v-card-title>

		<v-divider></v-divider>

		<v-card-text class="pa-4">
			<!-- Quick Actions -->
			<div class="quick-actions mb-4">
				<v-btn
					color="success"
					variant="elevated"
					prepend-icon="mdi-rocket-launch"
					class="mr-2"
					@click="enableModular"
				>
					{{ __("Enable Modular System") }}
				</v-btn>

				<v-btn
					color="warning"
					variant="elevated"
					prepend-icon="mdi-restore"
					class="mr-2"
					@click="disableModular"
				>
					{{ __("Use Original System") }}
				</v-btn>

				<v-btn
					color="error"
					variant="outlined"
					prepend-icon="mdi-refresh"
					@click="resetAll"
				>
					{{ __("Reset All") }}
				</v-btn>
			</div>

			<v-alert type="info" density="compact" class="mb-4">
				{{ __("Changes take effect after page reload") }}
			</v-alert>

			<!-- Feature Flags List -->
			<v-expansion-panels>
				<!-- Core System -->
				<v-expansion-panel>
					<v-expansion-panel-title>
						<v-icon class="mr-2">mdi-application-cog</v-icon>
						{{ __("Core System") }}
					</v-expansion-panel-title>
					<v-expansion-panel-text>
						<v-switch
							v-for="flag in coreFlags"
							:key="flag.key"
							v-model="flagStates[flag.key]"
							:label="flag.label"
							:hint="flag.hint"
							color="primary"
							hide-details="auto"
							@update:model-value="updateFlag(flag.key, $event)"
						></v-switch>
					</v-expansion-panel-text>
				</v-expansion-panel>

				<!-- Features -->
				<v-expansion-panel>
					<v-expansion-panel-title>
						<v-icon class="mr-2">mdi-feature-search</v-icon>
						{{ __("Features") }}
					</v-expansion-panel-title>
					<v-expansion-panel-text>
						<v-switch
							v-for="flag in featureFlags"
							:key="flag.key"
							v-model="flagStates[flag.key]"
							:label="flag.label"
							:hint="flag.hint"
							color="primary"
							hide-details="auto"
							@update:model-value="updateFlag(flag.key, $event)"
						></v-switch>
					</v-expansion-panel-text>
				</v-expansion-panel>

				<!-- Performance -->
				<v-expansion-panel>
					<v-expansion-panel-title>
						<v-icon class="mr-2">mdi-speedometer</v-icon>
						{{ __("Performance") }}
					</v-expansion-panel-title>
					<v-expansion-panel-text>
						<v-switch
							v-for="flag in performanceFlags"
							:key="flag.key"
							v-model="flagStates[flag.key]"
							:label="flag.label"
							:hint="flag.hint"
							color="primary"
							hide-details="auto"
							@update:model-value="updateFlag(flag.key, $event)"
						></v-switch>
					</v-expansion-panel-text>
				</v-expansion-panel>

				<!-- Debug -->
				<v-expansion-panel>
					<v-expansion-panel-title>
						<v-icon class="mr-2">mdi-bug</v-icon>
						{{ __("Debug") }}
					</v-expansion-panel-title>
					<v-expansion-panel-text>
						<v-switch
							v-for="flag in debugFlags"
							:key="flag.key"
							v-model="flagStates[flag.key]"
							:label="flag.label"
							:hint="flag.hint"
							color="primary"
							hide-details="auto"
							@update:model-value="updateFlag(flag.key, $event)"
						></v-switch>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>

			<!-- Current Status -->
			<div class="status-section mt-4">
				<v-card variant="outlined">
					<v-card-text>
						<div class="status-header text-subtitle-2 mb-2">{{ __("Current Status") }}</div>
						<v-chip
							:color="systemStatus.color"
							variant="flat"
							prepend-icon="mdi-information"
							class="mb-2"
						>
							{{ systemStatus.text }}
						</v-chip>

						<div class="text-caption mt-2">
							{{ enabledCount }} / {{ totalFlags }} {{ __("features enabled") }}
						</div>
					</v-card-text>
				</v-card>
			</div>

			<!-- Actions -->
			<div class="actions-section mt-4">
				<v-btn
					color="primary"
					block
					prepend-icon="mdi-reload"
					@click="reloadPage"
				>
					{{ __("Reload Page to Apply Changes") }}
				</v-btn>
			</div>
		</v-card-text>
	</v-card>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import {
	FEATURE_FLAGS,
	isFeatureEnabled,
	enableFeature,
	disableFeature,
	enableModularSystem,
	disableModularSystem,
	resetAllFeatureFlags,
} from '../../utils/featureFlags';

export default {
	name: 'FeatureFlagsPanel',
	setup() {
		const flagStates = ref({});

		// Flag definitions with labels and hints
		const coreFlags = [
			{
				key: FEATURE_FLAGS.USE_MODULAR_SYSTEM,
				label: 'Use Modular POS System',
				hint: 'Enable the new modular architecture with POS types',
			},
			{
				key: FEATURE_FLAGS.USE_NEW_ITEM_GRID,
				label: 'Use New Item Grid',
				hint: 'CSS Grid rendering instead of RecycleScroller',
			},
			{
				key: FEATURE_FLAGS.USE_DEVICE_LAYOUTS,
				label: 'Use Device Layouts',
				hint: 'Auto-adapt to mobile, tablet, desktop',
			},
			{
				key: FEATURE_FLAGS.USE_TOUCH_GESTURES,
				label: 'Enable Touch Gestures',
				hint: 'Swipe, long-press, pinch gestures',
			},
		];

		const featureFlags = [
			{
				key: FEATURE_FLAGS.ENABLE_SPLIT_PAYMENTS,
				label: 'Split Payments',
				hint: 'Multiple payment methods per transaction',
			},
			{
				key: FEATURE_FLAGS.ENABLE_PLU_KEYPAD,
				label: 'PLU Keypad',
				hint: 'Touch keypad for produce codes',
			},
			{
				key: FEATURE_FLAGS.ENABLE_SCALE_WIDGET,
				label: 'Scale Widget',
				hint: 'Real-time weighing integration',
			},
			{
				key: FEATURE_FLAGS.ENABLE_CUSTOMER_DISPLAY,
				label: 'Customer Display',
				hint: 'Second screen for customers',
			},
		];

		const performanceFlags = [
			{
				key: FEATURE_FLAGS.ENABLE_WEB_WORKERS,
				label: 'Web Workers',
				hint: 'Offload calculations to separate thread',
			},
			{
				key: FEATURE_FLAGS.ENABLE_LAZY_LOADING,
				label: 'Lazy Loading',
				hint: 'Load components on demand',
			},
			{
				key: FEATURE_FLAGS.ENABLE_CODE_SPLITTING,
				label: 'Code Splitting',
				hint: 'Split code by POS type',
			},
		];

		const debugFlags = [
			{
				key: FEATURE_FLAGS.DEBUG_MODE,
				label: 'Debug Mode',
				hint: 'Show debug logs in console',
			},
			{
				key: FEATURE_FLAGS.SHOW_PERFORMANCE_METRICS,
				label: 'Performance Metrics',
				hint: 'Display FPS and timing info',
			},
		];

		// Load current flag states
		const loadFlagStates = () => {
			const allFlags = [...coreFlags, ...featureFlags, ...performanceFlags, ...debugFlags];
			
			allFlags.forEach(flag => {
				flagStates.value[flag.key] = isFeatureEnabled(flag.key);
			});
		};

		// Update flag
		const updateFlag = (flagName, value) => {
			if (value) {
				enableFeature(flagName);
			} else {
				disableFeature(flagName);
			}
		};

		// Quick actions
		const enableModular = () => {
			enableModularSystem();
			loadFlagStates();
			
			frappe.show_alert({
				message: __('Modular system enabled. Reload page to apply.'),
				indicator: 'green',
			});
		};

		const disableModular = () => {
			disableModularSystem();
			loadFlagStates();
			
			frappe.show_alert({
				message: __('Rolled back to original system. Reload page to apply.'),
				indicator: 'orange',
			});
		};

		const resetAll = () => {
			if (confirm(__('Reset all feature flags to default?'))) {
				resetAllFeatureFlags();
				loadFlagStates();
				
				frappe.show_alert({
					message: __('All flags reset. Reload page to apply.'),
					indicator: 'blue',
				});
			}
		};

		const reloadPage = () => {
			window.location.reload();
		};

		// System status
		const systemStatus = computed(() => {
			const modular = flagStates.value[FEATURE_FLAGS.USE_MODULAR_SYSTEM];
			
			if (modular) {
				return {
					color: 'success',
					text: __('Modular System Active'),
				};
			} else {
				return {
					color: 'info',
					text: __('Original System Active'),
				};
			}
		});

		// Count enabled flags
		const enabledCount = computed(() => {
			return Object.values(flagStates.value).filter(v => v === true).length;
		});

		const totalFlags = computed(() => {
			return Object.keys(flagStates.value).length;
		});

		// Load on mount
		onMounted(() => {
			loadFlagStates();
		});

		return {
			flagStates,
			coreFlags,
			featureFlags,
			performanceFlags,
			debugFlags,
			systemStatus,
			enabledCount,
			totalFlags,
			updateFlag,
			enableModular,
			disableModular,
			resetAll,
			reloadPage,
		};
	},
};
</script>

<style scoped>
.feature-flags-panel {
	max-width: 800px;
	margin: 0 auto;
}

.quick-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.status-section {
	border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
	padding-top: 16px;
}

.status-header {
	font-weight: 600;
	color: rgba(var(--v-theme-on-surface), 0.7);
}

:deep(.v-expansion-panel-text__wrapper) {
	padding: 16px;
}

:deep(.v-switch) {
	margin-bottom: 12px;
}
</style>

