"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false
});

export default function Home() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="w-[70%] h-[70%]">
        <Map />
      </div>
    </div>
  );  
}
