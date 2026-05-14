import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Layout } from "./layout";

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ["/dashboard", vi.fn()],
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    isProMode: true,
    toggleProMode: vi.fn(),
    notifications: [],
    markNotificationRead: vi.fn(),
  }),
}));

describe("Layout nav", () => {
  it("labels /profile as 個人", () => {
    const { container } = render(<Layout><div>child</div></Layout>);
    const a = container.querySelector('a[href="/profile"]');
    expect(a).toBeInTheDocument();
    expect(a?.textContent).toContain("個人");
  });

  it("has aria-label for notification bell trigger", () => {
    const { getAllByLabelText } = render(<Layout><div>child</div></Layout>);
    expect(getAllByLabelText("通知").length).toBeGreaterThan(0);
  });
});
