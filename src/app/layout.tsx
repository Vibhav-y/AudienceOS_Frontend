import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "AudienceOS",
  description: "AI-native CRM — describe a goal, launch a campaign.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={serif.variable} suppressHydrationWarning>
      <head>
        {/* set the sidebar state before paint so the compact rail doesn't flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.sidebar=localStorage.getItem('sidebar-collapsed')==='1'?'compact':'expanded'}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
