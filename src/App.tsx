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
import ResetPassword from "@/pages/ResetPassword";
import Community from "@/pages/Community";
import CommunityQuestion from "@/pages/CommunityQuestion";
import Leaderboard from "@/pages/Leaderboard";
import AdminDashboard from "@/pages/AdminDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeedbackButton from "@/components/FeedbackButton";
import PageTracker from "@/components/PageTracker";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageTracker />
        <FeedbackButton />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
            <Route path="/lrdi-sets" element={<ProtectedRoute><LRDISets /></ProtectedRoute>} />
            <Route path="/pyqs" element={<ProtectedRoute><PYQs /></ProtectedRoute>} />
            <Route path="/mocks" element={<ProtectedRoute><MockTests /></ProtectedRoute>} />
            <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
            <Route path="/review" element={<ProtectedRoute><ReviewMode /></ProtectedRoute>} />
            <Route path="/dpp" element={<ProtectedRoute><DPP /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            <Route path="/newspaper" element={<ProtectedRoute><NewspaperPage /></ProtectedRoute>} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/:id" element={<CommunityQuestion />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
