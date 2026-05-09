# Antares — Agent Handoff

## Projekat
BlaBlaCar alternativa za Srbiju. React Native + Expo (SDK 52) + Supabase backend.
Codebase: `C:\Users\Straja\Desktop\antares`
Server: `npx expo start --web --port 8083` → http://localhost:8083

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
    login.tsx          ← inline error state, Enter na password polju submittuje formu
    register.tsx       ← inline success/error
    onboarding/[step].tsx
  (tabs)/
    _layout.tsx        ← tab bar
    index.tsx          ← Home ekran (vidi detalje ispod)
    search.tsx         ← Pretraga sa DatePicker, CityAutocomplete, filteri
    offer.tsx          ← Wizard 6 koraka, DatePicker + TimePicker u koraku 3
    chats.tsx
    profile.tsx
  ride/[id].tsx
  ride/active/[id].tsx
  chat/[userId].tsx
  profile/[id].tsx     ← Javni profil
  my-rides.tsx         ← Vozačeve vožnje, prihvat/odbij rezervacija, brisanje sa potvrdom
  edit-profile.tsx
  verification.tsx
```

---

## Kritična pravila za web kompatibilnost
1. **`Alert.alert` ne radi na webu** — uvek koristiti inline state za greške/potvrde
2. **`expo-haptics` ne radi na webu** — lazy import sa `Platform.OS !== 'web'` check
3. **`router.back()`** — uvek koristiti `router.canGoBack() ? router.back() : router.replace(fallback)`
4. **`color=` prop** za lucide ikone → **`stroke=`**
5. **Leaflet** — ne importovati kao npm paket u Metro, koristiti `iframe srcDoc` sa CDN

---

## Urađeno u ovoj sesiji

### Bugfixevi (web kompatibilnost)
- `ride/active/[id].tsx` — 3× `color=` → `stroke=`; `Alert.alert` za "Pozovi" → inline banner
- `chat/[userId].tsx` — `Alert.alert` za grešku slanja → inline error banner; `color=` → `stroke=` na Send ikoni
- `my-rides.tsx` — brisanje i otkazivanje vožnje sada traže inline potvrdu pre akcije

### Home ekran (`app/(tabs)/index.tsx`)
- "Where To" karta sada ima **inline expanded search** — umesto navigacije na search stranicu, karta se proširi sa dva `CityAutocomplete` inputa direktno na home ekranu
- `expanded` defaultuje na `true` (forma uvek otvorena)
- X dugme kolapsira nazad na statičnu kartu
- Dugme zvona (notifikacije) sada otvara/zatvara inline panel sa praznim stanjem — dugme postaje zeleno dok je panel otvoren

### Search ekran (`app/(tabs)/search.tsx`)
- Dugme "Pretraži vožnje" u disabled stanju koristilo `Colors.surface3` pozadinu (nevidljivo) — sada samo `opacity: 0.4` bez promene boje

### CityAutocomplete (`components/ui/CityAutocomplete.tsx`)
- Kada je input fokusiran ali prazan, prikazuje dropdown sa 6 popularnih gradova: Beograd, Novi Sad, Niš, Kragujevac, Subotica, Čačak
- Header "Popularni gradovi" sa TrendingUp ikonom

### Login (`app/(auth)/login.tsx`)
- `returnKeyType="next"` na email polju, `returnKeyType="go"` + `onSubmitEditing={handleLogin}` na password polju — Enter submittuje formu

---

## Poznati problemi / TODO lista

### Nedovršene funkcionalnosti
- [ ] **Verifikacija telefona** — placeholder, nema OTP implementaciju
- [ ] **Push notifikacije** — `expo-notifications` instaliran ali nije konfigurisan; notif panel na home ekranu prikazuje prazno stanje
- [ ] **Live tracking** (vozač šalje lokaciju) — schema postoji, UI je placeholder u `ride/active/[id].tsx`
- [ ] **Recurring vožnje** — schema podržava, UI nije implementiran
- [ ] **Admin panel** za review verifikacija dokumenata — ne postoji
- [ ] **Ocenjivanje** posle vožnje — nema UI, samo DB schema
- [ ] **Saved searches** sa push notifikacijama — nema UI
- [ ] **Supabase Storage** upload avatara i dokumenata — bucket postoji, upload nije testiran

### UI/UX poboljšanja
- [ ] Onboarding korak 2 (foto) — dugme postoji ali `ImagePicker` nije priključen
- [ ] My Rides ekran — "broj putnika" nije editabilan na search ekranu (uvek 1)
- [ ] TimePicker u offer wizardu — sati su u ScrollView ali ne scrolluju dobro na webu
- [ ] Mapa u RouteMap — ako grad nije u `constants/cities.ts` mapa se ne prikazuje
- [ ] Home ekran notifikacije — kad se implementira Supabase Realtime za notifikacije, panel u `index.tsx` (`showNotifications`) treba popuniti pravim podacima iz tabele `notifications`

---

## Važne napomene

### Datumi
- **Interni/DB format:** `YYYY-MM-DD` (ISO)
- **Prikaz format:** `DD/MM/YYYY` — koristite `formatDate()` iz `lib/utils.ts`
- `DatePicker` komponenta vraća `YYYY-MM-DD` via `onChange`

### CityAutocomplete
- Popularne predloge (pre kucanja) menjati u `components/ui/CityAutocomplete.tsx` → const `POPULAR`
- Gradovi za pretragu su u `constants/cities.ts` (30 srpskih gradova sa koordinatama)
- `searchCities()` je accent-insensitive (š→s, č→c, itd.)

### Supabase Storage
- `avatars` bucket: javni, 5MB, samo slike
- `documents` bucket: privatni, 10MB, slike + PDF

### Supabase MCP
- Za direktan pristup bazi: MCP tool `mcp__plugin_supabase_supabase__execute_sql` sa `project_id: stddxguogqwilfuvesdw`

---

## Pokretanje
```bash
cd C:\Users\Straja\Desktop\antares
npx expo start --web --port 8083
# Browser: http://localhost:8083
# Ako Chrome prikaže grešku — otvori novi tab i idi na URL (ne refreshuj iz error stranice)
```

TypeScript: `npx tsc --noEmit` — mora biti 0 grešaka pre deploya.
