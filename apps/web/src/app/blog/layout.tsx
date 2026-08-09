import type { ReactNode } from "react";
import { Source_Serif_4 } from "next/font/google";
import { BlogFooter } from "../../components/blog/BlogFooter";
import { BlogHeader } from "../../components/blog/BlogHeader";
import "./blog.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={sourceSerif.variable}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <BlogHeader />
      <div style={{ flex: 1 }}>{children}</div>
      <BlogFooter />
    </div>
  );
}
