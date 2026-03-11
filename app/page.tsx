"use client";

import dynamic from "next/dynamic";
import Header from "@/components/Header";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="h-screen w-full flex flex-col items-center">
      <Header />

      <div className="w-[70%] h-[70%] mt-10">
        <Map />
      </div>
    </div>
  );
}
