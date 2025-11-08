# Copyright (c) 2025, Youssef Restom and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import json


class POSType(Document):
	def validate(self):
		"""Validate POS Type configuration"""
		self.validate_json_fields()
		self.validate_default_type()
		
	def validate_json_fields(self):
		"""Ensure JSON fields contain valid JSON"""
		for field in ['ui_configuration', 'hardware_configuration', 'workflow_configuration']:
			if self.get(field):
				try:
					if isinstance(self.get(field), str):
						json.loads(self.get(field))
				except json.JSONDecodeError:
					frappe.throw(f"Invalid JSON in {field}")
	
	def validate_default_type(self):
		"""Ensure only one default POS Type exists"""
		if self.is_default:
			existing_default = frappe.db.get_value(
				"POS Type",
				{"is_default": 1, "name": ["!=", self.name]},
				"name"
			)
			if existing_default:
				frappe.throw(f"POS Type {existing_default} is already set as default")


@frappe.whitelist()
def get_pos_type_config(pos_type_name):
	"""
	Get complete configuration for a POS Type
	
	Args:
		pos_type_name: Name of the POS Type
		
	Returns:
		dict: Complete configuration including UI, hardware, and workflow settings
	"""
	if not pos_type_name:
		# Get default POS Type
		pos_type_name = frappe.db.get_value("POS Type", {"is_default": 1, "enabled": 1}, "name")
		if not pos_type_name:
			# Fallback to first enabled type
			pos_type_name = frappe.db.get_value("POS Type", {"enabled": 1}, "name")
	
	if not pos_type_name:
		return get_default_config()
	
	pos_type = frappe.get_doc("POS Type", pos_type_name)
	
	return {
		"name": pos_type.name,
		"description": pos_type.description,
		"icon": pos_type.icon or "mdi-point-of-sale",
		"ui_configuration": parse_json_field(pos_type.ui_configuration),
		"hardware_configuration": parse_json_field(pos_type.hardware_configuration),
		"workflow_configuration": parse_json_field(pos_type.workflow_configuration)
	}


def parse_json_field(json_field):
	"""Parse JSON field safely"""
	if not json_field:
		return {}
	if isinstance(json_field, dict):
		return json_field
	try:
		return json.loads(json_field)
	except (json.JSONDecodeError, TypeError):
		return {}


def get_default_config():
	"""Return default configuration for retail POS"""
	return {
		"name": "Retail",
		"description": "Default retail POS configuration",
		"icon": "mdi-cart",
		"ui_configuration": {
			"enabled_features": ["variants", "batches", "serial", "bundles", "discounts"],
			"item_card_layout": {
				"show_image": True,
				"show_stock": True,
				"show_price": True,
				"show_description": True
			},
			"quick_actions": ["add_to_cart", "view_details", "add_to_favorites"],
			"category_navigation_style": "tabs",
			"touch_gesture_mappings": {
				"swipe_left": "remove_item",
				"swipe_right": "add_to_favorites",
				"long_press": "item_details"
			}
		},
		"hardware_configuration": {
			"barcode_scanner": {"enabled": True, "type": "keyboard_wedge"},
			"printer": {"enabled": False, "type": "esc_pos"},
			"cash_drawer": {"enabled": False, "trigger_via_printer": True},
			"scale": {"enabled": False, "type": "serial"},
			"customer_display": {"enabled": False, "type": "web"},
			"card_reader": {"enabled": False, "type": "stripe_terminal"}
		},
		"workflow_configuration": {
			"require_customer": False,
			"allow_negative_stock": False,
			"auto_print_receipt": False,
			"split_payment_enabled": False,
			"loyalty_program_enabled": True,
			"offline_mode_enabled": True
		}
	}

