# Fixed Test Script - Handles All Cases

## 🔧 Issue Fixed

The previous script assumed `ui_configuration` was already parsed, but it might be a JSON string.

---

## ✅ **Copy-Paste This Fixed Version**

### **Paste into Browser Console (F12)**:

```javascript
(async function() {
  console.log('🧪 Testing POSAwesome Modular System...\n');
  
  try {
    // Test 1: Backend API (with better error handling)
    console.log('Testing Backend API...');
    const backend = await frappe.call({
      method: 'posawesome.posawesome.api.pos_type.get_pos_type_config',
      args: {}
    });
    
    if (backend && backend.message) {
      console.log('✅ Backend API Works');
      console.log('   Raw response:', backend.message);
      console.log('   POS Type:', backend.message.name || 'Unknown');
      
      // Check if ui_configuration is string or object
      let uiConfig = backend.message.ui_configuration;
      if (typeof uiConfig === 'string') {
        try {
          uiConfig = JSON.parse(uiConfig);
        } catch (e) {
          console.warn('   ⚠️  ui_configuration is string but not valid JSON');
        }
      }
      
      if (uiConfig && uiConfig.enabled_features) {
        console.log('   Features:', uiConfig.enabled_features.length, 'enabled');
        console.log('   Feature list:', uiConfig.enabled_features);
      } else {
        console.log('   ⚠️  No enabled_features found');
        console.log('   ui_configuration type:', typeof backend.message.ui_configuration);
      }
    } else {
      console.log('❌ Backend API returned no message');
      console.log('   Full response:', backend);
    }
    
  } catch (error) {
    console.error('❌ Backend API Error:', error.message);
    console.error('   Check if migrations ran: bench --site your.site migrate');
    return;
  }
  
  try {
    // Test 2: Cart Service
    console.log('\nTesting Cart Service...');
    const { useCart } = await import('./services/cart/CartService.js');
    const cart = useCart();
    
    await cart.addItem({
      item_code: 'TEST',
      item_name: 'Test Item',
      rate: 10,
      stock_uom: 'Nos',
      actual_qty: 100
    }, 2);
    
    console.log('✅ Cart Service Works');
    console.log('   Items:', cart.items.length);
    console.log('   Total:', cart.getTotals().grandTotal);
    cart.clearCart();
    
  } catch (error) {
    console.error('❌ Cart Service Error:', error.message);
  }
  
  try {
    // Test 3: Payment Service
    console.log('\nTesting Payment Service...');
    const { usePayment } = await import('./services/payment/PaymentService.js');
    const pay = usePayment();
    
    pay.initializePayment(100);
    pay.addPayment({mode_of_payment: 'Cash', amount: 60, account: 'Cash'});
    
    console.log('✅ Payment Service Works');
    console.log('   Remaining:', pay.getRemainingAmount());
    pay.reset();
    
  } catch (error) {
    console.error('❌ Payment Service Error:', error.message);
  }
  
  try {
    // Test 4: POS Type Composable
    console.log('\nTesting POS Type Composable...');
    const { usePosType } = await import('./composables/types/usePosType.js');
    const pt = usePosType();
    
    await pt.loadPosTypeConfig();
    
    console.log('✅ POS Type Composable Works');
    console.log('   Type:', pt.posTypeName.value);
    console.log('   Icon:', pt.icon.value);
    console.log('   Config loaded:', !!pt.posTypeConfig.value);
    
  } catch (error) {
    console.error('❌ POS Type Composable Error:', error.message);
  }
  
  try {
    // Test 5: Device Detection
    console.log('\nTesting Device Detection...');
    const { useDeviceDetection } = await import('./composables/types/useDeviceDetection.js');
    const dev = useDeviceDetection();
    
    console.log('✅ Device Detection Works');
    console.log('   Device:', dev.deviceType.value);
    console.log('   Width:', dev.screenWidth.value);
    console.log('   Touch:', dev.touchCapable.value);
    
  } catch (error) {
    console.error('❌ Device Detection Error:', error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Testing Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ = Working  |  ❌ = Has Issues\n');
  
})();
```

---

## 🔍 **Diagnostic: Why ui_configuration Might Be Undefined**

Let's check what the API is actually returning:

```javascript
// Detailed API inspection
frappe.call({
  method: 'posawesome.posawesome.api.pos_type.get_pos_type_config',
  args: {},
  callback: function(r) {
    console.log('=== API Response Inspection ===');
    console.log('1. Full response:', r);
    console.log('2. Has message?', !!r.message);
    console.log('3. Message type:', typeof r.message);
    console.log('4. Message keys:', r.message ? Object.keys(r.message) : 'N/A');
    
    if (r.message) {
      console.log('5. ui_configuration type:', typeof r.message.ui_configuration);
      console.log('6. ui_configuration value:', r.message.ui_configuration);
      
      // Try to parse if string
      if (typeof r.message.ui_configuration === 'string') {
        try {
          const parsed = JSON.parse(r.message.ui_configuration);
          console.log('7. Parsed ui_configuration:', parsed);
          console.log('8. enabled_features:', parsed.enabled_features);
        } catch (e) {
          console.log('7. Failed to parse:', e.message);
        }
      } else if (r.message.ui_configuration) {
        console.log('7. ui_configuration is object:', r.message.ui_configuration);
        console.log('8. enabled_features:', r.message.ui_configuration.enabled_features);
      } else {
        console.log('7. ui_configuration is null/undefined');
      }
    }
  },
  error: function(err) {
    console.error('❌ API Error:', err);
  }
});
```

Run this and **tell me what you see** - it will show us exactly what the API is returning.

---

## 🔧 **Possible Issues and Fixes**

### **Issue 1: Migrations Didn't Complete**

**Check**:
```bash
bench --site your.site console
```

```python
# Check if POS Type exists
>>> frappe.get_meta("POS Type")
# If error → migrations failed

# Check if any POS Types exist
>>> frappe.get_all("POS Type")
# If empty list → fixtures didn't install
```

**Fix**:
```bash
# Re-run migrations
bench --site your.site migrate --skip-failing

# Check logs
cat sites/your.site/logs/web.log | grep -i "pos type"
```

### **Issue 2: get_pos_type_config Returns Wrong Format**

Let me check the actual API code:

```bash
bench --site your.site console
```

```python
# Test the function directly
>>> from posawesome.posawesome.doctype.pos_type.pos_type import get_pos_type_config
>>> result = get_pos_type_config(None)
>>> print(type(result))
>>> print(result.keys() if isinstance(result, dict) else "Not a dict")
>>> print(result)
```

This will show exactly what the function returns.

### **Issue 3: No POS Types in Database**

```python
# In bench console
>>> count = frappe.db.count("POS Type")
>>> print(f"POS Types in database: {count}")

# If 0, install fixtures manually:
>>> import json
>>> fixture_path = "apps/posawesome/posawesome/posawesome/fixtures/pos_type.json"
>>> with open(fixture_path, 'r') as f:
...     fixtures = json.load(f)
>>> for fixture in fixtures:
...     if not frappe.db.exists("POS Type", fixture["pos_type_name"]):
...         doc = frappe.get_doc(fixture)
...         doc.insert()
>>> frappe.db.commit()
>>> print("✅ Fixtures installed")
```

---

## 🎯 **Let's Debug Together**

### **Step 1: Run This First** (In bench console)

```python
# Check if POS Type doctype exists
>>> frappe.get_meta("POS Type")

# If this works, continue:
>>> types = frappe.get_all("POS Type", fields=["name", "pos_type_name", "enabled"])
>>> print("Found", len(types), "POS Types:")
>>> for t in types:
...     print("  -", t)

# If you see 4 types, backend is good!
# If you see 0 types, fixtures didn't install
```

### **Step 2: Run This Second** (In bench console)

```python
# Test the API function directly
>>> from posawesome.posawesome.api.pos_type import get_pos_type_config
>>> result = get_pos_type_config(None)
>>> print("\nResult type:", type(result))
>>> print("\nResult:", result)

# Check structure
>>> if isinstance(result, dict):
...     print("\nKeys:", result.keys())
...     print("\nName:", result.get("name"))
...     print("\nui_configuration type:", type(result.get("ui_configuration")))
...     ui_config = result.get("ui_configuration")
...     if isinstance(ui_config, dict):
...         print("enabled_features:", ui_config.get("enabled_features"))
...     elif isinstance(ui_config, str):
...         print("ui_configuration is JSON string, needs parsing")
```

### **Step 3: Tell Me What You See**

Based on the output from Step 2, I can tell you exactly what to fix.

---

## 🆘 **Immediate Workaround**

While we debug, you can still test services directly:

```javascript
// Test services work (doesn't need POS Type)
const { useCart } = await import('./services/cart/CartService.js');
const cart = useCart();

const testItem = {
  item_code: 'TEST-001',
  item_name: 'Test Product',
  rate: 25.00,
  stock_uom: 'Nos',
  actual_qty: 100
};

// Add to cart
await cart.addItem(testItem, 3);
console.log('Cart total:', cart.getTotals().grandTotal);

// This proves services work independently
```

---

## 📋 **Action Plan**

### **Right Now**:

1. ✅ **Run Step 1 script** (in bench console)
2. ✅ **Run Step 2 script** (in bench console)
3. ✅ **Copy the output** and share it with me
4. ✅ I'll tell you exactly what to fix

### **OR**:

Just **share the output** from this simpler command:

```bash
bench --site your.site console
```

```python
# Just run this:
>>> frappe.get_all("POS Type", fields=["*"])
```

And paste what you see - I'll diagnose from there!

---

**Let's debug this together - run the scripts above and share the output!** 🔍

