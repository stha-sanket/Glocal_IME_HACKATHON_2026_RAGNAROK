import requests
import sys
import os

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    print("Testing GET /health...")
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print(f"Status: {resp.status_code}")
        print(f"Body: {resp.json()}\n")
        assert resp.status_code == 200
    except Exception as e:
        print(f"Health test failed: {e}\n")

def test_login_and_converse_full():
    print("--- Testing FULL Multi-turn Converse Flow (Balance Check) ---")
    
    # 1. Login
    login_payload = {
        "email": "prashantadhikareeey@gmail.com",
        "password": "Test@1234"
    }
    try:
        resp = requests.post(f"{BASE_URL}/v1/auth/login", json=login_payload)
        print(f"Login Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        
        data = resp.json()
        token = data["session_token"]
        print(f"Session Token: {token}")
        
        headers = {
            "X-Session-Token": token,
            "Content-Type": "application/json"
        }
        
        # 2. Reset session state to ensure clean start
        requests.delete(f"{BASE_URL}/v1/session/reset", headers=headers)
        print("Session reset requested.")
        
        # 3. Converse Turn 1: Request balance
        print("\nTurn 1: Requesting balance...")
        converse_payload1 = {
            "message": "mero balance kati chha check gardeu na"
        }
        resp = requests.post(f"{BASE_URL}/v1/converse", json=converse_payload1, headers=headers)
        print(f"Turn 1 Status: {resp.status_code}")
        reply1 = resp.json()
        print(f"Turn 1 Reply: {reply1['reply']}")
        print(f"Turn 1 Phase: {reply1.get('phase')}")
        
        # 4. Converse Turn 2: Confirm with "yes"
        print("\nTurn 2: Confirming with 'yes'...")
        converse_payload2 = {
            "message": "yes"
        }
        resp = requests.post(f"{BASE_URL}/v1/converse", json=converse_payload2, headers=headers)
        print(f"Turn 2 Status: {resp.status_code}")
        reply2 = resp.json()
        print(f"Turn 2 Reply: {reply2['reply']}")
        print(f"Turn 2 Phase: {reply2.get('phase')}")
        print(f"Turn 2 Slots: {reply2.get('slots')}\n")
    except Exception as e:
        print(f"Multi-turn converse test failed: {e}\n")

def test_process_endpoint_full():
    print("--- Testing FULL Multi-turn Process Flow (Balance Check) ---")
    from config import DATA_LAYER_SERVICE_SECRET
    print(f"DATA_LAYER_SERVICE_SECRET: {repr(DATA_LAYER_SERVICE_SECRET)}")
    
    # 1. Login to get a valid user id (clientId)
    login_payload = {
        "email": "prashantadhikareeey@gmail.com",
        "password": "Test@1234"
    }
    try:
        resp = requests.post(f"{BASE_URL}/v1/auth/login", json=login_payload)
        if resp.status_code != 200:
            print("Login failed, skipping /process test.")
            return
        clientId = resp.json()["user"]["id"]
        print(f"Using clientId: {clientId}")
        
        headers = {
            "X-Service-Key": DATA_LAYER_SERVICE_SECRET,
            "Content-Type": "application/json"
        }
        
        # 2. Reset session state via Converse endpoint first to ensure clean start
        user_headers = {
            "X-Session-Token": resp.json()["session_token"],
            "Content-Type": "application/json"
        }
        requests.delete(f"{BASE_URL}/v1/session/reset", headers=user_headers)
        print("Session reset requested via user token.")
        
        # 3. Process Turn 1: Request balance
        print("\nTurn 1: Requesting balance...")
        payload1 = {
            "text": "balance kति छ?",
            "clientId": clientId
        }
        resp = requests.post(f"{BASE_URL}/process", json=payload1, headers=headers)
        print(f"Turn 1 Status: {resp.status_code}")
        if resp.status_code == 200:
            data1 = resp.json()
            print(f"Turn 1 Response: {data1['text']}")
            print(f"Turn 1 Audio length: {len(data1['audio'])}")
        else:
            print(f"Response: {resp.text}")
            return
        
        # 4. Process Turn 2: Confirm with "yes"
        print("\nTurn 2: Confirming with 'yes'...")
        payload2 = {
            "text": "yes",
            "clientId": clientId
        }
        resp = requests.post(f"{BASE_URL}/process", json=payload2, headers=headers)
        print(f"Turn 2 Status: {resp.status_code}")
        if resp.status_code == 200:
            data2 = resp.json()
            print(f"Turn 2 Response: {data2['text']}")
            print(f"Turn 2 Audio length: {len(data2['audio'])}")
        else:
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Multi-turn process test failed: {e}\n")

if __name__ == "__main__":
    test_health()
    test_login_and_converse_full()
    test_process_endpoint_full()
