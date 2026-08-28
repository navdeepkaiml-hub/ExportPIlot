import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { RoleProvider, useRole } from "@/context/RoleContext";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import SellerDashboard from "@/pages/SellerDashboard";
import BuyerDashboard from "@/pages/BuyerDashboard";
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
import DiscoverSuppliers from "@/pages/DiscoverSuppliers";
import ProductDetail from "@/pages/ProductDetail";
import MyProducts from "@/pages/MyProducts";
import FindBuyers from "@/pages/FindBuyers";
import RFQDetail from "@/pages/RFQDetail";
import RFQCreate from "@/pages/RFQCreate";
import MyRFQs from "@/pages/MyRFQs";
import Transactions from "@/pages/Transactions";
import TransactionDetail from "@/pages/TransactionDetail";
import Payouts from "@/pages/Payouts";
import Orders from "@/pages/Orders";
import SupplierProfile from "@/pages/SupplierProfile";
import PaymentResult from "@/pages/PaymentResult";

function RoleDashboard() {
  const { isSeller } = useRole();
  return isSeller ? <SellerDashboard /> : <BuyerDashboard />;
}

function App() {
  return (
    <div className="App">
      <RoleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Layout />}>
              <Route index element={<RoleDashboard />} />
              <Route path="inbox" element={<BuyerInbox />} />
              <Route path="buyers" element={<Buyers />} />
              <Route path="buyers/:id" element={<BuyerDetail />} />
              <Route path="deals" element={<Deals />} />
              <Route path="deals/:id" element={<DealDetail />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="negotiations" element={<Negotiation />} />
              <Route path="export-pack" element={<ExportPack />} />
              <Route path="followups" element={<Followups />} />
              <Route path="manager" element={<ManagerPage />} />
              <Route path="discover" element={<DiscoverSuppliers />} />
              <Route path="products" element={<MyProducts />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="find-buyers" element={<FindBuyers />} />
              <Route path="rfqs" element={<MyRFQs />} />
              <Route path="rfqs/new" element={<RFQCreate />} />
              <Route path="rfqs/:id" element={<RFQDetail />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="transactions/:id" element={<TransactionDetail />} />
              <Route path="payouts" element={<Payouts />} />
              <Route path="orders" element={<Orders />} />
              <Route path="profile/supplier" element={<SupplierProfile />} />
              <Route path="payment/success" element={<PaymentResult />} />
              <Route path="payment/cancel" element={<PaymentResult />} />
              <Route path="upcoming/:slug" element={<ComingSoon />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </RoleProvider>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
