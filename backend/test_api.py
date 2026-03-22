#!/usr/bin/env python
"""Quick API integration test via HTTP."""
import urllib.request
import json

BASE = "http://127.0.0.1:8000/api"

def get(path):
    r = urllib.request.urlopen(f"{BASE}{path}")
    return json.loads(r.read())

# Test 1: Sectors
sectors = get("/sectors/")
print(f"=== Sectors ({len(sectors)}) ===")
for s in sectors:
    print(f"  {s['id']}: {s['name']} ({s['stockCount']} stocks, icon={s['icon']})")

# Test 2: Stocks by sector
print(f"\n=== Banking stocks ===")
data = get("/sectors/banking/stocks/")
print(f"  Sector: {data['sector']['name']}")
print(f"  Stocks: {len(data['stocks'])}")
for st in data['stocks'][:3]:
    print(f"    {st['ticker']}: ${st['currentPrice']} ({st['changePercent']}%)")

# Test 3: Stock detail
print(f"\n=== AAPL detail ===")
stock = get("/stocks/AAPL/")
print(f"  {stock['ticker']}: {stock['name']}")
print(f"  Price: ${stock['currentPrice']}, Change: {stock['changePercent']}%")
print(f"  History points: {len(stock['history'])}")
if stock['history']:
    print(f"  First: {stock['history'][0]}, Last: {stock['history'][-1]}")

# Test 4: Chart data
print(f"\n=== AAPL chart (5d) ===")
chart = get("/stocks/AAPL/chart/?period=5d")
print(f"  Points: {len(chart)}")

# Test 5: Search
print(f"\n=== Search 'apple' ===")
results = get("/search/?q=apple")
for r in results:
    print(f"  {r['ticker']}: {r['name']}")

print("\nAll API tests passed!")