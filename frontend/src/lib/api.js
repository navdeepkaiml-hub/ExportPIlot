import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

export const api = {
  config: () => client.get("/config").then((r) => r.data),
  dashboard: () => client.get("/dashboard").then((r) => r.data),

  analyzeInquiry: (message) => client.post("/inquiry/analyze", { message }).then((r) => r.data),

  listDeals: () => client.get("/deals").then((r) => r.data),
  getDeal: (id) => client.get(`/deals/${id}`).then((r) => r.data),
  createDeal: (payload) => client.post("/deals", payload).then((r) => r.data),
  updateStage: (id, stage) => client.patch(`/deals/${id}/stage`, { stage }).then((r) => r.data),
  dealDoctor: (id) => client.get(`/deals/${id}/doctor`).then((r) => r.data),
  dealConversation: (id) => client.get(`/deals/${id}/conversation`).then((r) => r.data),
  dealActivities: (id) => client.get(`/deals/${id}/activities`).then((r) => r.data),

  listBuyers: () => client.get("/buyers").then((r) => r.data),
  getBuyer: (id) => client.get(`/buyers/${id}`).then((r) => r.data),

  calcPricing: (payload) => client.post("/pricing/calculate", payload).then((r) => r.data),
  simulate: (payload) => client.post("/pricing/simulate", payload).then((r) => r.data),

  createQuotation: (payload) => client.post("/quotations", payload).then((r) => r.data),
  listQuotations: () => client.get("/quotations").then((r) => r.data),
  dealQuotation: (id) => client.get(`/deals/${id}/quotation`).then((r) => r.data),

  negotiationAnalyze: (payload) => client.post("/negotiation/analyze", payload).then((r) => r.data),
  negotiationRespond: (payload) => client.post("/negotiation/respond", payload).then((r) => r.data),
  negotiationApprove: (payload) => client.post("/negotiation/approve", payload).then((r) => r.data),

  generateExportPack: (id) => client.post(`/deals/${id}/export-pack/generate`).then((r) => r.data),
  listDocuments: (id) => client.get(`/deals/${id}/documents`).then((r) => r.data),
  docUrl: (docId) => `${API}/documents/${docId}`,
  docDownloadUrl: (docId) => `${API}/documents/${docId}/download`,

  composeEmail: (id) => client.post(`/deals/${id}/compose-email`).then((r) => r.data),
  sendToBuyer: (id, payload) => client.post(`/deals/${id}/send`, payload).then((r) => r.data),

  listFollowups: () => client.get("/followups").then((r) => r.data),
  generateFollowup: (id) => client.post("/followups/generate", { followup_id: id }).then((r) => r.data),
  completeFollowup: (id) => client.post(`/followups/${id}/complete`).then((r) => r.data),

  ask: (question) => client.post("/assistant/ask", { question }).then((r) => r.data),
  resetDemo: () => client.post("/demo/reset").then((r) => r.data),
};
