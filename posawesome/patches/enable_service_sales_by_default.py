"""
Enable Force Service Sales by default for all existing POS Profiles
"""
import frappe


def execute():
    """Set posa_allow_service_sales=1 for all existing POS Profiles"""
    
    frappe.reload_doctype("POS Profile")
    
    # Get all POS Profiles
    pos_profiles = frappe.get_all("POS Profile", pluck="name")
    
    for profile_name in pos_profiles:
        try:
            profile = frappe.get_doc("POS Profile", profile_name)
            
            # Set the service sales flag to enabled (1) if it's not already set
            if not hasattr(profile, 'posa_allow_service_sales') or profile.posa_allow_service_sales is None:
                profile.posa_allow_service_sales = 1
                profile.flags.ignore_validate = True
                profile.flags.ignore_permissions = True
                profile.save()
                frappe.db.commit()
                print(f"✓ Enabled service sales for POS Profile: {profile_name}")
            else:
                print(f"- Service sales already configured for: {profile_name}")
                
        except Exception as e:
            print(f"✗ Error updating POS Profile {profile_name}: {str(e)}")
            continue
    
    print("\n" + "="*80)
    print("Migration Complete: Force Service Sales enabled by default")
    print("="*80)
    print("\nTo disable service sales for a specific profile:")
    print("1. Open the POS Profile")
    print("2. Uncheck 'Force Service Sales (Disable Stock Update)'")
    print("3. Save the profile")

