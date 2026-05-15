import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Profile from "./profile";
import { I18nProvider } from "@/lib/i18n";

let mockIsProMode = true;

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ["/profile", vi.fn()],
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/store", () => ({
  getTeamStats: () => ({ goals: 0, assists: 0, yellow: 0, red: 0, matches: 0, attendance: 0 }),
  getAggregatedStats: () => ({ goals: 0, assists: 0, yellow: 0, red: 0, matches: 0, attendance: 0 }),
  useAppStore: () => ({
    currentUser: {
      id: "u1",
      name: "User",
      avatarUrl: "",
      subscription: "pro",
      seasonStatsByTeam: {},
    },
    teams: [{ id: "t1", name: "T1", memberIds: ["u1"], accentColor: "#fff" }],
    isProMode: mockIsProMode,
    hostProfiles: [],
    publicMatches: [],
    venues: [],
    updateCurrentUser: vi.fn(),
    cancelPublicMatch: vi.fn(),
    finishPublicMatch: vi.fn(),
  }),
}));

describe("Profile accessibility", () => {
  it("has aria-label for icon-only edit buttons", () => {
    mockIsProMode = true;
    const { getAllByLabelText } = render(
      <I18nProvider>
        <Profile />
      </I18nProvider>,
    );
    expect(getAllByLabelText("編輯個人資料").length).toBeGreaterThan(0);
  });

  it("shows radar chart even in free mode", () => {
    mockIsProMode = false;
    const { getAllByText, getAllByTestId } = render(
      <I18nProvider>
        <Profile />
      </I18nProvider>,
    );
    expect(getAllByText("球員能力雷達").length).toBeGreaterThan(0);
    expect(getAllByTestId("player-radar-chart").length).toBeGreaterThan(0);
  });
});

