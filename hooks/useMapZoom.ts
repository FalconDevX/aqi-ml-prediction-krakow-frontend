import { useState } from "react";
import { useMapEvents } from "react-leaflet";

export function useMapZoom(initial = 11) {
  const [zoom, setZoom] = useState(initial);

  useMapEvents({
    zoomend: (e) => setZoom(e.target.getZoom()),
  });

  return zoom;
}

