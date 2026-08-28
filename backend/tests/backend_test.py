"""ExportPilot AI - backend regression tests."""
import os
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE:
    # fallback: read from frontend .env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass
BASE = (BASE or "").rstrip("/")
API = f"{BASE}/api"

SAMPLE_INQUIRY = (
    "Hello, we are Dubai Harvest Trading in the UAE. We are interested in purchasing "
    "premium Indian makhana. We need approximately 10 MT delivered CIF to Dubai. "
    "Please share your best price, payment terms and earliest delivery."
)


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --------------- health / config ---------------

def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_config(s):
    r = s.get(f"{API}/config")
    assert r.status_code == 200
    j = r.json()
    assert j["currency"] == "USD"
    assert "exporter" in j


# --------------- dashboard ---------------

def test_dashboard(s):
    r = s.get(f"{API}/dashboard")
    assert r.status_code == 200
    j = r.json()
    assert set(["kpis", "action_center", "revenue_at_risk", "pipeline_by_stage"]).issubset(j)
    kpis = j["kpis"]
    for k in ["pipeline", "orders_won", "followups_due", "deals_attention"]:
        assert k in kpis
    assert isinstance(j["action_center"], list)
    assert isinstance(j["pipeline_by_stage"], list)
    assert len(j["pipeline_by_stage"]) >= 5


# --------------- inquiry analyze ---------------

def test_inquiry_analyze(s):
    r = s.post(f"{API}/inquiry/analyze", json={"message": SAMPLE_INQUIRY}, timeout=60)
    assert r.status_code == 200
    j = r.json()
    for k in ["buyer", "country", "product", "quantity_value", "incoterm", "completeness", "missing_info", "summary"]:
        assert k in j, f"missing key {k}"
    assert isinstance(j["completeness"], int)
    assert isinstance(j["missing_info"], list)
    # dynamic-ish check
    assert "makhana" in j["product"].lower() or "makhana" in str(j).lower()


# --------------- deals CRUD ---------------

@pytest.fixture(scope="session")
def created_deal(s):
    payload = {
        "buyer_name": "TEST_Automation Buyer",
        "country": "United Arab Emirates",
        "product": "Premium Makhana",
        "grade": "5 Sutta",
        "quantity": "10 MT",
        "quantity_value": 10,
        "unit": "MT",
        "destination": "Dubai",
        "incoterm": "CIF",
        "payment_terms": "30% advance",
        "delivery": "30 days",
        "deal_value": 42000,
        "email": "test_auto@example.com",
        "source_message": SAMPLE_INQUIRY,
        "missing_info": ["Packaging"],
        "completeness": 82,
    }
    r = s.post(f"{API}/deals", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("id")
    return d


def test_list_deals_contains_created(s, created_deal):
    r = s.get(f"{API}/deals")
    assert r.status_code == 200
    ids = [x["id"] for x in r.json()]
    assert created_deal["id"] in ids


def test_get_deal(s, created_deal):
    r = s.get(f"{API}/deals/{created_deal['id']}")
    assert r.status_code == 200
    assert r.json()["buyer_name"] == "TEST_Automation Buyer"


def test_update_stage(s, created_deal):
    r = s.patch(f"{API}/deals/{created_deal['id']}/stage", json={"stage": "Qualified"})
    assert r.status_code == 200
    assert r.json()["stage"] == "Qualified"
    # verify persistence
    g = s.get(f"{API}/deals/{created_deal['id']}").json()
    assert g["stage"] == "Qualified"


def test_deal_doctor(s, created_deal):
    r = s.get(f"{API}/deals/{created_deal['id']}/doctor")
    assert r.status_code == 200
    j = r.json()
    assert "health" in j and "positives" in j and "attention" in j and "recommendation" in j


# --------------- pricing ---------------

def test_pricing_calculate(s):
    payload = {"product_cost": 10000, "packaging_cost": 500, "inland_transport": 800,
               "freight": 1200, "insurance": 200, "other_costs": 300,
               "desired_margin": 15, "quantity": 10, "incoterm": "CIF"}
    r = s.post(f"{API}/pricing/calculate", json=payload)
    assert r.status_code == 200
    j = r.json()
    for k in ["total_estimated_cost", "recommended_selling_price", "estimated_margin_pct",
              "unit_price", "total_order_value"]:
        assert k in j
    # CIF should include all six components => 13000
    assert j["total_estimated_cost"] == 13000.0
    assert j["recommended_selling_price"] > 13000
    assert j["unit_price"] > 0


def test_pricing_incoterm_exw(s):
    payload = {"product_cost": 10000, "packaging_cost": 500, "inland_transport": 800,
               "freight": 1200, "insurance": 200, "other_costs": 300,
               "desired_margin": 15, "quantity": 10, "incoterm": "EXW"}
    r = s.post(f"{API}/pricing/calculate", json=payload)
    assert r.status_code == 200
    # EXW: product+packaging+other = 10800
    assert r.json()["total_estimated_cost"] == 10800.0


def test_pricing_simulate(s):
    r = s.post(f"{API}/pricing/simulate",
               json={"total_cost": 10000, "base_selling_price": 12000, "discount_pct": 5})
    assert r.status_code == 200
    j = r.json()
    for k in ["current_margin_pct", "new_margin_pct", "new_selling_price", "recommendation"]:
        assert k in j


# --------------- quotations ---------------

@pytest.fixture(scope="session")
def quotation(s, created_deal):
    r = s.post(f"{API}/quotations", json={"deal_id": created_deal["id"], "unit_price": 4300})
    assert r.status_code == 200, r.text
    q = r.json()
    assert q["unit_price"] == 4300
    assert q["total_price"] == 43000
    assert q["number"].startswith("PI-")
    return q


def test_quotation_moves_stage(s, created_deal, quotation):
    d = s.get(f"{API}/deals/{created_deal['id']}").json()
    assert d["stage"] == "Quotation Sent"


def test_list_quotations(s, quotation):
    r = s.get(f"{API}/quotations")
    assert r.status_code == 200
    assert any(q["id"] == quotation["id"] for q in r.json())


def test_get_deal_quotation(s, created_deal, quotation):
    r = s.get(f"{API}/deals/{created_deal['id']}/quotation")
    assert r.status_code == 200
    assert r.json()["id"] == quotation["id"]


# --------------- negotiation ---------------

def test_negotiation_analyze(s, created_deal):
    r = s.post(f"{API}/negotiation/analyze",
               json={"deal_id": created_deal["id"],
                     "buyer_message": "Your price is 10% higher than another supplier. Can you improve?"},
               timeout=60)
    assert r.status_code == 200
    j = r.json()
    for k in ["objection_type", "buyer_pressure", "recommended_max_discount_pct", "strategies", "insight"]:
        assert k in j
    assert isinstance(j["strategies"], list) and len(j["strategies"]) >= 1


def test_negotiation_respond(s, created_deal):
    r = s.post(f"{API}/negotiation/respond",
               json={"deal_id": created_deal["id"],
                     "buyer_message": "Price is too high.",
                     "strategy": "Discount for full quantity"},
               timeout=60)
    assert r.status_code == 200
    assert isinstance(r.json().get("response"), str)
    assert len(r.json()["response"]) > 40


def test_negotiation_approve(s, created_deal):
    r = s.post(f"{API}/negotiation/approve",
               json={"deal_id": created_deal["id"], "text": "Thank you, we can offer 2% discount."})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    d = s.get(f"{API}/deals/{created_deal['id']}").json()
    assert d["stage"] == "Negotiation"


# --------------- export pack ---------------

@pytest.fixture(scope="session")
def export_pack(s, created_deal, quotation):
    r = s.post(f"{API}/deals/{created_deal['id']}/export-pack/generate")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["count"] == 7
    assert len(j["documents"]) == 7
    return j


def test_documents_list(s, created_deal, export_pack):
    r = s.get(f"{API}/deals/{created_deal['id']}/documents")
    assert r.status_code == 200
    assert len(r.json()) == 7


def test_document_html_and_download(s, export_pack):
    doc_id = export_pack["documents"][0]["id"]
    r = s.get(f"{API}/documents/{doc_id}")
    assert r.status_code == 200
    assert "<html" in r.text.lower() or "<!doctype" in r.text.lower()
    r2 = s.get(f"{API}/documents/{doc_id}/download")
    assert r2.status_code == 200
    assert "attachment" in r2.headers.get("content-disposition", "").lower()


# --------------- send-to-buyer ---------------

def test_compose_email(s, created_deal, export_pack):
    r = s.post(f"{API}/deals/{created_deal['id']}/compose-email", timeout=60)
    assert r.status_code == 200
    j = r.json()
    for k in ["recipient", "subject", "message", "attachments"]:
        assert k in j
    assert len(j["attachments"]) == 7


def test_send_to_buyer(s, created_deal):
    r = s.post(f"{API}/deals/{created_deal['id']}/send",
               json={"deal_id": created_deal["id"],
                     "recipient": "buyer@example.com",
                     "subject": "Export Pack",
                     "message": "Please find attached."})
    assert r.status_code == 200
    j = r.json()
    assert j["ok"] is True
    assert j["delivered"] is False  # no RESEND_API_KEY expected
    assert "note" in j


# --------------- follow-ups ---------------

def test_followups_list(s):
    r = s.get(f"{API}/followups")
    assert r.status_code == 200
    fus = r.json()
    assert isinstance(fus, list)
    assert len(fus) >= 1
    for f in fus:
        assert "priority" in f
        assert "days_since" in f


def test_followup_generate_and_complete(s):
    fus = s.get(f"{API}/followups").json()
    target = next((f for f in fus if f.get("priority") != "Completed"), None)
    assert target is not None
    r = s.post(f"{API}/followups/generate", json={"followup_id": target["id"]}, timeout=60)
    assert r.status_code == 200
    assert isinstance(r.json().get("message"), str)
    r2 = s.post(f"{API}/followups/{target['id']}/complete")
    assert r2.status_code == 200


# --------------- buyers ---------------

def test_list_buyers(s):
    r = s.get(f"{API}/buyers")
    assert r.status_code == 200
    buyers = r.json()
    assert len(buyers) >= 5
    for b in buyers:
        assert "deal_value" in b and "stage" in b and "health" in b


def test_get_buyer_detail(s):
    buyers = s.get(f"{API}/buyers").json()
    bid = buyers[0]["id"]
    r = s.get(f"{API}/buyers/{bid}")
    assert r.status_code == 200
    j = r.json()
    for k in ["buyer", "deals", "conversations", "documents", "activities"]:
        assert k in j


# --------------- assistant ---------------

def test_assistant_export_pack_action(s):
    r = s.post(f"{API}/assistant/ask",
               json={"question": "Prepare the export pack for Dubai Harvest Trading"},
               timeout=60)
    assert r.status_code == 200
    j = r.json()
    assert isinstance(j.get("answer"), str) and len(j["answer"]) > 0
    action = j.get("action")
    assert action is not None, f"expected action, got {j}"
    assert action["type"] == "prepare_export_pack"
    assert "deal_id" in action


def test_assistant_generic(s):
    r = s.post(f"{API}/assistant/ask",
               json={"question": "What are my highest-value open deals?"},
               timeout=60)
    assert r.status_code == 200
    assert isinstance(r.json().get("answer"), str)
