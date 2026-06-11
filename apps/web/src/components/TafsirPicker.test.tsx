import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readTafsir } from "../lib/tafsir";
import { TafsirPicker } from "./TafsirPicker";

const tafsirs = [
  { id: "en-jalalayn", name: "Jalālayn" },
  { id: "en-ibn-kathir", name: "Ibn Kathīr" },
];

describe("TafsirPicker", () => {
  it("renders nothing when there's only one tafsir to choose", () => {
    const { container } = render(<TafsirPicker tafsirs={[tafsirs[0]!]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("persists the chosen tafsir edition", async () => {
    render(<TafsirPicker tafsirs={tafsirs} />);

    const select = screen.getByLabelText("Tafsir edition") as HTMLSelectElement;
    await userEvent.selectOptions(select, "en-ibn-kathir");

    expect(select.value).toBe("en-ibn-kathir");
    expect(readTafsir("")).toBe("en-ibn-kathir");
  });
});
