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

  dashboardSeller: () => client.get("/dashboard/seller").then((r) => r.data),
  dashboardBuyer: () => client.get("/dashboard/buyer").then((r) => r.data),

  listProducts: (params) => client.get("/products", { params }).then((r) => r.data),
  getProduct: (id) => client.get(`/products/${id}`).then((r) => r.data),
  matchProduct: (id) => client.post(`/match/product/${id}`).then((r) => r.data),
  getSupplier: (id) => client.get(`/suppliers/${id}`).then((r) => r.data),

  listRfqs: (params) => client.get("/rfqs", { params }).then((r) => r.data),
  getRfq: (id) => client.get(`/rfqs/${id}`).then((r) => r.data),
  createRfq: (payload) => client.post("/rfqs", payload).then((r) => r.data),
  matchRfq: (id) => client.post(`/match/rfq/${id}`).then((r) => r.data),

  createOffer: (payload) => client.post("/offers", payload).then((r) => r.data),
  listOffers: () => client.get("/offers").then((r) => r.data),

  listTransactions: () => client.get("/transactions").then((r) => r.data),
  getTransaction: (id) => client.get(`/transactions/${id}`).then((r) => r.data),
  createTransaction: (payload) => client.post("/transactions", payload).then((r) => r.data),
  advanceTransaction: (id) => client.post(`/transactions/${id}/advance`).then((r) => r.data),
  checkout: (payload) => client.post("/payments/checkout", payload).then((r) => r.data),
  paymentStatus: (sid) => client.get(`/payments/status/${sid}`).then((r) => r.data),

  verifyBuyer: (id) => client.post(`/buyers/${id}/verify`).then((r) => r.data),
  winrate: () => client.get("/insights/winrate").then((r) => r.data),
};
