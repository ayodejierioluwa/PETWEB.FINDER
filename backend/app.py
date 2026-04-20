# Copyright (c) 2026. All Rights Reserved.
# Proprietary and confidential. Do not distribute.

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Vendor, Product, Partnership
from scraper_engine import ScraperEngine

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, 'petrohub.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/')
def home():
    return jsonify({"status": "Petroleum Supply Hub Core Active"})

@app.route('/api/init', methods=['POST'])
def init_slate():
    """Initializes the database and triggers the initial scrape."""
    with app.app_context():
        db.create_all()
        engine = ScraperEngine()
        result = engine.perform_scrape()
        return jsonify({"status": "success", "data": result})

@app.route('/api/search', methods=['POST'])
def search_products():
    data = request.get_json() or {}
    query = data.get('query', '').lower()
    category = data.get('category', '')
    budget_max = data.get('budget', None)
    
    products_query = Product.query
    
    if query:
        products_query = products_query.filter(
            Product.name.ilike(f'%{query}%') | Product.specifications.ilike(f'%{query}%')
        )
    if category:
        products_query = products_query.filter(Product.category.ilike(f'%{category}%'))
        
    if budget_max is not None and budget_max > 0:
        products_query = products_query.filter(Product.price_min <= budget_max)
        
    found_products = products_query.all()
    
    results = []
    for p in found_products:
        vendor = Vendor.query.get(p.vendor_id)
        results.append({
            "product": p.to_dict(),
            "vendor": vendor.to_dict()
        })
        
    # Sort results by the vendor's Trust Score descending
    results.sort(key=lambda x: x['vendor']['trust_score'], reverse=True)
    
    return jsonify({
        "count": len(results),
        "results": results[:20] # Return top 20 items to prevent huge payloads
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if not Vendor.query.first():
            print("Seeding database via scraper engine...")
            ScraperEngine().perform_scrape()
            print("Database seeded.")
            
    app.run(debug=True, port=5001)
