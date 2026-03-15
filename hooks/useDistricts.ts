import { useEffect, useState } from "react";
import type { GeoJsonObject } from "geojson";
import { DISTRICT_FILES } from "@/constants/districts";

type District = { data: GeoJsonObject; name: string };

export function useDistricts() {
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    Promise.all(
      DISTRICT_FILES.map(async ({ path, name }) => {
        const res = await fetch(path);
        const data = (await res.json()) as GeoJsonObject;
        return { data, name };
      }),
    ).then(setDistricts);
  }, []);

  return districts;
}

