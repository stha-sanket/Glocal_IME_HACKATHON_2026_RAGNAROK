import requests

BASE_URL = "https://q4n8mbr4-3002.inc1.devtunnels.ms/api/v2"

ENDPOINTS = [
    "/account/balance",
    "/account/details",
    "/account/statement",
    "/card/block",
    "/card/unblock",
]

METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

# Optional: add auth token if you have one
HEADERS = {
    # "Authorization": "Bearer YOUR_TOKEN_HERE",
    "Content-Type": "application/json",
}

def check_endpoint(endpoint):
    url = BASE_URL + endpoint
    print(f"\n{'='*55}")
    print(f"  Endpoint: {endpoint}")
    print(f"{'='*55}")

    results = {}
    for method in METHODS:
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=HEADERS,
                json={},           # empty body for POST/PUT/PATCH
                timeout=8,
                allow_redirects=True,
            )
            status = response.status_code
            results[method] = status

            # Colour-code in terminal
            if status in (200, 201, 204):
                tag = "✅ OK"
            elif status == 401:
                tag = "🔒 Auth Required"
            elif status == 403:
                tag = "🚫 Forbidden"
            elif status == 404:
                tag = "❌ Not Found"
            elif status == 405:
                tag = "⛔ Method Not Allowed"
            else:
                tag = f"⚠️  {status}"

            print(f"  {method:<8} → {status}  {tag}")

            # Print body snippet if meaningful
            if status not in (401, 403, 405) and response.text.strip():
                snippet = response.text.strip()[:200]
                print(f"           Body: {snippet}")

        except requests.exceptions.Timeout:
            print(f"  {method:<8} → TIMEOUT")
            results[method] = "TIMEOUT"
        except requests.exceptions.ConnectionError as e:
            print(f"  {method:<8} → CONNECTION ERROR: {e}")
            results[method] = "CONNECTION_ERROR"

    # Highlight methods that are likely allowed (not 405 / not 404)
    allowed = [m for m, s in results.items() if isinstance(s, int) and s not in (404, 405)]
    if allowed:
        print(f"\n  👉 Likely accepted methods: {', '.join(allowed)}")
    else:
        print(f"\n  ⚠️  No clearly accepted methods found.")

    return results


if __name__ == "__main__":
    print("\n🔍 API Endpoint HTTP Method Probe")
    print(f"   Base URL : {BASE_URL}")
    print(f"   Methods  : {', '.join(METHODS)}")

    all_results = {}
    for ep in ENDPOINTS:
        all_results[ep] = check_endpoint(ep)

    # Summary table
    print(f"\n\n{'='*55}")
    print("  SUMMARY TABLE")
    print(f"{'='*55}")
    header = f"{'Endpoint':<25}" + "".join(f"{m:<8}" for m in METHODS)
    print(header)
    print("-" * len(header))
    for ep, res in all_results.items():
        row = f"{ep:<25}"
        for m in METHODS:
            s = str(res.get(m, "-"))
            row += f"{s:<8}"
        print(row)
    print()
