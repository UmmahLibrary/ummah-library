import { describe, expect, it } from "vitest";
import { focusTargetAfterRemoving } from "./focus";

describe("focusTargetAfterRemoving", () => {
  it("picks the next control after the removed item, else the one before", () => {
    document.body.innerHTML = `
      <button id="a">a</button>
      <article id="item"><button id="x">remove</button></article>
      <button id="b">b</button>`;
    expect(focusTargetAfterRemoving(document.getElementById("item"))?.id).toBe("b");
    document.getElementById("b")!.remove();
    expect(focusTargetAfterRemoving(document.getElementById("item"))?.id).toBe("a");
  });
});
