# Quick Test Commands Reference Card

## 🚀 Enable Modular System (Copy-Paste to Browser Console)

### **Method 1: Direct Enable (Works Now)**

```javascript
// Copy this entire block and paste into browser console (F12)

localStorage.setItem('pos_use_modular_system', 'true');
localStorage.setItem('pos_use_new_item_grid', 'true');
localStorage.setItem('pos_use_device_layouts', 'true');
console.log('✅ Modular system enabled!');
console.log('🔄 Reloading in 2 seconds...');
setTimeout(() => location.reload(), 2000);
```

### **Method 2: After Frontend Rebuild**

```bash
# First, rebuild frontend:
cd apps/posawesome/frontend && yarn build

# Then in browser console:
window.posFeatureFlags.enableModular();
location.reload();
```

---

## 🔙 Disable Modular System

```javascript
// Copy-paste to console

localStorage.setItem('pos_use_modular_system', 'false');
localStorage.setItem('pos_use_new_item_grid', 'false');
localStorage.setItem('pos_use_device_layouts', 'false');
console.log('⏮️  Modular system disabled');
console.log('🔄 Reloading in 2 seconds...');
setTimeout(() => location.reload(), 2000);
```

---

## 🧪 Test Backend APIs (bench console)

```bash
bench --site your.site console
```

```python
# Quick tests - paste one at a time

# 1. Check POS Types
frappe.get_all("POS Type", fields=["name"])

# 2. Get Grocery config
from posawesome.posawesome.api.pos_type import get_pos_type_config
config = get_pos_type_config("Grocery Store")
print(config["name"])

# 3. Check custom fields
frappe.db.has_column("POS Profile", "pos_type")

# 4. Test PLU search
from posawesome.posawesome.api.items import search_by_plu
items = search_by_plu("4011")
print(f"Found {len(items)} items")

# 5. Test scale barcode
from posawesome.posawesome.api.items import parse_scale_barcode
result = parse_scale_barcode("02123450125051")
print(result)
```

---

## 🧪 Test Services (Browser Console)

```javascript
// Test Cart Service

const { useCart } = await import('./services/cart/CartService.js');
const cart = useCart();

// Add item
await cart.addItem({
  item_code: 'TEST-001',
  item_name: 'Test Item',
  rate: 10.00,
  stock_uom: 'Nos',
  actual_qty: 100
}, 2);

console.log('Cart:', cart.items);
console.log('Total:', cart.getTotals().grandTotal);

// Clear
cart.clearCart();
```

```javascript
// Test Payment Service

const { usePayment } = await import('./services/payment/PaymentService.js');
const payment = usePayment();

payment.initializePayment(100);
payment.addPayment({
  mode_of_payment: 'Cash',
  amount: 60,
  account: 'Cash - C'
});
payment.addPayment({
  mode_of_payment: 'Card',
  amount: 40,
  account: 'Bank - C'
});

console.log('Payment:', payment.getPaymentSummary());
console.log('Fully paid?', payment.isFullyPaid());
```

---

## 🔍 Check System Status

```javascript
// Check if modular system is enabled

const isModular = localStorage.getItem('pos_use_modular_system') === 'true';
console.log('Modular system:', isModular ? '✅ ENABLED' : '❌ DISABLED');

// Check all flags
const flags = {
  modular: localStorage.getItem('pos_use_modular_system'),
  itemGrid: localStorage.getItem('pos_use_new_item_grid'),
  layouts: localStorage.getItem('pos_use_device_layouts'),
  lazy: localStorage.getItem('pos_enable_lazy_loading'),
};
console.table(flags);
```

---

## 📱 Check Device Detection

```javascript
// After page loads with modular system

// Check device type
console.log('Screen width:', window.innerWidth);
console.log('Expected device:', 
  window.innerWidth < 640 ? 'mobile' :
  window.innerWidth < 1024 ? 'tablet' : 
  'desktop'
);

// Check touch capability
console.log('Touch capable:', 'ontouchstart' in window);
```

---

## 🔧 Debug Commands

### Clear Everything

```javascript
// Complete reset

localStorage.clear();
sessionStorage.clear();
console.log('✅ All storage cleared');
console.log('🔄 Reloading...');
setTimeout(() => location.reload(), 1000);
```

### Check Console for POS Type

```javascript
// After POS loads, look for these messages:

// ✅ Good:
// "POS Type loaded: Grocery Store"
// "Device: desktop"
// "Layout: DesktopLayout"

// ❌ Issues:
// Red error messages
// "Failed to load POS Type"
```

---

## 🎯 Quick Testing Scenarios

### **Scenario 1: Test Backend Only** (5 minutes)

```bash
# In terminal
bench --site your.site console
```

```python
# In console
frappe.get_all("POS Type")
# Expected: 4 types

from posawesome.posawesome.api.pos_type import get_pos_type_config
config = get_pos_type_config("Grocery Store")
print(config.keys())
# Expected: name, ui_configuration, hardware_configuration, workflow_configuration
```

### **Scenario 2: Test Services** (10 minutes)

```javascript
// In browser console (F12)

// Test cart
const { useCart } = await import('./services/cart/CartService.js');
const cart = useCart();
const testItem = {item_code: 'T1', item_name: 'Test', rate: 10, stock_uom: 'Nos', actual_qty: 100};
await cart.addItem(testItem, 2);
console.log('✅ Cart works:', cart.items.length === 1);

// Test payment
const { usePayment } = await import('./services/payment/PaymentService.js');
const pay = usePayment();
pay.initializePayment(100);
pay.addPayment({mode_of_payment: 'Cash', amount: 60, account: 'Cash - C'});
console.log('✅ Payment works:', pay.getRemainingAmount() === 40);
```

### **Scenario 3: Test Full System** (After Rebuild)

```javascript
// Enable
window.posFeatureFlags.enableModular();
location.reload();

// After reload, check console for:
// "POS Type loaded: [type]"
// "Device: [type]"

// Test functionality in UI
```

---

## 📋 Testing Priority

### **Today** (Without Rebuild)

1. ✅ Test backend (bench console)
2. ✅ Test services (browser import)
3. ✅ Enable via localStorage
4. ✅ Verify POS Type configuration

### **After Rebuild** (Tomorrow)

5. ✅ Test with window.posFeatureFlags
6. ✅ Complete full testing checklist
7. ✅ Test on multiple devices
8. ✅ Test all POS types

---

## 🆘 If Something Doesn't Work

### Check These First:

```javascript
// 1. Check migrations ran
// In bench console:
frappe.get_meta("POS Type")  // Should exist

// 2. Check POS Profile configured
// In browser console:
// Go to POS Profile, check "POS Type" field exists

// 3. Check localStorage
localStorage.getItem('pos_use_modular_system')  // Should be "true"

// 4. Check console errors
// Look for red errors in console (F12)

// 5. Hard reload
// Ctrl+Shift+R or Cmd+Shift+R
```

---

## 💡 Pro Tip

**Save this as a bookmark** for quick access:

```javascript
javascript:(function(){const f=['pos_use_modular_system','pos_use_new_item_grid','pos_use_device_layouts'];f.forEach(k=>localStorage.setItem(k,'true'));location.reload();})();
```

Click bookmark to enable modular system instantly!

---

## 📞 Support

**Issues?** → See [IMMEDIATE_TESTING_WORKAROUND.md](./IMMEDIATE_TESTING_WORKAROUND.md)  
**Full Guide?** → See [MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md)  
**Questions?** → Check [START_HERE.md](./START_HERE.md)

---

**You're all set to start testing! Use the workarounds above until you rebuild the frontend.** ✅

