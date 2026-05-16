import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./dashboard";
import { I18nProvider } from "@/lib/i18n";
import { api } from "@/lib/api";
import { getUserLocation } from "@/lib/geo";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

vi.mock("@/components/onboarding-tour", () => ({
  OnboardingTour: () => null,
}));

vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

vi.mock("@/lib/geo", () => ({
  getUserLocation: vi.fn(),
  getDistance: vi.fn(() => 0),
}));

vi.mock("@/lib/store", () => ({
  getAggregatedStats: () => ({ goals: 0, assists: 0, yellow: 0, red: 0, matches: 0, attendance: 0 }),
  useAppStore: () => ({
    currentUser: { id: "u1", name: "U1" },
    teams: [
      { id: "t1", name: "Team 1", logoUrl: "", memberIds: ["u1"] },
      { id: "t2", name: "Team 2", logoUrl: "", memberIds: ["u2"] },
    ],
    events: [],
    venues: [],
    publicMatches: [],
    deletePublicMatch: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("Dashboard page", () => {
  it("shows only teams that current user belongs to and renders nearby weather", async () => {
    vi.mocked(getUserLocation).mockResolvedValue({
      coords: { latitude: 22.3, longitude: 114.1 },
    } as any);

    vi.mocked(api).mockResolvedValue({
      fetchedAt: new Date().toISOString(),
      lang: "tc",
      location: { lat: 22.3, lng: 114.1 },
      temperature: { station: "香港天文台", value: 28, unit: "C", recordTime: new Date().toISOString() },
      humidity: { value: 70, unit: "percent", recordTime: new Date().toISOString() },
      rainfall: { district: "油尖旺", max: 5, unit: "mm", startTime: "", endTime: "" },
      warnings: [{ code: "TC8NE", name: "T8" }],
    } as any);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { queryByText } = render(
      <QueryClientProvider client={qc}>
        <I18nProvider>
          <Dashboard />
        </I18nProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Team 1")).toBeInTheDocument();
    expect(queryByText("Team 2")).not.toBeInTheDocument();

    expect(await screen.findByText("28°C")).toBeInTheDocument();
    expect(await screen.findByText("70%")).toBeInTheDocument();
    expect(await screen.findByText("5mm")).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "T8" })).toBeInTheDocument();
  });

  it("renders weather even without location by falling back to HKO", async () => {
    vi.mocked(getUserLocation).mockRejectedValue(new Error("denied"));
    vi.mocked(api).mockResolvedValue({
      fetchedAt: new Date().toISOString(),
      lang: "tc",
      location: { lat: 22.3020278, lng: 114.1743333 },
      temperature: { station: "香港天文台", value: 28, unit: "C", recordTime: new Date().toISOString() },
      humidity: { value: 70, unit: "percent", recordTime: new Date().toISOString() },
      rainfall: { district: "油尖旺", max: 5, unit: "mm", startTime: "", endTime: "" },
      warnings: [],
    } as any);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={qc}>
        <I18nProvider>
          <Dashboard />
        </I18nProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("28°C")).toBeInTheDocument();
    expect(await screen.findByText("天文台附近")).toBeInTheDocument();
    expect(screen.queryByText("油尖旺")).not.toBeInTheDocument();
  });

  it("allows retrying location to load nearby weather", async () => {
    vi.mocked(getUserLocation).mockRejectedValue(new Error("denied"));
    vi.mocked(api).mockResolvedValue({
      fetchedAt: new Date().toISOString(),
      lang: "tc",
      location: { lat: 22.3020278, lng: 114.1743333 },
      temperature: { station: "香港天文台", value: 28, unit: "C", recordTime: new Date().toISOString() },
      humidity: { value: 70, unit: "percent", recordTime: new Date().toISOString() },
      rainfall: { district: "油尖旺", max: 5, unit: "mm", startTime: "", endTime: "" },
      warnings: [],
    } as any);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={qc}>
        <I18nProvider>
          <Dashboard />
        </I18nProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(getUserLocation).toHaveBeenCalled();
    });
    expect(await screen.findByText("未開定位：顯示香港天文台附近天氣。")).toBeInTheDocument();

    expect(await screen.findByTestId("weather-metrics-grid")).toHaveClass("grid-cols-4");

    const user = userEvent.setup();
    const before = vi.mocked(getUserLocation).mock.calls.length;
    const beforeApiCalls = vi.mocked(api).mock.calls.length;
    const refreshBtn = await screen.findByRole("button", { name: "允許定位" });
    expect(refreshBtn).not.toHaveTextContent("允許定位");
    await user.click(refreshBtn);
    await waitFor(() => {
      expect(vi.mocked(getUserLocation).mock.calls.length).toBeGreaterThan(before);
    });
    await waitFor(() => {
      expect(vi.mocked(api).mock.calls.length).toBeGreaterThan(beforeApiCalls);
    });
  });
});

