# ExportPilot AI — Product Requirements Document

## Original Problem Statement
Build **ExportPilot AI** — "Your AI Export Department", a premium B2B SaaS MVP for small/medium exporters. Turns international buyer inquiries into quotations, negotiations, export documents and follow-ups from one AI-powered workspace. Competition MVP demonstrating a larger startup vision. Core connected workflow:
Buyer Inquiry → AI Understanding → Deal → Pricing → Quotation → Negotiation → Export Pack → Send to Buyer → Follow-up.

## User Choices
- AI: Emergent Universal LLM Key + **Claude Sonnet 4.6**
- Auth: **None** — jump straight to Demo Workspace at `/app`
- Currency: **USD** (compact e.g. $268.3K)
- Design: agent-chosen (High-contrast SaaS, Outfit + Plus Jakarta Sans, indigo AI accent)
- Pricing math in Python; AI outputs dynamic on real data; docs genuinely downloadable; Send-to-Buyer a real workflow.

## Architecture
- **Frontend**: React 19 + React Router 7, Tailwind + shadcn/ui, framer-motion, recharts. Landing + `/app` shell (sidebar CORE/EXPANSION + floating AI Export Manager).
- **Backend**: FastAPI + Motor (MongoDB). All routes `/api`. UUID string ids, `_id` excluded via projection.
- **AI**: emergentintegrations `LlmChat` (anthropic/claude-sonnet-4-6). `llm_json` (extraction/negotiation-analysis/assistant) + `llm_text` (negotiation reply/email/follow-up) with safe fallbacks.
- **Pricing**: pure Python `compute_pricing` (incoterm component inclusion) + margin simulator.
- **Docs**: server-generated HTML documents, previewable + downloadable.
- **Email**: optional `RESEND_API_KEY`; without it Send-to-Buyer records the send in-app.

## Data Models
User/Company (constant exporter), Buyer, Deal, Quotation (+items), Document, FollowUp, Activity, Conversation, SentEmail. Connected: Buyer → Deal → Quotation → Negotiation → Export Pack → Follow-up.

## Implemented (2026-06) — all verified, 27/27 backend + full E2E frontend passing
- Command Center dashboard (KPIs, AI Action Center, Revenue-at-Risk chart)
- AI Buyer Inbox (dynamic extraction, completeness ring, missing info, create deal, clarifying questions)
- Deals Kanban (6 stages, drag-to-move, deal health)
- Deal Detail (stage timeline, tabs: Overview/AI Deal Doctor, Conversation, Quotation, Export Pack, Activity)
- AI Pricing Engine / Quote Builder + margin simulator
- Quotation generator (preview + HTML download + send)
- AI Negotiation Copilot (objection analysis, 3 strategies, generated response, approve→conversation)
- One-Click Export Pack (7 downloadable documents)
- Send-to-Buyer email composer (AI-composed, success state)
- AI Follow-ups (priority sections, generated messages, send/schedule/complete)
- AI Export Manager (floating + full page, data-aware, prepare-export-pack action)
- 12 polished Coming Soon pages + 4-phase roadmap
- Buyers CRM + buyer detail tabs
- Landing page; auto-seeded demo data (5 buyers, 8 deals, quotations, follow-ups); demo reset
- Safety disclaimers on all documents & pricing

## Backlog (not built — intentional, Coming Soon only)
Global Call, Live Voice Translation, Logistics Marketplace, Trade Financing, Advanced Shipment Tracking, WhatsApp, Enterprise Team, 30+ Languages, Enterprise SSO, Accounting & ERP, AI Buyer Verification, Compliance Intelligence.

## Notes / Optional Improvements
- To enable live outbound email: set `RESEND_API_KEY` in backend/.env (switch requests→httpx.AsyncClient).
- Optionally split server.py into routers; add stage enum validation.
