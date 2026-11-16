import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AyahBlock } from "./AyahBlock";
import { Card } from "./Card";
import { Chip } from "./Chip";
import { ListRow } from "./ListRow";
import { SectionHeader } from "./SectionHeader";
import { Stepper } from "./Stepper";
import { Text } from "./Text";
import { nativeFamily, NATIVE_FONT } from "./native-fonts";

const styleOf = (el: Element) => el.getAttribute("style") ?? "";

describe("Text", () => {
  it("uses the shared type ramp and the requested element", () => {
    render(
      <Text as="h2" role="heading">
        Language
      </Text>,
    );
    const h = screen.getByRole("heading", { level: 2, name: "Language" });
    expect(styleOf(h)).toContain("var(--noor-text-heading)");
    expect(styleOf(h)).toContain("var(--noor-leading-heading)");
  });

  it("gives Arabic-script text taller lines and no capitals or tracking", () => {
    render(
      <Text role="overline" script="nastaliq" lang="ur">
        زبان
      </Text>,
    );
    const s = styleOf(screen.getByText("زبان"));
    expect(s).toContain("line-height: 2.1");
    expect(s).not.toContain("uppercase");
    expect(s).not.toContain("letter-spacing");
  });
});

describe("Card", () => {
  it("is a plain group by default and a button when pressable", async () => {
    const onPress = vi.fn();
    const { rerender } = render(<Card>Inside</Card>);
    expect(screen.queryByRole("button")).toBeNull();
    expect(styleOf(screen.getByText("Inside"))).toContain("var(--noor-radius-lg)");
    rerender(
      <Card onPress={onPress} label="Continue reading">
        Inside
      </Card>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Continue reading" }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("renders a link when given href", () => {
    render(<Card href="/quran">Quran</Card>);
    expect(screen.getByRole("link", { name: "Quran" }).getAttribute("href")).toBe("/quran");
  });
});

describe("SectionHeader", () => {
  it("renders a heading with its purpose line and an id for aria-labelledby", () => {
    render(
      <SectionHeader id="lang-title" icon="globe" title="Language" note="Choose a language" />,
    );
    const h = screen.getByRole("heading", { name: "Language" });
    expect(h.id).toBe("lang-title");
    expect(screen.getByText("Choose a language")).toBeTruthy();
  });
});

describe("ListRow", () => {
  it("has a 48px target and reports presses", async () => {
    const onPress = vi.fn();
    render(<ListRow title="Al-Fātiḥah" subtitle="7 āyāt" onPress={onPress} chevron />);
    const row = screen.getByRole("button", { name: /Al-Fātiḥah/ });
    expect(styleOf(row)).toContain("min-height: 48px");
    expect(row.querySelector(".noor-mirror-rtl")).not.toBeNull();
    await userEvent.click(row);
    expect(onPress).toHaveBeenCalledOnce();
  });
});

describe("Chip", () => {
  it("announces its selected state and stays tappable", () => {
    render(
      <Chip selected lang="ar">
        العربية
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "العربية" });
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(chip.getAttribute("lang")).toBe("ar");
    expect(styleOf(chip)).toContain("min-height: 44px");
  });
});

describe("Stepper", () => {
  it("labels both buttons and disables the end of the range", async () => {
    const onIncrease = vi.fn();
    render(
      <Stepper
        label="Arabic size"
        value="100%"
        onDecrease={() => {}}
        onIncrease={onIncrease}
        canDecrease={false}
        decreaseLabel="Smaller Arabic text"
        increaseLabel="Bigger Arabic text"
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Smaller Arabic text" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Bigger Arabic text" }));
    expect(onIncrease).toHaveBeenCalledOnce();
    expect(screen.getByText("100%").getAttribute("aria-live")).toBe("polite");
  });
});

describe("AyahBlock", () => {
  // Al-Fātiḥah 1:2 as stored (shadda before fatḥa — never NFC-normalized).
  const AYAH = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ";

  it("passes the Quranic text through exactly, in a right-to-left Arabic box", () => {
    render(
      <AyahBlock
        label="Al-Fātiḥah, āyah 2"
        arabic={<span data-testid="ar">{AYAH}</span>}
        actions={<button type="button">Play</button>}
        translations={[
          { key: "en", label: "Mustafa Khattab", text: "All praise is for Allah", lang: "en" },
          { key: "ur", text: "سب تعریفیں اللہ کے لیے ہیں", lang: "ur", dir: "rtl" },
        ]}
      />,
    );
    const ar = screen.getByTestId("ar");
    expect(ar.textContent).toBe(AYAH);
    expect(ar.parentElement?.getAttribute("dir")).toBe("rtl");
    expect(ar.parentElement?.getAttribute("lang")).toBe("ar");
    expect(screen.getByRole("article", { name: "Al-Fātiḥah, āyah 2" })).toBeTruthy();
    const ur = screen.getByText("سب تعریفیں اللہ کے لیے ہیں");
    expect(ur.getAttribute("dir")).toBe("rtl");
    expect(ur.getAttribute("lang")).toBe("ur");
    // Web reader order: Arabic, translations, then the action row.
    const order = [
      screen.getByTestId("ar"),
      screen.getByText(/All praise is for Allah/),
      screen.getByRole("button", { name: "Play" }),
    ];
    for (let i = 1; i < order.length; i++) {
      expect(
        order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    // Two translations: each names its translator.
    expect(screen.getByText("Mustafa Khattab")).toBeTruthy();
  });

  it("scales translations with the reader's translation size", () => {
    render(
      <AyahBlock
        arabic={null}
        translationScale={1.2}
        translations={[{ key: "en", text: "Indeed" }]}
      />,
    );
    // 1.125rem × 1.2 (jsdom simplifies the calc).
    expect(styleOf(screen.getByText("Indeed"))).toContain("1.35rem");
  });
});

describe("native font families", () => {
  it("pick the Noor face for weight and script", () => {
    expect(nativeFamily(400)).toBe(NATIVE_FONT.regular);
    expect(nativeFamily(800)).toBe(NATIVE_FONT.extrabold);
    expect(nativeFamily(800, "arabic")).toBe(NATIVE_FONT.arBold);
    expect(nativeFamily(500, "nastaliq")).toBe(NATIVE_FONT.urMedium);
    expect(nativeFamily(700, "nastaliq")).toBe(NATIVE_FONT.urBold);
  });
});
