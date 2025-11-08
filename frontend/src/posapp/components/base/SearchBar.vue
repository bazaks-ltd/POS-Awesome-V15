<template>
	<div class="search-bar" :class="searchClasses">
		<v-text-field
			v-model="searchQuery"
			:placeholder="placeholder"
			:prepend-inner-icon="prependIcon"
			:append-inner-icon="appendIcon"
			variant="outlined"
			:density="density"
			:autofocus="autofocus"
			:loading="loading"
			clearable
			hide-details
			@update:model-value="handleInput"
			@keydown.enter="handleEnter"
			@keydown.esc="handleEscape"
			@click:clear="handleClear"
			@click:prepend-inner="handlePrependClick"
			@click:append-inner="handleAppendClick"
			@focus="handleFocus"
			@blur="handleBlur"
		>
			<!-- Optional voice search button -->
			<template v-if="enableVoiceSearch" #append>
				<v-btn
					:icon="isListening ? 'mdi-microphone' : 'mdi-microphone-outline'"
					:color="isListening ? 'error' : 'default'"
					variant="text"
					size="small"
					@click="toggleVoiceSearch"
				></v-btn>
			</template>
		</v-text-field>

		<!-- Recent searches -->
		<v-menu
			v-model="showRecentSearches"
			:close-on-content-click="false"
			activator="parent"
			offset-y
		>
			<v-list v-if="recentSearches.length > 0" density="compact">
				<v-list-subheader>{{ __("Recent Searches") }}</v-list-subheader>
				<v-list-item
					v-for="(search, index) in recentSearches"
					:key="index"
					@click="selectRecentSearch(search)"
				>
					<template #prepend>
						<v-icon size="small">mdi-history</v-icon>
					</template>
					<v-list-item-title>{{ search }}</v-list-item-title>
					<template #append>
						<v-btn
							icon="mdi-close"
							size="x-small"
							variant="text"
							@click.stop="removeRecentSearch(index)"
						></v-btn>
					</template>
				</v-list-item>
				<v-divider></v-divider>
				<v-list-item @click="clearRecentSearches">
					<template #prepend>
						<v-icon size="small">mdi-delete-outline</v-icon>
					</template>
					<v-list-item-title>{{ __("Clear All") }}</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>

		<!-- Search suggestions -->
		<v-menu
			v-model="showSuggestions"
			:close-on-content-click="false"
			activator="parent"
			offset-y
			max-height="300"
		>
			<v-list v-if="suggestions.length > 0" density="compact">
				<v-list-item
					v-for="(suggestion, index) in suggestions"
					:key="index"
					@click="selectSuggestion(suggestion)"
				>
					<template #prepend>
						<v-icon size="small">mdi-magnify</v-icon>
					</template>
					<v-list-item-title v-html="highlightMatch(suggestion)"></v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useDeviceDetection } from '../../composables/types/useDeviceDetection';

export default {
	name: 'SearchBar',
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: () => frappe._('Search items...'),
		},
		autofocus: {
			type: Boolean,
			default: false,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		suggestions: {
			type: Array,
			default: () => [],
		},
		debounce: {
			type: Number,
			default: 300,
		},
		enableVoiceSearch: {
			type: Boolean,
			default: false,
		},
		saveRecentSearches: {
			type: Boolean,
			default: true,
		},
		maxRecentSearches: {
			type: Number,
			default: 10,
		},
	},
	emits: ['update:model-value', 'search', 'clear', 'focus', 'blur', 'voice-search'],
	setup(props, { emit }) {
		const { isMobile, touchTargetSize } = useDeviceDetection();
		
		const searchQuery = ref(props.modelValue);
		const isFocused = ref(false);
		const showRecentSearches = ref(false);
		const showSuggestions = ref(false);
		const recentSearches = ref([]);
		const isListening = ref(false);
		let debounceTimer = null;

		// Density based on device
		const density = computed(() => {
			return isMobile.value ? 'comfortable' : 'compact';
		});

		// Icons
		const prependIcon = computed(() => {
			return 'mdi-magnify';
		});

		const appendIcon = computed(() => {
			return props.loading ? null : (searchQuery.value ? 'mdi-close' : null);
		});

		// Search classes
		const searchClasses = computed(() => ({
			'search-focused': isFocused.value,
			'mobile-search': isMobile.value,
		}));

		/**
		 * Load recent searches from localStorage
		 */
		const loadRecentSearches = () => {
			if (!props.saveRecentSearches) return;
			
			try {
				const saved = localStorage.getItem('pos_recent_searches');
				if (saved) {
					recentSearches.value = JSON.parse(saved);
				}
			} catch (error) {
				console.error('Failed to load recent searches:', error);
			}
		};

		/**
		 * Save recent searches to localStorage
		 */
		const saveRecentSearch = (query) => {
			if (!props.saveRecentSearches || !query.trim()) return;

			// Remove if already exists
			recentSearches.value = recentSearches.value.filter(s => s !== query);
			
			// Add to beginning
			recentSearches.value.unshift(query);
			
			// Limit size
			if (recentSearches.value.length > props.maxRecentSearches) {
				recentSearches.value = recentSearches.value.slice(0, props.maxRecentSearches);
			}

			// Save to localStorage
			try {
				localStorage.setItem('pos_recent_searches', JSON.stringify(recentSearches.value));
			} catch (error) {
				console.error('Failed to save recent searches:', error);
			}
		};

		/**
		 * Handle input with debounce
		 */
		const handleInput = (value) => {
			searchQuery.value = value;
			emit('update:model-value', value);

			// Clear existing timer
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}

			// Set new timer
			debounceTimer = setTimeout(() => {
				if (value && value.length > 0) {
					showSuggestions.value = props.suggestions.length > 0;
					emit('search', value);
				} else {
					showSuggestions.value = false;
				}
			}, props.debounce);
		};

		/**
		 * Handle Enter key
		 */
		const handleEnter = () => {
			if (searchQuery.value) {
				saveRecentSearch(searchQuery.value);
				emit('search', searchQuery.value);
				showSuggestions.value = false;
				showRecentSearches.value = false;
			}
		};

		/**
		 * Handle Escape key
		 */
		const handleEscape = () => {
			searchQuery.value = '';
			emit('update:model-value', '');
			emit('clear');
			showSuggestions.value = false;
			showRecentSearches.value = false;
		};

		/**
		 * Handle clear button
		 */
		const handleClear = () => {
			searchQuery.value = '';
			emit('update:model-value', '');
			emit('clear');
			showSuggestions.value = false;
		};

		/**
		 * Handle prepend icon click
		 */
		const handlePrependClick = () => {
			if (searchQuery.value) {
				handleEnter();
			}
		};

		/**
		 * Handle append icon click
		 */
		const handleAppendClick = () => {
			handleClear();
		};

		/**
		 * Handle focus
		 */
		const handleFocus = () => {
			isFocused.value = true;
			emit('focus');
			
			// Show recent searches if no query
			if (!searchQuery.value && recentSearches.value.length > 0) {
				showRecentSearches.value = true;
			}
		};

		/**
		 * Handle blur
		 */
		const handleBlur = () => {
			isFocused.value = false;
			emit('blur');
			
			// Hide menus with delay to allow clicks
			setTimeout(() => {
				showRecentSearches.value = false;
				showSuggestions.value = false;
			}, 200);
		};

		/**
		 * Select recent search
		 */
		const selectRecentSearch = (search) => {
			searchQuery.value = search;
			emit('update:model-value', search);
			emit('search', search);
			showRecentSearches.value = false;
		};

		/**
		 * Remove recent search
		 */
		const removeRecentSearch = (index) => {
			recentSearches.value.splice(index, 1);
			
			try {
				localStorage.setItem('pos_recent_searches', JSON.stringify(recentSearches.value));
			} catch (error) {
				console.error('Failed to update recent searches:', error);
			}
		};

		/**
		 * Clear all recent searches
		 */
		const clearRecentSearches = () => {
			recentSearches.value = [];
			showRecentSearches.value = false;
			
			try {
				localStorage.removeItem('pos_recent_searches');
			} catch (error) {
				console.error('Failed to clear recent searches:', error);
			}
		};

		/**
		 * Select suggestion
		 */
		const selectSuggestion = (suggestion) => {
			searchQuery.value = suggestion;
			emit('update:model-value', suggestion);
			saveRecentSearch(suggestion);
			emit('search', suggestion);
			showSuggestions.value = false;
		};

		/**
		 * Highlight matching text in suggestions
		 */
		const highlightMatch = (text) => {
			if (!searchQuery.value) return text;
			
			const regex = new RegExp(`(${searchQuery.value})`, 'gi');
			return text.replace(regex, '<strong>$1</strong>');
		};

		/**
		 * Toggle voice search
		 */
		const toggleVoiceSearch = () => {
			isListening.value = !isListening.value;
			emit('voice-search', isListening.value);

			// TODO: Implement actual voice recognition
			// This would use Web Speech API
		};

		// Watch for external changes
		watch(() => props.modelValue, (newValue) => {
			searchQuery.value = newValue;
		});

		// Load recent searches on mount
		loadRecentSearches();

		return {
			searchQuery,
			isFocused,
			showRecentSearches,
			showSuggestions,
			recentSearches,
			isListening,
			density,
			prependIcon,
			appendIcon,
			searchClasses,
			touchTargetSize,
			handleInput,
			handleEnter,
			handleEscape,
			handleClear,
			handlePrependClick,
			handleAppendClick,
			handleFocus,
			handleBlur,
			selectRecentSearch,
			removeRecentSearch,
			clearRecentSearches,
			selectSuggestion,
			highlightMatch,
			toggleVoiceSearch,
		};
	},
};
</script>

<style scoped>
.search-bar {
	width: 100%;
	position: relative;
}

.search-focused {
	z-index: 10;
}

.mobile-search :deep(.v-field__input) {
	font-size: 16px; /* Prevents zoom on iOS */
}

/* Transition for focus */
.search-bar :deep(.v-field) {
	transition: all 0.2s ease;
}

.search-focused :deep(.v-field) {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Highlight in suggestions */
:deep(strong) {
	color: rgb(var(--v-theme-primary));
	font-weight: 600;
}
</style>

