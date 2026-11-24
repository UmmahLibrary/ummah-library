import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const removeSurah = vi.fn().mockResolvedValue(undefined);
const savedSurahs = vi
  .fn()
  .mockResolvedValue([{ reciterId: "alafasy", surah: 112, ayahCount: 4, bytes: 216000 }]);
vi.mock("../lib/audio-store", () => ({ webAudioStore: { savedSurahs, removeSurah } }));

const { DownloadsManager } = await import("./DownloadsManager");

afterEach(() => {
  vi.restoreAllMocks();
  removeSurah.mockClear();
});

describe("DownloadsManager", () => {
  it("asks before deleting a download, and keeps it on Cancel", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <DownloadsManager surahNames={{ 112: "Al-Ikhlaas" }} reciterNames={{ alafasy: "Alafasy" }} />,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Delete Al-Ikhlaas download" }),
    );
    expect(confirm).toHaveBeenCalledWith("Remove Al-Ikhlaas from this device?");
    expect(removeSurah).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole("button", { name: "Delete Al-Ikhlaas download" }));
    await waitFor(() => expect(removeSurah).toHaveBeenCalledWith("alafasy", 112));
  });
});
