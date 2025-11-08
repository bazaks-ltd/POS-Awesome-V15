# Copyright (c) 2025, Youssef Restom and contributors
# For license information, please see license.txt

import frappe
import json


@frappe.whitelist()
def get_pos_type_config(pos_profile=None):
	"""
	Get POS Type configuration for a given POS Profile
	
	Args:
		pos_profile: Name of POS Profile (optional, uses default if not provided)
		
	Returns:
		dict: Complete POS Type configuration
	"""
	from posawesome.posawesome.doctype.pos_type.pos_type import get_pos_type_config as get_config
	
	pos_type_name = None
	
	# Get POS Type from POS Profile if provided
	if pos_profile:
		pos_type_name = frappe.db.get_value("POS Profile", pos_profile, "pos_type")
	
	# If no POS Type specified, get default
	if not pos_type_name:
		pos_type_name = frappe.db.get_value("POS Type", {"is_default": 1, "enabled": 1}, "name")
	
	return get_config(pos_type_name)


@frappe.whitelist()
def get_layout_template(pos_type, device_target="auto"):
	"""
	Get layout template configuration for POS Type and device
	
	Args:
		pos_type: Name of POS Type
		device_target: Device type (auto, mobile, tablet, desktop)
		
	Returns:
		dict: Layout configuration for the device
	"""
	config = get_pos_type_config()
	ui_config = config.get("ui_configuration", {})
	
	# Device-specific overrides
	layout_templates = {
		"mobile": {
			"columns": 1,
			"items_per_row": 2,
			"use_bottom_sheets": True,
			"compact_mode": True,
			"touch_target_size": 48
		},
		"tablet": {
			"columns": 2,
			"items_per_row": 3,
			"use_side_panels": True,
			"compact_mode": False,
			"touch_target_size": 44
		},
		"desktop": {
			"columns": 3,
			"items_per_row": 4,
			"use_side_panels": True,
			"compact_mode": False,
			"touch_target_size": 40
		}
	}
	
	# Auto-detect if needed
	if device_target == "auto":
		device_target = "desktop"  # Default, will be overridden by client
	
	layout = layout_templates.get(device_target, layout_templates["desktop"])
	
	# Merge with POS Type specific configurations
	layout.update({
		"pos_type": pos_type,
		"category_navigation_style": ui_config.get("category_navigation_style", "tabs"),
		"layout_mode": ui_config.get("layout_mode", "standard"),
		"enabled_features": ui_config.get("enabled_features", [])
	})
	
	return layout


@frappe.whitelist()
def get_available_pos_types():
	"""
	Get list of available POS Types
	
	Returns:
		list: List of enabled POS Types with basic info
	"""
	pos_types = frappe.get_all(
		"POS Type",
		filters={"enabled": 1},
		fields=["name", "description", "icon", "is_default"],
		order_by="is_default desc, name"
	)
	
	return pos_types


@frappe.whitelist()
def get_hardware_config(pos_profile=None):
	"""
	Get hardware configuration for POS Profile
	
	Args:
		pos_profile: Name of POS Profile
		
	Returns:
		dict: Hardware configuration
	"""
	config = get_pos_type_config(pos_profile)
	return config.get("hardware_configuration", {})


@frappe.whitelist()
def validate_pos_type_compatibility(pos_type, required_features):
	"""
	Check if POS Type supports required features
	
	Args:
		pos_type: Name of POS Type
		required_features: List of required features
		
	Returns:
		dict: Validation result with missing features
	"""
	from posawesome.posawesome.doctype.pos_type.pos_type import get_pos_type_config as get_config
	
	config = get_config(pos_type)
	enabled_features = config.get("ui_configuration", {}).get("enabled_features", [])
	
	if isinstance(required_features, str):
		required_features = json.loads(required_features)
	
	missing_features = [f for f in required_features if f not in enabled_features]
	
	return {
		"compatible": len(missing_features) == 0,
		"missing_features": missing_features,
		"enabled_features": enabled_features
	}

