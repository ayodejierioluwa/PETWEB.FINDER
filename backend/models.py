# Copyright (c) 2026. All Rights Reserved.
# Proprietary and confidential. Do not distribute.

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Vendor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    location = db.Column(db.String(200))
    country = db.Column(db.String(100)) # Added field
    rating = db.Column(db.Float, default=0.0)
    trust_score = db.Column(db.Float, default=0.0) # Calculated based on sales & partnerships
    local_content_value = db.Column(db.Float, default=0.0) # NCDMB Compliance: 0-100
    total_sales_volume = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship('Product', backref='vendor', lazy=True)
    partnerships = db.relationship('Partnership', backref='vendor', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'country': self.country,
            'rating': self.rating,
            'trust_score': self.trust_score,
            'local_content_value': self.local_content_value,
            'total_sales_volume': self.total_sales_volume,
            'partnerships': [p.partner_name for p in self.partnerships]
        }

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100))
    specifications = db.Column(db.Text)
    price_min = db.Column(db.Float, default=0.0)
    price_max = db.Column(db.Float, default=0.0)
    image_url = db.Column(db.String(500)) 
    tech_spec = db.Column(db.String(100)) # New field: e.g., "15k PSI", "P110"
    unit = db.Column(db.String(50)) # e.g., "Sack", "Unit", "MT"
    pack_weight = db.Column(db.String(50)) # e.g., "50kg", "25kg"
    lead_time_days = db.Column(db.Integer, default=7) # Innovation: Logistics forecasting
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'specifications': self.specifications,
            'tech_spec': self.tech_spec,
            'unit': self.unit,
            'pack_weight': self.pack_weight,
            'lead_time_days': self.lead_time_days,
            'price_min': self.price_min,
            'price_max': self.price_max,
            'image_url': self.image_url,
            'vendor_id': self.vendor_id
        }

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_name = db.Column(db.String(200), nullable=False)
    destination = db.Column(db.String(200), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Processing') # Processing, Shipped, In Transit, Delivered
    tracking_location = db.Column(db.String(200), default='Vendor Warehouse')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    items = db.relationship('OrderItem', backref='order', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'client_name': self.client_name,
            'destination': self.destination,
            'total_amount': self.total_amount,
            'status': self.status,
            'tracking_location': self.tracking_location,
            'created_at': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    price_at_order = db.Column(db.Float, nullable=False)
    
    product_name = db.Column(db.String(200)) # Snapshot of name
    vendor_name = db.Column(db.String(200)) # Snapshot of vendor

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'vendor_name': self.vendor_name,
            'quantity': self.quantity,
            'price': self.price_at_order
        }

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        product = Product.query.get(self.product_id)
        return {
            'id': self.id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'product': product.to_dict() if product else None,
            'added_at': self.added_at.isoformat()
        }

class Partnership(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    partner_name = db.Column(db.String(100), nullable=False) # e.g., 'Chevron', 'Exxon'
    value_weight = db.Column(db.Float, default=1.0) # Used to calculate Trust Score
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)
