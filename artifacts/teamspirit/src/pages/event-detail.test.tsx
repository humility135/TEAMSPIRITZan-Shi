import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EventDetail from "./event-detail";
import { I18nProvider } from "@/lib/i18n";

const setLocation = vi.fn();
const cancelEvent = vi.fn();

vi.mock("wouter", () => ({
  useRoute: () => [true, { eventId: "e1" }],
  useLocation: () => ["/events/e1", setLocation],
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    status: number;
    body: any;
    constructor(status: number, body: any, message?: string) {
      super(message ?? `API ${status}`);
      this.status = status;
      this.body = body;
    }
  }
  return {
    ApiError,
    api: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    events: [
      {
        id: "e1",
        teamId: "t1",
        title: "Event 1",
        status: "scheduled",
        fee: 0,
        capacity: null,
        datetime: "2099-05-10T10:00:00.000Z",
        endDatetime: "2099-05-10T11:00:00.000Z",
        venueId: undefined,
        venueAddress: "Somewhere",
        venueAddressEn: "Somewhere",
        attendingIds: [],
        declinedIds: [],
        waitlistIds: [],
        slotOffers: [],
      },
    ],
    users: [],
    teams: [{ id: "t1", name: "Team 1" }],
    venues: [],
    currentUser: { id: "u1", name: "U1", role: { t1: "Owner" } },
    updateEventRSVP: vi.fn(),
    updateMatchStats: vi.fn(),
    acceptEventSlot: vi.fn(),
    payEventSlot: vi.fn(),
    declineEventSlot: vi.fn(),
    cancelEvent,
    finishEvent: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cancelEvent.mockResolvedValueOnce({ ok: true });
});

afterEach(() => {
  cleanup();
});

describe("EventDetail cancel confirmation", () => {
  it("requires confirmation before cancelling team event", async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <I18nProvider>
          <EventDetail />
        </I18nProvider>
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    const cancelBtn = await screen.findByRole("button", { name: "取消比賽" });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(cancelEvent).not.toHaveBeenCalled();
    });

    expect(await screen.findByText(/確定要取消/)).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "確認取消" }));
    await waitFor(() => {
      expect(cancelEvent).toHaveBeenCalledWith("e1");
    });
  });
});
