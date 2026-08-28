import {
  Home, Brain, Users, Briefcase, FileText, Handshake, PackageCheck, Clock, Bot,
  Video, Languages, Ship, CreditCard, PackageSearch, MessageCircle, UsersRound,
  Globe, Lock, BarChart3, ShieldCheck, Scale,
} from "lucide-react";

export const CORE_NAV = [
  { to: "/app", label: "Command Center", icon: Home, end: true },
  { to: "/app/inbox", label: "AI Buyer Inbox", icon: Brain, ai: true },
  { to: "/app/buyers", label: "Buyers", icon: Users },
  { to: "/app/deals", label: "Deals", icon: Briefcase },
  { to: "/app/quotations", label: "Quotations", icon: FileText },
  { to: "/app/negotiation", label: "Negotiation", icon: Handshake, ai: true },
  { to: "/app/export-pack", label: "Export Pack", icon: PackageCheck },
  { to: "/app/followups", label: "Follow-ups", icon: Clock },
];

export const UPCOMING_NAV = [
  { slug: "global-call", label: "Global Call", icon: Video, title: "Global Call", desc: "Video calling with AI-assisted multilingual communication.", long: "Talk with international buyers while ExportPilot translates the conversation in real time." },
  { slug: "voice-translation", label: "Live Voice Translation", icon: Languages, title: "Live Voice Translation", desc: "Real-time speech translation between exporters and international buyers.", long: "Speak in your language and let ExportPilot translate live for your buyer, and back again." },
  { slug: "logistics", label: "Logistics Marketplace", icon: Ship, title: "Logistics Marketplace", desc: "Connect exporters with logistics and freight service providers.", long: "Compare freight quotes and book logistics partners without leaving your export workspace." },
  { slug: "trade-financing", label: "Trade Financing", icon: CreditCard, title: "Trade Financing", desc: "Connect eligible exporters with trade-finance partners.", long: "Access working capital and trade finance offers matched to your confirmed export orders." },
  { slug: "shipment-tracking", label: "Advanced Shipment Tracking", icon: PackageSearch, title: "Advanced Shipment Tracking", desc: "Track export shipments from dispatch to delivery.", long: "Live milestone tracking from factory gate to buyer's port with proactive delay alerts." },
  { slug: "whatsapp", label: "WhatsApp Integration", icon: MessageCircle, title: "WhatsApp Integration", desc: "Manage buyer conversations and follow-ups through WhatsApp.", long: "Handle buyer chats and automated follow-ups on WhatsApp, synced to every deal." },
  { slug: "enterprise-team", label: "Enterprise Team", icon: UsersRound, title: "Enterprise Team", desc: "Multi-user workspaces, roles and enterprise collaboration.", long: "Invite your sales, documentation and logistics teams with granular roles and permissions." },
  { slug: "languages", label: "30+ Languages", icon: Globe, title: "30+ Languages", desc: "Communicate with buyers across global markets in multiple languages.", long: "Draft quotations, emails and documents in 30+ languages tuned for international trade." },
  { slug: "sso", label: "Enterprise SSO", icon: Lock, title: "Enterprise SSO", desc: "Enterprise authentication and single sign-on.", long: "SAML / OIDC single sign-on and advanced security controls for larger export houses." },
  { slug: "accounting", label: "Accounting & ERP", icon: BarChart3, title: "Accounting & ERP", desc: "Connect ExportPilot with accounting and enterprise systems.", long: "Sync invoices and orders with Tally, Zoho, SAP and leading accounting platforms." },
  { slug: "buyer-verification", label: "AI Buyer Verification", icon: ShieldCheck, title: "AI Buyer Verification", desc: "AI-assisted buyer risk and credibility analysis.", long: "Screen new buyers with AI-assisted credibility signals before you commit to an order." },
  { slug: "compliance", label: "Compliance Intelligence", icon: Scale, title: "Compliance Intelligence", desc: "AI-assisted export compliance and regulatory workflows.", long: "Stay ahead of documentation and regulatory requirements with AI-assisted compliance guidance." },
];

export const ROADMAP = [
  { phase: "Phase 1", title: "AI Export Workflow", status: "Current" },
  { phase: "Phase 2", title: "Global Communication", status: "Upcoming" },
  { phase: "Phase 3", title: "Trade Services", status: "Upcoming" },
  { phase: "Phase 4", title: "Enterprise Export Infrastructure", status: "Future" },
];
