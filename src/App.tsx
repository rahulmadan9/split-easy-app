import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GroupsProvider } from "@/hooks/useGroups";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import JoinGroupLink from "./pages/JoinGroupLink";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GroupsProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Index />} />
          <Route path="/group/:id" element={<Index />} />
          <Route path="/group/:id/settings" element={<Index />} />
          <Route path="/profile" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/join/:inviteCode" element={<JoinGroupLink />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </GroupsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
