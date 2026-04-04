/**
 * MarketPulse - Interactive Global Market Intelligence Engine
 * Rebuilt with Leaflet.js and real-time backend API integration.
 */

const MarketInsights = (function () {

    // ─── DATA ────────────────────────────────────────────────────────────────
    const markets = [
        { city: "New York", lat: 40.7128, lng: -74.0060, connections: ["London", "Tokyo", "Dubai", "São Paulo"], sentiment: 'bullish' },
        { city: "London", lat: 51.5074, lng: -0.1278, connections: ["New York", "Frankfurt", "Dubai", "Mumbai"], sentiment: 'neutral' },
        { city: "Tokyo", lat: 35.6762, lng: 139.6503, connections: ["New York", "Shanghai", "Singapore", "Sydney"], sentiment: 'bullish' },
        { city: "Shanghai", lat: 31.2304, lng: 121.4737, connections: ["Tokyo", "Singapore", "London"], sentiment: 'neutral' },
        { city: "Mumbai", lat: 19.0760, lng: 72.8777, connections: ["London", "Dubai", "Singapore"], sentiment: 'bullish' },
        { city: "Dubai", lat: 25.2048, lng: 55.2708, connections: ["London", "Mumbai", "New York"], sentiment: 'bullish' },
        { city: "Singapore", lat: 1.3521, lng: 103.8198, connections: ["Mumbai", "Tokyo", "Shanghai", "Sydney"], sentiment: 'bullish' },
        { city: "Sydney", lat: -33.8688, lng: 151.2093, connections: ["Singapore", "Tokyo"], sentiment: 'neutral' },
        { city: "São Paulo", lat: -23.5505, lng: -46.6333, connections: ["New York"], sentiment: 'bearish' },
        { city: "Frankfurt", lat: 50.1109, lng: 8.6821, connections: ["London"], sentiment: 'bearish' }
    ];

    // ─── STATE ───────────────────────────────────────────────────────────────
    let map = null;
    let routeLines = [];
    let markerMap = {};
    let heatmapMode = false;
    let initialized = false;

    const sentimentColor = {
        bullish: '#4ade80',   // green
        bearish: '#f87171',   // red
        neutral: '#a78bfa',   // purple
    };

    // ─── INIT ────────────────────────────────────────────────────────────────
    async function init() {
        if (initialized) return;

        map = L.map('map-container', {
            center: [20, 10],
            zoom: 2,
            zoomControl: false,
            attributionControl: false,
            minZoom: 2,
            maxZoom: 6,
            scrollWheelZoom: true,
        });

        // Dark CartoDB tile
        L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
            { subdomains: 'abcd', maxZoom: 20 }
        ).addTo(map);

        // Fetch Live Sentiments for Initial State
        await syncMarketHighlights();

        renderRoutes();
        renderMarkers();
        setupDetailCard();
        setupSpotlight();
        initGlobalTicker();
        setupHeatmapToggle();
        setupSearchPanel();

        // Periodic sync (every 60 seconds)
        setInterval(syncMarketHighlights, 60000);

        initialized = true;
        console.log('MarketPulse — Real-time Engine initialized');
    }

    async function syncMarketHighlights() {
        try {
            const resp = await fetch('/api/market-highlights');
            if (resp.ok) {
                const highlights = await resp.json();
                highlights.forEach(h => {
                    const market = markets.find(m => m.city === h.city);
                    if (market) {
                        market.sentiment = h.sentiment;
                        market.change_pct = h.change_pct;
                    }
                });
                if (initialized) renderMarkers();
            }
        } catch (err) {
            console.error('Market Highlights sync failed:', err);
        }
    }

    // ─── SEARCH COMMAND PANEL (NEW) ──────────────────────────────────────────
    function setupSearchPanel() {
        const input = document.getElementById('market-search-input');
        const results = document.getElementById('market-search-results');
        if (!input || !results) return;

        let debounceTimer;
        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const q = e.target.value.trim();
            if (q.length < 2) {
                results.classList.add('hidden');
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const resp = await fetch(`/api/search-regions?q=${encodeURIComponent(q)}`);
                    const hubs = await resp.json();
                    renderSearchResults(hubs);
                } catch (err) {
                    console.error('Search failed:', err);
                }
            }, 300);
        });

        // Hide results on blur
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !results.contains(e.target)) {
                results.classList.add('hidden');
            }
        });
    }

    function renderSearchResults(hubs) {
        const results = document.getElementById('market-search-results');
        if (!hubs.length) {
            results.innerHTML = '<div class="px-4 py-3 text-[10px] text-slate-500 font-mono italic uppercase">No hubs found</div>';
        } else {
            results.innerHTML = hubs.map(hub => `
                <div class="px-4 py-2 hover:bg-blue-500/10 cursor-pointer border-b border-white/5 transition-all group search-item" data-city="${hub.city}">
                    <div class="text-[10px] text-white font-bold tracking-widest uppercase group-hover:text-blue-400">${hub.city}</div>
                    <div class="text-[8px] text-slate-500 uppercase tracking-tighter">${hub.country} Hub</div>
                </div>
            `).join('');

            results.querySelectorAll('.search-item').forEach(item => {
                item.addEventListener('click', () => {
                    const city = item.getAttribute('data-city');
                    const markerData = markets.find(m => m.city === city);
                    if (markerData) flyToMarker(city);
                    results.classList.add('hidden');
                    document.getElementById('market-search-input').value = '';
                });
            });
        }
        results.classList.remove('hidden');
    }

    function flyToMarker(cityName) {
        const marker = markerMap[cityName];
        const data = markets.find(m => m.city === cityName);
        if (marker && data) {
            map.flyTo([data.lat, data.lng], 4, { duration: 1.5 });
            setTimeout(() => showDetails(data, marker), 1600);
        }
    }

    // ─── GLOBAL TICKER ───────────────────────────────────────────────────────
    async function initGlobalTicker() {
        const track = document.getElementById('global-ticker-track');
        if (!track) return;

        try {
            const resp = await fetch('/api/market-mood');
            if (!resp.ok) throw new Error('API offline');
            const data = await resp.json();
            
            track.innerHTML = '';
            
            // Build items including Mood
            const tickerItems = [];
            
            // 1. Add Mood Item first
            tickerItems.push({
                name: 'Sentiment',
                value: data.mood.toUpperCase(),
                change: data.mood.toLowerCase().includes('greed') ? 'Optimistic' : 'Caution',
                color: data.mood.toLowerCase().includes('greed') ? 'text-cyan-400' : 'text-amber-400'
            });

            // 2. Add Global Indices
            data.indices.forEach(idx => {
                tickerItems.push({
                    name: idx.name,
                    value: idx.price,
                    change: idx.percent,
                    color: idx.trend === 'up' ? 'text-green-400' : (idx.trend === 'down' ? 'text-red-400' : 'text-slate-400')
                });
            });

            // Triple for infinite loop
            const loopItems = [...tickerItems, ...tickerItems, ...tickerItems];
            loopItems.forEach((item) => {
                const el = document.createElement('div');
                el.className = 'flex items-center gap-2 pr-12 shrink-0';
                el.innerHTML = `
                    <span class="text-[8px] text-slate-500 font-black tracking-widest uppercase">${item.name}</span>
                    <span class="text-[9px] ${item.color} font-mono font-bold">${item.value}</span>
                    <span class="text-[8px] ${item.color} opacity-60 font-mono">(${item.change})</span>
                `;
                track.appendChild(el);
            });

            // Start Animation
            track.style.animation = 'ticker-scroll 60s linear infinite';
        } catch (err) {
            console.error('Ticker data fetch failed:', err);
            track.innerHTML = '<span class="text-[9px] text-red-500/50 font-black tracking-widest uppercase">CONNECTION INTERRUPTED</span>';
        }
    }

    function setupHeatmapToggle() {
        const btn = document.getElementById('heatmap-toggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            heatmapMode = !heatmapMode;
            // Update label
            btn.querySelector('span').textContent = heatmapMode ? 'HEATMAP MODE' : 'HEATMAP MODE';
            // Update OFF/ON badge (last span)
            const spans = btn.querySelectorAll('span');
            if (spans.length >= 2) {
                spans[spans.length - 1].textContent = heatmapMode ? 'ON' : 'OFF';
                spans[spans.length - 1].style.opacity = heatmapMode ? '1' : '0.4';
                spans[spans.length - 1].style.color = heatmapMode ? '#60a5fa' : '';
            }
            // Active border highlight
            btn.classList.toggle('border-blue-500/50', heatmapMode);
            btn.classList.toggle('text-blue-400', heatmapMode);
            renderMarkers(); // Redraw markers with sentiment colors
        });
    }

    // ─── SPOTLIGHT TRACKING ──────────────────────────────────────────────────
    function setupSpotlight() {
        const spotlight = document.getElementById('map-spotlight');
        const container = document.getElementById('map-container');
        if (!spotlight || !container) return;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            spotlight.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(96,165,250,0.12), transparent 80%)`;
            spotlight.style.opacity = '1';
        });

        container.addEventListener('mouseleave', () => {
            spotlight.style.opacity = '0';
        });
    }

    // ─── MARKERS ─────────────────────────────────────────────────────────────
    function makeIcon(market) {
        let color = '#60a5fa'; // Blue default
        if (heatmapMode) {
            color = sentimentColor[market.sentiment] || '#60a5fa';
        }
        
        const html = `
            <div class="market-marker-container" style="color: ${color}">
                <div class="marker-pulsing-halo"></div>
                <div class="marker-core" style="background: ${color}; box-shadow: 0 0 15px ${color}aa;"></div>
            </div>`;
            
        return L.divIcon({
            html,
            className: 'market-marker-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
    }

    function renderMarkers() {
        // Clear existing markers
        Object.values(markerMap).forEach(m => map.removeLayer(m));
        markerMap = {};

        markets.forEach(market => {
            const icon = makeIcon(market);
            const marker = L.marker([market.lat, market.lng], { icon }).addTo(map);

            marker.bindTooltip(market.city.toUpperCase(), {
                permanent: false,
                direction: 'top',
                offset: [0, -12],
                className: 'aria-tooltip',
            });

            marker.on('click', () => showDetails(market, marker));
            marker.on('mouseover', () => highlightRoutes(market.city));
            marker.on('mouseout', () => resetRoutes());

            markerMap[market.city] = marker;
        });

        injectTooltipStyles();
    }

    // ─── TRADE ROUTES ────────────────────────────────────────────────────────
    function renderRoutes() {
        const processed = new Set();
        routeLines.forEach(l => map.removeLayer(l));
        routeLines = [];

        markets.forEach(startNode => {
            startNode.connections.forEach(endCityName => {
                const endNode = markets.find(m => m.city === endCityName);
                if (!endNode) return;

                const routeId = [startNode.city, endNode.city].sort().join('-');
                if (processed.has(routeId)) return;
                processed.add(routeId);

                const latlngs = getCurvePoints([startNode.lat, startNode.lng], [endNode.lat, endNode.lng]);

                // Base Path
                L.polyline(latlngs, {
                    color: 'rgba(96,165,250,0.08)',
                    weight: 1,
                    interactive: false,
                    className: 'aria-trade-route-base',
                }).addTo(map);

                // Beaming Path
                const line = L.polyline(latlngs, {
                    color: 'rgba(96,165,250,0.4)',
                    weight: 1.5,
                    className: 'aria-trade-route',
                    cities: `${startNode.city},${endNode.city}`,
                }).addTo(map);

                routeLines.push(line);
            });
        });
    }

    function getCurvePoints(start, end) {
        const points = [];
        const n = 40;
        const midLat = (start[0] + end[0]) / 2;
        const midLng = (start[1] + end[1]) / 2;
        const dLat = end[0] - start[0];
        const dLng = end[1] - start[1];
        const dist = Math.sqrt(dLat*dLat + dLng*dLng);
        const multiplier = 0.15 + (dist * 0.002); 
        const cp = [midLat + (dLng * multiplier), midLng - (dLat * multiplier)];

        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const lat = (1-t)*(1-t)*start[0] + 2*(1-t)*t*cp[0] + t*t*end[0];
            const lng = (1-t)*(1-t)*start[1] + 2*(1-t)*t*cp[1] + t*t*end[1];
            points.push([lat, lng]);
        }
        return points;
    }

    function highlightRoutes(cityName) {
        routeLines.forEach(line => {
            const cities = line.options.cities || '';
            if (cities.includes(cityName)) {
                line.setStyle({ color: '#60a5fa', weight: 3, opacity: 1 });
                if (line.getElement()) line.getElement().classList.add('route-active');
            } else {
                line.setStyle({ opacity: 0.1 });
                if (line.getElement()) line.getElement().classList.remove('route-active');
            }
        });
    }

    function resetRoutes() {
        routeLines.forEach(line => {
            line.setStyle({ color: 'rgba(96,165,250,0.4)', weight: 1.5, opacity: 1 });
            if (line.getElement()) line.getElement().classList.remove('route-active');
        });
    }

    // ─── DETAIL CARD Logic ───────────────────────────────────────────────────
    function setupDetailCard() {
        map.on('click', (e) => {
            // Only hide if we clicked the map background, not a marker
            if (e.originalEvent.target.id === 'map-container' || e.originalEvent.target.classList.contains('leaflet-container')) {
                const card = document.getElementById('market-detail-card');
                if (card) card.classList.add('hidden');
            }
        });
    }

    async function showDetails(market, marker) {
        const card = document.getElementById('market-detail-card');
        if (!card) return;

        // Reset and Show Loading State
        card.classList.remove('hidden');
        document.getElementById('market-city').textContent = market.city.toUpperCase();
        document.getElementById('market-ai-outlook').innerHTML = `<div class="animate-pulse text-slate-500 italic">Decrypting regional macroeconomic signals...</div>`;
        
        updateCardPosition(market);
        map.panTo([market.lat, market.lng], { animate: true, duration: 0.5 });

        try {
            const resp = await fetch(`/api/market-data/${encodeURIComponent(market.city)}`);
            const realData = await resp.json();
            
            // Populate Metrics (LIVE)
            const gdpEl = document.getElementById('market-gdp');
            if (gdpEl) gdpEl.textContent = realData.macro.gdp;

            const mcapEl = document.getElementById('market-cap');
            if (mcapEl) mcapEl.textContent = realData.macro.marketCap;
            
            const growthEl = document.getElementById('market-growth');
            if (growthEl) {
                growthEl.textContent = realData.macro.growth;
                growthEl.className = `text-xs font-bold tracking-widest ${realData.macro.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'}`;
            }

            const inflationEl = document.getElementById('market-inflation');
            if (inflationEl) inflationEl.textContent = realData.macro.inflation;

            const popEl = document.getElementById('market-population');
            if (popEl) popEl.textContent = realData.macro.population;

            // Update Sentiment & Status Color
            const sentimentEl = document.getElementById('market-sentiment');
            if (sentimentEl) {
                sentimentEl.textContent = realData.sentiment.toUpperCase();
                sentimentEl.className = `text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                    realData.sentiment === 'bullish' ? 'text-green-400 border-green-400/30 bg-green-400/5' : 'text-red-400 border-red-500/30 bg-red-400/5'
                }`;
            }

            // Market Status
            const ms = realData.marketStatus;
            document.getElementById('market-status-text').textContent = `${ms.exchange}: ${ms.status}`;
            document.getElementById('market-local-time').textContent = ms.localTime;
            document.getElementById('market-next-event').textContent = ms.nextEvent;
            
            const dot = document.getElementById('market-status-dot');
            if (dot) {
                dot.className = `w-1.5 h-1.5 rounded-full ${ms.status === 'OPEN' ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`;
            }

            // Tables
            const sectorContainer = document.getElementById('market-sectors');
            sectorContainer.innerHTML = '';
            realData.sectors.forEach(s => {
                const row = document.createElement('div');
                row.className = 'flex justify-between items-center text-[10px]';
                row.innerHTML = `<span class="text-slate-400 underline decoration-white/10 decoration-dotted underline-offset-4">${s.name}</span><span class="${s.change.startsWith('+') ? 'text-green-400' : 'text-red-400'} font-bold">${s.change}</span>`;
                sectorContainer.appendChild(row);
            });

            const companyContainer = document.getElementById('market-companies');
            companyContainer.innerHTML = '';
            realData.topCompanies.forEach(c => {
                const box = document.createElement('div');
                box.className = 'bg-black/40 p-1.5 rounded border border-white/5 flex flex-col hover:border-blue-500/30 transition-colors cursor-pointer';
                box.innerHTML = `<span class="text-[9px] text-slate-300 font-bold">${c.name}</span><span class="text-[8px] ${c.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}">${c.change}</span>`;
                companyContainer.appendChild(box);
            });

            document.getElementById('market-capital-flow').textContent = realData.capitalFlow;
            const riskEl = document.getElementById('market-risk-level');
            riskEl.textContent = realData.riskLevel;
            riskEl.className = `text-[10px] font-bold ${realData.riskLevel.includes('High') ? 'text-red-400' : realData.riskLevel.includes('Low') ? 'text-green-400' : 'text-yellow-400'}`;

            document.getElementById('market-ai-outlook').textContent = realData.aiOutlook;

        } catch (err) {
            console.error('Market fetch failed:', err);
            document.getElementById('market-ai-outlook').innerHTML = `<span class="text-red-400">Connection Interrupted. Re-synchronizing regional nodes...</span>`;
        }
    }

    function updateCardPosition(market) {
        const card = document.getElementById('market-detail-card');
        const point = map.latLngToContainerPoint([market.lat, market.lng]);
        const container = map.getContainer();
        const rect = container.getBoundingClientRect();

        let left = point.x + 20;
        let top  = point.y - 120;
        if (left + 360 > rect.width)  left = point.x - 380;
        if (top + 450  > rect.height) top  = rect.height - 470;
        if (top < 10) top = 10;

        card.style.left = `${left}px`;
        card.style.top  = `${top}px`;
    }

    // ─── CSS INJECTION ───────────────────────────────────────────────────────
    function injectTooltipStyles() {
        if (document.getElementById('aria-market-styles')) return;
        const style = document.createElement('style');
        style.id = 'aria-market-styles';
        style.textContent = `
            .leaflet-container { background: #050510 !important; cursor: crosshair !important; border: none !important; }
            .aria-tooltip { background: rgba(0,0,0,0.9) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; font-family: monospace; font-size: 10px; letter-spacing: 2px; }
            .market-marker-icon { z-index: 1000; }
            .marker-core { width: 10px; height: 10px; border-radius: 50%; border: 2.5px solid #fff; box-shadow: 0 0 10px currentColor; }
            .marker-pulsing-halo { 
                position: absolute; 
                width: 40px; 
                height: 40px; 
                left: -8px; 
                top: -8px; 
                border-radius: 50%; 
                background: currentColor; 
                opacity: 0; 
                animation: marker-pulse 4s cubic-bezier(0.24, 0, 0.38, 1) infinite; 
            }
            @keyframes marker-pulse { 
                0% { transform: scale(0.4); opacity: 0.6; } 
                50% { opacity: 0.2; }
                100% { transform: scale(2.5); opacity: 0; } 
            }
            
            .aria-trade-route { 
                stroke-dasharray: 4, 150; 
                animation: flow 12s linear infinite; 
                filter: drop-shadow(0 0 2px rgba(96,165,250,0.5));
            }
            .aria-trade-route-base {
                stroke-opacity: 0.05;
            }
            
            @keyframes flow { 
                from { stroke-dashoffset: 300; }
                to { stroke-dashoffset: 0; } 
            }
            
            .route-active { 
                stroke-width: 4; 
                stroke: #60a5fa !important; 
                filter: drop-shadow(0 0 8px #60a5fa); 
                stroke-dasharray: none;
                animation: route-glow 2s ease-in-out infinite alternate;
            }
            
            @keyframes route-glow {
                from { filter: drop-shadow(0 0 4px #60a5fa); opacity: 0.8; }
                to { filter: drop-shadow(0 0 12px #60a5fa); opacity: 1; }
            }
            
            #global-ticker-track {
                display: flex;
                will-change: transform;
            }
            @keyframes ticker-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-33.333%); }
            }
        `;
        document.head.appendChild(style);
    }

    return { init };

})();
