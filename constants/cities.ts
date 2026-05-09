export const SERBIAN_CITIES = [
  { name: 'Beograd', lat: 44.8176, lng: 20.4569 },
  { name: 'Novi Sad', lat: 45.2671, lng: 19.8335 },
  { name: 'Niš', lat: 43.3209, lng: 21.8958 },
  { name: 'Kragujevac', lat: 44.0165, lng: 20.9114 },
  { name: 'Subotica', lat: 46.1004, lng: 19.6669 },
  { name: 'Zrenjanin', lat: 45.3826, lng: 20.3902 },
  { name: 'Pančevo', lat: 44.8708, lng: 20.6403 },
  { name: 'Čačak', lat: 43.8914, lng: 20.3497 },
  { name: 'Novi Pazar', lat: 43.1367, lng: 20.5122 },
  { name: 'Kruševac', lat: 43.5804, lng: 21.3228 },
  { name: 'Smederevo', lat: 44.6632, lng: 20.9276 },
  { name: 'Valjevo', lat: 44.2722, lng: 19.8867 },
  { name: 'Paraćin', lat: 43.8618, lng: 21.4093 },
  { name: 'Užice', lat: 43.8557, lng: 19.8428 },
  { name: 'Vranje', lat: 42.5505, lng: 21.9007 },
  { name: 'Šabac', lat: 44.7542, lng: 19.6919 },
  { name: 'Leskovac', lat: 42.9981, lng: 21.9461 },
  { name: 'Prokuplje', lat: 43.2333, lng: 21.5833 },
  { name: 'Bor', lat: 44.0766, lng: 22.0996 },
  { name: 'Jagodina', lat: 43.9770, lng: 21.2613 },
  { name: 'Sombor', lat: 45.7764, lng: 19.1139 },
  { name: 'Kikinda', lat: 45.8277, lng: 20.4648 },
  { name: 'Zaječar', lat: 43.9052, lng: 22.2930 },
  { name: 'Pirot', lat: 43.1545, lng: 22.5862 },
  { name: 'Požarevac', lat: 44.6205, lng: 21.1871 },
  { name: 'Loznica', lat: 44.5345, lng: 19.2280 },
  { name: 'Vrnjačka Banja', lat: 43.6238, lng: 20.8948 },
  { name: 'Zlatibor', lat: 43.7282, lng: 19.7165 },
  { name: 'Kopaonik', lat: 43.2912, lng: 20.8131 },
  { name: 'Sokobanja', lat: 43.6443, lng: 21.8679 },
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/š/g, 's')
    .replace(/č/g, 'c')
    .replace(/ć/g, 'c')
    .replace(/đ/g, 'd')
    .replace(/ž/g, 'z');
}

export function searchCities(query: string): typeof SERBIAN_CITIES {
  if (!query || query.length < 1) return SERBIAN_CITIES;
  const q = normalize(query.trim());
  return SERBIAN_CITIES.filter((city) =>
    normalize(city.name).includes(q)
  ).slice(0, 8);
}
