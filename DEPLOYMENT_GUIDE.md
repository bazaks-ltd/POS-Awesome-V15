# Deployment Guide - Vue 3 Modular POS System

## 🚀 Quick Deployment

### Step-by-Step Deployment

#### 1. Backend Deployment

```bash
# Navigate to frappe-bench directory
cd /Volumes/TZARMORSP/wrk/posbaz/frappe-bench

# Run migrations to create POS Type doctype and custom fields
bench --site your.site migrate

# Verify POS Type installation
bench --site your.site console
```

In the console:
```python
>>> frappe.get_all("POS Type", fields=["name", "enabled"])
# Should show: Grocery Store, Pharmacy, Service & Spa, Retail

>>> frappe.db.get_value("POS Profile", "Your Profile Name", ["pos_type", "device_target"], as_dict=True)
# Should show new custom fields
```

```bash
# Restart bench
bench restart
```

#### 2. Frontend Deployment

```bash
# Navigate to frontend directory
cd apps/posawesome/frontend

# Install dependencies (if any new ones)
yarn install

# Build for production
yarn build

# Output will be in apps/posawesome/posawesome/public/dist/
```

#### 3. Clear Cache

```bash
# Clear server cache
bench --site your.site clear-cache
bench --site your.site clear-website-cache

# Restart
bench restart
```

#### 4. Configure POS Profile

1. **Open ERPNext** → Accounts → POS Profile
2. **Select/Create POS Profile**
3. **Scroll to "POS Type Configuration" section** (new section)
4. **Set POS Type** = "Grocery Store" (or desired type)
5. **Set Device Target** = "Auto" (or specific device)
6. **Set Item Grouping Mode** = "Quick Filters"
7. **Set Layout Mode** = "Fast Checkout" (for grocery)
8. **Enable Touch Gestures** ✓
9. **Scroll to "Hardware Configuration" section**
10. **Enable Scale Integration** ✓ (if using scale)
11. **Set Scale Port** = "COM3" (or appropriate port)
12. **Set Scale Protocol** = "Mettler Toledo" (or your scale)
13. **Enable Customer Display** ✓ (if using second screen)
14. **Enable Split Payments** ✓ (for grocery)
15. **Save**

#### 5. Browser Testing

1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Hard refresh**: Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. **Open POS**: Navigate to /app/posawesome
4. **Select POS Profile** with configured POS Type
5. **Verify**:
   - POS Type loads (check browser console)
   - Appropriate layout appears
   - Features match selected type

---

## 🧪 Testing Checklist

### Backend Tests

```bash
# Test POS Type API
bench --site your.site console
```

```python
>>> from posawesome.posawesome.api.pos_type import get_pos_type_config
>>> config = get_pos_type_config("Grocery Store")
>>> print(config["name"])  # Should print: Grocery Store
>>> print(config["ui_configuration"]["enabled_features"])
# Should show: plu_codes, weighted_items, split_payments, etc.

>>> # Test PLU search
>>> from posawesome.posawesome.api.items import search_by_plu
>>> items = search_by_plu("4011")  # Banana PLU
>>> print(len(items))  # Should find items if PLU codes configured

>>> # Test scale barcode parsing
>>> from posawesome.posawesome.api.items import parse_scale_barcode
>>> result = parse_scale_barcode("02123450125051")
>>> print(result)  # Should parse item code and weight
```

### Frontend Tests

Open browser console (F12) and run:

```javascript
// Test device detection
import { useDeviceDetection } from './composables/types/useDeviceDetection';
const { deviceType, isMobile, touchCapable } = useDeviceDetection();
console.log('Device:', deviceType.value);
console.log('Mobile:', isMobile.value);
console.log('Touch:', touchCapable.value);

// Test cart service
import { useCart } from './services/cart/CartService';
const cart = useCart();
await cart.addItem({ item_code: 'TEST', item_name: 'Test Item', rate: 10 }, 2);
console.log('Cart items:', cart.items);
console.log('Totals:', cart.getTotals());

// Test payment service
import { usePayment } from './services/payment/PaymentService';
const payment = usePayment();
payment.initializePayment(100);
payment.addPayment({ mode_of_payment: 'Cash', amount: 50, account: 'Cash - C' });
payment.addPayment({ mode_of_payment: 'Card', amount: 50, account: 'Bank - C' });
console.log('Payment summary:', payment.getPaymentSummary());
```

### Feature Tests

#### Test 1: POS Type Loading ✓
1. Open POS with Grocery Store profile
2. Open browser console
3. Check for: "POS Type loaded: Grocery Store"
4. Verify grocery features visible (PLU keypad, scale widget)

#### Test 2: Device Layout Adaptation ✓
1. Open POS in browser at full screen (desktop)
2. Verify three-column layout appears
3. Resize browser to tablet width (~800px)
4. Verify two-column layout appears
5. Resize to mobile width (~400px)
6. Verify single-column with FAB appears

#### Test 3: ItemGrid Rendering ✓
1. Open POS
2. Navigate to items view
3. Verify items display in CSS Grid
4. Scroll down
5. Verify more items load progressively
6. Check for 60 FPS scrolling (F12 → Performance tab)

#### Test 4: Touch Gestures ✓ (on touch device)
1. Long-press an item card
2. Verify details appear
3. Swipe left on cart item
4. Verify delete action
5. Double-tap item
6. Verify quick add

#### Test 5: Grocery PLU Entry ✓
1. Open grocery POS
2. Click PLU keypad
3. Enter code: 4011 (bananas)
4. Verify item search executes
5. Select item
6. Verify added to cart

#### Test 6: Scale Integration ✓ (requires hardware)
1. Connect weighing scale to COM port
2. Grant Web Serial permission in browser
3. Place item on scale
4. Click "Use Weight"
5. Verify weight captured
6. Verify item added with correct weight and price

#### Test 7: Split Payment ✓
1. Add items to cart (total > $50)
2. Click Checkout
3. Verify Split Payment dialog appears
4. Add Cash payment: $30
5. Add Card payment: $20
6. Verify progress bar shows 100%
7. Click Complete Payment
8. Verify invoice submitted with both payments

---

## 🔧 Configuration Options

### POS Type Configuration

Each POS Type has three JSON configuration sections:

#### 1. UI Configuration

```json
{
  "enabled_features": [
    "barcode_scanning",
    "plu_codes",
    "weighted_items",
    "split_payments"
  ],
  "item_card_layout": {
    "show_image": true,
    "show_stock": true,
    "show_price": true,
    "show_plu": true,
    "card_size": "large"
  },
  "category_navigation_style": "quick_filters",
  "layout_mode": "fast_checkout"
}
```

#### 2. Hardware Configuration

```json
{
  "scale": {
    "enabled": true,
    "type": "serial",
    "protocol": "mettler_toledo",
    "port": "COM3",
    "baud_rate": 9600
  },
  "printer": {
    "enabled": true,
    "type": "esc_pos",
    "auto_print": true
  },
  "customer_display": {
    "enabled": true,
    "type": "web"
  }
}
```

#### 3. Workflow Configuration

```json
{
  "require_customer": false,
  "split_payment_enabled": true,
  "loyalty_program_enabled": true,
  "offline_mode_enabled": true,
  "auto_print_receipt": true
}
```

### Editing POS Type Configuration

**Via ERPNext UI**:
1. Go to POS Type list
2. Open "Grocery Store"
3. Edit UI Configuration JSON
4. Save
5. Reload POS to see changes

**Via Code**:
```python
# In bench console
pos_type = frappe.get_doc("POS Type", "Grocery Store")
ui_config = json.loads(pos_type.ui_configuration)
ui_config["enabled_features"].append("new_feature")
pos_type.ui_configuration = json.dumps(ui_config)
pos_type.save()
frappe.db.commit()
```

---

## 🐛 Troubleshooting

### Issue: POS Type not loading

**Symptoms**: Console error "Failed to load POS Type"

**Solutions**:
1. Check migrations ran: `bench --site site1.local migrate`
2. Check doctype exists: `frappe.get_meta("POS Type")`
3. Check fixtures installed: `frappe.get_all("POS Type")`
4. Check API accessible: Test endpoint in browser console
5. Clear cache: `bench --site site1.local clear-cache`

### Issue: Custom fields not showing in POS Profile

**Symptoms**: POS Type field doesn't appear

**Solutions**:
1. Check patch executed: Look in `tabPatch Log`
2. Run patch manually:
   ```python
   from posawesome.patches.add_pos_type_fields_to_pos_profile import execute
   execute()
   ```
3. Clear cache and reload
4. Check custom field exists:
   ```python
   frappe.db.exists("Custom Field", {"dt": "POS Profile", "fieldname": "pos_type"})
   ```

### Issue: Items not displaying in ItemGrid

**Symptoms**: ItemGrid shows "No items found"

**Solutions**:
1. Check items prop is being passed
2. Verify data structure:
   ```javascript
   console.log('Items:', items);
   // Each item should have: item_code, item_name, rate
   ```
3. Check filtering isn't too restrictive
4. Check browser console for errors

### Issue: Layout not changing on device resize

**Symptoms**: Still shows desktop layout on mobile

**Solutions**:
1. Check useDeviceDetection is working:
   ```javascript
   const { deviceType } = useDeviceDetection();
   console.log('Device:', deviceType.value);
   ```
2. Check useLayoutAdapter:
   ```javascript
   const { currentLayoutComponent } = useLayoutAdapter();
   console.log('Layout:', currentLayoutComponent.value);
   ```
3. Hard refresh browser: Ctrl+Shift+R
4. Check no device override set in POS Profile

### Issue: Touch gestures not working

**Symptoms**: Swipe doesn't trigger actions

**Solutions**:
1. Test on actual touch device (not mouse)
2. Check touch capability:
   ```javascript
   console.log('Touch:', 'ontouchstart' in window);
   ```
3. Verify gesture enabled in POS Profile
4. Check console for gesture event logs

### Issue: Scale not connecting

**Symptoms**: "Scale not connected" message

**Solutions**:
1. Check browser supports Web Serial:
   ```javascript
   console.log('Serial API:', 'serial' in navigator);
   ```
2. Use Chrome or Edge browser (Firefox doesn't support Web Serial)
3. Ensure HTTPS connection (required for Web Serial)
4. Grant serial port permission when prompted
5. Check COM port is correct
6. Check scale is powered on and connected

### Issue: Split payment not showing

**Symptoms**: Regular payment dialog instead of split payment

**Solutions**:
1. Check POS Type configuration:
   ```python
   config = frappe.get_doc("POS Type", "Grocery Store")
   print(config.workflow_configuration)
   # Check split_payment_enabled: true
   ```
2. Check POS Profile has "Enable Split Payments" checked
3. Check `splitPaymentEnabled` composable returns true
4. Verify payment methods configured in POS Profile

---

## 🔐 Security Considerations

### Web Serial API Permissions

**Issue**: Web Serial requires explicit user permission

**Solution**:
1. Request permission on first use
2. Store permission state
3. Show helpful error if denied
4. Provide manual weight entry fallback

### HTTPS Requirement

**Issue**: Web Serial only works on HTTPS

**Solution**:
1. Use HTTPS in production (required)
2. For local development:
   - Use `localhost` (exempt from HTTPS requirement)
   - OR setup local SSL certificate
   - OR use ngrok for HTTPS tunnel

### Payment Security

**Issue**: PCI-DSS compliance for card payments

**Solution**:
1. Never store card numbers
2. Use tokenization (Stripe, etc.)
3. Card data only to payment gateway
4. No logging of sensitive data

---

## 📊 Performance Monitoring

### Measure Rendering Performance

```javascript
// In browser console
// 1. Start performance recording
performance.mark('items-render-start');

// 2. Render items (scroll or search)
// ... user interaction ...

// 3. End performance recording
performance.mark('items-render-end');
performance.measure('items-render', 'items-render-start', 'items-render-end');

// 4. Get results
const measure = performance.getEntriesByName('items-render')[0];
console.log(`Render time: ${measure.duration}ms`);
// Target: < 100ms
```

### Monitor FPS

```javascript
// FPS counter
let lastTime = performance.now();
let frames = 0;

function countFPS() {
  frames++;
  const currentTime = performance.now();
  
  if (currentTime >= lastTime + 1000) {
    console.log(`FPS: ${frames}`);
    frames = 0;
    lastTime = currentTime;
  }
  
  requestAnimationFrame(countFPS);
}

countFPS();
// Target: 60 FPS
```

### Check Memory Usage

```javascript
// Check memory (Chrome only)
if (performance.memory) {
  console.log('Used JS Heap:', (performance.memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
  console.log('Total JS Heap:', (performance.memory.totalJSHeapSize / 1048576).toFixed(2), 'MB');
}
```

---

## 🔄 Rollback Procedure

### If Issues Occur

#### Option 1: Disable New Features (Safest)

1. **Set POS Type to null** in POS Profile
2. **Uncheck new hardware options**
3. **Save and reload**
4. System falls back to original behavior

#### Option 2: Rollback Code

```bash
# 1. Checkout previous version
cd apps/posawesome
git log --oneline  # Find commit before refactoring
git checkout <commit-hash>

# 2. Rebuild frontend
cd frontend
yarn build

# 3. Restart
cd ../../..
bench restart

# 4. Clear cache
bench --site your.site clear-cache
```

#### Option 3: Database Rollback

```bash
# Restore from backup (if you made one)
bench --site your.site restore /path/to/backup.sql.gz
```

---

## 🎯 Gradual Deployment Strategy

### Phase 1: Test Environment (Week 1)

1. Deploy to test site
2. Create test POS Profile with Grocery type
3. Test all features
4. Fix bugs
5. Gather feedback

### Phase 2: Single Register Pilot (Week 2)

1. Deploy to production
2. Configure ONE POS Profile with new system
3. Train one cashier
4. Monitor performance
5. Fix issues

### Phase 3: Gradual Rollout (Week 3-4)

1. Add more registers one by one
2. Configure each with appropriate POS Type
3. Train staff
4. Monitor and optimize

### Phase 4: Full Deployment (Week 5+)

1. All registers using new system
2. Remove old code (RecycleScroller)
3. Optimize based on real usage
4. Add requested features

---

## 📱 Device-Specific Testing

### Mobile Testing (Phone)

**Devices to Test**:
- iPhone (iOS Safari)
- Android phone (Chrome)

**Tests**:
1. Verify MobileLayout loads
2. Test FAB navigation
3. Test bottom sheets
4. Test swipe gestures
5. Check touch targets (minimum 48px)
6. Test single-hand usability
7. Verify performance on 3G/4G

### Tablet Testing

**Devices to Test**:
- iPad (iOS Safari)
- Android tablet (Chrome)

**Tests**:
1. Verify TabletLayout loads
2. Test split screen (items + cart)
3. Test portrait/landscape orientation
4. Test expandable panels
5. Check touch targets (minimum 44px)
6. Verify two-handed usability

### Desktop Testing

**Browsers to Test**:
- Chrome/Edge (recommended)
- Firefox (limited Web Serial)
- Safari (limited Web Serial)

**Tests**:
1. Verify DesktopLayout loads
2. Test three-column layout
3. Test keyboard shortcuts
4. Test mouse interactions
5. Test hardware (scale, printer)

---

## 🔌 Hardware Setup

### Weighing Scale Setup

**Compatible Scales**:
- Mettler Toledo
- CAS
- Avery Berkel
- Ohaus
- Any serial scale with configurable protocol

**Connection Steps**:
1. Connect scale to computer via USB/Serial
2. Note COM port (Windows) or /dev/ttyUSB0 (Linux)
3. Configure in POS Profile:
   - Enable Scale Integration ✓
   - Scale Port: COM3 (or your port)
   - Scale Protocol: Mettler Toledo
4. Open POS
5. Click "Connect Scale" in ScaleWidget
6. Grant browser permission
7. Test with item on scale

**Troubleshooting Scale**:
- Verify scale is powered on
- Check COM port in Device Manager (Windows)
- Try different USB port
- Check scale sends data (use serial monitor)
- Verify baud rate matches (usually 9600)

### Thermal Printer Setup (Coming Soon)

**Compatible Printers**:
- Any ESC/POS compatible printer
- Epson TM series
- Star TSP series
- Generic thermal printers

**Setup** (when implemented):
1. Connect printer via USB
2. Install printer drivers
3. Configure in POS Profile
4. Test print from POS

### Cash Drawer Setup (Coming Soon)

**Connection**:
- Usually connects to printer via RJ11
- Triggered by printer command
- No direct PC connection needed

### Card Reader Setup (Coming Soon)

**Options**:
- Stripe Terminal (recommended)
- Square Reader
- Generic USB card readers

---

## 📈 Monitoring & Analytics

### What to Monitor

1. **Error Rate**: Check browser console and server logs
2. **Performance**: FPS, interaction latency, load times
3. **Usage**: Which features used most
4. **Issues**: User complaints, bugs reported

### Logging

**Browser Console**:
```javascript
// Enable debug logging
localStorage.setItem('pos_debug', 'true');

// Check service events
cart.on('cart_updated', (items) => {
  console.log('[Cart] Updated:', items.length, 'items');
});

payment.on('payment_added', (payment) => {
  console.log('[Payment] Added:', payment.mode_of_payment, payment.amount);
});
```

**Server Logs**:
```bash
# Watch logs
tail -f sites/your.site/logs/web.log

# Check error log
tail -f sites/your.site/logs/error.log
```

---

## ✅ Pre-Launch Checklist

### Backend
- [ ] Migrations run successfully
- [ ] POS Type doctype created
- [ ] Custom fields added to POS Profile
- [ ] Fixtures installed (4 POS types)
- [ ] API endpoints working
- [ ] Backup created

### Frontend
- [ ] Dependencies installed
- [ ] Build successful (no errors)
- [ ] Assets deployed to public/dist
- [ ] Cache cleared
- [ ] Hard refresh performed

### Configuration
- [ ] POS Profile configured with POS Type
- [ ] Device target set
- [ ] Hardware settings configured
- [ ] Payment methods added
- [ ] Tested and saved

### Testing
- [ ] Backend APIs tested
- [ ] Frontend services tested
- [ ] Components render correctly
- [ ] Layout adapts to device
- [ ] Touch gestures work
- [ ] Hardware connects (if applicable)

### Documentation
- [ ] Team trained on new features
- [ ] User guides created
- [ ] Support process defined
- [ ] Rollback plan ready

### Go-Live
- [ ] Deployed to production
- [ ] Monitored for 1 hour
- [ ] No critical errors
- [ ] Users can checkout successfully
- [ ] Performance acceptable

---

## 🎓 Training Guide

### For Cashiers

**New Features to Learn**:
1. **PLU Entry**: Use on-screen keypad for produce
2. **Scale**: Place item, weight auto-captured
3. **Split Payment**: Accept multiple payment methods
4. **Touch Gestures**: Swipe to delete, long-press for details

**Training Time**: ~30 minutes per cashier

### For Managers

**New Capabilities**:
1. **POS Type Selection**: Choose appropriate type for location
2. **Device Configuration**: Optimize for available devices
3. **Hardware Setup**: Configure scales, printers
4. **Reporting**: Same as before (ERPNext reports)

**Training Time**: ~1 hour

---

## 📞 Support

### Getting Help

1. **Check documentation**: 7 comprehensive guides in apps/posawesome/
2. **Check browser console**: F12 → Console tab for errors
3. **Check server logs**: `tail -f sites/your.site/logs/web.log`
4. **Test on different browser**: Try Chrome if using Firefox
5. **Create detailed bug report**: Include steps to reproduce

### Contact

- **Technical Issues**: Check IMPLEMENTATION_INDEX.md
- **Integration Help**: See INTEGRATION_GUIDE.md
- **Usage Questions**: See MODULAR_POS_QUICKSTART.md

---

## 🎉 Success!

If you've completed all steps and tests pass, congratulations! Your modular POS system is deployed and ready to use.

**Next Steps**:
1. Train staff
2. Monitor usage
3. Collect feedback
4. Plan next features
5. Optimize based on real usage

---

**Deployment Version**: 1.0  
**Last Updated**: January 30, 2025  
**Status**: Ready for Production Testing

