import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

describe("shared dialog", () => {
  it("announces its title and description and returns focus after dismissal", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open check</Button>
        </DialogTrigger>
        <DialogContent title="Check connection" description="A private test.">
          <Button>Run check</Button>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open check" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Check connection");
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "A private test.",
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
