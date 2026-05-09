# Antares — Agent Handoff

## Projekat
BlaBlaCar alternativa za Srbiju. React Native + Expo (SDK 52) + Supabase backend.
Codebase: `C:\Users\Straja\Desktop\antares`
Server: `npx expo start --web` (obično na portu 8081 ili 8083)

---

## Supabase
- **Project ID:** `stddxguogqwilfuvesdw`
- **URL:** `https://stddxguogqwilfuvesdw.supabase.co`
- **Region:** eu-central-1
- **Anon key:** u `.env` fajlu

Baza ima 11 tabela sa RLS: `profiles`, `vehicles`, `rides`, `ride_stops`, `bookings`, `messages`, `reviews`, `reports`, `saved_searches`, `notifications`, `live_locations`.

---

## Stack
- **Routing:** Expo Router v6 (file-based, `app/` direktorijum)
- **State:** Zustand (`stores/`) + TanStack Query (`hooks/`)
- **UI:** Custom komponente u `components/ui/` — NE Tamagui
- **Ikone:** `lucide-react-native` v0.475.0 — koristi `stroke=` prop, **NE `color=`**
- **Boje:** `constants/colors.ts` — tamna tema, brand: `#19E07A`
- **Datumi:** `date-fns`, format za prikaz: `DD/MM/YYYY` (utility: `lib/utils.ts → formatDate`)
- **Mape:** Leaflet via `<iframe srcDoc>` u `components/maps/RouteMap.web.tsx` (bez npm paketa)

---

## Struktura ekrana
```
app/
  _layout.tsx          ← root, AuthGate, QueryClient, SafeAreaProvider, Geist font
  (auth)/
    login.tsx          ← inline error state (Alert.alert NE RADI na webu!)
    register.tsx       ← inline success/error
    onboarding/[step].tsx
  (tabs)/
    _layout.tsx        ← tab bar, "Ponudi" ima kvadratni CTA ikonu
    index.tsx          ← Home ekran
    search.tsx         ← Pretraga sa DatePicker, eksplicitno "Pretraži" dugme
    offer.tsx          ← Wizard 6 koraka, DatePicker + TimePicker u koraku 3
    chats.tsx
    profile.tsx        ← Uredi / Verifikacija linkovi
  ride/[id].tsx
  ride/active/[id].tsx
  chat/[userId].tsx
  profile/[id].tsx     ← Javni profil
  my-rides.tsx         ← Vozačeve vožnje, prihvat/odbij rezervacija, brisanje
  edit-profile.tsx     ← Promena podataka, upload avatara
  verification.tsx     ← Upload dokumenata
```

---

## Kritična pravila za web kompatibilnost
1. **`Alert.alert` ne radi na webu** — uvek koristiti inline state za greške/potvrde
2. **`expo-haptics` ne radi na webu** — lazy import sa `Platform.OS !== 'web'` check
3. **`router.back()`** — uvek koristiti `router.canGoBack() ? router.back() : router.replace(fallback)`
4. **`color=` prop** za lucide ikone → **`stroke=`**
5. **Leaflet** — ne importovati kao npm paket u Metro, koristiti `iframe srcDoc` sa CDN

---

## Poslednje urađeno (pre handoff-a)

### Search ekran — pretraga vožnji (NEDOVRŠENO)
Problem koji je trebao biti rešen: korisnik bira datum sa DatePicker-a ali vožnje se ne pojavljuju.

**Šta je urađeno:**
- `hooks/useRides.ts → useSearchRides` refaktorisan: dodat eksplicitni `enabled: boolean` parametar, `staleTime: 0, gcTime: 0`, query ne filtrira po polaziste/odrediste ako su prazni
- `app/(tabs)/search.tsx` — dodati lokalni state `polaziste`, `odrediste`, `datum` odvojeni od store, dodato eksplicitno "Pretraži" dugme, `searchTriggered` state kontroliše kada se query aktivira

**Verovatni uzrok buga (nije 100% verifikovan):** Query bio disabled jer `polaziste` ili `odrediste` bili prazni u store-u (korisnik dolazi sa home chip-a koji postavlja samo odrediste). Novi eksplicitni search trigger to rešava.

**Još nije testirano** — TypeScript prolazi čisto ali UI nije verifikovan u browseru.

---

## Poznati problemi / TODO lista

### Aktivni bugovi
- [ ] Search dugme funkcionisanje — treba testirati u browseru da li se vožnje prikazuju
- [ ] Kada se promeni datum, "Pretraži" dugme mora biti pritisnuto ručno (OK po dizajnu)

### Nedovršene funkcionalnosti
- [ ] **Supabase Storage bucket** za avatare i dokumente kreiran ali nisu testirani upload-i
- [ ] **Verifikacija telefona** — placeholder, nema OTP implementaciju
- [ ] **Push notifikacije** — `expo-notifications` instaliran ali nije konfigurisan
- [ ] **Live tracking** (vozač šalje lokaciju) — schema postoji, UI je placeholder u `ride/active/[id].tsx`
- [ ] **Recurring vožnje** — schema podržava, UI nije implementiran
- [ ] **Admin panel** za review verifikacija dokumenata — ne postoji
- [ ] **Ocenjivanje** posle vožnje — nema UI, samo DB schema
- [ ] **Saved searches** sa push notifikacijama — nema UI

### UI/UX poboljšanja
- [ ] Onboarding korak 2 (foto) — dugme postoji ali `ImagePicker` nije priključen
- [ ] Chat ekran ima `Alert.alert` za grešku slanja — treba inline state
- [ ] My Rides ekran — nema potvrde pre brisanja vožnje (direktno briše)
- [ ] Search ekran — "broj putnika" nije editabilan (uvek 1)
- [ ] TimePicker u offer wizardu — sati su u ScrollView ali ne scrolluju dobro na webu
- [ ] Mapa u RouteMap — ako grad nije u `constants/cities.ts` mapa se ne prikazuje

### Komponente koje su `color=` umesto `stroke=`
Proverite `ride/active/[id].tsx` — tamo su ostali zaostali `color=` props u nekim ikonama.

---

## Važne napomene

### Datumi
- **Interni/DB format:** `YYYY-MM-DD` (ISO)
- **Prikaz format:** `DD/MM/YYYY` — koristite `formatDate()` iz `lib/utils.ts`
- `DatePicker` komponenta vraća `YYYY-MM-DD` via `onChange`

### Supabase Storage
- `avatars` bucket: javni, 5MB, samo slike
- `documents` bucket: privatni, 10MB, slike + PDF
- Upload koristi `base64` encoding via `expo-image-picker`

### Gradovi
- `constants/cities.ts` ima 30 srpskih gradova sa koordinatama
- `searchCities()` je accent-insensitive (š→s, č→c, itd.)
- Mapa radi samo za gradove koji su u ovom fajlu

### Supabase MCP
- Za direktan pristup bazi: MCP tool `mcp__plugin_supabase_supabase__execute_sql` sa `project_id: stddxguogqwilfuvesdw`
- Za kreiranje Storage-a i bucket politika: koristiti SQL direktno

---

## Pokretanje
```bash
cd C:\Users\Straja\Desktop\antares
npx expo start --web --port 8083
# Browser: http://localhost:8083
```

TypeScript: `npx tsc --noEmit` — mora biti 0 grešaka pre deployа.
