import httpx
import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Any, List
import yfinance as yf

class MarketDataService:
    def __init__(self):
        self.cache: Dict[str, Any] = {}
        self.cache_expiry = 3600  # 1 hour for macro, market is more frequent
        # Mapping as before
        self.market_map = {
            "New York": {"index": "^GSPC", "exchange": "NYSE", "country": "USA", "iso": "USA"},
            "Frankfurt": {"index": "^GDAXI", "exchange": "FSX", "country": "DEU", "iso": "DEU"},
            "London": {"index": "^FTSE", "exchange": "LSE", "country": "GBR", "iso": "GBR"},
            "Mumbai": {"index": "^BSESN", "exchange": "NSE", "country": "IND", "iso": "IND"},
            "Tokyo": {"index": "^N225", "exchange": "JPX", "country": "JPN", "iso": "JPN"},
            "Singapore": {"index": "^STI", "exchange": "SGX", "country": "SGP", "iso": "SGP"},
            "Shanghai": {"index": "000001.SS", "exchange": "SSE", "country": "CHN", "iso": "CHN"},
            "São Paulo": {"index": "^BVSP", "exchange": "BOVESPA", "country": "BRA", "iso": "BRA"},
            "Dubai": {"index": "^DFMGI", "exchange": "DFM", "country": "ARE", "iso": "AE"},
            "Sydney": {"index": "^AXJO", "exchange": "ASX", "country": "AUS", "iso": "AUS"}
        }

    async def get_regional_data(self, city: str) -> Dict[str, Any]:
        """Fetches and caches data for a specific regional node."""
        now = time.time()
        if city in self.cache:
            data, timestamp = self.cache[city]
            if now - timestamp < 300: # 5 min cache for indices
                return data

        config = self.market_map.get(city)
        if not config: return {"error": "Region not found"}

        # Fetch Live Signals
        macro = await self._fetch_live_macro(config['iso'])
        market = await self._fetch_live_index(config['index'])
        
        result = {
            "city": city,
            "sentiment": self._calc_sentiment(market.get('change_pct', 0)),
            "marketStatus": {
                "exchange": config['exchange'],
                "status": "OPEN", 
                "localTime": datetime.now(timezone.utc).strftime("%I:%M %p"),
                "nextEvent": "Next Close: 04:00 PM"
            },
            "macro": macro,
            "marketIndex": market,
            "sectors": [
                {"name": "Technology", "change": f"{+1.2 + (market.get('change_pct',0)/2):.1f}%"},
                {"name": "Finance", "change": f"{+0.8 + (market.get('change_pct',0)/3):.1f}%"},
                {"name": "Healthcare", "change": "-0.2%"}
            ],
            "topCompanies": [
                {"name": "Alpha Corp", "change": "+1.1%"},
                {"name": "Beta Ltd", "change": "+0.7%"}
            ],
            "capitalFlow": "Institutional Inflow" if market.get('change_pct',0) > 0 else "Cautious Outflow",
            "riskLevel": "Low" if abs(market.get('change_pct',0)) < 1.0 else "Elevated",
            "aiOutlook": self._generate_ai_outlook(city, market, macro)
        }
        self.cache[city] = (result, now)
        return result

    def _calc_sentiment(self, change_pct: float) -> str:
        """Returns bullish, bearish, or neutral based on index change."""
        if change_pct > 0.2: return "bullish"
        if change_pct < -0.2: return "bearish"
        return "neutral"

    async def get_all_hubs_data(self) -> List[Dict[str, Any]]:
        """Return a simplified snapshot for all market nodes (for heatmap)."""
        tasks = [self._fetch_live_index(conf['index']) for conf in self.market_map.values()]
        indices = await asyncio.gather(*tasks)
        
        results = []
        for city, index in zip(self.market_map.keys(), indices):
            results.append({
                "city": city,
                "sentiment": self._calc_sentiment(index.get('change_pct', 0)),
                "change_pct": index.get('change_pct', 0)
            })
        return results

    async def _fetch_live_macro(self, iso: str) -> Dict[str, Any]:
        """Fetch live macro from World Bank (Keyless)."""
        try:
            urls = {
                "gdp": f"https://api.worldbank.org/v2/country/{iso}/indicator/NY.GDP.MKTP.CD?format=json&per_page=1",
                "growth": f"https://api.worldbank.org/v2/country/{iso}/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=1",
                "inflation": f"https://api.worldbank.org/v2/country/{iso}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=1",
                "population": f"https://api.worldbank.org/v2/country/{iso}/indicator/SP.POP.TOTL?format=json&per_page=1",
                "market_cap": f"https://api.worldbank.org/v2/country/{iso}/indicator/CM.MKT.LCAP.CD?format=json&per_page=1",
                "lending_rate": f"https://api.worldbank.org/v2/country/{iso}/indicator/FR.INR.LEND?format=json&per_page=1"
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                res_list = await asyncio.gather(*[client.get(u) for u in urls.values()])
                res = dict(zip(urls.keys(), res_list))
                
            def val(r): 
                try: return r.json()[1][0]['value']
                except: return None
            
            pop = val(res['population'])
            mcap = val(res['market_cap'])
            rate_val = val(res['lending_rate'])
            # Soft fallback if bank rate is missing
            rate = rate_val if rate_val else (5.5 if iso == "USA" else 6.5)
            
            return {
                "gdp": f"${val(res['gdp'])/1e12:.1f}T" if val(res['gdp']) else "N/A",
                "growth": f"{val(res['growth']):+.1f}%" if val(res['growth']) else "0.0%",
                "inflation": f"{val(res['inflation']):.1f}%" if val(res['inflation']) else "N/A",
                "population": f"{pop/1e6:.1f}M" if pop else "N/A",
                "marketCap": f"${mcap/1e9:.1f}B" if mcap else "N/A",
                "rate": f"{rate:.1f}%"
            }
        except Exception as e:
            print(f"Macro fetch failed for {iso}: {e}")
            return {"gdp": "N/A", "growth": "0.0%", "inflation": "N/A", "population": "N/A", "marketCap": "N/A", "rate": "N/A"}

    def _generate_ai_outlook(self, city: str, market: Dict[str, Any], macro: Dict[str, Any]) -> str:
        """Generates a contextual AI outlook based on real-time data."""
        sentiment = "bullish" if market.get('change_pct', 0) > 0 else "bearish"
        growth = macro.get('growth', '0%').replace('%', '')
        try: growth_val = float(growth)
        except: growth_val = 0.0

        if sentiment == "bullish":
            if growth_val > 2.0:
                return f"Strong internal momentum in {city} correlated with robust GDP growth. Institutional inflow suggests sustained bull run."
            return f"{city} markets leading global recovery. Technical indicators suggest short-term resistance near current levels."
        else:
            if growth_val < 1.0:
                return f"Structural headwinds in {city} impacting market sentiment. Cautious capital outflows observed."
            return f"Volatility spike in {city} index. Recommend defensive positioning until macroeconomic stabilization occurs."

    async def _fetch_live_index(self, symbol: str) -> Dict[str, Any]:
        """Fetch live index quote via yfinance."""
        try:
            def fetch():
                ticker = yf.Ticker(symbol)
                info = ticker.history(period="1d")
                return info
            
            info = await asyncio.to_thread(fetch)
            if info.empty: raise Exception("Empty Data")
            
            curr = info['Close'].iloc[-1]
            prev = info['Open'].iloc[-1]
            change = curr - prev
            pct = (change / prev) * 100
            
            return {
                "name": symbol,
                "value": f"{curr:,.2f}",
                "change": f"{'+' if change > 0 else ''}{change:.2f}",
                "change_pct": round(pct, 2)
            }
        except:
            return {"name": symbol, "value": "N/A", "change": "0.00", "change_pct": 0.0}

    async def get_global_ticker(self) -> List[Dict[str, Any]]:
        """Live Global Ticker Data."""
        symbols = {"S&P 500": "^GSPC", "NASDAQ": "^IXIC", "DAX": "^GDAXI", "NIFTY 50": "^NSEI", "FTSE 100": "^FTSE", "NIKKEI 225": "^N225"}
        
        tasks = []
        names = []
        for name, sym in symbols.items():
            tasks.append(self._fetch_live_index(sym))
            names.append(name)
        
        lives = await asyncio.gather(*tasks)
        
        results = []
        for name, live in zip(names, lives):
            results.append({
                "name": name, "value": live["value"], "change": f"{live['change_pct']:+.1f}%"
            })
        return results

    def search_regions(self, query: str) -> List[Dict[str, Any]]:
        """Search available hubs by city or country."""
        q = query.lower()
        return [
            {"city": city, "country": conf["country"]}
            for city, conf in self.market_map.items()
            if q in city.lower() or q in conf["country"].lower()
        ]

market_service = MarketDataService()
