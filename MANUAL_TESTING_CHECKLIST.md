# Manual Testing Checklist - Vue 3 Modular POS System

## 📋 Testing Overview

This checklist covers all aspects of the modular POS system. Complete each section and mark items as ✅ (pass), ❌ (fail), or ⚠️ (warning/partial).

**Tester**: _______________  
**Date**: _______________  
**Environment**: ☐ Dev  ☐ Test  ☐ Production  
**Browser**: ☐ Chrome  ☐ Edge  ☐ Firefox  ☐ Safari  

---

## 🔧 Pre-Testing Setup

### Backend Verification

```bash
# Run these commands first
cd /Volumes/TZARMORSP/wrk/posbaz/frappe-bench
bench --site your.site migrate
bench restart
```

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1.1 | Run `bench --site your.site migrate` | No errors, migrations applied | ☐ |
| 1.2 | Check output for "POS Type" | See "Creating POS Type..." message | ☐ |
| 1.3 | Restart: `bench restart` | Services restart successfully | ☐ |
| 1.4 | Open console: `bench --site your.site console` | Console opens | ☐ |

### Backend Database Verification

In bench console, run these commands:

```python
# Copy and paste each line
>>> import frappe

# Check POS Type doctype exists
>>> frappe.get_meta("POS Type")
# Expected: <Document POS Type>

# Check POS Types installed
>>> frappe.get_all("POS Type", fields=["name", "enabled"])
# Expected: List with 4 types

# Check custom fields added
>>> frappe.db.has_column("POS Profile", "pos_type")
# Expected: True

>>> frappe.db.has_column("POS Profile", "device_target")
# Expected: True

>>> frappe.db.has_column("POS Profile", "enable_split_payments")
# Expected: True

>>> exit()
```

| Test | Command | Expected Result | Status |
|------|---------|-----------------|--------|
| 2.1 | `frappe.get_meta("POS Type")` | Returns DocType meta | ☐ |
| 2.2 | Check POS Types count | 4 types (Grocery, Pharmacy, Service, Retail) | ☐ |
| 2.3 | Check pos_type field | True | ☐ |
| 2.4 | Check device_target field | True | ☐ |
| 2.5 | Check enable_split_payments field | True | ☐ |

### Frontend Build Verification

```bash
cd apps/posawesome/frontend
yarn build
```

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 3.1 | Run `yarn build` | Build completes without errors | ☐ |
| 3.2 | Check output | "Build completed in X seconds" | ☐ |
| 3.3 | Check dist folder | Files in `posawesome/public/dist/` | ☐ |

### Cache Clearing

```bash
bench --site your.site clear-cache
bench --site your.site clear-website-cache
```

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 4.1 | Clear cache | "Cache cleared" message | ☐ |
| 4.2 | Clear website cache | Success message | ☐ |

---

## 📱 Frontend Testing - Browser Console

### Open Browser and Test

1. **Open your ERPNext site** in browser
2. **Press F12** to open developer console
3. **Navigate to** /app/posawesome

### Console Verification

Run these commands in browser console:

```javascript
// Check feature flags available
window.posFeatureFlags
// Expected: Object with methods

// Check all flags
window.posFeatureFlags.getAll()
// Expected: Object with all flags (currently all false)

// Enable modular system
window.posFeatureFlags.enableModular()
// Expected: Console logs about enabling features

// Reload page
location.reload()
```

| Test | Command | Expected Result | Status |
|------|---------|-----------------|--------|
| 5.1 | Check `window.posFeatureFlags` exists | Object with enable/disable methods | ☐ |
| 5.2 | Run `getAll()` | Shows all feature flags | ☐ |
| 5.3 | Run `enableModular()` | Logs "Modular system enabled" | ☐ |
| 5.4 | Reload page | Page reloads | ☐ |

---

## 🎯 POS Profile Configuration

### Configure Test POS Profile

1. **Go to**: Accounts → POS Profile
2. **Select or create** a test profile

| Step | Field | Value to Set | Status |
|------|-------|--------------|--------|
| 6.1 | POS Type | Select "Grocery Store" | ☐ |
| 6.2 | Device Target | Select "Auto" | ☐ |
| 6.3 | Item Grouping Mode | Select "Quick Filters" | ☐ |
| 6.4 | Layout Mode | Select "Fast Checkout" | ☐ |
| 6.5 | Enable Touch Gestures | Check ✓ | ☐ |
| 6.6 | Enable Split Payments | Check ✓ | ☐ |
| 6.7 | Save profile | Saved successfully | ☐ |

**Notes**: __________________________________________________

---

## 🖥️ Desktop Testing (Width > 1024px)

### Test Environment Setup

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 7.1 | Open POS | POS interface loads | ☐ |
| 7.2 | Open browser console (F12) | Console opens | ☐ |
| 7.3 | Look for "POS Type loaded" | See "POS Type loaded: Grocery Store" | ☐ |
| 7.4 | Check for errors | No red errors in console | ☐ |

### Layout Verification (Desktop)

| Test | Element | What to Check | Status |
|------|---------|---------------|--------|
| 8.1 | Layout structure | Three-column layout visible | ☐ |
| 8.2 | Left column | Categories/filters visible | ☐ |
| 8.3 | Center column | Items grid visible | ☐ |
| 8.4 | Right column | Cart/customer visible | ☐ |
| 8.5 | Navigation drawer | Permanent drawer on left | ☐ |
| 8.6 | Search bar | Search in top app bar | ☐ |

### Item Grid Rendering

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 9.1 | Look at items display | Items shown in CSS Grid | ☐ |
| 9.2 | Count visible items | 20-40 items initially visible | ☐ |
| 9.3 | Check item cards | Cards show image, name, price, stock | ☐ |
| 9.4 | Hover over item | Card lifts slightly (hover effect) | ☐ |
| 9.5 | Scroll down slowly | More items load progressively | ☐ |
| 9.6 | Scroll performance | Smooth, no jank, 60 FPS feel | ☐ |
| 9.7 | Check console | No positioning errors | ☐ |

### Search Functionality

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 10.1 | Click search bar | Input focuses | ☐ |
| 10.2 | Type item name | Items filter as you type | ☐ |
| 10.3 | Clear search (X button) | All items shown again | ☐ |
| 10.4 | Press Enter on search | Search executes | ☐ |
| 10.5 | Type then clear | Recent searches shown | ☐ |

### Category Navigation

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 11.1 | Look for category chips | Horizontal scrollable chips | ☐ |
| 11.2 | Click a category | Items filter to that category | ☐ |
| 11.3 | Click another category | Both categories selected (multi-select) | ☐ |
| 11.4 | Click "Clear All" | All categories cleared | ☐ |
| 11.5 | Check item count | Updates as filters change | ☐ |

### Item Selection

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 12.1 | Click an item card | Item added to cart | ☐ |
| 12.2 | Check right panel | Cart shows added item | ☐ |
| 12.3 | Add same item again | Quantity increases | ☐ |
| 12.4 | Add different item | New line in cart | ☐ |
| 12.5 | Check cart total | Total calculates correctly | ☐ |

---

## 📱 Mobile Testing (Width < 640px)

### Setup for Mobile Testing

**Option 1**: Resize browser to < 640px width  
**Option 2**: Use Chrome DevTools device emulation (F12 → Toggle device toolbar)  
**Option 3**: Test on actual mobile device (recommended)

### Layout Verification (Mobile)

| Test | Element | What to Check | Status |
|------|---------|---------------|--------|
| 13.1 | Layout structure | Single column layout | ☐ |
| 13.2 | App bar | Top app bar with menu, search, cart | ☐ |
| 13.3 | Floating Action Button | FAB visible bottom right | ☐ |
| 13.4 | Items view | Full-screen items display | ☐ |
| 13.5 | Navigation | Hamburger menu icon | ☐ |

### Mobile Navigation

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 14.1 | Click hamburger menu | Drawer slides in from left | ☐ |
| 14.2 | Click outside drawer | Drawer closes | ☐ |
| 14.3 | Click search icon | Search overlay appears fullscreen | ☐ |
| 14.4 | Type in search | Items filter | ☐ |
| 14.5 | Close search | Returns to items view | ☐ |

### Mobile Cart Interaction

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 15.1 | Click cart FAB | Cart view slides in | ☐ |
| 15.2 | Check cart display | Full-screen cart view | ☐ |
| 15.3 | Click back arrow FAB | Returns to items view | ☐ |
| 15.4 | Add item | Automatically shows cart | ☐ |

### Touch Target Verification (Mobile)

| Test | Element | What to Check | Status |
|------|---------|---------------|--------|
| 16.1 | Item cards | Easy to tap (48px minimum) | ☐ |
| 16.2 | Buttons | Large enough for finger | ☐ |
| 16.3 | FAB button | Easy to reach with thumb | ☐ |
| 16.4 | Search input | Tapping works, no zoom on iOS | ☐ |
| 16.5 | Category chips | Easy to tap | ☐ |

---

## 📟 Tablet Testing (Width 640-1024px)

### Setup for Tablet Testing

Resize browser to ~800px width or use actual tablet

### Layout Verification (Tablet)

| Test | Element | What to Check | Status |
|------|---------|---------------|--------|
| 17.1 | Layout structure | Two-column layout (items | cart) | ☐ |
| 17.2 | Left panel | Items take ~60% width | ☐ |
| 17.3 | Right panel | Cart takes ~40% width | ☐ |
| 17.4 | Both panels visible | Can see items and cart together | ☐ |
| 17.5 | App bar | Search in app bar | ☐ |

### Tablet Interactions

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 18.1 | Add item | Instantly visible in cart panel | ☐ |
| 18.2 | Scroll items | Cart stays fixed | ☐ |
| 18.3 | Resize to portrait | Layout adapts (vertical split) | ☐ |
| 18.4 | Resize to landscape | Layout adapts (horizontal split) | ☐ |

---

## 🏪 Grocery Store Features Testing

### PLU Keypad Test

**Note**: Only visible if POS Type = "Grocery Store"

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 19.1 | Look for PLU keypad | Visible in left panel or quick actions | ☐ |
| 19.2 | Click number "4" | "4" appears in display | ☐ |
| 19.3 | Click "0", "1", "1" | Display shows "4011" | ☐ |
| 19.4 | Click search/magnify | Searches for PLU 4011 | ☐ |
| 19.5 | Click backspace | Removes last digit | ☐ |
| 19.6 | Click clear (X) | Clears all digits | ☐ |

**Expected API Call**:
```
Method: posawesome.posawesome.api.items.search_by_plu
Args: { plu_code: "4011" }
```

**Notes**: __________________________________________________

### Scale Widget Test

**Note**: Requires POS Type = "Grocery Store" and "Enable Scale Integration" ✓

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 20.1 | Look for scale widget | Widget visible (if enabled) | ☐ |
| 20.2 | Check connection status | Shows "Disconnected" (no scale) | ☐ |
| 20.3 | Click "Manual Entry" | Manual weight input appears | ☐ |
| 20.4 | Enter weight "1.250" | Value appears in field | ☐ |
| 20.5 | Click "Use" | Weight value ready to use | ☐ |

**With Real Scale** (if available):

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 20.6 | Connect scale to PC | Scale powered on | ☐ |
| 20.7 | Click "Connect" in widget | Browser asks for serial port permission | ☐ |
| 20.8 | Grant permission | Widget shows "Connected" | ☐ |
| 20.9 | Place item on scale | Weight updates in real-time | ☐ |
| 20.10 | Remove item | Weight returns to 0.000 | ☐ |
| 20.11 | Place item again | Weight shows stable after 1 second | ☐ |
| 20.12 | Click "Use Weight" | Weight captured, ready to add item | ☐ |
| 20.13 | Click "Tare" | Scale resets to zero | ☐ |

**Notes**: __________________________________________________

### Split Payment Test

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 21.1 | Add items totaling $100 | Cart shows $100 total | ☐ |
| 21.2 | Click "Checkout" | Split Payment dialog appears | ☐ |
| 21.3 | See total due | Shows $100.00 | ☐ |
| 21.4 | Select "Cash" | Cash selected | ☐ |
| 21.5 | Enter amount "60" | $60 entered | ☐ |
| 21.6 | Click "Add Payment" | Cash $60 added to list | ☐ |
| 21.7 | Check remaining | Shows $40.00 remaining | ☐ |
| 21.8 | Check progress bar | Shows 60% filled | ☐ |
| 21.9 | Select "Card" | Card selected | ☐ |
| 21.10 | Click "All" button | Auto-fills $40 | ☐ |
| 21.11 | Click "Add Payment" | Card $40 added | ☐ |
| 21.12 | Check progress bar | Shows 100% (green) | ☐ |
| 21.13 | Check "Complete Payment" button | Enabled (not disabled) | ☐ |
| 21.14 | Click "Complete Payment" | Payment completes, invoice submits | ☐ |

**Notes**: __________________________________________________

### Customer Display Test

**Setup**: Open POS in one browser window, open `/app/posawesome?customer_display=1` in another window (simulate second screen)

| Test | Action (Main POS) | Expected Result (Customer Display) | Status |
|------|-------------------|-------------------------------------|--------|
| 22.1 | Add item to cart | Item appears on customer display | ☐ |
| 22.2 | Add second item | Display updates with new item | ☐ |
| 22.3 | Check running total | Total shows correctly | ☐ |
| 22.4 | Apply discount | Savings shown on display | ☐ |
| 22.5 | Check time | Current time updates every second | ☐ |
| 22.6 | Check promotions | Promotional messages rotate | ☐ |

**Notes**: __________________________________________________

### Quick Touch Grid Test

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 23.1 | Look for quick touch grid | Grid visible in left panel | ☐ |
| 23.2 | See popular items | Shows 8-12 items with images | ☐ |
| 23.3 | Click category selector | Dropdown shows categories | ☐ |
| 23.4 | Select different category | Items update to that category | ☐ |
| 23.5 | Click an item card | Item added to cart | ☐ |
| 23.6 | Click quick add (+) | Item added without details | ☐ |
| 23.7 | Hover over item | Quick add button appears | ☐ |

**Notes**: __________________________________________________

---

## 🏥 Pharmacy POS Testing

### Setup

Change POS Profile: Set "POS Type" = "Pharmacy"  
Reload browser: Ctrl+Shift+R

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 24.1 | POS loads | Pharmacy layout loads | ☐ |
| 24.2 | Check console | "POS Type loaded: Pharmacy" | ☐ |
| 24.3 | Check quick actions | See "Upload Prescription", "Check Interactions", "Insurance Claim" | ☐ |
| 24.4 | Click "Upload Prescription" | Shows "Coming soon" message | ☐ |
| 24.5 | Check category style | Tree navigation (not filters) | ☐ |
| 24.6 | Item cards | Show batch/expiry fields (if configured) | ☐ |

**Notes**: __________________________________________________

---

## 💆 Service & Spa POS Testing

### Setup

Change POS Profile: Set "POS Type" = "Service & Spa"  
Reload browser

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 25.1 | POS loads | Service layout loads | ☐ |
| 25.2 | Check console | "POS Type loaded: Service & Spa" | ☐ |
| 25.3 | Check quick actions | See "Book Appointment", "Service Packages", "Membership" | ☐ |
| 25.4 | Check cart actions | Tip amount field visible | ☐ |
| 25.5 | Enter tip amount | Can enter tip value | ☐ |
| 25.6 | Category style | Tabs (swipeable) | ☐ |

**Notes**: __________________________________________________

---

## 🛍️ Retail POS Testing

### Setup

Change POS Profile: Set "POS Type" = "Retail"  
Reload browser

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 26.1 | POS loads | Retail layout loads | ☐ |
| 26.2 | Check console | "POS Type loaded: Retail" | ☐ |
| 26.3 | Layout structure | Standard three-column (desktop) | ☐ |
| 26.4 | Category style | Hybrid (tabs + filters) | ☐ |
| 26.5 | All features | Variants, bundles, standard checkout | ☐ |

**Notes**: __________________________________________________

---

## 🎨 Device Adaptation Testing

### Resize Testing (Desktop Browser)

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 27.1 | Start at full screen (>1024px) | Desktop layout (3 columns) | ☐ |
| 27.2 | Resize to 900px | Tablet layout (2 columns) | ☐ |
| 27.3 | Check console | "Device: tablet" logged | ☐ |
| 27.4 | Resize to 500px | Mobile layout (1 column, FAB) | ☐ |
| 27.5 | Check console | "Device: mobile" logged | ☐ |
| 27.6 | Resize back to full | Desktop layout returns | ☐ |
| 27.7 | Check transitions | Smooth, no flickering | ☐ |

### Device Override Testing

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 28.1 | Set Device Target = "Mobile" in POS Profile | Save profile | ☐ |
| 28.2 | Reload POS (on desktop) | Mobile layout shown even on big screen | ☐ |
| 28.3 | Set Device Target = "Desktop" | Save profile | ☐ |
| 28.4 | Reload POS (resize to mobile) | Desktop layout shown even on small screen | ☐ |
| 28.5 | Set Device Target = "Auto" | Save profile | ☐ |
| 28.6 | Reload POS | Auto-detects correctly | ☐ |

**Notes**: __________________________________________________

---

## 👆 Touch Gestures Testing

**Best tested on actual touch device (tablet/phone)**

### Swipe Gestures

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 29.1 | Long-press item card (hold 1 sec) | Item details appear | ☐ |
| 29.2 | Swipe cart item left | Delete action triggers | ☐ |
| 29.3 | Swipe cart item right | Add to favorites (if implemented) | ☐ |
| 29.4 | Double-tap item quickly | Quick add to cart | ☐ |

**On Touch Device Only**:

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 29.5 | Swipe category tabs left/right | Tabs scroll smoothly | ☐ |
| 29.6 | Pull down on items list | Pull-to-refresh indicator | ☐ |
| 29.7 | Tap button | Subtle haptic feedback (if device supports) | ☐ |

**Notes**: __________________________________________________

---

## 🔄 Service Layer Testing

### Cart Service

**Open browser console (F12) and run**:

```javascript
// Import cart service
import { useCart } from './services/cart/CartService';
const cart = useCart();

// Test add item
const testItem = {
  item_code: 'TEST-001',
  item_name: 'Test Item',
  rate: 10.00,
  stock_uom: 'Nos',
  actual_qty: 100
};

await cart.addItem(testItem, 2);
console.log('Cart items:', cart.items.length); // Should be 1

// Test get totals
const totals = cart.getTotals();
console.log('Totals:', totals);
// Should show: subtotal: 20, grandTotal: 20+tax

// Test update quantity
await cart.updateQuantity(0, 5);
console.log('Updated qty:', cart.items[0].qty); // Should be 5

// Test remove item
cart.removeItem(0);
console.log('After remove:', cart.items.length); // Should be 0
```

| Test | Code | Expected Result | Status |
|------|------|-----------------|--------|
| 30.1 | `await cart.addItem(testItem, 2)` | Item added, cart.items.length = 1 | ☐ |
| 30.2 | `cart.getTotals()` | Returns {subtotal: 20, grandTotal: 20, etc} | ☐ |
| 30.3 | `await cart.updateQuantity(0, 5)` | Qty updates to 5 | ☐ |
| 30.4 | `cart.removeItem(0)` | Item removed, length = 0 | ☐ |
| 30.5 | Check console | No errors | ☐ |

### Payment Service

```javascript
import { usePayment } from './services/payment/PaymentService';
const payment = usePayment();

// Initialize payment
payment.initializePayment(150.00);

// Add cash payment
payment.addPayment({
  mode_of_payment: 'Cash',
  amount: 100,
  account: 'Cash - C'
});

console.log('Remaining:', payment.getRemainingAmount()); // Should be 50

// Add card payment
payment.addPayment({
  mode_of_payment: 'Card',
  amount: 50,
  account: 'Bank - C'
});

console.log('Fully paid:', payment.isFullyPaid()); // Should be true
console.log('Summary:', payment.getPaymentSummary());
```

| Test | Code | Expected Result | Status |
|------|------|-----------------|--------|
| 31.1 | `payment.initializePayment(150)` | Total due = 150 | ☐ |
| 31.2 | Add cash $100 | Remaining = 50 | ☐ |
| 31.3 | Add card $50 | Remaining = 0 | ☐ |
| 31.4 | `payment.isFullyPaid()` | Returns true | ☐ |
| 31.5 | `payment.getPaymentSummary()` | Shows 2 payments, change = 0 | ☐ |

**Notes**: __________________________________________________

---

## 🎯 Backend API Testing

### Open bench console

```bash
bench --site your.site console
```

### POS Type API Tests

```python
>>> from posawesome.posawesome.api.pos_type import get_pos_type_config

# Test get configuration
>>> config = get_pos_type_config("Grocery Store")
>>> print("Name:", config["name"])
>>> print("Features:", config["ui_configuration"]["enabled_features"])
>>> print("Scale enabled:", config["hardware_configuration"]["scale"]["enabled"])
```

| Test | Command | Expected Result | Status |
|------|---------|-----------------|--------|
| 32.1 | Get Grocery config | Returns dict with configuration | ☐ |
| 32.2 | Check name | "Grocery Store" | ☐ |
| 32.3 | Check features | List includes "plu_codes", "weighted_items", etc | ☐ |
| 32.4 | Check scale config | enabled: True | ☐ |

### PLU Search API Test

```python
>>> from posawesome.posawesome.api.items import search_by_plu

# Test PLU search
>>> items = search_by_plu("4011")  # Banana PLU code
>>> print("Found items:", len(items))
# Will be 0 if no items have PLU code "4011" configured

# If you have items with PLU codes:
>>> if items:
...     print("First item:", items[0]["item_name"])
```

| Test | Command | Expected Result | Status |
|------|---------|-----------------|--------|
| 33.1 | `search_by_plu("4011")` | Returns list (may be empty if no PLU codes) | ☐ |
| 33.2 | Check return structure | Each item has item_code, item_name, rate, etc | ☐ |

### Scale Barcode Parsing Test

```python
>>> from posawesome.posawesome.api.items import parse_scale_barcode

# Test scale barcode
>>> result = parse_scale_barcode("02123450125051")
>>> print("Result:", result)
# Expected: {'item_code': '12345', 'weight': 1.250, 'error': 'Item not found'} if item doesn't exist
```

| Test | Command | Expected Result | Status |
|------|---------|-----------------|--------|
| 34.1 | Parse barcode "02123450125051" | Returns dict with item_code and weight | ☐ |
| 34.2 | Check weight | weight: 1.250 | ☐ |
| 34.3 | Check item_code | item_code: '12345' | ☐ |

**Notes**: __________________________________________________

---

## 💾 Data Persistence Testing

### Local Storage

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 35.1 | Enable modular system | Feature flag saved | ☐ |
| 35.2 | Reload page | Modular system still enabled | ☐ |
| 35.3 | Search for item | Recent search saved | ☐ |
| 35.4 | Search again | Recent searches appear | ☐ |
| 35.5 | Disable modular system | Flag removed | ☐ |
| 35.6 | Reload page | Back to original system | ☐ |

### Cart State

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 36.1 | Add 3 items to cart | Cart has 3 items | ☐ |
| 36.2 | Reload page (F5) | Cart persists (if offline mode enabled) | ☐ |
| 36.3 | Clear cart | Cart emptied | ☐ |

**Notes**: __________________________________________________

---

## ⚡ Performance Testing

### Rendering Performance

| Test | Metric | How to Measure | Target | Actual | Status |
|------|--------|----------------|--------|--------|--------|
| 37.1 | Initial load time | Check Network tab | < 3s | ___s | ☐ |
| 37.2 | Scrolling FPS | Visual smoothness | 60 FPS | ___ | ☐ |
| 37.3 | Search response | Type and filter | < 300ms | ___ms | ☐ |
| 37.4 | Item click to cart | Click to visible | < 100ms | ___ms | ☐ |
| 37.5 | Category switch | Click to filter | < 200ms | ___ms | ☐ |

### Memory Usage

**Open Chrome DevTools → Performance Monitor**

| Test | Action | Memory Before | Memory After | Status |
|------|--------|---------------|--------------|--------|
| 38.1 | Load POS | ___ MB | ___ MB | ☐ |
| 38.2 | Scroll 100 items | ___ MB | ___ MB | ☐ |
| 38.3 | Add 20 items to cart | ___ MB | ___ MB | ☐ |
| 38.4 | Clear cart | ___ MB | ___ MB | ☐ |

**Notes**: __________________________________________________

---

## 🔀 Integration Testing

### Complete Checkout Flow

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 39.1 | Open POS | POS loads with Grocery type | ☐ |
| 39.2 | Search for item "apple" | Items filtered | ☐ |
| 39.3 | Click item | Added to cart | ☐ |
| 39.4 | Check cart panel | Item visible with price | ☐ |
| 39.5 | Update quantity to 3 | Quantity updates, total recalculates | ☐ |
| 39.6 | Add 3 more different items | Cart has 4 line items | ☐ |
| 39.7 | Select customer | Customer applied to cart | ☐ |
| 39.8 | Apply discount | Discount calculated | ☐ |
| 39.9 | Click "Checkout" | Split payment dialog appears | ☐ |
| 39.10 | Add payment: Cash $50 | Payment added | ☐ |
| 39.11 | Add payment: Card $remaining | Payment added | ☐ |
| 39.12 | Click "Complete Payment" | Invoice submits | ☐ |
| 39.13 | Check ERPNext | Sales Invoice created | ☐ |
| 39.14 | Check invoice payments | Both cash and card recorded | ☐ |
| 39.15 | Check stock | Stock levels updated | ☐ |

**Expected Invoice**: _______________  
**Expected Total**: $_______________

**Notes**: __________________________________________________

---

## 🔧 Error Handling Testing

### Invalid Scenarios

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 40.1 | Add item with 0 stock (if validation on) | Error message shown | ☐ |
| 40.2 | Try to add negative quantity | Prevented or error shown | ☐ |
| 40.3 | Try payment > remaining | Error: "exceeds remaining" | ☐ |
| 40.4 | Search for non-existent PLU | "No items found" message | ☐ |
| 40.5 | Disconnect during operation | Offline mode activates gracefully | ☐ |

### Edge Cases

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 41.1 | Load POS with no items | Shows empty state | ☐ |
| 41.2 | Load POS without POS Type set | Falls back to default (Retail) | ☐ |
| 41.3 | Filter to category with no items | Shows "no items" message | ☐ |
| 41.4 | Try to checkout empty cart | Checkout button disabled | ☐ |

**Notes**: __________________________________________________

---

## 🖱️ Backward Compatibility Testing

### With Modular System Disabled

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 42.1 | Run `window.posFeatureFlags.disableModular()` | Flags disabled | ☐ |
| 42.2 | Reload page | Original POS loads | ☐ |
| 42.3 | Add items to cart | Works as before | ☐ |
| 42.4 | Checkout | Original payment flow | ☐ |
| 42.5 | Check invoice | Created successfully | ☐ |

### Feature Flag Isolation

| Test | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 43.1 | Enable only new item grid | Only grid changes, rest stays same | ☐ |
| 43.2 | Enable only device layouts | Only layout adapts, features same | ☐ |
| 43.3 | Enable only split payments | Only payment dialog changes | ☐ |

**Notes**: __________________________________________________

---

## 🌐 Browser Compatibility Testing

### Chrome/Edge (Primary Support)

| Test | Browser | Version | Result | Status |
|------|---------|---------|--------|--------|
| 44.1 | Chrome | Latest | All features work | ☐ |
| 44.2 | Edge | Latest | All features work | ☐ |
| 44.3 | Web Serial API | - | Scale widget works | ☐ |

### Firefox (Limited Support)

| Test | Browser | Version | Result | Status |
|------|---------|---------|--------|--------|
| 45.1 | Firefox | Latest | Basic features work | ☐ |
| 45.2 | Web Serial API | - | Not supported (expected) | ☐ |
| 45.3 | Manual weight entry | - | Works as fallback | ☐ |

### Safari (Limited Support)

| Test | Browser | Version | Result | Status |
|------|---------|---------|--------|--------|
| 46.1 | Safari | Latest | Basic features work | ☐ |
| 46.2 | iOS Safari | iOS 15+ | Mobile layout works | ☐ |
| 46.3 | Touch gestures | - | Work on touch devices | ☐ |

**Notes**: __________________________________________________

---

## 📊 Console Output Verification

### Expected Console Messages

When POS loads successfully, you should see:

```
[POS Type] Loading configuration...
[POS Type] Loaded: Grocery Store
[Device Detection] Device: desktop
[Device Detection] Touch capable: false
[Device Detection] Screen: 1920x1080
[Layout Adapter] Selected layout: DesktopLayout
[CartService] Initialized
[PaymentService] Initialized
[FeatureFlags] Modular system enabled
```

| Test | Message | Present? | Status |
|------|---------|----------|--------|
| 47.1 | "POS Type loaded" | Yes/No | ☐ |
| 47.2 | "Device: [type]" | Yes/No | ☐ |
| 47.3 | No red errors | Yes/No | ☐ |
| 47.4 | Service initialized messages | Yes/No | ☐ |

---

## ✅ Critical Path Test (End-to-End)

### Complete User Journey

**Scenario**: Customer buys groceries with cash and card

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open POS (Grocery type, Desktop) | Loads with 3-column layout | ☐ |
| 2 | Search "banana" | Banana items shown | ☐ |
| 3 | Click banana item | Added to cart | ☐ |
| 4 | Use PLU keypad: "4011" | Finds banana via PLU | ☐ |
| 5 | Add 3 more items (different) | Cart has 5 line items | ☐ |
| 6 | Check cart total | Calculates correctly | ☐ |
| 7 | Select customer "Walk-In" | Customer applied | ☐ |
| 8 | Click "Checkout" | Split payment dialog appears | ☐ |
| 9 | Payment method: "Cash" | Cash selected | ☐ |
| 10 | Amount: "50" | $50 entered | ☐ |
| 11 | Click "Add Payment" | Cash $50 added to list | ☐ |
| 12 | Progress bar | Shows ~50% | ☐ |
| 13 | Payment method: "Card" | Card selected | ☐ |
| 14 | Click "All" button | Auto-fills remaining amount | ☐ |
| 15 | Click "Add Payment" | Card payment added | ☐ |
| 16 | Progress bar | Shows 100% (green) | ☐ |
| 17 | Click "Complete Payment" | Payment processes | ☐ |
| 18 | Check success message | Invoice created message | ☐ |
| 19 | Open ERPNext → Sales Invoice | New invoice visible | ☐ |
| 20 | Check invoice payments | 2 rows: Cash $50 + Card $remaining | ☐ |
| 21 | Check stock ledger | Stock deducted for all items | ☐ |
| 22 | Cart state | Cart cleared for next transaction | ☐ |

**Total Time**: _______ seconds (Target: < 60 seconds)

**Invoice Number**: _______________  
**Total Amount**: $_______________

**Overall Result**: ☐ PASS  ☐ FAIL

**Notes**: __________________________________________________

---

## 📝 Issues Log

Use this section to document any issues found:

### Issue 1
- **Severity**: ☐ Critical  ☐ High  ☐ Medium  ☐ Low
- **Component**: _______________________
- **Description**: _______________________
- **Steps to Reproduce**: _______________________
- **Expected**: _______________________
- **Actual**: _______________________
- **Screenshot/Error**: _______________________

### Issue 2
- **Severity**: ☐ Critical  ☐ High  ☐ Medium  ☐ Low
- **Component**: _______________________
- **Description**: _______________________
- **Steps to Reproduce**: _______________________
- **Expected**: _______________________
- **Actual**: _______________________

### Issue 3
- **Severity**: ☐ Critical  ☐ High  ☐ Medium  ☐ Low
- **Component**: _______________________
- **Description**: _______________________
- **Steps to Reproduce**: _______________________

*(Add more as needed)*

---

## ✅ Sign-Off Checklist

### Functional Testing

- [ ] All backend tests passed
- [ ] All frontend tests passed
- [ ] All POS types tested
- [ ] All devices tested
- [ ] All features tested
- [ ] Critical path passed

### Performance Testing

- [ ] Scrolling is smooth (60 FPS)
- [ ] Interactions are fast (< 100ms)
- [ ] Load time acceptable (< 3s)
- [ ] Memory usage reasonable

### Compatibility Testing

- [ ] Works on Chrome
- [ ] Works on Edge
- [ ] Works on Firefox (basic)
- [ ] Works on Safari (basic)

### Device Testing

- [ ] Desktop layout works
- [ ] Tablet layout works
- [ ] Mobile layout works
- [ ] Touch gestures work (on touch device)

### Integration Testing

- [ ] Complete checkout flow works
- [ ] Invoice created in ERPNext
- [ ] Stock updated correctly
- [ ] Payments recorded correctly

### Documentation

- [ ] All documentation guides reviewed
- [ ] Deployment guide followed
- [ ] Integration guide tested
- [ ] Quick start guide works

---

## 📊 Test Summary

**Total Tests**: _______  
**Passed**: _______  
**Failed**: _______  
**Warnings**: _______  
**Pass Rate**: _______%

**Overall Assessment**: ☐ Ready for Production  ☐ Needs Minor Fixes  ☐ Needs Major Work

**Tester Signature**: _______________  
**Date Completed**: _______________

**Recommendation**:
- ☐ Proceed to production deployment
- ☐ Fix issues then retest
- ☐ Need additional testing on: _______________________

---

## 📎 Attachments

- [ ] Screenshots of successful tests
- [ ] Console logs (if errors)
- [ ] Performance metrics
- [ ] Invoice samples
- [ ] Error messages

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅

1. **Document any minor issues** for future enhancement
2. **Proceed with pilot deployment** (1-2 registers)
3. **Train staff** on new features
4. **Monitor closely** for first week
5. **Gather user feedback**
6. **Plan full rollout**

### If Issues Found ❌

1. **Document all issues** using issue log above
2. **Categorize by severity** (Critical/High/Medium/Low)
3. **Report to development team**
4. **Fix critical issues** before deployment
5. **Retest after fixes**
6. **Update this checklist** with results

---

## 📞 Support

**Questions during testing?**
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section
- Review [START_HERE.md](./START_HERE.md) for documentation index
- Check browser console for error messages

**Found bugs?**
- Use issue log above
- Include steps to reproduce
- Take screenshots
- Note browser and device details

---

**Testing Guide Version**: 1.0  
**Last Updated**: January 30, 2025  
**Compatible with**: POSAwesome Vue 3 Modular Refactoring v1.0

🎯 **Good luck with testing!**

