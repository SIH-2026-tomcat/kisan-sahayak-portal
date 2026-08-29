"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui";

type Centre = { id: string; name: string; address: string; latitude: string | null; longitude: string | null; contactPhone?: string | null };

/** Leaflet + OpenStreetMap. Always rendered alongside a text list (accessibility requirement). */
export function CentreMap({ centres }: { centres: Centre[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current || mapRef.current) return;

      const pts = centres
        .filter((c) => c.latitude && c.longitude)
        .map((c) => ({ c, lat: parseFloat(c.latitude!), lng: parseFloat(c.longitude!) }));
      const center = pts[0] ? [pts[0].lat, pts[0].lng] : [20.5, 86.4];

      const map = L.map(ref.current).setView(center as [number, number], 10);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      for (const p of pts) {
        L.marker([p.lat, p.lng]).addTo(map).bindPopup(`<b>${p.c.name}</b><br/>${p.c.address}`);
      }
      if (pts.length > 1) map.fitBounds(pts.map((p) => [p.lat, p.lng]) as any, { padding: [30, 30] });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [centres]);

  return (
    <div className="space-y-3">
      <div ref={ref} className="h-64 w-full rounded-lg border border-line" role="img" aria-label="Map of procurement centres" />
      <div className="space-y-2">
        {centres.map((c) => (
          <Card key={c.id} className="text-sm">
            <p className="font-medium">{c.name}</p>
            <p className="text-muted">{c.address}</p>
            {c.contactPhone && <p className="text-muted">{c.contactPhone}</p>}
            {c.latitude && c.longitude && (
              <a
                className="text-link"
                href={`https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=16/${c.latitude}/${c.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                Directions →
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
