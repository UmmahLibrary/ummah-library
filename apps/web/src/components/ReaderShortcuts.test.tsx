import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { ReaderShortcuts } from "./ReaderShortcuts";

afterEach(() => {
  document.body.innerHTML = "";
});

function setup() {
  const play = document.createElement("button");
  play.className = "audio-play";
  const onPlay = vi.fn();
  play.addEventListener("click", onPlay);
  const save = document.createElement("button");
  save.textContent = "Save";
  document.body.append(play, save);
  render(<ReaderShortcuts storageKey="test" />);
  return { onPlay, save };
}

describe("ReaderShortcuts — Space", () => {
  it("plays/pauses when nothing interactive has focus", () => {
    const { onPlay } = setup();
    fireEvent.keyDown(document.body, { key: " " });
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("leaves Space to a focused button (it must press that button)", () => {
    const { onPlay, save } = setup();
    save.focus();
    const ev = fireEvent.keyDown(save, { key: " " });
    expect(onPlay).not.toHaveBeenCalled();
    expect(ev).toBe(true); // not prevented, so the browser presses Save
  });
});
