# Modular POS System - Quick Start Guide

## Overview

POSAwesome has been refactored into a modular, type-aware system that supports multiple POS types (Grocery, Pharmacy, Service, Retail) with device-specific layouts and touch-first interactions.

## Core Concepts

### 1. POS Types

POS Types define the behavior, UI, and hardware configuration for different business models:

- **Grocery Store**: Fast checkout, scale integration, PLU codes, split payments
- **Pharmacy**: Prescriptions, drug interactions, insurance claims
- **Service/Spa**: Appointments, resource booking, packages, tips
- **Retail**: General merchandise, variants, bundles

### 2. Service Layer

Business logic is separated from UI components into reusable services:

```javascript
// Cart operations
import { useCart } from '@/services/cart/CartService';
const cart = useCart();
await cart.addItem(item, qty, options);

// Payment processing
import { usePayment } from '@/services/payment/PaymentService';
const payment = usePayment();
payment.initializePayment(totalDue);
payment.addPayment({ mode_of_payment: 'Cash', amount: 100 });
```

### 3. Composables

Type-aware composables provide configuration and behavior:

```javascript
// POS Type configuration
import { usePosType } from '@/composables/types/usePosType';
const { loadPosTypeConfig, isFeatureEnabled, scaleEnabled } = usePosType();
await loadPosTypeConfig(posProfileName);

if (isFeatureEnabled('weighted_items')) {
  // Show scale widget
}

// Device detection
import { useDeviceDetection } from '@/composables/types/useDeviceDetection';
const { isMobile, touchTargetSize, itemsPerRow } = useDeviceDetection();
```

## Creating a New POS Type

### Step 1: Define POS Type in Backend

Create a new POS Type record:

```python
# Via Frappe Desk or fixture
{
  "doctype": "POS Type",
  "pos_type_name": "Restaurant",
  "description": "Restaurant POS with table management",
  "icon": "mdi-silverware-fork-knife",
  "enabled": 1,
  "ui_configuration": {
    "enabled_features": [
      "table_management",
      "modifiers",
      "course_ordering",
      "tips"
    ],
    "item_card_layout": {
      "show_image": true,
      "show_price": true,
      "show_modifiers": true,
      "card_size": "large"
    },
    "category_navigation_style": "tabs",
    "layout_mode": "standard"
  },
  "hardware_configuration": {
    "kitchen_printer": {
      "enabled": true,
      "type": "esc_pos"
    },
    "customer_display": {
      "enabled": true
    }
  },
  "workflow_configuration": {
    "require_table_selection": true,
    "allow_split_bills": true,
    "auto_print_to_kitchen": true
  }
}
```

### Step 2: Create Type-Specific Components

```vue
<!-- RestaurantLayout.vue -->
<template>
  <div class="restaurant-layout">
    <TableSelector v-if="!selectedTable" @table-selected="selectTable" />
    
    <div v-else class="pos-view">
      <ItemsSelector :categories="menuCategories" />
      <OrderView :table="selectedTable" />
      <ModifiersPanel v-if="selectedItem" :item="selectedItem" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { usePosType } from '@/composables/types/usePosType';

export default {
  setup() {
    const { isFeatureEnabled } = usePosType();
    const selectedTable = ref(null);
    
    const selectTable = (table) => {
      selectedTable.value = table;
    };
    
    return {
      selectedTable,
      selectTable,
      showModifiers: isFeatureEnabled('modifiers'),
    };
  },
};
</script>
```

### Step 3: Register Layout Component

```javascript
// posTypes.js
import RestaurantLayout from '@/components/types/restaurant/RestaurantLayout.vue';

export const posTypeLayouts = {
  'Restaurant': {
    mobile: RestaurantLayout,
    tablet: RestaurantLayout,
    desktop: RestaurantLayout,
  },
  'Grocery Store': {
    mobile: GroceryMobileLayout,
    tablet: GroceryTabletLayout,
    desktop: GroceryDesktopLayout,
  },
  // ... other types
};
```

## Using Services

### Cart Service Example

```javascript
import { useCart } from '@/services/cart/CartService';

// In your component
const cart = useCart();

// Add item
await cart.addItem({
  item_code: 'ITEM-001',
  item_name: 'Product Name',
  rate: 10.00,
}, 2, {
  warehouse: 'Main Store',
});

// Update quantity
await cart.updateQuantity(0, 5); // index, new quantity

// Set customer
await cart.setCustomer(customerObj);

// Get totals
const totals = cart.getTotals();
console.log(totals.grandTotal);

// Listen to events
cart.on('cart_updated', (items) => {
  console.log('Cart updated:', items);
});
```

### Payment Service Example

```javascript
import { usePayment } from '@/services/payment/PaymentService';

const payment = usePayment();

// Initialize
payment.initializePayment(150.00);

// Add multiple payment methods (split payment)
payment.addPayment({
  mode_of_payment: 'Cash',
  amount: 100,
  account: 'Cash - C',
});

payment.addPayment({
  mode_of_payment: 'Card',
  amount: 50,
  account: 'Bank - C',
  reference_no: 'TXN123',
});

// Check if fully paid
if (payment.isFullyPaid()) {
  const summary = payment.getPaymentSummary();
  console.log('Change:', summary.change);
  // Complete transaction
}
```

## Creating Reusable Components

### Base Component Pattern

```vue
<!-- ActionButton.vue - Touch-optimized button -->
<template>
  <v-btn
    :class="['action-btn', { 'touch-mode': isTouchDevice }]"
    :height="touchTargetSize"
    v-bind="$attrs"
    @click="handleClick"
  >
    <v-icon v-if="icon" :start="!iconOnly">{{ icon }}</v-icon>
    <span v-if="!iconOnly"><slot /></span>
  </v-btn>
</template>

<script>
import { computed } from 'vue';
import { useDeviceDetection } from '@/composables/types/useDeviceDetection';

export default {
  props: {
    icon: String,
    iconOnly: Boolean,
  },
  setup() {
    const { isMobile, touchTargetSize, touchCapable } = useDeviceDetection();
    
    const isTouchDevice = computed(() => {
      return touchCapable.value || isMobile.value;
    });
    
    return {
      isTouchDevice,
      touchTargetSize,
    };
  },
};
</script>

<style scoped>
.action-btn.touch-mode {
  min-width: 48px;
  min-height: 48px;
  padding: 12px 16px;
}
</style>
```

## Implementing Touch Gestures

```vue
<template>
  <div ref="swipeableElement" class="cart-item">
    <div class="item-content" :style="{ transform: `translateX(${swipeOffset}px)` }">
      <!-- Item content -->
    </div>
    <div class="swipe-actions">
      <v-icon>mdi-delete</v-icon>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useSwipeableItem } from '@/composables/types/useTouchGestures';

export default {
  setup(props, { emit }) {
    const swipeableElement = ref(null);
    
    const {
      swipeOffset,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    } = useSwipeableItem({
      onSwipeLeft: () => {
        emit('delete-item');
      },
      threshold: 80,
    });
    
    return {
      swipeableElement,
      swipeOffset,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    };
  },
};
</script>
```

## Hardware Integration

### Scale Integration Example

```vue
<template>
  <ScaleWidget
    :scale-config="scaleConfig"
    :auto-read="true"
    @weight-captured="handleWeightCaptured"
  />
</template>

<script>
import ScaleWidget from '@/components/types/grocery/ScaleWidget.vue';
import { usePosType } from '@/composables/types/usePosType';

export default {
  components: { ScaleWidget },
  setup() {
    const { getHardwareConfig } = usePosType();
    const scaleConfig = getHardwareConfig('scale');
    
    const handleWeightCaptured = ({ weight, unit }) => {
      // Add weighted item to cart
      cart.addItem(item, weight, {
        is_weighted_item: true,
        weight: weight,
        uom: unit,
      });
    };
    
    return {
      scaleConfig,
      handleWeightCaptured,
    };
  },
};
</script>
```

## Backend API Integration

### Creating New APIs

```python
# posawesome/posawesome/api/custom_feature.py
import frappe

@frappe.whitelist()
def get_custom_data(pos_profile):
    """Custom API endpoint"""
    pos_type = frappe.db.get_value("POS Profile", pos_profile, "pos_type")
    
    # Type-specific logic
    if pos_type == "Grocery Store":
        return get_grocery_data()
    elif pos_type == "Pharmacy":
        return get_pharmacy_data()
    
    return {}
```

### Calling from Frontend

```javascript
const response = await frappe.call({
  method: 'posawesome.posawesome.api.custom_feature.get_custom_data',
  args: {
    pos_profile: posProfileName,
  },
});

const data = response.message;
```

## Testing Your Changes

### 1. Backend Testing

```bash
# Run migrations
bench --site your.site migrate

# Test API endpoints
bench --site your.site console
>>> from posawesome.posawesome.api.pos_type import get_pos_type_config
>>> config = get_pos_type_config("Grocery Store")
>>> print(config)
```

### 2. Frontend Testing

```bash
# Development mode
cd apps/posawesome/frontend
yarn dev

# Build for production
yarn build

# Clear cache
bench --site your.site clear-cache
bench --site your.site clear-website-cache
```

### 3. Browser Testing

- Clear browser cache and local storage
- Test on actual mobile device
- Test touch gestures
- Test hardware integrations (if available)
- Test offline mode

## Best Practices

### 1. Service Layer
- Keep services framework-agnostic (no Vue dependencies)
- Use events for reactive updates
- Implement singleton pattern for stateful services
- Add proper error handling

### 2. Components
- Keep components thin - delegate to services
- Use composables for shared logic
- Follow single responsibility principle
- Make components configurable via props

### 3. POS Type Configuration
- Use JSON for flexible configuration
- Validate configuration on backend
- Provide sensible defaults
- Document configuration options

### 4. Device Handling
- Mobile-first approach
- Progressive enhancement
- Test on real devices
- Consider touch target sizes

### 5. Performance
- Lazy load type-specific code
- Use virtual scrolling where appropriate
- Implement request caching
- Optimize images and assets

## Common Patterns

### Pattern 1: Conditional Feature Rendering

```vue
<template>
  <div>
    <PLUKeypad v-if="isFeatureEnabled('plu_codes')" @item-selected="addItem" />
    <ScaleWidget v-if="scaleEnabled" @weight-captured="setWeight" />
    <SplitPayment v-if="splitPaymentEnabled" :total-due="total" />
  </div>
</template>

<script>
import { usePosType } from '@/composables/types/usePosType';

export default {
  setup() {
    const {
      isFeatureEnabled,
      scaleEnabled,
      splitPaymentEnabled,
    } = usePosType();
    
    return {
      isFeatureEnabled,
      scaleEnabled,
      splitPaymentEnabled,
    };
  },
};
</script>
```

### Pattern 2: Device-Adaptive Layouts

```vue
<template>
  <component :is="currentLayout" />
</template>

<script>
import { computed } from 'vue';
import { useDeviceDetection } from '@/composables/types/useDeviceDetection';
import MobileLayout from './MobileLayout.vue';
import TabletLayout from './TabletLayout.vue';
import DesktopLayout from './DesktopLayout.vue';

export default {
  setup() {
    const { isMobile, isTablet, isDesktop } = useDeviceDetection();
    
    const currentLayout = computed(() => {
      if (isMobile.value) return MobileLayout;
      if (isTablet.value) return TabletLayout;
      return DesktopLayout;
    });
    
    return { currentLayout };
  },
};
</script>
```

### Pattern 3: Service Events

```javascript
// Subscribe to service events
const unsubscribe = cart.on('item_added', (item) => {
  console.log('Item added:', item);
  // Update UI, show notification, etc.
});

// Cleanup on component unmount
onUnmounted(() => {
  unsubscribe();
});
```

## Troubleshooting

### Issue: POS Type not loading
- Check that POS Profile has `pos_type` field set
- Verify POS Type is enabled
- Check browser console for errors
- Verify API endpoint is accessible

### Issue: Hardware not connecting
- Check browser supports required APIs (Web Serial, etc.)
- Verify HTTPS connection (required for Web Serial)
- Check hardware configuration in POS Type
- Grant necessary browser permissions

### Issue: Touch gestures not working
- Verify device has touch capability
- Check touch gesture mappings in POS Type config
- Ensure event handlers are properly attached
- Test on actual touch device (not mouse simulation)

## Additional Resources

- [POSAwesome Documentation](https://github.com/ucraft-com/POS-Awesome/wiki)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vuetify 3 Documentation](https://vuetifyjs.com/)
- [ERPNext Documentation](https://docs.erpnext.com/)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## Support

For questions or issues:
1. Check existing GitHub issues
2. Review implementation summary
3. Test with default POS Type first
4. Check browser console for errors
5. Create detailed GitHub issue with reproduction steps

