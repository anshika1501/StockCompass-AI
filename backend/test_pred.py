import urllib.request
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = "http://127.0.0.1:8000/api/predictions/"
data = json.dumps({"symbol": "AAPL", "target_time": "2026-03-12T10:00:00Z"}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS:", response.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
