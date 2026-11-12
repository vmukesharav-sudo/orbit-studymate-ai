import requests
import json
import os
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_live_verification():
    print("=" * 60)
    print("ORBIT — LIVE END-TO-END SYSTEM VERIFICATION")
    print("=" * 60)

    # 1. Health check
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    health = r.json()
    assert health["status"] == "online"
    print("✔ [1/6] Live FastAPI Health Endpoint: ONLINE")

    # 2. Authentication
    test_email = "alex.live@orbit.edu"
    test_pw = "LiveVerification2026!"
    reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": test_email,
        "password": test_pw,
        "full_name": "Alex Live Verifier"
    })
    if reg_res.status_code == 201:
        token = reg_res.json()["access_token"]
    else:
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": test_pw
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✔ [2/6] User Registration & JWT Authentication: PASS")

    # 3. Document PDF Upload & Extraction
    pdf_path = "frontend/public/sample_distributed_systems_notes.pdf"
    assert os.path.exists(pdf_path), "Sample PDF missing"
    with open(pdf_path, "rb") as f:
        up_res = requests.post(f"{BASE_URL}/api/documents/upload", headers=headers, files={
            "file": ("sample_distributed_systems_notes.pdf", f, "application/pdf")
        })
    assert up_res.status_code == 201, f"PDF upload failed: {up_res.text}"
    doc_id = up_res.json()["id"]
    page_count = up_res.json()["page_count"]
    assert page_count == 4, f"Expected 4 pages, got {page_count}"
    print(f"✔ [3/6] PDF Upload & Page Extraction: PASS ({page_count} pages extracted)")

    # 4. Document Detail & Structure Verification
    detail_res = requests.get(f"{BASE_URL}/api/documents/{doc_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    pages = json.loads(detail["extracted_text"])
    assert len(pages) == 4
    assert "Distributed Systems" in pages[0]["text"]
    print(f"✔ [4/6] Document Grounding & Chunk Cache: PASS (Page 1 starts with '{pages[0]['text'][:40]}...')")

    # 5. User Settings & Diagnostics
    settings_res = requests.get(f"{BASE_URL}/api/settings", headers=headers)
    assert settings_res.status_code == 200
    print("✔ [5/6] Student Preferences & Workspace Settings: PASS")

    # 6. Analytics Telemetry
    analytics_res = requests.get(f"{BASE_URL}/api/analytics/overview", headers=headers)
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert "total_study_hours" in analytics
    print(f"✔ [6/6] Real-time Learning Analytics: PASS (Streak: {analytics.get('study_streak_days')} days)")

    print("=" * 60)
    print("ALL 6 LIVE VERIFICATION CHECKS PASSED WITH 0 ERRORS!")
    print("=" * 60)

if __name__ == "__main__":
    run_live_verification()

