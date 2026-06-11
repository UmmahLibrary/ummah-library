import { pluginRegistry } from "@ummahlibrary/api";
import { NoorPageFrame } from "../../components/NoorPageFrame";
import { HadithBrowser } from "../../components/HadithBrowser";

export const metadata = { title: "Hadith" };

const COLLECTIONS = pluginRegistry.byKind("hadith").map((c) => ({ id: c.id, name: c.name }));

export default function HadithPage() {
  return (
    <NoorPageFrame
      title="Hadith Library"
      sub="The major collections of prophetic tradition"
      glyph="📖"
      back="/"
      maxW={900}
    >
      <HadithBrowser collections={COLLECTIONS} />
      <p
        style={{
          fontSize: 12,
          color: "#5C6273",
          textAlign: "center",
          marginTop: 32,
          fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
        }}
      >
        Source: fawazahmed0/hadith-api
      </p>
    </NoorPageFrame>
  );
}
