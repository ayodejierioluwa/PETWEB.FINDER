from app import app, db
from scraper_engine import ScraperEngine
import os

with app.app_context():
    db.create_all()
    print("Database schema verified.")
    if not os.path.exists('petrohub.db'):
        print("Creating new database...")
    
    print("Seeding diverse vendor network...")
    result = ScraperEngine().perform_scrape()
    print(f"Success: {result}")
