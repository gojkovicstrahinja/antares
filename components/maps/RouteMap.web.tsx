import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { SERBIAN_CITIES } from '@/constants/cities';

interface RouteMapProps {
  polaziste: string;
  odrediste: string;
  stops?: string[];
  style?: ViewStyle;
}

function getCityCoords(name: string): [number, number] | null {
  const city = SERBIAN_CITIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  return city ? [city.lat, city.lng] : null;
}

export function RouteMap({ polaziste, odrediste, stops = [], style }: RouteMapProps) {
  const fromCoords = getCityCoords(polaziste);
  const toCoords = getCityCoords(odrediste);

  const html = useMemo(() => {
    if (!fromCoords || !toCoords) return '';

    const stopCoords = stops
      .map(getCityCoords)
      .filter(Boolean) as [number, number][];

    const allPoints: [number, number][] = [fromCoords, ...stopCoords, toCoords];

    const centerLat = allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length;
    const centerLng = allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length;

    const routeJson = JSON.stringify(allPoints);
    const fromJson = JSON.stringify(fromCoords);
    const toJson = JSON.stringify(toCoords);
    const stopsJson = JSON.stringify(stopCoords);
    const accent = Colors.accent;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; background:#0a0a0a; }
  .leaflet-container { background:#0a0a0a !important; }
  .leaflet-control-zoom {
    border:1px solid #2C2C2E !important;
    border-radius:8px !important;
    overflow:hidden;
    margin:10px !important;
  }
  .leaflet-control-zoom a {
    background:#1A1A1A !important;
    color:#fff !important;
    border-color:#2C2C2E !important;
    width:28px !important;
    height:28px !important;
    line-height:28px !important;
    font-size:16px !important;
  }
  .leaflet-control-zoom a:hover { background:#2C2C2E !important; }
  .leaflet-control-attribution { display:none; }
  .leaflet-tooltip {
    background: #1A1A1A !important;
    border: 1px solid #2C2C2E !important;
    color: #fff !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    padding: 4px 10px !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.7) !important;
    white-space: nowrap !important;
    font-family: system-ui,-apple-system,sans-serif !important;
  }
  .leaflet-tooltip::before { display:none !important; }
  .tooltip-start {
    background: ${accent} !important;
    color: #000 !important;
    border-color: ${accent} !important;
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map', {
  center: [${centerLat}, ${centerLng}],
  zoom: 8,
  zoomControl: true,
  scrollWheelZoom: true,
  attributionControl: false
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  subdomains: 'abcd'
}).addTo(map);

var routePoints = ${routeJson};
var fromCoords = ${fromJson};
var toCoords = ${toJson};
var stopCoords = ${stopsJson};

// Zelena linija rute
L.polyline(routePoints, {
  color: '${accent}',
  weight: 4,
  opacity: 0.95,
  lineCap: 'round',
  lineJoin: 'round'
}).addTo(map);

// Usputne stanice
stopCoords.forEach(function(c) {
  L.circleMarker(c, {
    radius: 5,
    color: '#fff',
    fillColor: '#757575',
    fillOpacity: 1,
    weight: 2
  }).addTo(map);
});

// Polaziste — zelena tačka + tooltip iznad
L.circleMarker(fromCoords, {
  radius: 8,
  color: '#000',
  fillColor: '${accent}',
  fillOpacity: 1,
  weight: 2
}).bindTooltip('${polaziste.replace(/'/g, "\\'")}', {
  permanent: true,
  direction: 'top',
  offset: [0, -10],
  className: 'tooltip-start'
}).addTo(map);

// Odrediste — bela tačka + tooltip iznad
L.circleMarker(toCoords, {
  radius: 8,
  color: '${accent}',
  fillColor: '#fff',
  fillOpacity: 1,
  weight: 2
}).bindTooltip('${odrediste.replace(/'/g, "\\'")}', {
  permanent: true,
  direction: 'top',
  offset: [0, -10],
  className: ''
}).addTo(map);

// Fit bounds
if (routePoints.length > 1) {
  map.fitBounds(routePoints, { padding: [36, 36] });
}
</script>
</body>
</html>`;
  }, [polaziste, odrediste, stops.join(',')]);

  if (!fromCoords || !toCoords || !html) {
    return <View style={[styles.placeholder, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <iframe
        srcDoc={html}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 16,
          display: 'block',
        }}
        title="Mapa rute"
        sandbox="allow-scripts"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholder: {
    height: 260,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
