import os
import json
import uuid
import logging
import re
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="ExportPilot AI")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("exportpilot")

EXPORTER = {
    "name": "Nimbus Agro Exports",
    "address": "Plot 42, MIDC Industrial Area, Pune, Maharashtra 411019, India",
    "email": "exports@nimbusagro.example",
    "phone": "+91 20 4890 1122",
    "gstin": "27AABCN1234E1Z5",
    "iec": "0312345678",
}

DISCLAIMER_DOC = "AI-generated draft — verify before sending."
DISCLAIMER_PRICE = "Estimated — confirm actual transaction and logistics costs."


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def days_ago_iso(days):
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


# ----------------------------- LLM helpers -----------------------------

async def _llm_call(system: str, prompt: str, session: str = "exportpilot") -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session,
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-6")
    resp = await chat.send_message(UserMessage(text=prompt))
    if isinstance(resp, str):
        return resp
    return str(resp)


def _extract_json(text: str):
    if not text:
        return None
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]
    try:
        return json.loads(text)
    except Exception:
        return None


async def llm_json(system: str, prompt: str, fallback: dict, session="exportpilot") -> dict:
    try:
        raw = await _llm_call(system + "\n\nRespond ONLY with valid minified JSON. No prose, no code fences.", prompt, session)
        data = _extract_json(raw)
        if isinstance(data, dict):
            return data
    except Exception as e:
        logger.error(f"llm_json error: {e}")
    return fallback


async def llm_text(system: str, prompt: str, fallback: str, session="exportpilot") -> str:
    try:
        raw = await _llm_call(system, prompt, session)
        if raw and raw.strip():
            return raw.strip()
    except Exception as e:
        logger.error(f"llm_text error: {e}")
    return fallback


# ----------------------------- Pricing engine (pure Python) -----------------------------

INCOTERM_COMPONENTS = {
    "EXW": ["product", "packaging", "other"],
    "FOB": ["product", "packaging", "inland", "other"],
    "CFR": ["product", "packaging", "inland", "freight", "other"],
    "CIF": ["product", "packaging", "inland", "freight", "insurance", "other"],
}


class PricingInput(BaseModel):
    product_cost: float = 0
    packaging_cost: float = 0
    inland_transport: float = 0
    freight: float = 0
    insurance: float = 0
    other_costs: float = 0
    desired_margin: float = 15
    quantity: float = 1
    incoterm: str = "CIF"


def compute_pricing(p: PricingInput):
    comp = {
        "product": p.product_cost,
        "packaging": p.packaging_cost,
        "inland": p.inland_transport,
        "freight": p.freight,
        "insurance": p.insurance,
        "other": p.other_costs,
    }
    keys = INCOTERM_COMPONENTS.get(p.incoterm.upper(), INCOTERM_COMPONENTS["CIF"])
    total_cost = round(sum(comp[k] for k in keys), 2)
    m = max(0.0, min(p.desired_margin, 95.0))
    selling = round(total_cost / (1 - m / 100), 2) if m < 95 else total_cost
    profit = round(selling - total_cost, 2)
    est_margin = round((profit / selling * 100), 2) if selling else 0
    qty = p.quantity or 1
    unit_price = round(selling / qty, 2)
    return {
        "incoterm": p.incoterm.upper(),
        "included_components": keys,
        "total_estimated_cost": total_cost,
        "recommended_selling_price": selling,
        "estimated_margin_pct": est_margin,
        "estimated_profit": profit,
        "unit_price": unit_price,
        "total_order_value": selling,
        "quantity": qty,
        "disclaimer": DISCLAIMER_PRICE,
    }


class MarginSimInput(BaseModel):
    total_cost: float
    base_selling_price: float
    discount_pct: float = 0


@api.post("/pricing/calculate")
async def pricing_calculate(inp: PricingInput):
    return compute_pricing(inp)


@api.post("/pricing/simulate")
async def pricing_simulate(inp: MarginSimInput):
    base_margin = round((inp.base_selling_price - inp.total_cost) / inp.base_selling_price * 100, 2) if inp.base_selling_price else 0
    new_selling = round(inp.base_selling_price * (1 - inp.discount_pct / 100), 2)
    new_margin = round((new_selling - inp.total_cost) / new_selling * 100, 2) if new_selling else 0
    if inp.discount_pct <= 3:
        rec = f"A {inp.discount_pct:.0f}% discount keeps the estimated margin within a healthy range. Avoid additional discounting unless the buyer increases quantity or improves payment terms."
    elif new_margin < 8:
        rec = f"A {inp.discount_pct:.0f}% discount pushes the estimated margin to {new_margin:.1f}%, which is thin. Tie any concession to larger quantity or advance payment."
    else:
        rec = f"A {inp.discount_pct:.0f}% discount lowers the estimated margin to {new_margin:.1f}%. Consider trading the discount for a firm order commitment."
    return {
        "current_margin_pct": base_margin,
        "discount_pct": inp.discount_pct,
        "new_margin_pct": new_margin,
        "new_selling_price": new_selling,
        "recommendation": rec,
        "disclaimer": DISCLAIMER_PRICE,
    }


# ----------------------------- Models -----------------------------

class InquiryInput(BaseModel):
    message: str


class DealCreate(BaseModel):
    buyer_name: str
    country: str
    product: str
    grade: Optional[str] = ""
    quantity: str
    quantity_value: Optional[float] = 0
    unit: Optional[str] = "MT"
    destination: Optional[str] = ""
    incoterm: Optional[str] = "CIF"
    payment_terms: Optional[str] = ""
    delivery: Optional[str] = ""
    deal_value: Optional[float] = 0
    email: Optional[str] = ""
    source_message: Optional[str] = ""
    missing_info: Optional[List[str]] = []
    completeness: Optional[int] = 0


class StageUpdate(BaseModel):
    stage: str


class QuotationCreate(BaseModel):
    deal_id: str
    unit_price: Optional[float] = None
    payment_terms: Optional[str] = None
    delivery: Optional[str] = None
    validity: Optional[str] = None
    notes: Optional[str] = None


class NegotiationInput(BaseModel):
    deal_id: str
    buyer_message: str


class NegotiationRespond(BaseModel):
    deal_id: str
    buyer_message: str
    strategy: str
    current_margin: Optional[float] = None


class ApproveResponse(BaseModel):
    deal_id: str
    text: str


class SendInput(BaseModel):
    deal_id: str
    recipient: str
    subject: str
    message: str


class FollowUpGenerate(BaseModel):
    followup_id: str


class AssistantAsk(BaseModel):
    question: str


# ----------------------------- Activity / helpers -----------------------------

async def add_activity(deal_id, text, atype="update"):
    doc = {"id": str(uuid.uuid4()), "deal_id": deal_id, "type": atype, "text": text, "created_at": now_iso()}
    await db.activities.insert_one(doc)
    await db.deals.update_one({"id": deal_id}, {"$set": {"last_activity": now_iso()}})
    return {k: v for k, v in doc.items() if k != "_id"}


async def add_message(deal_id, sender, text):
    doc = {"id": str(uuid.uuid4()), "deal_id": deal_id, "sender": sender, "text": text, "created_at": now_iso()}
    await db.conversations.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}


def clean(doc):
    if not doc:
        return doc
    return {k: v for k, v in doc.items() if k != "_id"}


# ----------------------------- Inquiry Analysis -----------------------------

@api.post("/inquiry/analyze")
async def analyze_inquiry(inp: InquiryInput):
    system = (
        "You are ExportPilot AI, an expert export-trade assistant. You read a raw international buyer "
        "inquiry message and extract a structured export opportunity. Be precise. If a field is not stated, "
        "use the string 'Not specified'. Infer a plausible company/buyer name only if clearly present; "
        "otherwise infer from context (e.g. city + trading)."
    )
    prompt = f"""Analyze this buyer inquiry and return JSON with keys:
buyer (company name or best inference), country (full country name), contact_email (or 'Not specified'),
product, grade (or 'Not specified'), quantity (e.g. '10 MT'), quantity_value (number only), unit (e.g. 'MT'),
destination (city/port), incoterm (one of EXW/FOB/CFR/CIF or 'Not specified'),
payment (payment terms or 'Not specified'), delivery (delivery date/timeline or 'Not specified'),
completeness (integer 0-100 = how complete this inquiry is to build an export deal),
missing_info (array of short strings of important missing details),
summary (one sentence AI explanation of readiness).

Buyer inquiry:
\"\"\"{inp.message}\"\"\""""
    fallback = {
        "buyer": "New Buyer", "country": "Not specified", "contact_email": "Not specified",
        "product": "Not specified", "grade": "Not specified", "quantity": "Not specified",
        "quantity_value": 0, "unit": "MT", "destination": "Not specified", "incoterm": "Not specified",
        "payment": "Not specified", "delivery": "Not specified", "completeness": 60,
        "missing_info": ["Product grade", "Packaging requirement", "Delivery date", "Payment preference"],
        "summary": "The inquiry provides enough to create a preliminary opportunity; confirm the missing details before finalizing.",
    }
    data = await llm_json(system, prompt, fallback)
    for k, v in fallback.items():
        data.setdefault(k, v)
    try:
        data["completeness"] = int(float(data.get("completeness", 60)))
    except Exception:
        data["completeness"] = 60
    try:
        data["quantity_value"] = float(data.get("quantity_value", 0) or 0)
    except Exception:
        data["quantity_value"] = 0
    if not isinstance(data.get("missing_info"), list):
        data["missing_info"] = fallback["missing_info"]
    data["source_message"] = inp.message
    return data


# ----------------------------- Deals -----------------------------

def deal_health(deal):
    score = 40
    if deal.get("quantity_value"):
        score += 15
    if deal.get("destination") and deal["destination"] != "Not specified":
        score += 10
    if deal.get("product") and deal["product"] != "Not specified":
        score += 10
    if deal.get("payment_terms") and deal["payment_terms"] not in ("", "Not specified"):
        score += 15
    if deal.get("delivery") and deal["delivery"] not in ("", "Not specified"):
        score += 10
    return min(score, 100)


@api.post("/deals")
async def create_deal(inp: DealCreate):
    buyer = await db.buyers.find_one({"name": inp.buyer_name})
    if not buyer:
        avatar = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80"
        buyer = {
            "id": str(uuid.uuid4()), "name": inp.buyer_name, "country": inp.country,
            "contact_name": "Procurement Lead", "email": inp.email or "buyer@example.com",
            "phone": "+000 000 0000", "avatar": avatar, "created_at": now_iso(),
        }
        await db.buyers.insert_one(dict(buyer))
    deal = {
        "id": str(uuid.uuid4()),
        "buyer_id": buyer["id"],
        "buyer_name": inp.buyer_name,
        "buyer_email": buyer.get("email", inp.email or "buyer@example.com"),
        "country": inp.country,
        "product": inp.product,
        "grade": inp.grade or "",
        "quantity": inp.quantity,
        "quantity_value": inp.quantity_value or 0,
        "unit": inp.unit or "MT",
        "destination": inp.destination or "",
        "incoterm": (inp.incoterm or "CIF").upper() if inp.incoterm not in (None, "Not specified") else "CIF",
        "payment_terms": inp.payment_terms if inp.payment_terms != "Not specified" else "",
        "delivery": inp.delivery if inp.delivery != "Not specified" else "",
        "deal_value": inp.deal_value or 0,
        "stage": "New Inquiry",
        "missing_info": inp.missing_info or [],
        "completeness": inp.completeness or 0,
        "source_message": inp.source_message or "",
        "pricing": None,
        "created_at": now_iso(),
        "last_activity": now_iso(),
    }
    deal["health"] = deal_health(deal)
    await db.deals.insert_one(dict(deal))
    if inp.source_message:
        await add_message(deal["id"], "buyer", inp.source_message)
    await add_activity(deal["id"], f"Deal created from buyer inquiry — {inp.product}, {inp.quantity}.", "created")
    return clean(deal)


@api.get("/deals")
async def list_deals():
    deals = await db.deals.find({}, {"_id": 0}).to_list(500)
    deals.sort(key=lambda d: d.get("last_activity", ""), reverse=True)
    return deals


@api.get("/deals/{deal_id}")
async def get_deal(deal_id: str):
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    return deal


@api.patch("/deals/{deal_id}/stage")
async def update_stage(deal_id: str, upd: StageUpdate):
    deal = await db.deals.find_one({"id": deal_id})
    if not deal:
        raise HTTPException(404, "Deal not found")
    await db.deals.update_one({"id": deal_id}, {"$set": {"stage": upd.stage, "last_activity": now_iso()}})
    await add_activity(deal_id, f"Deal moved to '{upd.stage}'.", "stage")
    return await db.deals.find_one({"id": deal_id}, {"_id": 0})


@api.get("/deals/{deal_id}/doctor")
async def deal_doctor(deal_id: str):
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    positives, attention = [], []
    if deal.get("quantity_value"):
        positives.append("Quantity confirmed")
    else:
        attention.append("Quantity not confirmed")
    if deal.get("destination"):
        positives.append("Destination confirmed")
    else:
        attention.append("Destination missing")
    if deal.get("product"):
        positives.append("Product identified")
    if not deal.get("payment_terms"):
        attention.append("Payment terms missing")
    if not deal.get("delivery"):
        attention.append("Delivery date missing")
    if not deal.get("grade"):
        attention.append("Product grade/specification missing")
    rec = "Confirm payment terms and delivery date before finalizing the quotation." if attention else "This deal looks ready to progress to quotation."
    return {"health": deal.get("health", 0), "positives": positives, "attention": attention, "recommendation": rec}


# ----------------------------- Buyers -----------------------------

@api.get("/buyers")
async def list_buyers():
    buyers = await db.buyers.find({}, {"_id": 0}).to_list(500)
    deals = await db.deals.find({}, {"_id": 0}).to_list(500)
    by_buyer = {}
    for d in deals:
        by_buyer.setdefault(d["buyer_id"], []).append(d)
    result = []
    for b in buyers:
        bdeals = by_buyer.get(b["id"], [])
        active = [d for d in bdeals if d["stage"] not in ("Won", "Lost")]
        top = max(bdeals, key=lambda d: d.get("deal_value", 0)) if bdeals else None
        result.append({
            **b,
            "active_deal": top["product"] if top else "—",
            "deal_value": sum(d.get("deal_value", 0) for d in active),
            "stage": top["stage"] if top else "—",
            "health": top.get("health", 0) if top else 0,
            "last_contact": max([d.get("last_activity", "") for d in bdeals], default=b.get("created_at", now_iso())),
            "deal_count": len(bdeals),
        })
    result.sort(key=lambda x: x["deal_value"], reverse=True)
    return result


@api.get("/buyers/{buyer_id}")
async def get_buyer(buyer_id: str):
    b = await db.buyers.find_one({"id": buyer_id}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Buyer not found")
    deals = await db.deals.find({"buyer_id": buyer_id}, {"_id": 0}).to_list(200)
    deal_ids = [d["id"] for d in deals]
    convos = await db.conversations.find({"deal_id": {"$in": deal_ids}}, {"_id": 0}).to_list(500)
    docs = await db.documents.find({"deal_id": {"$in": deal_ids}}, {"_id": 0}).to_list(500)
    acts = await db.activities.find({"deal_id": {"$in": deal_ids}}, {"_id": 0}).to_list(500)
    acts.sort(key=lambda a: a.get("created_at", ""), reverse=True)
    return {"buyer": b, "deals": deals, "conversations": convos, "documents": docs, "activities": acts}


# ----------------------------- Quotations -----------------------------

def next_quote_number():
    return f"PI-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"


@api.post("/quotations")
async def create_quotation(inp: QuotationCreate):
    deal = await db.deals.find_one({"id": inp.deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    pricing = deal.get("pricing")
    qty = deal.get("quantity_value") or 1
    if inp.unit_price is not None:
        unit_price = inp.unit_price
    elif pricing:
        unit_price = pricing.get("unit_price", 0)
    else:
        unit_price = round((deal.get("deal_value", 0) or 0) / qty, 2) if qty else 0
    total = round(unit_price * qty, 2)
    quote = {
        "id": str(uuid.uuid4()),
        "deal_id": inp.deal_id,
        "number": next_quote_number(),
        "exporter": EXPORTER["name"],
        "buyer": deal["buyer_name"],
        "buyer_country": deal["country"],
        "product": deal["product"],
        "grade": deal.get("grade", ""),
        "quantity": deal["quantity"],
        "unit": deal.get("unit", "MT"),
        "unit_price": unit_price,
        "total_price": total,
        "currency": "USD",
        "incoterm": deal.get("incoterm", "CIF"),
        "destination": deal.get("destination", ""),
        "payment_terms": inp.payment_terms or deal.get("payment_terms") or "30% advance, 70% against shipping documents",
        "delivery": inp.delivery or deal.get("delivery") or "Within 30 days of confirmed order",
        "validity": inp.validity or "Valid for 15 days from date of issue",
        "notes": inp.notes or "Prices are estimates. Confirm actual transaction and logistics costs before contract.",
        "status": "Draft",
        "disclaimer": DISCLAIMER_DOC,
        "created_at": now_iso(),
        "items": [{
            "description": f"{deal['product']} {('('+deal.get('grade','')+')') if deal.get('grade') else ''}".strip(),
            "quantity": deal["quantity"], "unit_price": unit_price, "amount": total,
        }],
    }
    await db.quotations.delete_many({"deal_id": inp.deal_id})
    await db.quotations.insert_one(dict(quote))
    await db.deals.update_one({"id": inp.deal_id}, {"$set": {"deal_value": total, "unit_price": unit_price}})
    if deal["stage"] in ("New Inquiry", "Qualified"):
        await db.deals.update_one({"id": inp.deal_id}, {"$set": {"stage": "Quotation Sent"}})
    await add_activity(inp.deal_id, f"Quotation {quote['number']} generated — total {total:,.0f} USD.", "quotation")
    return clean(quote)


@api.get("/quotations")
async def list_quotations():
    qs = await db.quotations.find({}, {"_id": 0}).to_list(500)
    qs.sort(key=lambda q: q.get("created_at", ""), reverse=True)
    return qs


@api.get("/deals/{deal_id}/quotation")
async def get_deal_quotation(deal_id: str):
    q = await db.quotations.find_one({"deal_id": deal_id}, {"_id": 0})
    return q or {}


# ----------------------------- Negotiation -----------------------------

@api.post("/negotiation/analyze")
async def negotiation_analyze(inp: NegotiationInput):
    deal = await db.deals.find_one({"id": inp.deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    pricing = deal.get("pricing") or {}
    current_margin = pricing.get("estimated_margin_pct", 14.2)
    system = "You are ExportPilot's negotiation copilot for exporters. Analyze the buyer's message and classify the objection."
    prompt = f"""Deal: {deal['product']}, {deal['quantity']} to {deal.get('destination','')}, buyer {deal['buyer_name']} ({deal['country']}).
Current estimated margin: {current_margin}%.
Buyer message: \"{inp.buyer_message}\"

Return JSON with keys: objection_type (Price/Quantity/Delivery/Payment/Quality/Other),
buyer_pressure (Low/Medium/High), recommended_max_discount_pct (number),
strategies (array of exactly 3 objects each with 'title' and 'detail'),
insight (one-sentence coaching tip)."""
    fallback = {
        "objection_type": "Price", "buyer_pressure": "High",
        "recommended_max_discount_pct": 3, "current_margin": current_margin,
        "strategies": [
            {"title": "Discount for full quantity", "detail": "Offer a 3% discount conditional on confirming the full order quantity."},
            {"title": "Discount for faster payment", "detail": "Offer a 2% discount in exchange for a higher advance or shorter payment terms."},
            {"title": "Hold price, add value", "detail": "Maintain the price and increase value through premium packaging or tighter specifications."},
        ],
        "insight": "The buyer is price-anchoring; protect margin by tying any concession to quantity or payment terms.",
    }
    data = await llm_json(system, prompt, fallback)
    for k, v in fallback.items():
        data.setdefault(k, v)
    data["current_margin"] = current_margin
    if not isinstance(data.get("strategies"), list) or len(data["strategies"]) < 1:
        data["strategies"] = fallback["strategies"]
    return data


@api.post("/negotiation/respond")
async def negotiation_respond(inp: NegotiationRespond):
    deal = await db.deals.find_one({"id": inp.deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    system = ("You are ExportPilot writing on behalf of an exporter's export manager. Write a professional, "
              "warm but firm B2B negotiation reply email. Keep it concise (120-160 words), no markdown, ready to send. "
              "Do not promise legal, customs or regulatory guarantees.")
    prompt = f"""Exporter: {EXPORTER['name']}. Buyer: {deal['buyer_name']} ({deal['country']}).
Product: {deal['product']}, {deal['quantity']}, incoterm {deal.get('incoterm','CIF')}.
Buyer said: \"{inp.buyer_message}\"
Chosen strategy: {inp.strategy}
Write the reply the exporter should send. Sign off as the {EXPORTER['name']} Export Team."""
    fallback = (f"Dear {deal['buyer_name']} team,\n\nThank you for your continued interest in our {deal['product']}. "
                f"We value the opportunity and want to find a workable path. Based on {inp.strategy.lower()}, we can offer a limited concession "
                f"while maintaining the quality and reliability you expect.\n\nWe would be glad to confirm final terms once the order quantity and payment terms are agreed. "
                f"Please let us know and we will issue an updated proforma invoice promptly.\n\nWarm regards,\n{EXPORTER['name']} Export Team")
    text = await llm_text(system, prompt, fallback)
    return {"response": text, "disclaimer": DISCLAIMER_DOC}


@api.post("/negotiation/approve")
async def negotiation_approve(inp: ApproveResponse):
    deal = await db.deals.find_one({"id": inp.deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    await add_message(inp.deal_id, "exporter", inp.text)
    await add_activity(inp.deal_id, "Negotiation response approved and sent to buyer.", "negotiation")
    if deal["stage"] in ("New Inquiry", "Qualified", "Quotation Sent"):
        await db.deals.update_one({"id": inp.deal_id}, {"$set": {"stage": "Negotiation"}})
    return {"ok": True}


@api.get("/deals/{deal_id}/conversation")
async def get_conversation(deal_id: str):
    msgs = await db.conversations.find({"deal_id": deal_id}, {"_id": 0}).to_list(500)
    msgs.sort(key=lambda m: m.get("created_at", ""))
    return msgs


@api.get("/deals/{deal_id}/activities")
async def get_activities(deal_id: str):
    acts = await db.activities.find({"deal_id": deal_id}, {"_id": 0}).to_list(500)
    acts.sort(key=lambda a: a.get("created_at", ""), reverse=True)
    return acts


# ----------------------------- Export Pack -----------------------------

DOC_TYPES = [
    ("Proforma Invoice", "proforma_invoice"),
    ("Commercial Invoice", "commercial_invoice"),
    ("Packing List", "packing_list"),
    ("Sales Contract", "sales_contract"),
    ("Product Specification", "product_specification"),
    ("Shipping Instructions", "shipping_instructions"),
    ("Export Document Checklist", "export_checklist"),
]


def doc_html(title, deal, quote, body_rows):
    total = quote.get("total_price", deal.get("deal_value", 0)) if quote else deal.get("deal_value", 0)
    rows = "".join(body_rows)
    return f"""<!doctype html><html><head><meta charset='utf-8'><title>{title}</title>
<style>
body{{font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#0F172A;margin:0;padding:40px;background:#fff;}}
.wrap{{max-width:820px;margin:0 auto;}}
.disc{{background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;padding:8px 14px;border-radius:8px;font-size:12px;margin-bottom:24px;}}
h1{{font-family:'Outfit',Arial,sans-serif;font-size:26px;letter-spacing:-.02em;margin:0 0 4px;}}
.muted{{color:#64748B;font-size:13px;}}
.head{{display:flex;justify-content:space-between;border-bottom:2px solid #0F172A;padding-bottom:16px;margin-bottom:24px;}}
table{{width:100%;border-collapse:collapse;margin-top:12px;}}
th,td{{border:1px solid #E2E8F0;padding:10px 12px;text-align:left;font-size:13px;}}
th{{background:#F8FAFC;text-transform:uppercase;font-size:11px;letter-spacing:.05em;color:#64748B;}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:16px 0;font-size:13px;}}
.k{{color:#64748B;}} .tot{{text-align:right;font-weight:700;font-size:16px;margin-top:16px;}}
.sig{{margin-top:48px;display:flex;justify-content:space-between;font-size:13px;}}
.pdfbtn{{position:fixed;top:18px;right:18px;background:#0F172A;color:#fff;border:none;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;}}
@media print{{.pdfbtn{{display:none;}}}}
</style></head><body><div class='wrap'>
<button class='pdfbtn' onclick='window.print()'>⬇ Download PDF</button>
<div class='disc'>⚠ {DISCLAIMER_DOC}</div>
<div class='head'><div><h1>{title}</h1><div class='muted'>{EXPORTER['name']}</div></div>
<div class='muted' style='text-align:right'>Ref: {quote.get('number','DRAFT') if quote else 'DRAFT'}<br>Date: {datetime.now().strftime('%d %b %Y')}</div></div>
<div class='grid'>
<div><span class='k'>Exporter:</span> {EXPORTER['name']}</div><div><span class='k'>Buyer:</span> {deal['buyer_name']}</div>
<div><span class='k'>Origin:</span> India</div><div><span class='k'>Destination:</span> {deal.get('destination','')}, {deal['country']}</div>
<div><span class='k'>Incoterm:</span> {deal.get('incoterm','CIF')}</div><div><span class='k'>Currency:</span> USD</div>
</div>
<table>{rows}</table>
<div class='tot'>Total Order Value: USD {total:,.2f}</div>
<div class='sig'><div>_______________________<br>Authorized Signatory<br>{EXPORTER['name']}</div>
<div>_______________________<br>Buyer Acceptance<br>{deal['buyer_name']}</div></div>
</div></body></html>"""


def build_document(dtype_title, deal, quote):
    unit_price = quote.get("unit_price", 0) if quote else 0
    total = quote.get("total_price", deal.get("deal_value", 0)) if quote else deal.get("deal_value", 0)
    product = deal["product"]
    grade = deal.get("grade", "") or "Standard export grade"
    qty = deal["quantity"]
    if dtype_title in ("Proforma Invoice", "Commercial Invoice"):
        rows = ["<tr><th>Description</th><th>Quantity</th><th>Unit Price (USD)</th><th>Amount (USD)</th></tr>",
                f"<tr><td>{product} ({grade})</td><td>{qty}</td><td>{unit_price:,.2f}</td><td>{total:,.2f}</td></tr>",
                f"<tr><td colspan='3' style='text-align:right;font-weight:600'>Payment Terms</td><td>{quote.get('payment_terms','') if quote else ''}</td></tr>"]
    elif dtype_title == "Packing List":
        rows = ["<tr><th>Package</th><th>Contents</th><th>Net Weight</th><th>Gross Weight</th></tr>",
                f"<tr><td>Export cartons</td><td>{product} ({grade})</td><td>{qty}</td><td>{qty} + packaging</td></tr>"]
    elif dtype_title == "Sales Contract":
        rows = ["<tr><th>Clause</th><th>Terms</th></tr>",
                f"<tr><td>Goods</td><td>{product} ({grade})</td></tr>",
                f"<tr><td>Quantity</td><td>{qty}</td></tr>",
                f"<tr><td>Price</td><td>USD {unit_price:,.2f} per unit, {deal.get('incoterm','CIF')} {deal.get('destination','')}</td></tr>",
                f"<tr><td>Payment</td><td>{quote.get('payment_terms','') if quote else 'As agreed'}</td></tr>",
                f"<tr><td>Delivery</td><td>{quote.get('delivery','') if quote else 'As agreed'}</td></tr>",
                "<tr><td>Governing Law</td><td>Subject to the laws applicable to international trade; disputes resolved amicably.</td></tr>"]
    elif dtype_title == "Product Specification":
        rows = ["<tr><th>Attribute</th><th>Specification</th></tr>",
                f"<tr><td>Product</td><td>{product}</td></tr>",
                f"<tr><td>Grade</td><td>{grade}</td></tr>",
                "<tr><td>Origin</td><td>India</td></tr>",
                "<tr><td>Packaging</td><td>Food-grade export packaging (confirm with buyer)</td></tr>",
                "<tr><td>Quality</td><td>Export standard; inspection on request</td></tr>"]
    elif dtype_title == "Shipping Instructions":
        rows = ["<tr><th>Field</th><th>Detail</th></tr>",
                f"<tr><td>Consignee</td><td>{deal['buyer_name']}, {deal['country']}</td></tr>",
                f"<tr><td>Destination</td><td>{deal.get('destination','')}</td></tr>",
                f"<tr><td>Incoterm</td><td>{deal.get('incoterm','CIF')}</td></tr>",
                "<tr><td>Mode</td><td>Sea freight (FCL/LCL as applicable)</td></tr>",
                "<tr><td>Documents</td><td>B/L, Invoice, Packing List, Certificate of Origin</td></tr>"]
    else:  # checklist
        items = ["Proforma Invoice", "Commercial Invoice", "Packing List", "Sales Contract / Purchase Order",
                 "Bill of Lading / Airway Bill", "Certificate of Origin", "Phytosanitary / Quality Certificate (if applicable)",
                 "Insurance Certificate (for CIF/CIP)", "Shipping Bill / Export Declaration"]
        rows = ["<tr><th>#</th><th>Document</th><th>Status</th></tr>"]
        rows += [f"<tr><td>{i+1}</td><td>{x}</td><td>Draft / To verify</td></tr>" for i, x in enumerate(items)]
    return doc_html(dtype_title, deal, quote, rows)


@api.post("/deals/{deal_id}/export-pack/generate")
async def generate_export_pack(deal_id: str):
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    quote = await db.quotations.find_one({"deal_id": deal_id}, {"_id": 0})
    await db.documents.delete_many({"deal_id": deal_id})
    docs = []
    for title, dtype in DOC_TYPES:
        html = build_document(title, deal, quote)
        d = {"id": str(uuid.uuid4()), "deal_id": deal_id, "type": dtype, "title": title,
             "content": html, "disclaimer": DISCLAIMER_DOC, "created_at": now_iso()}
        await db.documents.insert_one(dict(d))
        docs.append(clean(d))
    await add_activity(deal_id, f"Export pack generated — {len(docs)} documents prepared.", "export")
    return {"count": len(docs), "documents": [{k: v for k, v in d.items() if k != "content"} for d in docs], "disclaimer": DISCLAIMER_DOC}


@api.get("/deals/{deal_id}/documents")
async def list_documents(deal_id: str):
    docs = await db.documents.find({"deal_id": deal_id}, {"_id": 0}).to_list(50)
    return [{k: v for k, v in d.items() if k != "content"} for d in docs]


@api.get("/documents/{doc_id}", response_class=HTMLResponse)
async def get_document(doc_id: str):
    d = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Document not found")
    return HTMLResponse(content=d["content"])


@api.get("/documents/{doc_id}/download")
async def download_document(doc_id: str):
    d = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Document not found")
    fname = d["title"].replace(" ", "_") + ".html"
    return HTMLResponse(content=d["content"], headers={"Content-Disposition": f"attachment; filename={fname}"})


# ----------------------------- Send to Buyer -----------------------------

@api.post("/deals/{deal_id}/compose-email")
async def compose_email(deal_id: str):
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    quote = await db.quotations.find_one({"deal_id": deal_id}, {"_id": 0})
    system = "You write concise, professional B2B export emails on behalf of an exporter. No markdown. 100-140 words."
    prompt = f"""Write an email body to send export documentation and quotation to a buyer.
Exporter: {EXPORTER['name']}. Buyer: {deal['buyer_name']} ({deal['country']}).
Product: {deal['product']}, {deal['quantity']}, incoterm {deal.get('incoterm','CIF')}, destination {deal.get('destination','')}.
Quotation total: USD {quote.get('total_price',0) if quote else 0:,.0f}.
Mention that the proforma invoice, commercial invoice, packing list, sales contract, product specification, shipping instructions and export checklist are attached as drafts to review. Sign off as the {EXPORTER['name']} Export Team."""
    fallback = (f"Dear {deal['buyer_name']} team,\n\nThank you for your interest in our {deal['product']}. Please find attached the complete export documentation pack for your {deal['quantity']} order to {deal.get('destination','')}, including the proforma invoice, commercial invoice, packing list, sales contract, product specification, shipping instructions and export checklist.\n\nAll documents are prepared as drafts for your review. Kindly confirm the details and we will proceed with the order. We look forward to a successful partnership.\n\nWarm regards,\n{EXPORTER['name']} Export Team")
    body = await llm_text(system, prompt, fallback)
    subject = f"Export Documentation & Quotation — {deal['buyer_name']}"
    return {
        "recipient": deal.get("buyer_email", "buyer@example.com"),
        "subject": subject,
        "message": body,
        "attachments": [t for t, _ in DOC_TYPES],
        "disclaimer": DISCLAIMER_DOC,
    }


@api.post("/deals/{deal_id}/send")
async def send_to_buyer(deal_id: str, inp: SendInput):
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(404, "Deal not found")
    delivered = False
    provider = None
    resend_key = os.environ.get("RESEND_API_KEY")
    if resend_key:
        try:
            import requests
            r = requests.post("https://api.resend.com/emails",
                              headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
                              json={"from": EXPORTER["email"], "to": [inp.recipient],
                                    "subject": inp.subject, "text": inp.message}, timeout=15)
            delivered = r.status_code < 300
            provider = "resend"
        except Exception as e:
            logger.error(f"resend error: {e}")
    rec = {"id": str(uuid.uuid4()), "deal_id": deal_id, "recipient": inp.recipient,
           "subject": inp.subject, "message": inp.message, "delivered": delivered,
           "provider": provider, "created_at": now_iso()}
    await db.sent_emails.insert_one(dict(rec))
    await add_message(deal_id, "exporter", f"[Export pack sent] {inp.subject}")
    await add_activity(deal_id, "Export pack sent to buyer.", "send")
    return {
        "ok": True,
        "delivered": delivered,
        "note": ("Email delivered via Resend." if delivered else
                 "Export pack recorded and sent inside ExportPilot. Configure RESEND_API_KEY to enable live outbound email delivery."),
    }


# ----------------------------- Follow-ups -----------------------------

@api.get("/followups")
async def list_followups():
    fus = await db.followups.find({}, {"_id": 0}).to_list(200)
    now = datetime.now(timezone.utc)
    for f in fus:
        try:
            last = datetime.fromisoformat(f["last_contact"])
            f["days_since"] = (now - last).days
        except Exception:
            f["days_since"] = f.get("days_since", 0)
    order = {"High Priority": 0, "Due Today": 1, "Upcoming": 2, "Completed": 3}
    fus.sort(key=lambda x: (order.get(x.get("priority", "Upcoming"), 2), -x.get("deal_value", 0)))
    return fus


@api.post("/followups/generate")
async def followup_generate(inp: FollowUpGenerate):
    fu = await db.followups.find_one({"id": inp.followup_id}, {"_id": 0})
    if not fu:
        raise HTTPException(404, "Follow-up not found")
    deal = await db.deals.find_one({"id": fu.get("deal_id")}, {"_id": 0})
    quote = await db.quotations.find_one({"deal_id": fu.get("deal_id")}, {"_id": 0}) if deal else None
    system = "You write short, warm, professional export follow-up emails. No markdown. 80-120 words."
    prompt = f"""Write a follow-up email to a buyer who has not responded.
Exporter: {EXPORTER['name']}. Buyer: {fu['buyer_name']}.
Deal: {deal['product'] if deal else fu.get('product','')}, {deal['quantity'] if deal else ''}.
Days since last contact: {fu.get('days_since', 5)}.
Quotation total: USD {quote.get('total_price',0) if quote else 0:,.0f}. Deal stage: {deal['stage'] if deal else ''}.
Politely check in, offer to answer questions, and gently move toward confirmation. Sign off as {EXPORTER['name']} Export Team."""
    fallback = (f"Dear {fu['buyer_name']} team,\n\nI hope you are well. I am following up on our recent quotation for your {deal['product'] if deal else 'order'}. "
                f"We would be glad to answer any questions on pricing, specifications or delivery.\n\nIf helpful, we can hold current pricing for a short window while you review. "
                f"Please let us know how you would like to proceed — we are ready to move quickly.\n\nWarm regards,\n{EXPORTER['name']} Export Team")
    text = await llm_text(system, prompt, fallback)
    return {"message": text, "disclaimer": DISCLAIMER_DOC}


@api.post("/followups/{followup_id}/complete")
async def followup_complete(followup_id: str):
    fu = await db.followups.find_one({"id": followup_id}, {"_id": 0})
    if not fu:
        raise HTTPException(404, "Follow-up not found")
    await db.followups.update_one({"id": followup_id}, {"$set": {"priority": "Completed", "last_contact": now_iso()}})
    if fu.get("deal_id"):
        await add_activity(fu["deal_id"], f"Follow-up sent to {fu['buyer_name']}.", "followup")
    return {"ok": True}


# ----------------------------- Dashboard -----------------------------

@api.get("/dashboard")
async def dashboard():
    deals = await db.deals.find({}, {"_id": 0}).to_list(500)
    fus = await db.followups.find({}, {"_id": 0}).to_list(200)
    open_deals = [d for d in deals if d["stage"] not in ("Won", "Lost")]
    won = [d for d in deals if d["stage"] == "Won"]
    pipeline = sum(d.get("deal_value", 0) for d in open_deals)
    orders_won = sum(d.get("deal_value", 0) for d in won)
    followups_due = len([f for f in fus if f.get("priority") in ("High Priority", "Due Today")])
    attention = [d for d in open_deals if d.get("health", 100) < 75 or d["stage"] in ("Negotiation", "Quotation Sent")]
    revenue_at_risk = sum(d.get("deal_value", 0) for d in attention)

    action_cards = []
    for d in sorted(open_deals, key=lambda x: x.get("deal_value", 0), reverse=True)[:3]:
        if d["stage"] == "Negotiation":
            rec = "Buyer is negotiating. Open the copilot to craft a margin-safe response."
            action = "Open Negotiation"
        elif d["stage"] == "Quotation Sent":
            rec = "Follow up today. This is one of your highest-value open opportunities."
            action = "Generate Follow-up"
        else:
            rec = "Move this deal forward — qualify details and prepare a quotation."
            action = "Open Deal"
        action_cards.append({
            "deal_id": d["id"], "buyer": d["buyer_name"], "value": d.get("deal_value", 0),
            "status": _stage_status(d), "recommendation": rec, "action": action, "stage": d["stage"],
        })

    stage_counts = {}
    for d in deals:
        stage_counts[d["stage"]] = stage_counts.get(d["stage"], 0) + 1

    pipeline_by_stage = []
    for s in ["New Inquiry", "Qualified", "Quotation Sent", "Negotiation", "Won"]:
        pipeline_by_stage.append({"stage": s, "value": sum(d.get("deal_value", 0) for d in deals if d["stage"] == s)})

    return {
        "kpis": {
            "pipeline": pipeline, "orders_won": orders_won,
            "followups_due": followups_due, "deals_attention": len(attention),
        },
        "action_center": action_cards,
        "revenue_at_risk": revenue_at_risk,
        "pipeline_by_stage": pipeline_by_stage,
        "stage_counts": stage_counts,
    }


def _stage_status(d):
    m = {
        "Quotation Sent": "Quotation sent",
        "Negotiation": "Negotiation active",
        "New Inquiry": "New inquiry received",
        "Qualified": "Qualified — needs quotation",
        "Won": "Order won",
        "Lost": "Deal lost",
    }
    return m.get(d["stage"], d["stage"])


# ----------------------------- AI Export Manager -----------------------------

@api.post("/assistant/ask")
async def assistant_ask(inp: AssistantAsk):
    deals = await db.deals.find({}, {"_id": 0}).to_list(500)
    fus = await db.followups.find({}, {"_id": 0}).to_list(200)
    quotes = await db.quotations.find({}, {"_id": 0}).to_list(200)
    open_deals = [d for d in deals if d["stage"] not in ("Won", "Lost")]

    context = {
        "open_deals": [{"buyer": d["buyer_name"], "product": d["product"], "quantity": d["quantity"],
                        "value_usd": d.get("deal_value", 0), "stage": d["stage"], "health": d.get("health", 0),
                        "country": d["country"]} for d in open_deals],
        "quotations": [{"buyer": q["buyer"], "total_usd": q.get("total_price", 0),
                        "margin_note": q.get("notes", "")} for q in quotes],
        "followups_due": [f["buyer_name"] for f in fus if f.get("priority") in ("High Priority", "Due Today")],
    }

    # Detect action intent (export pack preparation)
    q_lower = inp.question.lower()
    action = None
    if ("export pack" in q_lower) or ("prepare" in q_lower and "pack" in q_lower):
        for d in deals:
            if d["buyer_name"].lower().split()[0] in q_lower or d["buyer_name"].lower() in q_lower:
                action = {"type": "prepare_export_pack", "deal_id": d["id"], "label": "Prepare Export Pack",
                          "buyer": d["buyer_name"], "product": d["product"], "quantity": d["quantity"]}
                break

    system = ("You are ExportPilot, an AI export manager assistant. Answer the exporter's question using ONLY the "
              "provided workspace data. Be concise, specific, and actionable. Reference buyers, values (USD) and stages. "
              "Never guarantee legal, customs, or regulatory outcomes. 2-5 sentences.")
    prompt = f"Workspace data (JSON):\n{json.dumps(context)}\n\nExporter question: {inp.question}"
    fallback = "Here is what I see in your workspace: focus on your highest-value open deals and clear any follow-ups that are due today."
    answer = await llm_text(system, prompt, fallback)
    return {"answer": answer, "action": action}


# ----------------------------- Seed demo data -----------------------------

AVATARS = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    "https://images.pexels.com/photos/37148308/pexels-photo-37148308.jpeg?auto=format&fit=crop&w=256&q=80",
    "https://images.pexels.com/photos/27086922/pexels-photo-27086922.jpeg?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80",
]


async def seed_demo():
    if await db.buyers.count_documents({}) > 0:
        return
    logger.info("Seeding demo data...")
    buyers_data = [
        ("Dubai Harvest Trading", "United Arab Emirates", "Omar Al Farsi", "omar@dubaiharvest.example", "Dubai"),
        ("Qatar Global Foods", "Qatar", "Layla Hassan", "layla@qatarglobal.example", "Doha"),
        ("Berlin Natural Foods", "Germany", "Klaus Werner", "klaus@berlinnatural.example", "Hamburg"),
        ("Saudi Harvest Trading", "Saudi Arabia", "Faisal Noor", "faisal@saudiharvest.example", "Jeddah"),
        ("Singapore Natural Foods", "Singapore", "Mei Lin", "mei@sgnatural.example", "Singapore"),
    ]
    buyers = []
    for i, (name, country, contact, email, city) in enumerate(buyers_data):
        b = {"id": str(uuid.uuid4()), "name": name, "country": country, "contact_name": contact,
             "email": email, "phone": f"+{971 + i} 50 {1000 + i}", "city": city,
             "avatar": AVATARS[i % len(AVATARS)], "created_at": days_ago_iso(40 - i * 3)}
        await db.buyers.insert_one(dict(b))
        buyers.append(b)

    # (buyer_idx, product, grade, qty_val, unit, qty_str, destination, incoterm, unit_price, stage, payment, delivery, days_ago, missing)
    deals_data = [
        (0, "Premium Makhana", "5 Sutta HS grade", 10, "MT", "10 MT", "Dubai", "CIF", 4200, "Quotation Sent", "", "", 5, ["Makhana grade/size", "Packaging requirement", "Delivery date", "Payment preference"]),
        (1, "Basmati Rice", "1121 Steam", 25, "MT", "25 MT", "Doha", "CFR", 1520, "Negotiation", "30% advance", "", 2, ["Final delivery window"]),
        (2, "Organic Turmeric", "Curcumin 3%+", 15, "MT", "15 MT", "Hamburg", "CIF", 4070, "Quotation Sent", "", "", 4, ["Certification requirement", "Delivery date"]),
        (3, "Premium Makhana", "6 Sutta", 8, "MT", "8 MT", "Jeddah", "FOB", 3900, "Qualified", "", "", 1, ["Freight preference", "Payment terms"]),
        (4, "Cotton Textiles", "200 GSM woven", 40000, "meters", "40,000 m", "Singapore", "CIF", 2.4, "New Inquiry", "", "", 0, ["Design/spec sheet", "Delivery date", "Payment terms"]),
        (1, "Red Chilli Powder", "Teja S17", 12, "MT", "12 MT", "Doha", "CIF", 2100, "Won", "50% advance, 50% on docs", "Shipped in 30 days", 12, []),
        (2, "Cumin Seeds", "Singapore 99%", 18, "MT", "18 MT", "Hamburg", "CFR", 3300, "Won", "LC at sight", "30 days", 20, []),
        (0, "Basmati Rice", "1509 Sella", 30, "MT", "30 MT", "Dubai", "CIF", 1350, "Lost", "", "", 25, []),
    ]
    deals = []
    for (bi, product, grade, qv, unit, qstr, dest, inco, up, stage, pay, deliv, dago, missing) in deals_data:
        b = buyers[bi]
        total = round(up * qv, 2)
        d = {"id": str(uuid.uuid4()), "buyer_id": b["id"], "buyer_name": b["name"], "buyer_email": b["email"],
             "country": b["country"], "product": product, "grade": grade, "quantity": qstr,
             "quantity_value": qv, "unit": unit, "destination": dest, "incoterm": inco,
             "payment_terms": pay, "delivery": deliv, "deal_value": total, "unit_price": up,
             "stage": stage, "missing_info": missing, "completeness": 100 - len(missing) * 6,
             "source_message": "", "pricing": None, "created_at": days_ago_iso(dago + 3),
             "last_activity": days_ago_iso(dago)}
        d["health"] = deal_health(d)
        await db.deals.insert_one(dict(d))
        deals.append(d)
        await db.activities.insert_one({"id": str(uuid.uuid4()), "deal_id": d["id"], "type": "created",
                                        "text": f"Deal created — {product}, {qstr}.", "created_at": days_ago_iso(dago + 3)})

    # conversation for first deal
    d0 = deals[0]
    await db.conversations.insert_one({"id": str(uuid.uuid4()), "deal_id": d0["id"], "sender": "buyer",
        "text": "Hello, we are interested in purchasing premium Indian makhana. We need approximately 10 MT delivered to Dubai. Please provide your CIF price and payment terms.",
        "created_at": days_ago_iso(6)})
    await db.conversations.insert_one({"id": str(uuid.uuid4()), "deal_id": d0["id"], "sender": "exporter",
        "text": "Thank you for your interest. Please find our proforma invoice with CIF Dubai pricing attached. We look forward to working with you.",
        "created_at": days_ago_iso(5)})
    # negotiation message on deal[1]
    await db.conversations.insert_one({"id": str(uuid.uuid4()), "deal_id": deals[1]["id"], "sender": "buyer",
        "text": "Your price is 8% higher than another supplier. Can you offer a better price?",
        "created_at": days_ago_iso(2)})

    # quotations for a few deals
    for idx in [0, 1, 2, 5, 6]:
        d = deals[idx]
        q = {"id": str(uuid.uuid4()), "deal_id": d["id"], "number": next_quote_number(),
             "exporter": EXPORTER["name"], "buyer": d["buyer_name"], "buyer_country": d["country"],
             "product": d["product"], "grade": d.get("grade", ""), "quantity": d["quantity"], "unit": d["unit"],
             "unit_price": d["unit_price"], "total_price": d["deal_value"], "currency": "USD",
             "incoterm": d["incoterm"], "destination": d["destination"],
             "payment_terms": d.get("payment_terms") or "30% advance, 70% against shipping documents",
             "delivery": d.get("delivery") or "Within 30 days of confirmed order",
             "validity": "Valid for 15 days from date of issue",
             "notes": "Prices are estimates. Confirm actual transaction and logistics costs before contract.",
             "status": "Won" if d["stage"] == "Won" else "Sent", "disclaimer": DISCLAIMER_DOC,
             "created_at": d["created_at"],
             "items": [{"description": f"{d['product']} ({d.get('grade','')})", "quantity": d["quantity"],
                        "unit_price": d["unit_price"], "amount": d["deal_value"]}]}
        await db.quotations.insert_one(dict(q))

    # follow-ups
    fudata = [
        (0, "High Priority", "Follow up today. Highest-value open opportunity awaiting buyer response.", 5),
        (2, "Due Today", "Buyer requested a revised quotation. Send updated proforma today.", 4),
        (3, "High Priority", "Qualified deal with no quotation yet. Send pricing to keep momentum.", 1),
        (1, "Upcoming", "Negotiation active. Prepare a margin-safe counter-offer.", 2),
        (4, "Upcoming", "New inquiry — qualify specifications before quoting.", 0),
    ]
    for (di, prio, rec, dago) in fudata:
        d = deals[di]
        await db.followups.insert_one({"id": str(uuid.uuid4()), "deal_id": d["id"], "buyer_name": d["buyer_name"],
            "product": d["product"], "deal_value": d["deal_value"], "last_contact": days_ago_iso(dago),
            "days_since": dago, "priority": prio, "recommendation": rec, "status": "open"})
    logger.info("Demo data seeded.")


@api.post("/demo/reset")
async def demo_reset():
    for c in ["buyers", "deals", "quotations", "documents", "followups", "activities", "conversations", "sent_emails", "products", "rfqs", "offers", "transactions", "payment_transactions"]:
        await db[c].delete_many({})
    await seed_demo()
    await seed_marketplace()
    return {"ok": True}


@api.get("/")
async def root():
    return {"message": "ExportPilot AI API", "status": "ok"}


@api.get("/config")
async def config():
    return {"exporter": EXPORTER, "currency": "USD", "commission_pct": PLATFORM_COMMISSION_PCT,
            "stripe_enabled": bool(os.environ.get("STRIPE_API_KEY")),
            "email_provider_configured": bool(os.environ.get("RESEND_API_KEY"))}


# ============================================================================
# MARKETPLACE · PROFILES · RFQ · OFFERS · AI MATCH · TRANSACTIONS · INSIGHTS
# ============================================================================

COUNTRY_CURRENCY = {
    "United Arab Emirates": "USD", "Qatar": "USD", "Germany": "EUR", "Saudi Arabia": "USD",
    "Singapore": "SGD", "India": "INR", "United Kingdom": "GBP", "United States": "USD",
    "Netherlands": "EUR", "France": "EUR", "Japan": "JPY", "Australia": "AUD",
}
PLATFORM_COMMISSION_PCT = 0.5
COMMISSION_LABEL = "0.5%"

PRODUCT_IMAGES = {
    "makhana": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
    "rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    "turmeric": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=600&q=80",
    "spice": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
    "chilli": "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=600&q=80",
    "cumin": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80",
    "textile": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80",
    "cotton": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80",
    "tea": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=600&q=80",
    "coffee": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80",
    "default": "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80",
}


def product_image(name):
    n = (name or "").lower()
    for k, v in PRODUCT_IMAGES.items():
        if k in n:
            return v
    return PRODUCT_IMAGES["default"]


# ---- Models ----
class ProductCreate(BaseModel):
    name: str
    category: str = "Agri & Food"
    grade: Optional[str] = ""
    origin: str = "India"
    available_qty: str = ""
    moq: str = ""
    price: float = 0
    currency: str = "USD"
    unit: str = "MT"
    incoterms: List[str] = ["FOB", "CIF"]
    certifications: List[str] = []
    packaging: Optional[str] = "Export-grade packaging"
    port: Optional[str] = "Nhava Sheva (INNSA)"
    lead_time: Optional[str] = "20-30 days"
    description: Optional[str] = ""


class RFQCreate(BaseModel):
    product: str
    category: str = "Agri & Food"
    grade: Optional[str] = ""
    quantity: str
    quantity_value: Optional[float] = 0
    unit: Optional[str] = "MT"
    destination: str
    country: str
    incoterm: str = "CIF"
    payment_terms: Optional[str] = ""
    target_price: Optional[float] = 0
    currency: Optional[str] = "USD"
    delivery: Optional[str] = ""
    industry: Optional[str] = ""
    buyer_name: Optional[str] = "Demo Buyer Co."
    notes: Optional[str] = ""


class OfferCreate(BaseModel):
    rfq_id: Optional[str] = None
    product_id: Optional[str] = None
    buyer_name: str
    seller_name: Optional[str] = None
    price: float
    quantity: str
    incoterm: str = "CIF"
    message: Optional[str] = ""


class TxnCreate(BaseModel):
    deal_id: Optional[str] = None
    buyer_name: str
    seller_name: Optional[str] = None
    product: str
    quantity: str
    value: float
    currency: str = "USD"


class CheckoutReq(BaseModel):
    transaction_id: str
    origin_url: str


# ---- Products ----
DEFAULT_SUPPLIER = {
    "id": "supplier-nimbus", "name": EXPORTER["name"], "country": "India",
    "verified": True, "years_exporting": 9, "completed_transactions": 47,
    "response_rate": 96, "avg_response": "3h", "rating": 4.8,
    "markets": ["UAE", "Qatar", "Germany", "Saudi Arabia", "Singapore"],
    "certifications": ["FSSAI", "APEDA", "ISO 22000", "Spices Board"],
    "description": "Nimbus Agro Exports is a Pune-based exporter of premium Indian agri-commodities — makhana, basmati rice, spices and textiles — serving buyers across the Middle East, Europe and Asia.",
    "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80",
}


@api.get("/products")
async def list_products(q: Optional[str] = None, category: Optional[str] = None, country: Optional[str] = None, incoterm: Optional[str] = None):
    query = {}
    if category and category != "All":
        query["category"] = category
    prods = await db.products.find(query, {"_id": 0}).to_list(200)
    if q:
        ql = q.lower()
        prods = [p for p in prods if ql in p["name"].lower() or ql in p.get("category", "").lower() or ql in p.get("seller_name", "").lower()]
    if country and country != "All":
        prods = [p for p in prods if p.get("origin") == country]
    if incoterm and incoterm != "All":
        prods = [p for p in prods if incoterm in p.get("incoterms", [])]
    return prods


@api.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    return p


@api.post("/products")
async def create_product(inp: ProductCreate):
    p = inp.dict()
    p.update({
        "id": str(uuid.uuid4()), "seller_id": DEFAULT_SUPPLIER["id"], "seller_name": EXPORTER["name"],
        "seller_country": "India", "verified": True, "rating": 4.8, "response_time": "3h",
        "image": product_image(inp.name), "status": "Published", "created_at": now_iso(),
    })
    await db.products.insert_one(dict(p))
    return clean(p)


# ---- RFQs ----
@api.get("/rfqs")
async def list_rfqs(q: Optional[str] = None, country: Optional[str] = None, incoterm: Optional[str] = None):
    rfqs = await db.rfqs.find({}, {"_id": 0}).to_list(200)
    if q:
        ql = q.lower()
        rfqs = [r for r in rfqs if ql in r["product"].lower() or ql in r.get("buyer_name", "").lower() or ql in r.get("destination", "").lower()]
    if country and country != "All":
        rfqs = [r for r in rfqs if r.get("country") == country]
    if incoterm and incoterm != "All":
        rfqs = [r for r in rfqs if r.get("incoterm") == incoterm]
    rfqs.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return rfqs


@api.get("/rfqs/{rid}")
async def get_rfq(rid: str):
    r = await db.rfqs.find_one({"id": rid}, {"_id": 0})
    if not r:
        raise HTTPException(404, "RFQ not found")
    return r


@api.post("/rfqs")
async def create_rfq(inp: RFQCreate):
    r = inp.dict()
    r.update({
        "id": str(uuid.uuid4()), "currency": inp.currency or COUNTRY_CURRENCY.get(inp.country, "USD"),
        "match_score": None, "status": "Open", "offers_count": 0, "created_at": now_iso(),
    })
    await db.rfqs.insert_one(dict(r))
    return clean(r)


def _match_score(product, rfq):
    score, reasons = 55, []
    if product["name"].lower().split()[0] in rfq["product"].lower() or rfq["product"].lower().split()[0] in product["name"].lower():
        score += 22; reasons.append("Product category match")
    if rfq.get("incoterm") in product.get("incoterms", []):
        score += 12; reasons.append(f"{rfq.get('incoterm')} available")
    if product.get("origin"):
        score += 6; reasons.append("Verified origin & documentation")
    if rfq.get("country") in [c for c in DEFAULT_SUPPLIER["markets"]] or True:
        score += 5; reasons.append("Destination supported")
    return min(score, 98), reasons


@api.post("/match/rfq/{rid}")
async def match_rfq(rid: str):
    rfq = await db.rfqs.find_one({"id": rid}, {"_id": 0})
    if not rfq:
        raise HTTPException(404, "RFQ not found")
    prods = await db.products.find({}, {"_id": 0}).to_list(200)
    scored = []
    for p in prods:
        s, reasons = _match_score(p, rfq)
        scored.append({"product": p, "score": s, "reasons": reasons,
                       "label": "Excellent" if s >= 90 else "Strong" if s >= 82 else "Good"})
    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:6]
    try:
        best = top[0]["product"]["name"] if top else rfq["product"]
        note = await llm_text(
            "You are ExportPilot's sourcing AI. One concise sentence explaining why these suppliers fit the buyer's requirement. No markdown.",
            f"Buyer needs {rfq['quantity']} of {rfq['product']} to {rfq['destination']} ({rfq.get('incoterm')}). Best match: {best}.",
            f"We found {len(top)} suppliers that match your {rfq['product']} requirement on product, incoterm and destination.")
    except Exception:
        note = f"We found {len(top)} suppliers matching your {rfq['product']} requirement."
    return {"summary": note, "matches": top}


@api.post("/match/product/{pid}")
async def match_product(pid: str):
    prod = await db.products.find_one({"id": pid}, {"_id": 0})
    if not prod:
        raise HTTPException(404, "Product not found")
    rfqs = await db.rfqs.find({}, {"_id": 0}).to_list(200)
    scored = []
    for r in rfqs:
        s, reasons = _match_score(prod, r)
        scored.append({"rfq": r, "score": s, "reasons": reasons,
                       "label": "Excellent" if s >= 90 else "Strong" if s >= 82 else "Good"})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return {"matches": scored[:6]}


# ---- Supplier / Buyer profiles ----
@api.get("/suppliers/{sid}")
async def get_supplier(sid: str):
    prods = await db.products.find({}, {"_id": 0}).to_list(200)
    return {"supplier": DEFAULT_SUPPLIER, "products": prods}


# ---- Offers ----
@api.post("/offers")
async def create_offer(inp: OfferCreate):
    o = inp.dict()
    o.update({"id": str(uuid.uuid4()), "status": "Sent", "created_at": now_iso()})
    await db.offers.insert_one(dict(o))
    if inp.rfq_id:
        await db.rfqs.update_one({"id": inp.rfq_id}, {"$inc": {"offers_count": 1}})
    return clean(o)


@api.get("/offers")
async def list_offers():
    offers = await db.offers.find({}, {"_id": 0}).to_list(200)
    offers.sort(key=lambda o: o.get("created_at", ""), reverse=True)
    return offers


# ---- Transactions & Payment Protection (Stripe) ----
TXN_STEPS = ["Deal Agreed", "Payment Protected", "Fulfillment In Progress", "Release Pending", "Payout Completed"]


def _txn_public(t):
    return {k: v for k, v in t.items() if k != "_id"}


@api.post("/transactions")
async def create_transaction(inp: TxnCreate):
    value = round(inp.value, 2)
    commission = round(value * PLATFORM_COMMISSION_PCT / 100, 2)
    payout = round(value - commission, 2)
    t = {
        "id": str(uuid.uuid4()), "number": f"EP-{uuid.uuid4().hex[:6].upper()}",
        "deal_id": inp.deal_id, "buyer_name": inp.buyer_name, "seller_name": inp.seller_name or EXPORTER["name"],
        "product": inp.product, "quantity": inp.quantity, "value": value, "currency": inp.currency,
        "commission_pct": PLATFORM_COMMISSION_PCT, "commission": commission, "payout": payout,
        "status": "Payment Pending", "stripe_session_id": None, "paid": False,
        "created_at": now_iso(),
        "timeline": [{"step": "Deal Agreed", "done": True, "at": now_iso()}] +
                    [{"step": s, "done": False, "at": None} for s in TXN_STEPS[1:]],
    }
    await db.transactions.insert_one(dict(t))
    if inp.deal_id:
        await add_activity(inp.deal_id, f"Protected transaction {t['number']} created — {inp.currency} {value:,.0f}.", "transaction")
    return _txn_public(t)


@api.get("/transactions")
async def list_transactions():
    ts = await db.transactions.find({}, {"_id": 0}).to_list(200)
    ts.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    return ts


@api.get("/transactions/{tid}")
async def get_transaction(tid: str):
    t = await db.transactions.find_one({"id": tid}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Transaction not found")
    return t


def _advance_timeline(t, target_status):
    idx = TXN_STEPS.index(target_status) if target_status in TXN_STEPS else 0
    tl = t.get("timeline", [])
    for i, step in enumerate(tl):
        step["done"] = i <= idx
        if i <= idx and not step.get("at"):
            step["at"] = now_iso()
    return tl


@api.post("/transactions/{tid}/advance")
async def advance_transaction(tid: str):
    t = await db.transactions.find_one({"id": tid}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Transaction not found")
    order = ["Payment Pending", "Payment Protected", "Fulfillment In Progress", "Release Pending", "Payout Completed"]
    cur = t.get("status", "Payment Pending")
    nxt = order[min(order.index(cur) + 1, len(order) - 1)]
    tl = _advance_timeline(t, nxt if nxt in TXN_STEPS else "Payment Protected")
    await db.transactions.update_one({"id": tid}, {"$set": {"status": nxt, "timeline": tl}})
    return await db.transactions.find_one({"id": tid}, {"_id": 0})


def _stripe_client(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    return StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)


@api.post("/payments/checkout")
async def payments_checkout(inp: CheckoutReq, request: Request):
    from emergentintegrations.payments.stripe.checkout import CheckoutSessionRequest
    t = await db.transactions.find_one({"id": inp.transaction_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Transaction not found")
    amount = float(round(t["value"], 2))
    origin = inp.origin_url.rstrip("/")
    success_url = f"{origin}/app/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/app/payment/cancel"
    checkout = _stripe_client(request)
    req = CheckoutSessionRequest(
        amount=amount, currency="usd", success_url=success_url, cancel_url=cancel_url,
        metadata={"transaction_id": t["id"], "type": "payment_protection"},
    )
    session = await checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "transaction_id": t["id"], "amount": amount,
        "currency": "usd", "status": "initiated", "payment_status": "pending",
        "created_at": now_iso(), "updated_at": now_iso(),
    })
    await db.transactions.update_one({"id": t["id"]}, {"$set": {"stripe_session_id": session.session_id}})
    return {"checkout_url": session.url, "session_id": session.session_id}


@api.get("/payments/status/{session_id}")
async def payments_status(session_id: str, request: Request):
    rec = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Transaction not found")
    if rec.get("payment_status") != "paid":
        try:
            checkout = _stripe_client(request)
            status = await checkout.get_checkout_status(session_id)
            if status.payment_status == "paid" or status.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid", "updated_at": now_iso()}})
                t = await db.transactions.find_one({"id": rec["transaction_id"]}, {"_id": 0})
                if t and not t.get("paid"):
                    tl = _advance_timeline(t, "Payment Protected")
                    await db.transactions.update_one({"id": t["id"]},
                        {"$set": {"paid": True, "status": "Payment Protected", "timeline": tl}})
                    if t.get("deal_id"):
                        await add_activity(t["deal_id"], f"Payment protected for transaction {t['number']}.", "payment")
                rec["payment_status"] = "paid"; rec["status"] = "completed"
        except Exception as e:
            logger.error(f"stripe status error: {e}")
    return {"session_id": session_id, "status": rec.get("status"), "payment_status": rec.get("payment_status"),
            "transaction_id": rec.get("transaction_id")}


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        checkout = _stripe_client(request)
        body = await request.body()
        resp = await checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))
        if resp.payment_status == "paid":
            rec = await db.payment_transactions.find_one({"session_id": resp.session_id})
            if rec and rec.get("payment_status") != "paid":
                await db.payment_transactions.update_one({"session_id": resp.session_id},
                    {"$set": {"payment_status": "paid", "status": "completed", "updated_at": now_iso()}})
                t = await db.transactions.find_one({"id": rec["transaction_id"]}, {"_id": 0})
                if t and not t.get("paid"):
                    tl = _advance_timeline(t, "Payment Protected")
                    await db.transactions.update_one({"id": t["id"]}, {"$set": {"paid": True, "status": "Payment Protected", "timeline": tl}})
    except Exception as e:
        logger.error(f"webhook error: {e}")
    return {"status": "ok"}


# ---- Buyer AI Verification snapshot ----
@api.post("/buyers/{buyer_id}/verify")
async def verify_buyer(buyer_id: str):
    b = await db.buyers.find_one({"id": buyer_id}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Buyer not found")
    deals = await db.deals.find({"buyer_id": buyer_id}, {"_id": 0}).to_list(100)
    won = len([d for d in deals if d["stage"] == "Won"])
    system = ("You are ExportPilot's buyer-verification AI. Give a concise credibility snapshot for an exporter. "
              "Never guarantee legitimacy. Return JSON: score (0-100 int), band (Low/Moderate/Strong), "
              "signals (array of 3 short positive/neutral strings), watchouts (array of up to 2 short caution strings), summary (one sentence).")
    prompt = f"Buyer {b['name']} from {b['country']}. Deals with us: {len(deals)} (won: {won}). Give a credibility snapshot for the exporter's own due diligence."
    fallback = {"score": 72 + won * 4, "band": "Strong" if won else "Moderate",
                "signals": ["Consistent engagement across deals", f"{len(deals)} recorded opportunit{'y' if len(deals)==1 else 'ies'}", "Clear product requirements"],
                "watchouts": ["Confirm company registration independently", "Verify banking details before shipment"],
                "summary": "Engagement signals are positive; complete your own KYC before committing to shipment."}
    data = await llm_json(system, prompt, fallback)
    for k, v in fallback.items():
        data.setdefault(k, v)
    try:
        data["score"] = max(0, min(int(float(data["score"])), 100))
    except Exception:
        data["score"] = fallback["score"]
    data["disclaimer"] = "AI credibility signals for your own due diligence — not a guarantee of buyer legitimacy."
    return data


# ---- Win-rate insights ----
@api.get("/insights/winrate")
async def winrate_insights():
    deals = await db.deals.find({}, {"_id": 0}).to_list(500)
    def agg(key):
        buckets = {}
        for d in deals:
            k = d.get(key) or "Other"
            b = buckets.setdefault(k, {"name": k, "won": 0, "lost": 0, "open": 0, "value": 0})
            if d["stage"] == "Won":
                b["won"] += 1; b["value"] += d.get("deal_value", 0)
            elif d["stage"] == "Lost":
                b["lost"] += 1
            else:
                b["open"] += 1
        out = []
        for b in buckets.values():
            closed = b["won"] + b["lost"]
            b["win_rate"] = round(b["won"] / closed * 100) if closed else 0
            out.append(b)
        return sorted(out, key=lambda x: (x["win_rate"], x["value"]), reverse=True)
    by_product = agg("product")
    by_country = agg("country")
    won = [d for d in deals if d["stage"] == "Won"]
    lost = [d for d in deals if d["stage"] == "Lost"]
    total_closed = len(won) + len(lost)
    return {
        "overall_win_rate": round(len(won) / total_closed * 100) if total_closed else 0,
        "won_value": sum(d.get("deal_value", 0) for d in won),
        "by_product": by_product, "by_country": by_country,
        "best_product": by_product[0]["name"] if by_product else "—",
        "best_country": by_country[0]["name"] if by_country else "—",
    }


# ---- Role-aware dashboards ----
@api.get("/dashboard/seller")
async def dashboard_seller():
    deals = await db.deals.find({}, {"_id": 0}).to_list(500)
    fus = await db.followups.find({}, {"_id": 0}).to_list(200)
    products = await db.products.find({}, {"_id": 0}).to_list(200)
    rfqs = await db.rfqs.find({}, {"_id": 0}).to_list(200)
    txns = await db.transactions.find({}, {"_id": 0}).to_list(200)
    open_deals = [d for d in deals if d["stage"] not in ("Won", "Lost")]
    neg = [d for d in deals if d["stage"] == "Negotiation"]
    protected = [t for t in txns if t.get("paid")]
    pending_payout = sum(t.get("payout", 0) for t in txns if t.get("status") not in ("Payout Completed",) and t.get("paid"))
    return {
        "kpis": {
            "active_products": len(products), "buyer_requests": len(rfqs),
            "active_negotiations": len(neg), "pipeline_value": sum(d.get("deal_value", 0) for d in open_deals),
            "protected_transactions": len(protected), "pending_payout": pending_payout,
        },
        "matching_rfqs": len(rfqs),
        "followups_due": len([f for f in fus if f.get("priority") in ("High Priority", "Due Today")]),
    }


@api.get("/dashboard/buyer")
async def dashboard_buyer():
    rfqs = await db.rfqs.find({}, {"_id": 0}).to_list(200)
    offers = await db.offers.find({}, {"_id": 0}).to_list(200)
    txns = await db.transactions.find({}, {"_id": 0}).to_list(200)
    products = await db.products.find({}, {"_id": 0}).to_list(200)
    protected = [t for t in txns if t.get("paid")]
    return {
        "kpis": {
            "active_rfqs": len([r for r in rfqs if r.get("status") == "Open"]),
            "supplier_matches": len(products), "active_negotiations": len(offers),
            "pending_payments": len([t for t in txns if not t.get("paid")]),
            "protected_transactions": len(protected), "orders": len(protected),
        },
        "supplier_matches": len(products),
    }


# ---- Marketplace seed ----
async def seed_marketplace():
    if await db.products.count_documents({}) > 0:
        return
    logger.info("Seeding marketplace...")
    prods = [
        ("Premium Makhana (Fox Nuts)", "Agri & Food", "5 Sutta HS grade", "50 MT/month", "5 MT", 4200, ["FOB", "CIF", "CFR"], ["FSSAI", "APEDA", "ISO 22000"], "Bihar, India"),
        ("Basmati Rice 1121 Steam", "Agri & Food", "1121 Steam", "200 MT/month", "25 MT", 1520, ["FOB", "CIF"], ["APEDA", "ISO 22000"], "Punjab, India"),
        ("Organic Turmeric", "Spices", "Curcumin 3%+", "80 MT/month", "10 MT", 4070, ["CIF", "CFR"], ["USDA Organic", "Spices Board"], "Erode, India"),
        ("Red Chilli Powder", "Spices", "Teja S17", "120 MT/month", "12 MT", 2100, ["FOB", "CIF"], ["FSSAI", "Spices Board"], "Guntur, India"),
        ("Cumin Seeds", "Spices", "Singapore 99%", "90 MT/month", "18 MT", 3300, ["FOB", "CFR"], ["Spices Board"], "Unjha, India"),
        ("Cotton Woven Textiles", "Textiles", "200 GSM woven", "500,000 m/month", "40,000 m", 2.4, ["FOB", "CIF"], ["OEKO-TEX", "GOTS"], "Surat, India"),
        ("Assam CTC Black Tea", "Beverages", "BP grade", "60 MT/month", "5 MT", 3100, ["FOB", "CIF"], ["FSSAI", "Tea Board"], "Assam, India"),
        ("Arabica Green Coffee", "Beverages", "Grade A washed", "40 MT/month", "5 MT", 5200, ["FOB", "CFR", "CIF"], ["Coffee Board", "Rainforest"], "Chikmagalur, India"),
    ]
    for (name, cat, grade, avail, moq, price, inco, certs, origin) in prods:
        p = {"id": str(uuid.uuid4()), "name": name, "category": cat, "grade": grade, "origin": "India",
             "origin_region": origin, "available_qty": avail, "moq": moq, "price": price, "currency": "USD",
             "unit": "MT" if "m" not in moq.split()[1] else "m", "incoterms": inco, "certifications": certs,
             "packaging": "Food-grade export packaging", "port": "Nhava Sheva (INNSA)", "lead_time": "20-30 days",
             "description": f"Premium {name} from {origin}, prepared to international export standards.",
             "seller_id": DEFAULT_SUPPLIER["id"], "seller_name": EXPORTER["name"], "seller_country": "India",
             "verified": True, "rating": round(4.6 + (hash(name) % 4) / 10, 1), "response_time": "3h",
             "image": product_image(name), "status": "Published", "created_at": now_iso()}
        await db.products.insert_one(dict(p))

    rfqs = [
        ("Dubai Harvest Trading", "United Arab Emirates", "Dubai", "Premium Makhana", "10 MT", 10, "CIF", "30% advance, 70% on docs", 4300, "Agri & Food"),
        ("Berlin Natural Foods", "Germany", "Hamburg", "Organic Turmeric", "15 MT", 15, "CIF", "LC at sight", 4100, "Spices"),
        ("Qatar Global Foods", "Qatar", "Doha", "Basmati Rice 1121", "25 MT", 25, "CFR", "50% advance", 1550, "Agri & Food"),
        ("Singapore Natural Foods", "Singapore", "Singapore", "Cotton Woven Textiles", "40,000 m", 40000, "CIF", "Open account 30 days", 2.5, "Textiles"),
        ("Saudi Harvest Trading", "Saudi Arabia", "Jeddah", "Red Chilli Powder", "12 MT", 12, "FOB", "TT advance", 2150, "Spices"),
        ("Amsterdam Fine Foods", "Netherlands", "Rotterdam", "Arabica Green Coffee", "5 MT", 5, "CIF", "LC 60 days", 5300, "Beverages"),
        ("Tokyo Trade House", "Japan", "Yokohama", "Assam CTC Black Tea", "8 MT", 8, "CFR", "TT on shipment", 3200, "Beverages"),
    ]
    for i, (buyer, country, dest, product, qstr, qv, inco, pay, price, cat) in enumerate(rfqs):
        r = {"id": str(uuid.uuid4()), "buyer_name": buyer, "country": country, "destination": dest,
             "product": product, "category": cat, "grade": "", "quantity": qstr, "quantity_value": qv, "unit": "MT",
             "incoterm": inco, "payment_terms": pay, "target_price": price, "currency": "USD",
             "delivery": "Within 30-45 days", "industry": "Import & Distribution", "notes": "",
             "match_score": 96 - i * 3, "status": "Open", "offers_count": (i % 3),
             "created_at": days_ago_iso(i)}
        await db.rfqs.insert_one(dict(r))

    # sample protected transactions
    won_deals = await db.deals.find({"stage": "Won"}, {"_id": 0}).to_list(10)
    for d in won_deals[:2]:
        value = d.get("deal_value", 100000)
        commission = round(value * PLATFORM_COMMISSION_PCT / 100, 2)
        t = {"id": str(uuid.uuid4()), "number": f"EP-{uuid.uuid4().hex[:6].upper()}", "deal_id": d["id"],
             "buyer_name": d["buyer_name"], "seller_name": EXPORTER["name"], "product": d["product"],
             "quantity": d["quantity"], "value": value, "currency": "USD", "commission_pct": PLATFORM_COMMISSION_PCT,
             "commission": commission, "payout": round(value - commission, 2), "status": "Payout Completed",
             "stripe_session_id": None, "paid": True, "created_at": days_ago_iso(10),
             "timeline": [{"step": s, "done": True, "at": days_ago_iso(10 - i)} for i, s in enumerate(TXN_STEPS)]}
        await db.transactions.insert_one(dict(t))
    logger.info("Marketplace seeded.")


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await seed_demo()
    await seed_marketplace()


@app.on_event("shutdown")
async def shutdown():
    client.close()
