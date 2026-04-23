import React from 'react';
import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/discover" component={Discover} />
        <Route path="/discover/host" component={HostMatch} />
        <Route path="/discover/:matchId" component={PublicMatchDetail} />
        <Route path="/teams" component={Teams} />
        <Route path="/teams/:teamId" component={TeamDetail} />
        <Route path="/events" component={Events} />
        <Route path="/events/:eventId" component={EventDetail} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AppProvider>
  );
}

export default App;
