import React from "react";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Notifications from "./notifications";
import { I18nProvider } from "@/lib/i18n";

const setLocation = vi.fn();
const markNotificationRead = vi.fn();

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ["/notifications", setLocation],
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    notifications: [
      {
        id: "n1",
        type: "system",
        message: "Hello",
        href: "/events/e1",
        createdAt: "2099-05-10T10:00:00.000Z",
        read: false,
      },
    ],
    markNotificationRead,
    clearNotifications: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  markNotificationRead.mockResolvedValue(undefined);
});

describe("Notifications page", () => {
  it("marks read then redirects when notification has href", async () => {
    const user = userEvent.setup();
    const { getByText } = render(
      <I18nProvider>
        <Notifications />
      </I18nProvider>,
    );

    await user.click(getByText("Hello"));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith("n1");
    });

    await waitFor(() => {
      expect(setLocation).toHaveBeenCalledWith("/events/e1");
    });

    expect(markNotificationRead.mock.invocationCallOrder[0]).toBeLessThan(setLocation.mock.invocationCallOrder[0]);
  });
});

