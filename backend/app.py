# Copyright (c) 2026. All Rights Reserved.
# Proprietary and confidential. Do not distribute.

import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Vendor, Product, Partnership, CartItem, Order, OrderItem
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
    country = data.get('country', '')
    budget_max = data.get('budget', None)
    
    products_query = Product.query.join(Vendor)
    
    if query:
        products_query = products_query.filter(
            Product.name.ilike(f'%{query}%') | 
            Product.specifications.ilike(f'%{query}%') |
            Vendor.name.ilike(f'%{query}%')
        )
    if category:
        products_query = products_query.filter(Product.category.ilike(f'%{category}%'))
        
    if country:
        # Join with Vendor to filter by country
        products_query = products_query.join(Vendor).filter(Vendor.country.ilike(f'%{country}%'))
        
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
        "results": results[:50] 
    })

# --- Cart Endpoints ---

@app.route('/api/cart', methods=['GET'])
def get_cart():
    items = CartItem.query.order_by(CartItem.added_at.desc()).all()
    return jsonify([item.to_dict() for item in items])

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    qty = int(data.get('quantity', 1))
    
    if not product_id:
        return jsonify({"error": "Product ID required"}), 400
    
    existing = CartItem.query.filter_by(product_id=product_id).first()
    if existing:
        existing.quantity += qty
    else:
        db.session.add(CartItem(product_id=product_id, quantity=qty))
        
    db.session.commit()
    return jsonify({"status": "success"})

@app.route('/api/cart/<int:item_id>', methods=['DELETE'])
def remove_from_cart(item_id):
    item = CartItem.query.get(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Removed from cart"}), 200

# --- Checkout & Order Tracking ---

@app.route('/api/checkout', methods=['POST'])
def checkout():
    data = request.get_json()
    client_name = data.get('client_name', 'Default Client')
    destination = data.get('destination', 'Onne Port, Nigeria')
    
    cart_items = CartItem.query.all()
    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400
        
    total = 0
    order = Order(client_name=client_name, destination=destination, total_amount=0)
    db.session.add(order)
    db.session.flush()
    
    for c_item in cart_items:
        product = Product.query.get(c_item.product_id)
        vendor = Vendor.query.get(product.vendor_id)
        
        o_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=c_item.quantity,
            price_at_order=product.price_min,
            product_name=product.name,
            vendor_name=vendor.name
        )
        db.session.add(o_item)
        total += (product.price_min * c_item.quantity)
        
        db.session.delete(c_item) # Clear cart
        
    order.total_amount = total
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "order": order.to_dict(),
        "message": f"Procurement request dispatched for {client_name}"
    })

@app.route('/api/orders', methods=['GET'])
def get_orders():
    orders = Order.query.order_by(Order.created_at.desc()).all()
    # Randomly update status of processing orders for demo purposes
    for o in orders:
        if o.status == 'Processing' and (datetime.utcnow() - o.created_at).seconds > 30:
            o.status = 'In Transit'
            o.tracking_location = 'Global Shipping Hub'
            db.session.commit()
            
    return jsonify([o.to_dict() for o in orders])

@app.route('/api/optimize', methods=['GET'])
def optimize_procurement():
    """AI Advisor: Audits the current cart for logistics and compliance."""
    cart_items = CartItem.query.all()
    if not cart_items:
        return jsonify({"insights": ["Cart is empty. No optimizations identified yet."]})
    
    insights = []
    vendors = set()
    total_value = 0
    local_content_sum = 0
    
    for item in cart_items:
        p = Product.query.get(item.product_id)
        v = Vendor.query.get(p.vendor_id)
        vendors.add(v.name)
        total_value += p.price_min
        local_content_sum += v.local_content_value
    
    avg_local_content = local_content_sum / len(cart_items)
    
    if len(vendors) > 3:
        insights.append(f"LOGISTICS ALERT: You are procuring from {len(vendors)} nodes. Consolidating to 2 nodes could reduce freight by ~15%.")
    
    if avg_local_content < 60:
        insights.append("NCDMB COMPLIANCE: Local content value is currently low. Consider switching to Nigerian-owned nodes for regulatory advantages.")
    else:
        insights.append("COMPLIANCE STRENGTH: Your current procurement profile shows high local content (NCDMB) alignment.")
        
    if total_value > 5000000:
        insights.append("BULK PROCUREMENT: Total order exceeds $5M. Strategic volume discounts may be triggered with SLB or Halliburton.")

    return jsonify({
        "insights": insights,
        "metrics": {
            "vendor_count": len(vendors),
            "avg_local_content": round(avg_local_content, 1)
        }
    })

@app.route('/api/market-pulse', methods=['GET'])
def market_pulse():
    """Live Market Ticker Data."""
    return jsonify([
        {"label": "BRENT CRUDE", "value": "$82.44", "trend": "+1.2%"},
        {"label": "WTI CRUDE", "value": "$78.12", "trend": "+0.8%"},
        {"label": "STEEL (HRC)", "value": "$745/t", "trend": "-2.4%"},
        {"label": "BARYTE (DRILL)", "value": "$142/t", "trend": "+4.1%"},
        {"label": "CEMENT (CLASS G)", "value": "$118/t", "trend": "STABLE"}
    ])

# Endpoint to get unique countries for the dropdown
@app.route('/api/countries', methods=['GET'])
def get_countries():
    countries = db.session.query(Vendor.country).distinct().all()
    country_list = [c[0] for c in countries if c[0]]
    return jsonify(sorted(country_list))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if not Vendor.query.first():
            print("Seeding database via scraper engine...")
            ScraperEngine().perform_scrape()
            print("Database seeded.")
            
    app.run(debug=True, host='0.0.0.0', port=5003)
