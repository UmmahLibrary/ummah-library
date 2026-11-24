import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CodeBlock, tokenizeCode } from "./CodeBlock";

describe("tokenizeCode", () => {
  it("splits keywords, strings and comments from plain text", () => {
    const tokens = tokenizeCode('const x = "hi"; // note');
    expect(tokens.map((t) => t.kind)).toEqual(["kw", "plain", "str", "plain", "com"]);
  });
});

describe("CodeBlock", () => {
  it("shows the language and copies the code to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeBlock lang="ts" code="const x = 1;" />);
    expect(screen.getByText("ts")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Copy"));
    expect(writeText).toHaveBeenCalledWith("const x = 1;");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Code copied");
  });

  it("lets a keyboard reach a code block that scrolls sideways", () => {
    render(<CodeBlock lang="ts" code="const x = 1;" />);
    const pre = screen.getByLabelText("ts example");
    expect(pre.tagName).toBe("PRE");
    expect(pre).toHaveAttribute("tabindex", "0");
  });
});
