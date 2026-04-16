import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Practice from "@/pages/Practice";
import LRDISets from "@/pages/LRDISets";
import PYQs from "@/pages/PYQs";
import MockTests from "@/pages/MockTests";
import Videos from "@/pages/Videos";
import About from "@/pages/About";
import ReviewMode from "@/pages/ReviewMode";
import DPP from "@/pages/DPP";
import Resources from "@/pages/Resources";
import NewspaperPage from "@/pages/Newspaper";
import Auth from "@/pages/Auth";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/lrdi-sets" element={<LRDISets />} />
            <Route path="/pyqs" element={<PYQs />} />
            <Route path="/mocks" element={<MockTests />} />
            <Route path="/videos" element={<Videos />} />
            
            <Route path="/about" element={<About />} />
            <Route path="/review" element={<ReviewMode />} />
            <Route path="/dpp" element={<DPP />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/newspaper" element={<NewspaperPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
