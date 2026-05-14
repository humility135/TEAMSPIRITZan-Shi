import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./dashboard";

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

describe("Dashboard page", () => {
  it("shows only teams that current user belongs to", () => {
    const { queryByText } = render(<Dashboard />);
    expect(queryByText("Team 1")).toBeInTheDocument();
    expect(queryByText("Team 2")).not.toBeInTheDocument();
  });
});

