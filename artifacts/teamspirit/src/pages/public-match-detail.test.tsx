import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PublicMatchDetail from "./public-match-detail";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ["/discover/pm1", vi.fn()],
  useRoute: () => [true, { matchId: "pm1" }],
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    publicMatches: [
      {
        id: "pm1",
        hostId: "u1",
        status: "open",
        datetime: "2026-05-10T10:00:00.000Z",
        endDatetime: "2026-05-10T11:00:00.000Z",
        venueId: null,
        venueAddress: "Somewhere",
        maxPlayers: 10,
        fee: 50,
        surface: "hard",
        skillLevel: 3,
        isVerified: false,
        attendees: [],
        waitlistIds: [],
        description: "",
        rules: "",
        refundPolicy: "flexible",
        slotOffers: [],
      },
    ],
    venues: [],
    users: [{ id: "u1", name: "Host", avatarUrl: "" }],
    hostProfiles: [{ userId: "u1", hostedCount: 0, punctualityRate: 100, averageRating: 5, reviews: [] }],
    matchComments: [],
    currentUser: { id: "u2", name: "Me", avatarUrl: "", role: {}, subscription: "free", tokensBalance: 0 },
    joinPublicMatch: vi.fn(),
    leavePublicMatch: vi.fn(),
    acceptMatchSlot: vi.fn(),
    payMatchSlot: vi.fn(),
    declineMatchSlot: vi.fn(),
    cancelPublicMatch: vi.fn(),
    addMatchComment: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  window.history.pushState({}, "", "/discover/pm1");
  if (!(navigator as any).clipboard) {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => undefined },
      configurable: true,
    });
  }
});

describe("PublicMatchDetail share", () => {
  it("uses Web Share API when available", async () => {
    (navigator as any).share = vi.fn().mockResolvedValue(undefined);
    const writeSpy = vi.spyOn((navigator as any).clipboard, "writeText").mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { getAllByRole } = render(<PublicMatchDetail />);
    await user.click(getAllByRole("button", { name: "分享" })[0]);
    expect((navigator as any).share).toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("falls back to clipboard copy when share is unavailable", async () => {
    delete (navigator as any).share;
    const writeSpy = vi.spyOn((navigator as any).clipboard, "writeText").mockResolvedValue(undefined);
    const user = userEvent.setup();
    const { getAllByRole } = render(<PublicMatchDetail />);
    await user.click(getAllByRole("button", { name: "分享" })[0]);
    expect(writeSpy).toHaveBeenCalledWith(window.location.href);
  });
});
