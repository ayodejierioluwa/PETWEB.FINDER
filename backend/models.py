# Copyright (c) 2026. All Rights Reserved.
# Proprietary and confidential. Do not distribute.

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Vendor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    location = db.Column(db.String(200))
    rating = db.Column(db.Float, default=0.0)
    trust_score = db.Column(db.Float, default=0.0) # Calculated based on sales & partnerships
    total_sales_volume = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship('Product', backref='vendor', lazy=True)
    partnerships = db.relationship('Partnership', backref='vendor', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'rating': self.rating,
            'trust_score': self.trust_score,
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
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'specifications': self.specifications,
            'price_min': self.price_min,
            'price_max': self.price_max,
            'vendor_id': self.vendor_id
        }

class Partnership(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    partner_name = db.Column(db.String(100), nullable=False) # e.g., 'Chevron', 'Exxon'
    value_weight = db.Column(db.Float, default=1.0) # Used to calculate Trust Score
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)
