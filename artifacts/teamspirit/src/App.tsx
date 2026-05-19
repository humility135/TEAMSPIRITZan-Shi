import React from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppProvider } from "@/lib/store";
import { I18nProvider } from "@/lib/i18n";
import { Layout } from "@/components/layout";
import { ErrorBoundary } from "@/components/error-boundary";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import TeamDetail from "@/pages/team-detail";
import TeamChat from "@/pages/team-chat";
import EventDetail from "@/pages/event-detail";
import Pricing from "@/pages/pricing";
import Profile from "@/pages/profile";
import Notifications from "@/pages/notifications";
import Discover from "@/pages/discover";
import Teams from "@/pages/teams";
import TeamHostEvent from "@/pages/team-host-event";
import Events from "@/pages/events";
import PublicMatchDetail from "@/pages/public-match-detail";
import HostMatch from "@/pages/host-match";
import ManageMatch from "@/pages/manage-match";
import Terms from "@/pages/terms";
import Login from "@/pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function AppRoutes() {
  const [loc] = useLocation();
  if (loc === '/login') {
    return <Login />;
  }
  if (loc === '/') {
    return <Home />;
  }
  if (loc === '/pricing') {
    return <Pricing />;
  }
  return (
    <AppProvider>
      <Layout>
        <ErrorBoundary>
          <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/discover" component={Discover} />
          <Route path="/discover/host" component={HostMatch} />
          <Route path="/discover/:matchId" component={PublicMatchDetail} />
          <Route path="/manage-match/:matchId" component={ManageMatch} />
          <Route path="/teams" component={Teams} />
          <Route path="/teams/:teamId/host" component={TeamHostEvent} />
          <Route path="/teams/:teamId/chat" component={TeamChat} />
          <Route path="/teams/:teamId" component={TeamDetail} />
          <Route path="/events" component={Events} />
          <Route path="/events/:eventId" component={EventDetail} />
          <Route path="/profile" component={Profile} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/terms" component={Terms} />
          <Route component={NotFound} />
        </Switch>
        </ErrorBoundary>
      </Layout>
    </AppProvider>
  );
}

function App() {
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Use an environment variable or fallback for development
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <I18nProvider>
              <AppRoutes />
            </I18nProvider>
          </WouterRouter>
          <Toaster theme="dark" richColors closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
