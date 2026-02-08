import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth0ProviderWithNavigate } from "@/providers/Auth0Provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import IntegrationCheck from "./pages/IntegrationCheck";
import NotFound from "./pages/NotFound";

// Artist pages
import ArtistArtworks from "./pages/artist/ArtistArtworks";
import ArtistCreateTag from "./pages/artist/ArtistCreateTag";
import ArtistCompliance from "./pages/artist/ArtistCompliance";

// Company pages
import CompanyProfile from "./pages/company/CompanyProfile";
import CompanyScan from "./pages/company/CompanyScan";
import CompanyHistory from "./pages/company/CompanyHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccessibilityProvider>
      <BrowserRouter>
        <Auth0ProviderWithNavigate>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/integration-check" element={<IntegrationCheck />} />

                {/* Artist routes */}
                <Route path="/artist/artworks" element={<ArtistArtworks />} />
                <Route path="/artist/create" element={<ArtistCreateTag />} />
                <Route path="/artist/compliance" element={<ArtistCompliance />} />

                {/* Company routes */}
                <Route path="/company/profile" element={<CompanyProfile />} />
                <Route path="/company/scan" element={<CompanyScan />} />
                <Route path="/company/history" element={<CompanyHistory />} />

                {/* Redirects */}
                <Route path="/artist" element={<Navigate to="/artist/artworks" replace />} />
                <Route path="/company" element={<Navigate to="/company/scan" replace />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </Auth0ProviderWithNavigate>
      </BrowserRouter>
    </AccessibilityProvider>
  </QueryClientProvider>
);

export default App;
