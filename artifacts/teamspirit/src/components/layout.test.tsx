import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Layout } from "./layout";
import { I18nProvider } from "@/lib/i18n";

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
    currentUser: {
      id: "u1",
      name: "Test User",
      avatarUrl: "",
      role: {},
      tokensBalance: 0,
      subscription: "free",
      seasonStatsByTeam: {},
    },
    teams: [],
    isProMode: true,
    toggleProMode: vi.fn(),
    notifications: [],
    markNotificationRead: vi.fn(),
  }),
}));

describe("Layout nav", () => {
  it("labels /profile as 個人", () => {
    const { container } = render(
      <I18nProvider>
        <Layout>
          <div>child</div>
        </Layout>
      </I18nProvider>,
    );
    const a = container.querySelector('a[href="/profile"]');
    expect(a).toBeInTheDocument();
    expect(a?.textContent).toContain("個人");
  });

  it("has aria-label for notification bell trigger", () => {
    const { getAllByLabelText } = render(
      <I18nProvider>
        <Layout>
          <div>child</div>
        </Layout>
      </I18nProvider>,
    );
    expect(getAllByLabelText("通知").length).toBeGreaterThan(0);
  });

  it("has aria-label for team chat trigger", () => {
    const { getAllByLabelText } = render(
      <I18nProvider>
        <Layout>
          <div>child</div>
        </Layout>
      </I18nProvider>,
    );
    expect(getAllByLabelText("聊天室").length).toBeGreaterThan(0);
  });
});
