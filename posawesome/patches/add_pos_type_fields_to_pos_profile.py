# Copyright (c) 2025, Youssef Restom and contributors
# For license information, please see license.txt

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def execute():
	"""Add POS Type related fields to POS Profile"""
	
	custom_fields = {
		"POS Profile": [
			{
				"fieldname": "pos_type_section",
				"fieldtype": "Section Break",
				"label": "POS Type Configuration",
				"insert_after": "country"
			},
			{
				"fieldname": "pos_type",
				"fieldtype": "Link",
				"label": "POS Type",
				"options": "POS Type",
				"insert_after": "pos_type_section",
				"description": "Select the type of POS (Grocery, Pharmacy, Service, etc.)"
			},
			{
				"fieldname": "device_target",
				"fieldtype": "Select",
				"label": "Device Target",
				"options": "\nAuto\nMobile\nTablet\nDesktop",
				"default": "Auto",
				"insert_after": "pos_type",
				"description": "Target device type for layout optimization"
			},
			{
				"fieldname": "column_break_pos_type",
				"fieldtype": "Column Break",
				"insert_after": "device_target"
			},
			{
				"fieldname": "item_grouping_mode",
				"fieldtype": "Select",
				"label": "Item Grouping Mode",
				"options": "\nTree\nQuick Filters\nTabs\nHybrid",
				"default": "Tabs",
				"insert_after": "column_break_pos_type",
				"description": "How to display and navigate item categories"
			},
			{
				"fieldname": "layout_mode",
				"fieldtype": "Select",
				"label": "Layout Mode",
				"options": "\nStandard\nCompact\nLarge Touch\nSingle Hand\nFast Checkout",
				"default": "Standard",
				"insert_after": "item_grouping_mode",
				"description": "UI layout optimization mode"
			},
			{
				"fieldname": "enable_touch_gestures",
				"fieldtype": "Check",
				"label": "Enable Touch Gestures",
				"default": "1",
				"insert_after": "layout_mode",
				"description": "Enable swipe, long-press, and other touch gestures"
			},
			{
				"fieldname": "hardware_section",
				"fieldtype": "Section Break",
				"label": "Hardware Configuration",
				"insert_after": "enable_touch_gestures",
				"collapsible": 1
			},
			{
				"fieldname": "enable_scale_integration",
				"fieldtype": "Check",
				"label": "Enable Scale Integration",
				"default": "0",
				"insert_after": "hardware_section"
			},
			{
				"fieldname": "scale_port",
				"fieldtype": "Data",
				"label": "Scale Port",
				"depends_on": "eval:doc.enable_scale_integration",
				"insert_after": "enable_scale_integration",
				"description": "Serial port for scale (e.g., COM3, /dev/ttyUSB0)"
			},
			{
				"fieldname": "scale_protocol",
				"fieldtype": "Select",
				"label": "Scale Protocol",
				"options": "\nMettler Toledo\nCAS\nAvery Berkel\nOhaus\nGeneric",
				"depends_on": "eval:doc.enable_scale_integration",
				"insert_after": "scale_port"
			},
			{
				"fieldname": "column_break_hardware",
				"fieldtype": "Column Break",
				"insert_after": "scale_protocol"
			},
			{
				"fieldname": "enable_customer_display",
				"fieldtype": "Check",
				"label": "Enable Customer Display",
				"default": "0",
				"insert_after": "column_break_hardware"
			},
			{
				"fieldname": "customer_display_url",
				"fieldtype": "Data",
				"label": "Customer Display URL",
				"depends_on": "eval:doc.enable_customer_display",
				"insert_after": "enable_customer_display",
				"description": "URL for customer-facing display"
			},
			{
				"fieldname": "enable_split_payments",
				"fieldtype": "Check",
				"label": "Enable Split Payments",
				"default": "0",
				"insert_after": "customer_display_url",
				"description": "Allow splitting total across multiple payment methods"
			}
		]
	}
	
	create_custom_fields(custom_fields, update=True)
	
	frappe.db.commit()
	
	print("✓ POS Type fields added to POS Profile")

