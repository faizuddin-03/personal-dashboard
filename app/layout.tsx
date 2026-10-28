import type { Metadata } from "next";
import { Geist, Geist_Mono, DotGothic16, Jersey_10 } from "next/font/google";
import "./globals.css";
// Medieval style sheets (Settings > Appearance > Style), all scoped to [data-style="medieval"].
import "./styles/medieval/base.css";
import "./styles/medieval/shell.css";
import "./styles/medieval/home.css";
import "./styles/medieval/calendar.css";
import "./styles/medieval/workspace.css";
import "./styles/medieval/notes.css";
import "./styles/medieval/jira.css";
import "./styles/medieval/eauto-runners.css";
import "./styles/medieval/eauto-tools.css";
import "./styles/medieval/ambient.css";
import AppShell from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Medieval style pixel fonts (used only under [data-style="medieval"], app/styles/medieval/).
// DotGothic16 replaced Pixelify Sans and Silkscreen (Faizuddin, 2026-10-27: "the numbers, Z, C,
// is hard to distinguish"); it is also used for labels via --font-pixel-label in ambient.css.
const pixelBody = DotGothic16({ variable: "--font-pixel-body", subsets: ["latin"], weight: "400" });
const jersey = Jersey_10({ variable: "--font-pixel-title", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Udin's Board",
  description: "Personal QA productivity dashboard with Jira integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pixelBody.variable} ${jersey.variable} h-full antialiased`}
    >
      <body className="h-full bg-slate-950 text-slate-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
