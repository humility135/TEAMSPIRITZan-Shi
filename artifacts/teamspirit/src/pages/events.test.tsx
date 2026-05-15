import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Events from "./events";
import { I18nProvider } from "@/lib/i18n";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    currentUser: { id: "u1" },
    teams: [{ id: "t1", memberIds: ["u1"], name: "T1" }],
    events: [
      {
        id: "e1",
        teamId: "t1",
        title: "Event 1",
        datetime: "2099-05-10T10:00:00.000Z",
        endDatetime: "2099-05-10T11:00:00.000Z",
        venueAddress: "Somewhere",
        fee: 0,
        capacity: null,
        status: "scheduled",
        attendingIds: ["u1"],
        declinedIds: [],
        waitlistIds: [],
        slotOffers: [],
        playerStats: [],
      },
    ],
    publicMatches: [
      {
        id: "pm1",
        datetime: "2099-05-10T10:00:00.000Z",
        endDatetime: "2099-05-10T11:00:00.000Z",
        hostId: "u1",
        attendees: ["u1"],
        venueId: null,
        venueAddress: "Somewhere",
        fee: 50,
        status: "open",
        maxPlayers: 10,
      },
    ],
    venues: [],
  }),
}));

describe("Events page", () => {
  it("renders both team events and public matches inside /events", () => {
    const { container } = render(
      <I18nProvider>
        <Events />
      </I18nProvider>,
    );
    expect(container.querySelector('a[href="/events/e1"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/discover/pm1"]')).toBeInTheDocument();
  });
});

