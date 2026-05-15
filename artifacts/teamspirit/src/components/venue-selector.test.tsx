import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VenueSelector } from "./venue-selector";
import { I18nProvider } from "@/lib/i18n";

describe("VenueSelector", () => {
  it("calls onClear when clear icon is clicked", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    const { getByLabelText } = render(
      <I18nProvider>
        <VenueSelector
          venues={[
            {
              id: "v1",
              name: "九龍仔公園",
              district: "九龍城區",
              address: "Some address",
              surface: "硬地",
            } as any,
          ]}
          selectedVenueId="v1"
          onSelect={() => {}}
          onClear={onClear}
        />
      </I18nProvider>,
    );

    await user.click(getByLabelText("清除已選球場"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

