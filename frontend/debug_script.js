    
        const API_HOST = window.location.hostname || 'localhost';
        const API_BASE = `http://${API_HOST}:5003/api`;
        let currentResults = [];

        window.addEventListener('load', async () => {
            loadCountries();
            updateCartUI();
        });

        async function loadCountries() {
            try {
                const res = await fetch(`${API_BASE}/countries`);
                const countries = await res.json();
                const list = document.getElementById('countryList');
                list.innerHTML = countries.map(c => `<option value="${c}">${c}</option>`).join('');
            } catch (e) { console.error("Countries load failed"); }
        }

        async function executeSearch() {
            const query = document.getElementById('query').value;
            const category = document.getElementById('category').value;
            const country = document.getElementById('country').value;
            const budgetVal = document.getElementById('budget').value;
            
            const payload = {
                query: query,
                category: category,
                country: country,
                budget: budgetVal ? parseFloat(budgetVal) : null
            };

            const grid = document.getElementById('resultsGrid');
            const loader = document.getElementById('loader');
            const statusBar = document.getElementById('statusBar');
            
            grid.innerHTML = '';
            statusBar.style.display = 'none';
            loader.classList.add('active');

            try {
                const response = await fetch(`${API_BASE}/search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                loader.classList.remove('active');
                currentResults = data.results || [];
                
                if (currentResults.length > 0) {
                    statusBar.style.display = 'flex';
                    document.getElementById('resCount').textContent = data.count;
                    renderResults(currentResults);
                } else {
                    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 10rem; color: var(--text-muted); font-size: 1.4rem; font-weight: 700;">Zero matches identified in the requested vector. Broaden search criteria.</div>';
                }
            } catch (err) {
                loader.classList.remove('active');
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #ef4444;">Core Synchronization Failure. API Unreachable.</div>';
            }
        }


        function renderResults(results) {
            const grid = document.getElementById('resultsGrid');
            grid.innerHTML = results.map((item, idx) => {
                const p = item.product;
                const v = item.vendor;
                const price_formatted = p.price_min >= 1000000 ? (p.price_min/1000000).toFixed(1) + 'M' : 
                                        p.price_min >= 1000 ? (p.price_min/1000).toFixed(1) + 'k' : p.price_min.toFixed(2);
                
                // First 3 partners for the card
                const partnersHtml = v.partnerships.slice(0, 3).map(pt => `<span class="partner-pill">${pt}</span>`).join('');

                const isLocal = v.country === "Nigeria";
                return `
                    <div class="card" style="animation: modalIn ${0.3 + (idx * 0.05)}s ease-out backwards;">
                        <div class="card-image-wrap" onclick="openModal(${idx})">
                            <img src="${p.image_url}" class="card-image" onerror="this.src='https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'">
                            <div class="category-tag">${p.category}</div>
                            ${p.tech_spec ? `<div style="position:absolute; top:20px; right:20px; background:rgba(0,0,0,0.6); backdrop-filter:blur(10px); color:var(--accent-hover); padding:0.4rem 1rem; border-radius:12px; font-weight:800; border:1px solid var(--accent-hover); font-size:0.8rem; box-shadow:0 10px 20px rgba(0,0,0,0.3);">${p.tech_spec}</div>` : ''}
                        </div>
                        <div class="card-body">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <h3 class="product-title" onclick="openModal(${idx})">${p.name}</h3>
                                <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.7rem; color:var(--text-muted); cursor:pointer;">
                                    <input type="checkbox" onchange="toggleCompare(${idx})" style="width:16px; height:16px;"> Compare
                                </label>
                            </div>
                            <div class="vendor-info-row">
                                <span class="vendor-name" style="display:flex; justify-content:space-between;">
                                    <span>🏢 ${v.name}</span>
                                    ${isLocal ? `<span style="font-size:0.7rem; background:rgba(16,185,129,0.2); color:var(--accent-success); padding:2px 8px; border-radius:4px; border:1px solid var(--accent-success);">NCDMB VERIFIED</span>` : ''}
                                </span>
                                <span class="location-text">📍 ${v.location}, ${v.country}</span>
                            </div>
                            <div style="display:flex; gap:1.5rem; margin: 0.5rem 0;">
                                <div style="font-size: 0.75rem; color: var(--accent-primary); font-weight: 700;">🚛 Lead Time: ${p.lead_time_days}d</div>
                                <div style="font-size: 0.75rem; color: var(--accent-hover); font-weight: 700;">🇳🇬 Local Content: ${v.local_content_value}%</div>
                            </div>
                        </div>
                        <div class="card-footer" onclick="openModal(${idx})">
                            <div class="price-val">$${price_formatted} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">/ ${p.unit}</span></div>
                            <div style="background:var(--accent-warning); color:black; padding:0.3rem 0.8rem; border-radius:10px; font-weight:900; font-size: 0.9rem;">⭐ ${v.rating.toFixed(1)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        async function processCheckout(event) {
            const clientName = document.getElementById('clientName').value;
            const destination = document.getElementById('destinationHub').value;
            const btn = event.target;
            
            if (!clientName || !destination) {
                alert("Procurement Protocol: Please specify Client Identity and Strategic Destination.");
                return;
            }

            const originalText = btn.textContent;
            btn.textContent = "⚙️ ACTIVATING NODES...";
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/checkout`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ client_name: clientName, destination: destination })
                });
                
                const data = await res.json();
                
                if (res.ok && data.status === 'success') {
                    showToast(); 
                    
                    // Immediate Receipt Generation
                    const receiptWindow = window.open('', '_blank');
                    receiptWindow.document.write(generateReceiptHTML(data.order));
                    receiptWindow.document.close();

                    closeCheckout();
                    updateCartUI();
                    
                    setTimeout(() => {
                        toggleOrders();
                    }, 800);
                } else {
                    throw new Error(data.error || "Dispatch synchronization failure");
                }
            } catch (err) {
                alert("Network Fault: " + err.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }

        function generateReceiptHTML(order) {
            return `
                <html>
                <head>
                    <title>PetroHub Procurement Receipt - ${order.id}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #0ea5e3; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
                        .title { font-size: 24px; font-weight: 900; text-transform: uppercase; }
                        .meta { text-align: right; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
                        th { text-align: left; background: #f8f9fa; padding: 12px; border-bottom: 2px solid #eee; }
                        td { padding: 12px; border-bottom: 1px solid #eee; }
                        .total { text-align: right; font-size: 20px; font-weight: 800; color: #0ea5e3; }
                        .footer { margin-top: 50px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="title">PetroHub Procurement Node</div>
                            <div>Global Logistics & Supply Chain</div>
                        </div>
                        <div class="meta">
                            <div>Order ID: ORD-${order.id.toString().padStart(4, '0')}</div>
                            <div>Date: ${new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div>
                        <strong>Client:</strong> ${order.client_name}<br>
                        <strong>Destination:</strong> ${order.destination}
                    </div>
                    <table>
                        <thead>
                            <tr><th>Item Description</th><th>Vendor</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
                        </thead>
                        <tbody>
                            ${order.items.map(i => `
                                <tr>
                                    <td>${i.product_name}</td>
                                    <td>${i.vendor_name}</td>
                                    <td>${i.quantity}</td>
                                    <td>$${i.price.toLocaleString()}</td>
                                    <td>$${(i.price * i.quantity).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total">Network Total: $${order.total_amount.toLocaleString()}</div>
                    <div class="footer">
                        This is an autonomous procurement record generated by the PetroHub Intelligence Network.<br>
                        The respective vendors have been notified via secure API dispatch.
                    </div>
                    window.print();<\/script>
                </body>
                </html>
            `;
        }

        async function updateMarketPulse() {
            try {
                const res = await fetch(`${API_BASE}/market-pulse`);
                const data = await res.json();
                const ticker = document.getElementById('tickerItems');
                // Create a repeated string for infinite marquee
                const content = data.map(item => `
                    <div class="pulse-item">
                        <span style="opacity:0.6; color:var(--text-muted);">${item.label}:</span>
                        <span style="color:white;">${item.value}</span>
                        <span style="color:${item.trend.includes('+') ? '#10b981' : '#ef4444'}">${item.trend}</span>
                    </div>
                `).join('');
                ticker.innerHTML = content + content + content + content; 
            } catch (e) { console.error("Ticker failed", e); }
        }

        async function updateOracle() {
            try {
                const res = await fetch(`${API_BASE}/optimize`);
                const data = await res.json();
                const el = document.getElementById('oracleInsights');
                el.innerHTML = data.insights.map(i => `<div style="margin-bottom:0.6rem; display:flex; gap:0.5rem;"><span>▸</span> ${i}</div>`).join('');
            } catch (e) {}
        }

        function toggleOrders() {
            console.log("Toggle Orders Triggered");
            const pane = document.getElementById('ordersPane');
            if (!pane) { alert("System Error: Orders Pane missing"); return; }
            pane.classList.toggle('active');
            if (pane.classList.contains('active')) {
                loadOrders();
                renderTacticalMap();
            }
        }

        function renderTacticalMap() {
            const map = document.getElementById('mapView');
            map.innerHTML = `
                <svg width="100%" height="100%" viewBox="0 0 400 220" style="background:#020408;">
                    <!-- Static Grid -->
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    <!-- Supply Route -->
                    <circle cx="50" cy="180" r="4" class="map-node" />
                    <text x="40" y="200" fill="white" font-size="8" font-weight="800">VENDOR HUB (TX/NG/NO)</text>
                    
                    <path d="M 50 180 Q 200 50 350 100" fill="none" class="map-line" id="routePath" />
                    
                    <circle cx="350" cy="100" r="6" fill="var(--accent-hover)" />
                    <text x="310" y="125" fill="var(--accent-hover)" font-size="9" font-weight="900">STRATEGIC DESTINATION</text>
                    
                    <!-- Animated Pulse -->
                    <circle r="3" fill="white">
                        <animateMotion dur="4s" repeatCount="indefinite" path="M 50 180 Q 200 50 350 100" />
                    </circle>
                </svg>
            `;
        }

        let compareList = [];
        function toggleCompare(idx) {
            const item = currentResults[idx];
            const foundIdx = compareList.findIndex(c => c.product.id === item.product.id);
            if (foundIdx > -1) compareList.splice(foundIdx, 1);
            else compareList.push(item);
            
            if (compareList.length >= 1) showCompareBar();
            else hideCompareBar();
        }

        function showCompareBar() {
            let bar = document.getElementById('compareBar');
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'compareBar';
                bar.style = "position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); background:var(--accent-primary); color:black; padding:1.2rem 3rem; border-radius:100px; display:flex; gap:2.5rem; align-items:center; z-index:9000; box-shadow:0 30px 60px rgba(0,0,0,0.6); font-weight:900; border:2px solid rgba(255,255,255,0.2); backdrop-filter:blur(10px);";
                document.body.appendChild(bar);
            }
            bar.innerHTML = `
                <span>⚖️ COMPARISON MODE: ${compareList.length} ITEMS</span>
                <button onclick="launchComparison()" style="background:white; color:black; border:none; padding:0.5rem 1.5rem; border-radius:50px; font-weight:900; cursor:pointer;">LIFT BATTLE-CARD</button>
                <div onclick="clearCompare()" style="cursor:pointer; opacity:0.8;">✕</div>
            `;
            bar.style.display = 'flex';
        }

        function hideCompareBar() {
            const bar = document.getElementById('compareBar');
            if (bar) bar.style.display = 'none';
        }

        function clearCompare() {
            compareList = [];
            hideCompareBar();
            searchProducts(); // Refresh to clear checkboxes
        }

        function launchComparison() {
            const modal = document.getElementById('modal');
            const content = document.getElementById('modalContent');
            
            content.innerHTML = `
                <div class="modal-close" onclick="closeModal()">✕</div>
                <div style="padding:4rem; width:100%; max-width:1000px; display:flex; flex-direction:column; gap:3rem;">
                    <h2 style="font-size:3rem; font-weight:900; text-align:center;">Strategic Battle-Card</h2>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem;">
                        ${compareList.map(c => `
                            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:30px; overflow:hidden;">
                                <img src="${c.product.image_url}" style="width:100%; height:250px; object-fit:cover;">
                                <div style="padding:2rem;">
                                    <div style="font-size:0.8rem; color:var(--accent-primary); font-weight:900; margin-bottom:0.5rem;">${c.product.category}</div>
                                    <h3 style="font-size:1.8rem; margin-bottom:1rem;">${c.product.name}</h3>
                                    <div style="display:grid; gap:0.8rem; font-size:0.9rem;">
                                        <div style="display:flex; justify-content:space-between;"><span>Vendor:</span><span style="color:white; font-weight:800;">${c.vendor.name}</span></div>
                                        <div style="display:flex; justify-content:space-between;"><span>NCDMB Score:</span><span style="color:var(--accent-success); font-weight:800;">${c.vendor.local_content_value}%</span></div>
                                        <div style="display:flex; justify-content:space-between;"><span>Trust Score:</span><span style="color:var(--accent-hover); font-weight:800;">${c.vendor.trust_score}</span></div>
                                        <div style="display:flex; justify-content:space-between;"><span>Unit Price:</span><span style="color:white; font-weight:900;">$${c.product.price_min.toLocaleString()}</span></div>
                                        <div style="display:flex; justify-content:space-between;"><span>Lead Time:</span><span style="color:white;">${c.product.lead_time_days} Days</span></div>
                                    </div>
                                    <div style="margin-top:2rem; padding:1.5rem; background:rgba(0,0,0,0.3); border-radius:15px; font-size:0.8rem; color:var(--text-muted); line-height:1.6;">
                                        ${c.product.specifications}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            modal.classList.add('active');
        }

        async function loadOrders() {
            const res = await fetch(`${API_BASE}/orders`);
            const orders = await res.json();
            const list = document.getElementById('ordersList');
            
            list.innerHTML = orders.map(o => `
                <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 15px; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="font-weight: 800; color: var(--accent-hover);">ORD-${o.id.toString().padStart(4, '0')}</span>
                        <span style="background: var(--accent-primary); color: black; font-size: 0.7rem; font-weight: 900; padding: 0.2rem 0.6rem; border-radius: 5px; text-transform: uppercase;">${o.status}</span>
                    </div>
                    <div style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem;">👤 ${o.client_name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">📍 Current: ${o.tracking_location}</div>
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; font-size: 0.8rem;">
                        ${o.items.map(i => `<div>• ${i.product_name} (${i.quantity})</div>`).join('')}
                    </div>
                    <div style="margin-top: 1rem; font-weight: 800; text-align: right;">$${o.total_amount.toLocaleString()}</div>
                    <button onclick="downloadReceipt(${o.id})" style="width: 100%; margin-top: 1rem; background: rgba(255,255,255,0.1); border: none; color: white; padding: 0.5rem; border-radius: 5px; font-size: 0.8rem; cursor: pointer;">📄 Download Receipt</button>
                </div>
            `).join('');
        }

        function downloadReceipt(orderId) {
            alert("Receipt Download Started: PetroHub_Order_" + orderId + ".pdf");
            // In a real app, this would point to a PDF generator
        }

        async function openCheckout() {
            // Close cart first for seamless transition
            const cartPane = document.getElementById('cartPane');
            if (cartPane.classList.contains('active')) {
                cartPane.classList.remove('active');
            }
            
            // Populate summary
            const res = await fetch(`${API_BASE}/cart`);
            const cart = await res.json();
            const summary = document.getElementById('checkoutSummary');
            const totalEl = document.getElementById('checkoutTotal');
            
            let total = 0;
            summary.innerHTML = cart.map(item => {
                total += item.product.price_min;
                return `<div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span>• ${item.product.name}</span>
                    <span>$${item.product.price_min.toLocaleString()}</span>
                </div>`;
            }).join('');
            
            totalEl.textContent = `Total: $${total.toLocaleString()}`;
            
            document.getElementById('checkoutModal').classList.add('active');
        }

        function closeCheckout() {
            document.getElementById('checkoutModal').classList.remove('active');
        }

        function openModal(idx) {
            const item = currentResults[idx];
            const p = item.product;
            const v = item.vendor;
            const modal = document.getElementById('modal');
            const content = document.getElementById('modalContent');
            
            const partnersHtml = v.partnerships.map(pt => `<span class="partner-pill" style="font-size:0.9rem; padding: 0.5rem 1.2rem; background:rgba(255,255,255,0.08);">${pt}</span>`).join('');

            content.innerHTML = `
                <div class="modal-image-col">
                    <img src="${p.image_url}" onerror="this.src='https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'">
                </div>
                <div class="modal-details-col">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:-1rem;">
                        <div style="font-size:0.9rem; color:var(--accent-primary); font-weight:900; text-transform:uppercase; letter-spacing:2px;">${p.category}</div>
                        ${p.tech_spec ? `<div style="background:var(--accent-hover); color:black; padding:0.3rem 1rem; border-radius:10px; font-weight:900; font-size:0.9rem;">${p.tech_spec}</div>` : ''}
                    </div>
                    <h2 style="font-size: 3rem; font-weight: 900; line-height: 1.1;">${p.name}</h2>
                    
                    <div style="display:flex; align-items:center; gap:1.2rem; margin-bottom:0.5rem;">
                        <span style="font-size: 1.2rem; font-weight: 800; color:var(--accent-hover);">🏢 ${v.name}</span>
                        <span class="location-text" style="font-size:1rem;">📍 ${v.country}</span>
                        <span style="background:rgba(255,255,255,0.1); color:white; padding:0.2rem 0.6rem; border-radius:5px; font-size:0.8rem; font-weight:700;">📦 ${p.pack_weight} Pack</span>
                    </div>
                    
                    <div class="specs-pane">
                        <strong style="color:white; display:block; margin-bottom:0.8rem; font-size:1.1rem;">Engineering Logic & Advantage:</strong>
                        <div style="color:var(--text-main); font-weight:500;">${p.specifications}</div>
                    </div>

                    <div class="partnership-box">
                        <strong style="font-size:0.9rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; font-weight:800;">Strategy Partners (Patronized By):</strong>
                        <div class="partner-grid">
                            ${partnersHtml}
                        </div>
                    </div>

                    <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 2rem; border-top:1px solid rgba(255,255,255,0.05);">
                        <div style="display:flex; gap:1.5rem; align-items:center;">
                            <div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); text-transform:uppercase; font-weight:800;">Node Rate (${p.unit})</div>
                                <div class="price-val" style="font-size: 2.2rem;">$${p.price_min.toLocaleString()}</div>
                            </div>
                            <div style="background:rgba(255,255,255,0.08); padding:0.8rem 1.2rem; border-radius:15px; display:flex; flex-direction:column; gap:0.4rem; border:1px solid var(--accent-primary);">
                                <label style="font-size:0.65rem; color:var(--accent-primary); font-weight:900; text-transform:uppercase;">Order Qty</label>
                                <div style="display:flex; align-items:center; gap:1rem;">
                                    <button class="qty-btn" onclick="adjustQty(-1)" style="border:none; background:rgba(255,255,255,0.1); width:24px; height:24px; border-radius:4px; color:white; cursor:pointer;">-</button>
                                    <input type="number" id="orderQty" value="1" min="1" readonly style="background:transparent; border:none; color:white !important; font-size:1.6rem; font-weight:900; width:60px; outline:none; text-align:center; -webkit-text-fill-color: white;">
                                    <button class="qty-btn" onclick="adjustQty(1)" style="border:none; background:rgba(255,255,255,0.1); width:24px; height:24px; border-radius:4px; color:white; cursor:pointer;">+</button>
                                </div>
                            </div>
                        </div>
                        <button class="btn-add-cart" onclick="addToCart(${p.id})" style="padding: 1.2rem 3rem; font-size: 1.2rem; border-radius:15px; background:var(--accent-primary); color:black; font-weight:900; cursor:pointer; border:none; box-shadow:0 10px 30px rgba(14,165,233,0.4);">⚡ DEPLOY TO CART</button>
                    </div>
                </div>
            `;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            document.getElementById('modal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        async function addToCart(pid) {
            const qty = document.getElementById('orderQty')?.value || 1;
            console.log("Procurement commitment initiated for Product ID:", pid, "Quantity:", qty);
            try {
                const res = await fetch(`${API_BASE}/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: pid, quantity: qty })
                });
                if (res.ok) {
                    showToast();
                    updateCartUI();
                    closeModal();
                } else {
                    const err = await res.json();
                    alert("Procurement Node Rejection: " + (err.error || "Network Fault"));
                }
            } catch (e) { 
                console.error("Cart error", e);
                alert("Critical System Fault: Communication with procurement server lost.");
            }
        }

        async function updateCartUI() {
            try {
                const res = await fetch(`${API_BASE}/cart`);
                const cart = await res.json();
                document.getElementById('cartCount').textContent = cart.length;
                
                const list = document.getElementById('cartItems');
                const totalEl = document.getElementById('cartTotal');
                
                if (cart.length === 0) {
                    list.innerHTML = '<div style="text-align:center; padding: 8rem; color:var(--text-muted); font-size:1.2rem; font-weight:600;">Inventory Empty</div>';
                    if (totalEl) totalEl.textContent = 'Total: $0.00';
                    return;
                }
                
                let total = 0;
                list.innerHTML = cart.map(item => {
                    total += item.product.price_min * item.quantity;
                    return `
                        <div class="cart-item" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem;">
                            <img src="${item.product.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" onerror="this.src='https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'">
                            <div style="flex-grow:1;">
                                <div style="font-weight: 800; font-size: 0.9rem;">${item.product.name}</div>
                                <div style="display:flex; gap:1rem; align-items:center;">
                                    <div style="font-size: 0.8rem; color: var(--accent-primary); font-weight: 700;">$${item.product.price_min.toLocaleString()}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 800;">QTY: ${item.quantity}</div>
                                </div>
                            </div>
                            <div onclick="removeFromCart(${item.id})" style="cursor: pointer; opacity: 0.5;">✕</div>
                        </div>
                    `;
                }).join('');
                
                if (totalEl) totalEl.textContent = `Total: $${total.toLocaleString()}`;
            } catch (e) { console.error("Cart UI failed"); }
        }

        async function removeFromCart(id) {
            await fetch(`${API_BASE}/cart/${id}`, { method: 'DELETE' });
            updateCartUI();
        }

        function toggleCart() {
            console.log("Toggle Cart Triggered");
            const pane = document.getElementById('cartPane');
            if (!pane) { alert("System Error: Cart Pane missing"); return; }
            pane.classList.toggle('active');
            if (pane.classList.contains('active')) {
                updateCartUI();
                updateOracle();
            }
        }

        function showToast() {
            const t = document.getElementById('toast');
            t.classList.add('active');
            setTimeout(() => t.classList.remove('active'), 3000);
        }

        // Initialize Market Pulse
        updateMarketPulse();
        setInterval(updateMarketPulse, 60000); // Update every minute

        function adjustQty(v) {
            const el = document.getElementById('orderQty');
            let val = parseInt(el.value) + v;
            if (val < 1) val = 1;
            el.value = val;
        }

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeModal();
                document.getElementById('cartPane').classList.remove('active');
                document.getElementById('ordersPane').classList.remove('active');
            }
            if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') executeSearch();
        });
    
