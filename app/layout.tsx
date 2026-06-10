import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";
  
export const metadata: Metadata = {
  title: "AirCast",
  description: "AirCast — mapa jakości powietrza",
  icons: {
    icon: [{ url: "/AirCast.png", type: "image/png" }],
    apple: "/AirCast.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full overflow-hidden">
      <body
        className="flex h-full w-full flex-col overflow-hidden bg-zinc-950 antialiased"
      >
        <Header />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
