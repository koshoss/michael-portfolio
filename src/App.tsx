import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";
import { Navigation } from "./components/Navigation";
import { HomePage } from "./pages/Home";
import { PortfolioPage } from "./pages/Portfolio";
import { PricingPage } from "./pages/Pricing";
import { ReviewsPage } from "./pages/Reviews";
import { TermsPage } from "./pages/Terms";
import { AdminPage } from "./pages/Admin";
import { ViewerPage } from "./pages/Viewer";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/view/:id" element={<ViewerPage />} />
            <Route path="*" element={
              <>
                <Navigation />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/reviews" element={<ReviewsPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </>
            } />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
