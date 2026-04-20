# GAIA.AI 🛢️

**Autonomous Petroleum Equipment & Data Acquisition System**

This system represents a high-end, dynamic hub for scraping and identifying petroleum supply materials across the global market. It includes custom indexing algorithms that generate dynamic "Trust Scores" and evaluate market vendors based on industry sales volumes and major partnerships (such as Halliburton, ExxonMobil, SLB).

## Notice: Proprietary Intellectual Property

> **[CLOSED SOURCE WARNING]**
> This repository is published strictly for showcase and demonstration purposes.
> The source code is proprietary and confidential. 
> 
> *The core `scraper_engine.py` (which houses the partnership indexing logics and scoring heuristics) has been compiled and obfuscated using Pyarmor to protect trade secrets.*
>
> You may NOT copy, reproduce, or distribute the algorithmic architecture, UI styles, or database models. **All Rights Reserved.**

## Features
- **Intelligent Acquisition**: Automates B2B product extraction.
- **Dynamic Trust Metric**: Weights vendors by who trusts them.
- **Precision Budgeting**: Filters out-of-bounds resources explicitly matching client caps.

### For GAIA Integration
To run the server in GAIA:
```bash
cd backend
python3 app.py
```
*(The obfuscated `scraper_engine.py` will execute natively in Python 3 environments without requiring reverse-engineering).*
