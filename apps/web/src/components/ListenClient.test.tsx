import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListenClient } from "./ListenClient";

afterEach(() => window.history.replaceState(null, "", "/"));

const surah = {
  number: 114,
  name: "الناس",
  transliteration: "An-Naas",
  englishName: "Mankind",
  ayahCount: 3,
};
const ayahs = [
  { aya: 1, text: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ" },
  { aya: 2, text: "مَلِكِ ٱلنَّاسِ" },
  { aya: 3, text: "إِلَٰهِ ٱلنَّاسِ" },
];

describe("ListenClient — Previous / Next", () => {
  // No reciters = the recitation can't play (as when offline or a stream fails).
  it("moves the shown āyah even when the recitation can't play", async () => {
    render(<ListenClient surah={surah} ayahs={ayahs} reciters={[]} prev={null} next={null} />);
    const next = screen.getByRole("button", { name: /Next/ });
    const prev = screen.getByRole("button", { name: /Previous/ });
    expect(prev).toBeDisabled();

    await userEvent.click(next);
    expect(await screen.findByText("Āyah 2")).toBeInTheDocument();
    expect(window.location.hash).toBe("#2");

    await userEvent.click(next);
    expect(await screen.findByText("Āyah 3")).toBeInTheDocument();
    expect(next).toBeDisabled();

    await userEvent.click(prev);
    expect(await screen.findByText("Āyah 2")).toBeInTheDocument();
  });
});
