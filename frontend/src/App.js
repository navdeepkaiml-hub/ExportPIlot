import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import CommandCenter from "@/pages/CommandCenter";
import BuyerInbox from "@/pages/BuyerInbox";
import Buyers from "@/pages/Buyers";
import BuyerDetail from "@/pages/BuyerDetail";
import Deals from "@/pages/Deals";
import DealDetail from "@/pages/DealDetail";
import Quotations from "@/pages/Quotations";
import Negotiation from "@/pages/Negotiation";
import ExportPack from "@/pages/ExportPack";
import Followups from "@/pages/Followups";
import ManagerPage from "@/pages/ManagerPage";
import ComingSoon from "@/pages/ComingSoon";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<CommandCenter />} />
            <Route path="inbox" element={<BuyerInbox />} />
            <Route path="buyers" element={<Buyers />} />
            <Route path="buyers/:id" element={<BuyerDetail />} />
            <Route path="deals" element={<Deals />} />
            <Route path="deals/:id" element={<DealDetail />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="negotiation" element={<Negotiation />} />
            <Route path="export-pack" element={<ExportPack />} />
            <Route path="followups" element={<Followups />} />
            <Route path="manager" element={<ManagerPage />} />
            <Route path="upcoming/:slug" element={<ComingSoon />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
