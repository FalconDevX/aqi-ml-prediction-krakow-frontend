import type { Metadata } from "next";
import "./globals.css";
  
export const metadata: Metadata = {
  title: "AQI Map",
  description: "AQI Map",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-screen w-full">
      <body
        className="antialiased min-h-screen w-full bg-zinc-950"
      >
        {children}
      </body>
    </html>
  );
}
