import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Discover from "./discover";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ["/discover", vi.fn()],
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    currentUser: { id: "u1" },
    publicMatches: [
      {
        id: "pm1",
        status: "open",
        venueId: null,
        venueAddress: "Somewhere",
        datetime: "2026-05-10T10:00:00.000Z",
        endDatetime: "2026-05-10T11:00:00.000Z",
        hostId: "u1",
        attendees: [],
        maxPlayers: 10,
        fee: 50,
        surface: "hard",
        skillLevel: 3,
        isVerified: false,
      },
    ],
    users: [{ id: "u1", name: "Host", avatarUrl: "" }],
    venues: [],
    hostProfiles: [{ userId: "u1", hostedCount: 0, punctualityRate: 100, averageRating: 5, reviews: [] }],
  }),
}));

describe("Discover page", () => {
  it("has a direct navigation link to match detail", () => {
    const { container } = render(<Discover />);
    expect(container.querySelector('a[href="/discover/pm1"]')).toBeInTheDocument();
  });
});

