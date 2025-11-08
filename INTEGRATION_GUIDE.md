# Integration Guide: Migrating to Modular POS System

## Overview

This guide explains how to integrate the new modular POS system with the existing POSAwesome codebase. The migration can be done gradually without breaking existing functionality.

## Integration Strategy

### Phase 1: Add POS Type Support (Non-Breaking)

The new POS Type system works alongside existing code. Existing POS Profiles without a `pos_type` will use default behavior.

#### Step 1: Run Migrations

```bash
# Apply backend changes
bench --site your.site migrate

# This creates:
# - POS Type doctype
# - Custom fields on POS Profile
# - Installs default POS Type fixtures
```

#### Step 2: Verify Installation

```python
# In bench console
bench --site your.site console

>>> frappe.get_all("POS Type", fields=["name", "enabled"])
[
  {"name": "Grocery Store", "enabled": 1},
  {"name": "Pharmacy", "enabled": 1},
  {"name": "Service & Spa", "enabled": 1},
  {"name": "Retail", "enabled": 1}
]

>>> frappe.db.get_value("POS Profile", "Your Profile", "pos_type")
# Will be None for existing profiles - that's OK!
```

### Phase 2: Use Service Layer in Existing Components

You can start using services immediately without changing components structure.

#### Example: Modify Invoice.vue to Use CartService

**Current Code (components/pos/Invoice.vue)**:
```javascript
// Old way - state in component
data() {
  return {
    items: [],
    customer: null,
  }
},
methods: {
  addItem(item, qty) {
    // Complex logic in component
    this.items.push({...item, qty});
    this.calculateTotals();
  }
}
```

**New Code - Using Service**:
```javascript
// Import service
import { useCart } from '../../services/cart/CartService';

export default {
  setup() {
    const cart = useCart();
    
    // Cart is now managed by service
    return { cart };
  },
  methods: {
    async addItem(item, qty) {
      // Delegate to service
      await cart.addItem(item, qty);
      // Service handles validation, pricing, events
    }
  },
  computed: {
    items() {
      return this.cart.items; // Read from service
    },
    totals() {
      return this.cart.getTotals(); // Calculations in service
    }
  }
}
```

**Benefits**:
- Business logic moves to testable service
- Component becomes simpler
- Multiple components can share cart state
- Easy to add features (just update service)

### Phase 3: Replace ItemsSelector RecycleScroller

This is the biggest visual change but can be done as a feature flag.

#### Step 1: Create Feature Flag

**In Pos.vue or Home.vue**:
```javascript
data() {
  return {
    useNewItemGrid: false, // Set to true to test new grid
  }
}
```

#### Step 2: Conditional Rendering

**In ItemsSelector.vue** (or create new component):
```vue
<template>
  <div>
    <!-- Old RecycleScroller (keep temporarily) -->
    <RecycleScroller
      v-if="!useNewItemGrid"
      v-bind="existingProps"
    >
      <!-- Existing template -->
    </RecycleScroller>

    <!-- New ItemGrid -->
    <ItemGrid
      v-else
      :items="displayedItems"
      :loading="loading"
      :item-card-layout="itemCardLayout"
      @item-selected="click_item"
    >
      <template #item="{ item }">
        <!-- Same item card template as before -->
        <ItemCard
          :item="item"
          :layout="itemCardLayout"
          @click="click_item(item)"
        />
      </template>
    </ItemGrid>
  </div>
</template>

<script>
import ItemGrid from '../items/ItemGrid.vue';
import ItemCard from '../base/ItemCard.vue';

export default {
  components: {
    ItemGrid,
    ItemCard,
  },
  // ... rest of existing code
}
</script>
```

#### Step 3: Test and Switch

1. Set `useNewItemGrid: true`
2. Test all functionality (search, filter, scroll)
3. If working, remove RecycleScroller code
4. Remove vue-virtual-scroller dependency

### Phase 4: Add Device-Aware Layouts

#### Step 1: Modify Pos.vue

**Current Structure**:
```vue
<template>
  <div class="pos-main-container">
    <v-row>
      <v-col>
        <ItemsSelector />
      </v-col>
      <v-col>
        <Invoice />
      </v-col>
    </v-row>
  </div>
</template>
```

**New Structure with Layout Adapter**:
```vue
<template>
  <component
    :is="currentLayout"
    :items="items"
    :categories="categories"
    :loading="loading"
    @item-selected="handleItemSelect"
    @checkout="handleCheckout"
  >
    <!-- Pass existing components as slots -->
    <template #cart>
      <Invoice />
    </template>
    
    <template #customer>
      <Customer />
    </template>
  </component>
</template>

<script>
import { computed } from 'vue';
import { useLayoutAdapter } from '../composables/types/useLayoutAdapter';
import { usePosType } from '../composables/types/usePosType';

export default {
  setup() {
    const { loadPosTypeConfig } = usePosType();
    const { currentLayoutComponent } = useLayoutAdapter();
    
    // Load configuration on mount
    onMounted(async () => {
      await loadPosTypeConfig(posProfile);
    });
    
    return {
      currentLayout: currentLayoutComponent,
    };
  }
}
</script>
```

### Phase 5: Enable Grocery-Specific Features

#### Step 1: Configure POS Profile

1. Open POS Profile in ERPNext
2. Set **POS Type** = "Grocery Store"
3. Set **Device Target** = "Auto" (or specific device)
4. Enable **Split Payments** checkbox
5. Enable **Scale Integration** checkbox
6. Set **Scale Port** and **Protocol**
7. Save

#### Step 2: Load Grocery Components Conditionally

```vue
<template>
  <component :is="currentLayout" v-bind="layoutProps">
    <!-- Grocery-specific features (conditional) -->
    <template v-if="posTypeName === 'Grocery Store'" #quick-actions>
      <PLUKeypad @item-selected="handlePLUItem" />
      <ScaleWidget
        v-if="scaleEnabled"
        :scale-config="scaleConfig"
        @weight-captured="handleWeight"
      />
    </template>
    
    <!-- Payment dialog with split payment support -->
    <template #payment>
      <SplitPayment
        v-if="splitPaymentEnabled"
        :total-due="grandTotal"
        :payment-methods="paymentMethods"
        @payment-complete="submitInvoice"
      />
      <Payments v-else @payment-complete="submitInvoice" />
    </template>
  </component>
</template>

<script>
import { usePosType } from '@/composables/types/usePosType';
import PLUKeypad from '@/components/types/grocery/PLUKeypad.vue';
import ScaleWidget from '@/components/types/grocery/ScaleWidget.vue';
import SplitPayment from '@/components/types/grocery/SplitPayment.vue';

export default {
  components: {
    PLUKeypad,
    ScaleWidget,
    SplitPayment,
  },
  setup() {
    const {
      posTypeName,
      scaleEnabled,
      splitPaymentEnabled,
      getHardwareConfig,
    } = usePosType();
    
    const scaleConfig = computed(() => getHardwareConfig('scale'));
    
    return {
      posTypeName,
      scaleEnabled,
      splitPaymentEnabled,
      scaleConfig,
    };
  }
}
</script>
```

## Backward Compatibility

### Existing POS Profiles Continue Working

- **No POS Type set**: Uses default "Retail" configuration
- **No device target**: Uses "Auto" detection
- **Existing components**: Work as before
- **New features**: Opt-in only

### Gradual Migration Path

```
Week 1: Backend setup + Service layer integration
Week 2: Test ItemGrid with feature flag
Week 3: Enable device layouts for new POS Profiles
Week 4: Migrate all POS Profiles to use POS Types
Week 5: Remove old RecycleScroller code
```

## Complete Integration Example

### Creating a New Grocery Store POS

#### 1. Backend Configuration

```python
# Create POS Profile (via Frappe Desk)
{
  "doctype": "POS Profile",
  "name": "Main Store Checkout 1",
  "company": "Your Company",
  "warehouse": "Main Store",
  "pos_type": "Grocery Store",  # NEW FIELD
  "device_target": "Auto",       # NEW FIELD
  "enable_scale_integration": 1,  # NEW FIELD
  "scale_port": "COM3",
  "scale_protocol": "Mettler Toledo",
  "enable_split_payments": 1,
  # ... existing fields
}
```

#### 2. Frontend Component

```vue
<!-- GroceryPOS.vue -->
<template>
  <div class="grocery-pos">
    <!-- Load appropriate layout automatically -->
    <GroceryLayout
      :items="items"
      :categories="itemGroups"
      :loading="loadingItems"
      :payment-methods="paymentMethods"
      @item-selected="addItemToCart"
      @checkout-complete="handleCheckoutComplete"
    >
      <!-- Customize cart display -->
      <template #cart>
        <ItemsTable
          :items="cartItems"
          @update-item="updateCartItem"
          @remove-item="removeCartItem"
        />
      </template>
    </GroceryLayout>

    <!-- Customer Display (second screen) -->
    <CustomerDisplay
      v-if="customerDisplayEnabled && isCustomerDisplayWindow"
      :store-name="companyName"
      :store-tagline="__('Quality products, great prices')"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useCart } from '@/services/cart/CartService';
import { usePosType } from '@/composables/types/usePosType';
import GroceryLayout from '@/components/types/grocery/GroceryLayout.vue';
import CustomerDisplay from '@/components/types/grocery/CustomerDisplay.vue';

export default {
  name: 'GroceryPOS',
  components: {
    GroceryLayout,
    CustomerDisplay,
  },
  setup() {
    const cart = useCart();
    const {
      loadPosTypeConfig,
      customerDisplayEnabled,
    } = usePosType();

    const items = ref([]);
    const itemGroups = ref([]);
    const loadingItems = ref(false);
    const paymentMethods = ref([]);

    // Cart items from service
    const cartItems = computed(() => cart.items);

    // Check if this is customer display window
    const isCustomerDisplayWindow = computed(() => {
      return window.location.search.includes('customer_display=1');
    });

    /**
     * Load initial data
     */
    const loadData = async () => {
      // Load POS Type config
      await loadPosTypeConfig(posProfile);

      // Load items, categories, etc.
      // ... existing loading logic
    };

    /**
     * Add item to cart
     */
    const addItemToCart = async (item, qty = 1) => {
      try {
        await cart.addItem(item, qty);
      } catch (error) {
        frappe.show_alert({
          message: error.message,
          indicator: 'red',
        });
      }
    };

    /**
     * Handle checkout complete
     */
    const handleCheckoutComplete = async ({ cart: cartData, payment }) => {
      // Submit invoice with payment data
      // ... existing submit logic
    };

    onMounted(() => {
      loadData();
    });

    return {
      items,
      itemGroups,
      loadingItems,
      paymentMethods,
      cartItems,
      customerDisplayEnabled,
      isCustomerDisplayWindow,
      addItemToCart,
      handleCheckoutComplete,
    };
  }
}
</script>
```

## Testing Checklist

### Backend
- [ ] POS Type doctype created
- [ ] Custom fields appear in POS Profile
- [ ] API endpoints return correct data
- [ ] Fixtures install successfully

### Frontend - Service Layer
- [ ] Cart service add/remove/update items
- [ ] Pricing service calculates correctly
- [ ] Payment service handles split payments
- [ ] Validation service checks stock

### Frontend - Components
- [ ] ItemGrid renders items
- [ ] Infinite scroll loads more items
- [ ] ItemCard displays correctly
- [ ] CategoryNav switches modes
- [ ] SearchBar filters items
- [ ] Layouts load based on device

### Grocery Features
- [ ] PLU keypad searches items
- [ ] Scale widget reads weight
- [ ] Split payment allocates amounts
- [ ] Customer display shows cart

### Device Testing
- [ ] Mobile: FAB navigation, bottom sheets, swipe gestures
- [ ] Tablet: Split screen, expandable panels
- [ ] Desktop: Three column, all features visible
- [ ] Orientation changes handled

### POS Types
- [ ] Retail type shows standard features
- [ ] Grocery type shows scale, PLU, split payment
- [ ] Pharmacy type shows prescriptions
- [ ] Service type shows bookings

## Troubleshooting

### Issue: "POS Type" link field not showing
**Solution**: Clear cache and refresh
```bash
bench --site your.site clear-cache
# Then reload browser with Ctrl+Shift+R
```

### Issue: API endpoints return 404
**Solution**: Restart bench
```bash
bench restart
```

### Issue: Items not loading in ItemGrid
**Solution**: Check console for errors, verify data structure
```javascript
// Items should have these minimum fields:
{
  item_code: "ITEM-001",
  item_name: "Product Name",
  rate: 10.00,
  actual_qty: 100,
  item_group: "Category",
}
```

### Issue: Layouts not switching on device change
**Solution**: Check device detection
```javascript
// In browser console
import { useDeviceDetection } from '@/composables/types/useDeviceDetection';
const { deviceType, isMobile } = useDeviceDetection();
console.log(deviceType.value); // Should show current device
```

### Issue: Touch gestures not working
**Solution**: Ensure touch events are attached
```javascript
// Check in browser
'ontouchstart' in window // Should be true on touch devices
```

## Migration Examples

### Example 1: Migrate ItemsSelector.vue

**Before**:
```vue
<RecycleScroller
  :items="displayedItems"
  :item-size="cardRowHeight"
  class="virtual-scroller"
>
  <template #default="{ item }">
    <div class="card-item-card">
      <!-- Complex item card -->
    </div>
  </template>
</RecycleScroller>
```

**After**:
```vue
<ItemGrid
  :items="displayedItems"
  :item-card-layout="itemCardLayout"
  @item-selected="handleItemClick"
>
  <template #item="{ item }">
    <ItemCard
      :item="item"
      :layout="itemCardLayout"
      @click="handleItemClick(item)"
    />
  </template>
</ItemGrid>
```

**Remove**:
- All RecycleScroller imports
- Complex CSS overrides (lines 4098-4335 in ItemsSelector.vue)
- Manual grid calculations
- cardRowHeight, cardColumns computations

### Example 2: Add Split Payment to Payments.vue

**Before**:
```vue
<template>
  <div class="payment-container">
    <v-select v-model="paymentMethod" :items="methods" />
    <v-text-field v-model="amount" label="Amount" />
    <v-btn @click="submitPayment">Pay</v-btn>
  </div>
</template>
```

**After (with split payment support)**:
```vue
<template>
  <div class="payment-container">
    <!-- Use split payment if enabled -->
    <SplitPayment
      v-if="splitPaymentEnabled"
      :total-due="grandTotal"
      :payment-methods="paymentMethods"
      @payment-complete="handlePayment"
    />
    
    <!-- Fallback to single payment -->
    <div v-else>
      <!-- Existing single payment UI -->
    </div>
  </div>
</template>

<script>
import { usePosType } from '@/composables/types/usePosType';
import SplitPayment from '@/components/types/grocery/SplitPayment.vue';

export default {
  components: { SplitPayment },
  setup() {
    const { splitPaymentEnabled } = usePosType();
    return { splitPaymentEnabled };
  }
}
</script>
```

### Example 3: Add Device-Aware Component Loading

**Before (single layout)**:
```vue
<template>
  <v-row>
    <v-col cols="5"><ItemsSelector /></v-col>
    <v-col cols="7"><Invoice /></v-col>
  </v-row>
</template>
```

**After (device-aware)**:
```vue
<template>
  <component
    :is="currentLayout"
    v-bind="layoutProps"
  >
    <template #items>
      <ItemsSelector />
    </template>
    <template #cart>
      <Invoice />
    </template>
  </component>
</template>

<script>
import { useLayoutAdapter } from '@/composables/types/useLayoutAdapter';

export default {
  setup() {
    const { currentLayoutComponent } = useLayoutAdapter();
    
    return {
      currentLayout: currentLayoutComponent,
    };
  }
}
</script>
```

## Configuration Examples

### Example 1: Configure Grocery Store

```json
// POS Type: Grocery Store (via Frappe Desk)
{
  "ui_configuration": {
    "enabled_features": [
      "barcode_scanning",
      "plu_codes",
      "weighted_items",
      "split_payments",
      "quick_tender",
      "customer_display"
    ],
    "item_card_layout": {
      "show_image": true,
      "show_stock": true,
      "show_price": true,
      "show_unit_price": true,
      "show_plu": true,
      "card_size": "large"
    },
    "category_navigation_style": "quick_filters",
    "layout_mode": "fast_checkout"
  },
  "hardware_configuration": {
    "scale": {
      "enabled": true,
      "type": "serial",
      "protocol": "mettler_toledo",
      "port": "COM3"
    }
  }
}
```

### Example 2: Configure Pharmacy

```json
{
  "ui_configuration": {
    "enabled_features": [
      "prescriptions",
      "batches",
      "expiry_tracking",
      "insurance"
    ],
    "item_card_layout": {
      "show_image": true,
      "show_expiry": true,
      "show_generic_name": true,
      "card_size": "medium"
    },
    "category_navigation_style": "tree",
    "search_priority": "high"
  }
}
```

## Performance Comparison

### Before (RecycleScroller)
- Heavy CSS overrides: 200+ lines
- Position calculations: Every scroll
- Memory usage: High (maintains virtual DOM)
- Flexibility: Low (hard to customize layouts)

### After (ItemGrid)
- Native CSS Grid: ~50 lines
- No calculations: Browser handles it
- Memory usage: Low (content-visibility: auto)
- Flexibility: High (pure CSS, any layout possible)

## API Integration

### New APIs to Call

```javascript
// 1. Load POS Type configuration
const config = await frappe.call({
  method: 'posawesome.posawesome.api.pos_type.get_pos_type_config',
  args: { pos_profile: 'Main Store' }
});

// 2. Search by PLU
const items = await frappe.call({
  method: 'posawesome.posawesome.api.items.search_by_plu',
  args: { plu_code: '4011' } // Bananas
});

// 3. Get quick PLU items
const quickItems = await frappe.call({
  method: 'posawesome.posawesome.api.items.get_quick_plu_items'
});
```

## Next Steps After Integration

1. **Test thoroughly** on all devices
2. **Gather user feedback** from cashiers
3. **Optimize performance** based on real usage
4. **Add custom POS types** as needed
5. **Extend hardware integrations** (printer, card reader)

## Support

- **Documentation**: See MODULAR_POS_QUICKSTART.md
- **Examples**: Check components in `types/grocery/`
- **Architecture**: Review VUE3_REFACTOR_README.md
- **Progress**: See PROGRESS_UPDATE.md

---

**Note**: This integration can be done incrementally. Start with one POS Profile, test thoroughly, then migrate others.

