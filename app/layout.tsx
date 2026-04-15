import type { Metadata } from "next";
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
    <html lang="en" className="min-h-screen w-full">
      <body
        className="antialiased min-h-screen w-full bg-zinc-950"
      >
        {children}
      </body>
    </html>
  );
}
