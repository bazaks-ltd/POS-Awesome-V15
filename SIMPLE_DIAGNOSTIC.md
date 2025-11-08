# Simple Diagnostic - Find the Issue

## 🎯 Run These 3 Commands

### **Command 1: Check if POS Types Exist** (Backend)

```bash
bench --site your.site console
```

```python
# Paste this:
frappe.get_all("POS Type", fields=["name", "enabled"])
```

**What You Should See**:
```python
[
  {'name': 'Grocery Store', 'enabled': 1},
  {'name': 'Pharmacy', 'enabled': 1},
  {'name': 'Service & Spa', 'enabled': 1},
  {'name': 'Retail', 'enabled': 1}
]
```

**What It Means**:
- ✅ If you see 4 types → Backend is installed correctly
- ❌ If you see `[]` (empty) → Fixtures didn't install
- ❌ If you see error → Migrations didn't run

---

### **Command 2: Check What API Returns** (Backend)

**Still in bench console**:

```python
# Paste this:
from posawesome.posawesome.api.pos_type import get_pos_type_config
result = get_pos_type_config(None)
print(result)
```

**Copy the output** and tell me what you see.

---

### **Command 3: Check in Browser** (Frontend)

**Open browser console (F12)**:

```javascript
// Paste this:
frappe.call({
  method: 'posawesome.posawesome.api.pos_type.get_pos_type_config',
  args: {},
  callback: function(r) {
    console.log('Full API response:', JSON.stringify(r, null, 2));
  }
});
```

**Copy the output** and tell me what you see.

---

## 🔍 Based on Results

### **If Command 1 Shows Empty `[]`**:

POS Types weren't created. Run this:

```bash
bench --site your.site migrate
bench --site your.site install-app posawesome
```

### **If Command 1 Shows Error**:

Migrations didn't complete. Run this:

```bash
# Re-run migrations with details
bench --site your.site migrate --verbose

# Check for errors in output
```

### **If Command 1 Shows 4 Types** ✅:

Backend is good! Continue to Command 2.

---

## 🆘 **Quick Fix: Install Manually**

If fixtures aren't installing automatically:

```bash
bench --site your.site console
```

```python
# Install Grocery Store POS Type manually
doc = frappe.get_doc({
    "doctype": "POS Type",
    "pos_type_name": "Grocery Store",
    "description": "Grocery store POS",
    "icon": "mdi-cart",
    "enabled": 1,
    "is_default": 0,
    "ui_configuration": {
        "enabled_features": ["plu_codes", "weighted_items", "split_payments"],
        "category_navigation_style": "quick_filters"
    },
    "hardware_configuration": {
        "scale": {"enabled": True},
        "printer": {"enabled": True}
    },
    "workflow_configuration": {
        "split_payment_enabled": True
    }
})

doc.insert()
frappe.db.commit()
print("✅ Grocery Store POS Type created!")

# Verify
frappe.get_all("POS Type", fields=["name"])
```

---

## 📊 **Share These Results**

**Please run all 3 commands and share**:

1. Output of Command 1 (POS Types list)
2. Output of Command 2 (API result in Python)
3. Output of Command 3 (API result in browser)

**I'll tell you exactly what to do based on what you see!**

---

## ⚡ **Most Common Issue**

Based on the error, most likely:

**The POS Type doctype exists BUT no POS Type records exist (fixtures didn't install)**

**Quick Check**:
```bash
bench --site your.site console
```

```python
frappe.db.count("POS Type")
# If this returns 0, fixtures didn't install
# If this returns 4, something else is wrong
```

**If it returns 0**, run the manual install script above.

---

**Run the 3 diagnostic commands and let me know what you get!** 🔍

