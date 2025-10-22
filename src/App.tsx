import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
// import NotFound from "./pages/NotFound";
// import SearchResults from "./pages/SearchResults";
// import { VendorDetailPage } from "@/components/VendorDetailPage";
// import MyQueue from "./pages/MyQueue";
// import ActiveQueue from "./pages/ActiveQueue";
// import QueueDetail from "./pages/QueueDetail";
// import OrderHistory from "./pages/OrderHistory";
// import SupportChat from "./pages/SupportChat";
import Auth from "./pages/Auth";
import VendorDashboard from "./components/vendor/VendorDashboard";
// import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner
        position="top-right"
        richColors={false}
        toastOptions={{
          duration: 3000, 
          classNames: {
            success: "bg-green-500 text-white border-none",
            error: "bg-red-500 text-white border-none",
            warning: "bg-amber-500 text-white border-none",
            info: "bg-blue-500 text-white border-none",
          },
        }}
        expand={true}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/vendor" element={<VendorDashboard />} />
          {/* <Route path="/profile" element={<Profile />} /> */}
          {/* <Route path="/search" element={<SearchResults />} /> */}
          {/* <Route path="/vendor/:id" element={<VendorDetailPage vendor={{
            id: "1",
            name: "Pizza Palace",
            coverImage: "/src/assets/vendor1.jpg",
            rating: 4.5,
            reviewCount: 120,
            eta: "15-20 min",
            queueSize: 8,
            distance: "0.5 km",
            cuisineType: "Italian",
            priceRange: "€€",
            isPreOrderAvailable: true,
            address: "123 Main St",
            phone: "+1234567890",
            hours: "10:00 - 22:00",
            description: "Authentic Italian pizza with fresh ingredients"
          }} />} /> */}
          {/* <Route path="/my-queue" element={<MyQueue />} /> */}
          {/* <Route path="/active-queue" element={<ActiveQueue />} /> */}
          {/* <Route path="/queue/:queueId" element={<QueueDetail />} /> */}
          {/* <Route path="/order-history" element={<OrderHistory />} /> */}
          {/* <Route path="/support" element={<SupportChat />} /> */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;