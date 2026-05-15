import React from "react";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TeamHostEvent from "./team-host-event";
import { I18nProvider } from "@/lib/i18n";

const setLocation = vi.fn();
const createEvent = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/teams/t1/host", setLocation],
  useRoute: () => [true, { teamId: "t1" }],
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/venue-selector", () => ({
  VenueSelector: ({ venues, onSelect }: any) => (
    <button type="button" data-testid="venue-selector" onClick={() => onSelect(venues[0])}>
      select
    </button>
  ),
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    teams: [{ id: "t1", name: "Team 1" }],
    venues: [
      {
        id: "v1",
        name: "九龍仔公園",
        district: "九龍城區",
        address: "Some address",
        surface: "硬地",
      },
    ],
    createEvent,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TeamHostEvent", () => {
  it("submits private venue name + court", async () => {
    createEvent.mockResolvedValueOnce({ id: "e1" });
    const user = userEvent.setup();
    const { container } = render(
      <I18nProvider>
        <TeamHostEvent />
      </I18nProvider>,
    );

    await user.type(container.querySelector('input[name="title"]')!, "Event");
    await user.type(container.querySelector('input[name="venueName"]')!, "Private Venue");
    await user.type(container.querySelector('input[name="venueCourt"]')!, "A場");
    await user.type(container.querySelector('input[name="date"]')!, "2099-05-10");
    await user.type(container.querySelector('input[name="startTime"]')!, "10:00");
    await user.type(container.querySelector('input[name="endTime"]')!, "11:00");
    await user.click(container.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(createEvent).toHaveBeenCalled();
    });

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "t1",
        venueId: undefined,
        venueAddress: "Private Venue A場",
      }),
    );
  });

  it("stores only court when LCSD venue is selected", async () => {
    createEvent.mockResolvedValueOnce({ id: "e1" });
    const user = userEvent.setup();
    const { container } = render(
      <I18nProvider>
        <TeamHostEvent />
      </I18nProvider>,
    );

    await user.type(container.querySelector('input[name="title"]')!, "Event");
    await user.click(container.querySelector('[data-testid="venue-selector"]')!);
    await user.type(container.querySelector('input[name="venueCourt"]')!, "1號場");
    await user.type(container.querySelector('input[name="date"]')!, "2099-05-10");
    await user.type(container.querySelector('input[name="startTime"]')!, "10:00");
    await user.type(container.querySelector('input[name="endTime"]')!, "11:00");
    await user.click(container.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(createEvent).toHaveBeenCalled();
    });

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "t1",
        venueId: "v1",
        venueAddress: "1號場",
      }),
    );
  });
});

