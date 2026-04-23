import React from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppProvider } from "@/lib/store";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import TeamDetail from "@/pages/team-detail";
import EventDetail from "@/pages/event-detail";
import Pricing from "@/pages/pricing";
import Profile from "@/pages/profile";
import Discover from "@/pages/discover";
import Teams from "@/pages/teams";
import Events from "@/pages/events";
import PublicMatchDetail from "@/pages/public-match-detail";
import HostMatch from "@/pages/host-match";
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
  return (
    <AppProvider>
      <Layout>
        <Switch>
          {[
            <Route key="dashboard" path="/dashboard" component={Dashboard} />,
            <Route key="discover" path="/discover" component={Discover} />,
            <Route key="host" path="/discover/host" component={HostMatch} />,
            <Route key="public-match" path="/discover/:matchId" component={PublicMatchDetail} />,
            <Route key="teams" path="/teams" component={Teams} />,
            <Route key="team-detail" path="/teams/:teamId" component={TeamDetail} />,
            <Route key="events" path="/events" component={Events} />,
            <Route key="event-detail" path="/events/:eventId" component={EventDetail} />,
            <Route key="pricing" path="/pricing" component={Pricing} />,
            <Route key="profile" path="/profile" component={Profile} />,
            <Route key="terms" path="/terms" component={Terms} />,
            <Route key="not-found" component={NotFound} />
          ]}
        </Switch>
      </Layout>
    </AppProvider>
  );
}

function App() {
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
