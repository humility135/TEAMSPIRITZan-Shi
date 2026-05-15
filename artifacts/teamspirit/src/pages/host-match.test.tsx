import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import HostMatch from "./host-match";
import { I18nProvider } from "@/lib/i18n";

const setLocation = vi.fn();
const createPublicMatch = vi.fn();

vi.mock("wouter", () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useLocation: () => ["/discover/host", setLocation],
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/venue-selector", () => ({
  VenueSelector: () => <div data-testid="venue-selector" />,
}));

vi.mock("@/lib/store", () => ({
  useAppStore: () => ({
    venues: [],
    createPublicMatch,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("HostMatch", () => {
  it("submits and redirects on success", async () => {
    createPublicMatch.mockResolvedValueOnce({ id: "pm1" });
    const user = userEvent.setup();
    const { container } = render(
      <I18nProvider>
        <HostMatch />
      </I18nProvider>,
    );

    await user.type(container.querySelector('input[name="venueName"]')!, "Test Venue");
    await user.type(container.querySelector('input[name="venueCourt"]')!, "1號場");
    await user.type(container.querySelector('input[name="date"]')!, "2099-05-10");
    await user.click(screen.getByTestId("host-startTime-hour"));
    await user.click(await screen.findByRole("option", { name: "10" }));
    await user.click(screen.getByTestId("host-startTime-minute"));
    await user.click(await screen.findByRole("option", { name: "00" }));
    await user.click(screen.getByTestId("host-endTime-hour"));
    await user.click(await screen.findByRole("option", { name: "11" }));
    await user.click(screen.getByTestId("host-endTime-minute"));
    await user.click(await screen.findByRole("option", { name: "00" }));
    await user.click(container.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(createPublicMatch).toHaveBeenCalled();
    });

    expect(createPublicMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        venueAddress: "Test Venue 1號場",
        datetime: "2099-05-10T02:00:00.000Z",
        endDatetime: "2099-05-10T03:00:00.000Z",
        fee: 0,
      }),
    );
    expect(setLocation).toHaveBeenCalledWith("/discover");
  });

  it("shows error and stays on page when API fails", async () => {
    createPublicMatch.mockRejectedValueOnce(new Error("Create failed"));
    const user = userEvent.setup();
    const { container } = render(
      <I18nProvider>
        <HostMatch />
      </I18nProvider>,
    );

    await user.type(container.querySelector('input[name="venueName"]')!, "Test Venue");
    await user.type(container.querySelector('input[name="venueCourt"]')!, "1號場");
    await user.type(container.querySelector('input[name="date"]')!, "2099-05-10");
    await user.click(screen.getByTestId("host-startTime-hour"));
    await user.click(await screen.findByRole("option", { name: "10" }));
    await user.click(screen.getByTestId("host-startTime-minute"));
    await user.click(await screen.findByRole("option", { name: "00" }));
    await user.click(screen.getByTestId("host-endTime-hour"));
    await user.click(await screen.findByRole("option", { name: "11" }));
    await user.click(screen.getByTestId("host-endTime-minute"));
    await user.click(await screen.findByRole("option", { name: "00" }));
    await user.click(container.querySelector('button[type="submit"]')!);

    const { toast } = await import("sonner");
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(setLocation).not.toHaveBeenCalled();
  });
});
