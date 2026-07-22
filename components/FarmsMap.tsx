"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useTheme } from "@/components/theme/ThemeProvider";
import { SWITZERLAND_BOUNDS, toFarmPoints } from "@/lib/map";
import type { Farm } from "@/types/farm";

interface FarmsMapProps {
  farms: Farm[];
  onOpenFarm: (farm: Farm) => void;
  /** CSS height for the map container (default: the directory's tall view). */
  heightStyle?: string;
}

// On-brand pin (no external image — avoids Leaflet's broken default-icon paths).
const pinIcon = L.divIcon({
  className: "farm-pin",
  html: '<span class="farm-pin__dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function clusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "farm-cluster",
    html: `<span>${count}</span>`,
    iconSize: [40, 40],
  });
}

/**
 * Interactive map of farms (Leaflet + OpenStreetMap raster tiles — no API key).
 * Markers cluster at low zoom; tapping a farm opens the shared detail sheet.
 * Client-only; loaded via a dynamic import so Leaflet stays out of the initial
 * bundle.
 */
export default function FarmsMap({
  farms,
  onOpenFarm,
  heightStyle = "min(70vh, 640px)",
}: FarmsMapProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  // Keep the latest callback without re-binding every marker.
  const onOpenRef = useRef(onOpenFarm);
  useEffect(() => {
    onOpenRef.current = onOpenFarm;
  }, [onOpenFarm]);

  // Init once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    });
    map.fitBounds([
      [SWITZERLAND_BOUNDS.south, SWITZERLAND_BOUNDS.west],
      [SWITZERLAND_BOUNDS.north, SWITZERLAND_BOUNDS.east],
    ]);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      iconCreateFunction: clusterIcon,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      // Add markers in chunks across frames so a few thousand farms don't freeze
      // the UI when the map opens or the filter set changes.
      chunkedLoading: true,
    });
    map.addLayer(cluster);
    mapRef.current = map;
    clusterRef.current = cluster;
    // Tiles can misrender if the container sized after init. Tracked so an
    // immediate unmount (dev StrictMode double-mount, fast nav) can't call
    // invalidateSize on a removed map.
    const sizeTimer = setTimeout(() => map.invalidateSize(), 0);

    return () => {
      clearTimeout(sizeTimer);
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  // (Re)build markers when the farm set changes.
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) {
      return;
    }
    cluster.clearLayers();
    const points = toFarmPoints(farms);
    // Build the markers up front and add them in one bulk call — far cheaper
    // than addLayer-per-marker, which re-clusters on every insert.
    const markers = points.map((point) => {
      const marker = L.marker([point.latitude, point.longitude], {
        icon: pinIcon,
        title: point.farm.name,
      });
      marker.on("click", () => onOpenRef.current(point.farm));
      return marker;
    });
    cluster.addLayers(markers);
    if (points.length > 0) {
      // Ensure Leaflet knows the real container size before fitting — when this
      // runs right after the map view mounts the container may not be laid out
      // yet, which would otherwise clamp the fit to maxZoom. Derive bounds from
      // the points directly: chunked loading adds markers asynchronously, so
      // cluster.getBounds() would be incomplete right now.
      map.invalidateSize();
      const bounds = L.latLngBounds(
        points.map((point) => [point.latitude, point.longitude]),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [farms]);

  return (
    <div
      className={`isolate overflow-hidden rounded-card border border-line ${
        theme === "dark" ? "map-dark" : ""
      }`}
      ref={containerRef}
      style={{ height: heightStyle }}
    />
  );
}
