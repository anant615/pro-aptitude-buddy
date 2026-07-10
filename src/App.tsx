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
import StudyPlanner from "@/pages/StudyPlanner";
import Dashboard from "@/pages/Dashboard";

import About from "@/pages/About";
import ReviewMode from "@/pages/ReviewMode";
import DPP from "@/pages/DPP";
import Resources from "@/pages/Resources";
import NewspaperPage from "@/pages/Newspaper";
import AISolver from "@/pages/AISolver";
import WarRoom from "@/pages/WarRoom";
import Mentor from "@/pages/Mentor";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Community from "@/pages/Community";
import CommunityQuestion from "@/pages/CommunityQuestion";
import Leaderboard from "@/pages/Leaderboard";
import AdminDashboard from "@/pages/AdminDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeedbackButton from "@/components/FeedbackButton";
import MentorshipHook from "@/components/MentorshipHook";
import PageTracker from "@/components/PageTracker";
import ErrorBoundary from "@/components/ErrorBoundary";

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
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/lrdi-sets" element={<LRDISets />} />
            <Route path="/pyqs" element={<PYQs />} />
            <Route path="/mocks" element={<MockTests />} />
            <Route path="/study-planner" element={<StudyPlanner />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/review" element={<ProtectedRoute><ReviewMode /></ProtectedRoute>} />
            <Route path="/dpp" element={<DPP />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/newspaper" element={<NewspaperPage />} />
            <Route path="/ai-solver" element={<AISolver />} />
            <Route path="/war-room" element={<WarRoom />} />
            <Route path="/mentor" element={<Mentor />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/:id" element={<CommunityQuestion />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
