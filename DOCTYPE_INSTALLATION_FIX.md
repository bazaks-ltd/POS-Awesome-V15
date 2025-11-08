# DocType Installation Fix - POS Type Not Recognized

## 🎯 The Issue

**Error**: `No module named 'frappe.core.doctype.pos_type'`

**Cause**: The POS Type doctype files exist but Frappe hasn't loaded them into the system yet.

**The files ARE there**:
```
apps/posawesome/posawesome/posawesome/doctype/pos_type/
├── __init__.py ✅
├── pos_type.json ✅
└── pos_type.py ✅
```

**But Frappe doesn't know about them yet.**

---

## ✅ **THE FIX (Run These Commands)**

### **Step 1: Clear All Caches**

```bash
cd /Volumes/TZARMORSP/wrk/posbaz/frappe-bench

# Clear Python cache
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete 2>/dev/null

# Clear Frappe cache
bench --site your.site clear-cache

# Rebuild (this makes Frappe recognize doctypes)
bench build --app posawesome

# Restart
bench restart
```

### **Step 2: Run Migrations Again**

```bash
bench --site your.site migrate
```

**Look for this in output**:
```
Updating DocTypes for posawesome...
Creating POS Type...
```

### **Step 3: Verify DocType Created**

```bash
bench --site your.site console
```

```python
# This should now work:
frappe.get_meta("POS Type")

# You should see: <DocType: POS Type> with no error
```

---

## 🔧 **Alternative: Force DocType Sync**

If the above doesn't work, force Frappe to sync the doctype:

```bash
bench --site your.site console
```

```python
# Force sync the doctype
import frappe
from frappe.modules.import_file import import_file_by_path

# Path to pos_type.json
doctype_path = "apps/posawesome/posawesome/posawesome/doctype/pos_type/pos_type.json"

# Import it
import_file_by_path(doctype_path, force=True)

print("✅ POS Type synced!")

# Verify
frappe.get_meta("POS Type")
# Should work now with no error
```

---

## 🎯 **Expected Results After Fix**

### **After bench build --app posawesome**:

```
Building posawesome...
✓ Compiling Python files...
✓ Syncing DocTypes...
✓ Building frontend...
✓ Done
```

### **After bench --site your.site migrate**:

```
Migrating your.site
Updating DocTypes for posawesome...
Creating POS Type... ← You should see this!
✓ Migration complete
```

### **After Verification**:

```python
>>> frappe.get_meta("POS Type")
<DocType: POS Type>  ← Success!

>>> frappe.db.count("POS Type")
0  ← This is OK, we'll install records next
```

---

## 📋 **Complete Fix Procedure**

### **Copy-paste each block in order**:

#### **1. Terminal Commands**:

```bash
cd /Volumes/TZARMORSP/wrk/posbaz/frappe-bench

# Clear caches
bench clear-cache
bench --site your.site clear-cache

# Build app (makes Frappe recognize new doctypes)
bench build --app posawesome

# Migrate
bench --site your.site migrate

# Restart
bench restart
```

#### **2. Verify in Console**:

```bash
bench --site your.site console
```

```python
# Check doctype exists
frappe.get_meta("POS Type")
# Should return doctype meta, not error
```

#### **3. Install Records**:

```python
# Still in console
import frappe, json

# Install Retail
frappe.get_doc({
    "doctype": "POS Type",
    "pos_type_name": "Retail",
    "description": "Retail POS",
    "icon": "mdi-store",
    "enabled": 1,
    "is_default": 1,
    "ui_configuration": json.dumps({
        "enabled_features": ["variants", "bundles"],
        "category_navigation_style": "tabs"
    }),
    "hardware_configuration": "{}",
    "workflow_configuration": "{}"
}).insert()

# Install Grocery Store
frappe.get_doc({
    "doctype": "POS Type",
    "pos_type_name": "Grocery Store",
    "description": "Grocery POS",
    "icon": "mdi-cart",
    "enabled": 1,
    "ui_configuration": json.dumps({
        "enabled_features": ["plu_codes", "weighted_items", "split_payments"],
        "category_navigation_style": "quick_filters"
    }),
    "hardware_configuration": json.dumps({"scale": {"enabled": True}}),
    "workflow_configuration": json.dumps({"split_payment_enabled": True})
}).insert()

frappe.db.commit()
print("✅ Installed POS Types!")

# Verify
frappe.get_all("POS Type", fields=["name"])
```

**Expected**: List with Retail and Grocery Store

#### **4. Test API**:

**Still in console**:

```python
from posawesome.posawesome.api.pos_type import get_pos_type_config
result = get_pos_type_config(None)
print("POS Type:", result["name"])
print("Features:", result["ui_configuration"]["enabled_features"])
```

**Expected**: Should print POS Type and features with no error

---

## ⚡ **Quick Summary**

**The Issue**: DocType files exist but Frappe hasn't loaded them

**The Fix**:
1. `bench build --app posawesome` ← This is the key command!
2. `bench --site your.site migrate`
3. Install records via console
4. Test

**Time**: 5 minutes

---

## 🎯 **One-Command Quick Fix**

If you want to do it all at once:

```bash
cd /Volumes/TZARMORSP/wrk/posbaz/frappe-bench && \
bench clear-cache && \
bench build --app posawesome && \
bench --site your.site migrate && \
bench restart && \
echo "✅ Done! Now install records in console"
```

Then open console and install the records using the script in Step 3 above.

---

**Run `bench build --app posawesome` first - that's the key command that will fix it!** ✅
