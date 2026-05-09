# Projekat: Antares (BlaBlaCar alternativa za Srbiju)

## Cilj
Napravi cross-platform aplikaciju za deljenje prevoza između gradova u Srbiji. 
Aplikacija mora biti besplatna za korisnike (bez naknada za rezervaciju) i 
funkcionalno ekvivalentna BlaBlaCar-u, ali sa UI/UX inspirisanim Uber-om.
Koristi Supabase MCP da napravis backend.

## Tehnički stack
- **Framework:** React Native sa Expo (SDK 52+)
- **Jezik:** TypeScript (strict mode)
- **Routing:** Expo Router (file-based)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **UI biblioteka:** Tamagui (radi nativno i na webu)
- **State management:** Zustand za client state, TanStack Query za server state
- **Mape:** react-native-maps sa OpenStreetMap (Mapbox kao fallback)
- **Push notifikacije:** expo-notifications
- **Forms:** react-hook-form + zod za validaciju
- **Datumi:** date-fns sa srpskom lokalizacijom
- **Deployment:** EAS Build (mobile), Vercel (web)
- **Jezik aplikacije:** srpski (latinica), pripremiti i18n strukturu za buduće jezike

## Platforme
Android, iOS, i Web — iz istog codebase-a (Expo for Web).

---

## DIZAJN — Uber-ovski UI/UX

### Vizuelni jezik
- **Paleta:** crna (#000) i bela (#FFF) kao primarne, sa jednim accent kolorom 
  (predlog: #00C566 — sveža zelena, asocijacija na "go") za CTA dugmiće i statuse
- **Tipografija:** sistemski font (San Francisco na iOS, Roboto na Android, Inter na webu), 
  velike bold cifre i kratki naslovi tipa Uber-a
- **Bottom sheet pattern:** glavni navigacijski element — mapa zauzima ekran, 
  bottom sheet prekriva donju trećinu sa input poljima (kao Uber "Where to?")
- **Kartice:** zaobljeni uglovi 16px, suptilne senke, dosta belog prostora
- **Ikone:** lucide-react-native, konzistentno 24px, tanka linija
- **Animacije:** sve tranzicije preko react-native-reanimated, prirodne spring animacije
- **Haptika:** expo-haptics na svaki značajan tap (potvrda, greška, success)

### Glavni ekrani

1. **Home (mapa + bottom sheet)** — kao Uber-ov početni ekran
   - Mapa Srbije sa pin-om na trenutnoj lokaciji korisnika
   - Bottom sheet sa "Kuda putuješ?" inputom
   - Dva taba na vrhu sheet-a: "Putnik" / "Vozač"
   - Recent destinations kao chip-ovi
   - "Sačuvane lokacije" sekcija (Kuća, Posao)

2. **Pretraga vožnji (putnik)**
   - Polazište + odredište autocomplete (gradovi Srbije)
   - Date picker — Uber-ov stil "Now / Schedule for later"
   - Broj putnika (1-4)
   - Live rezultati ispod, sortirano po vremenu polaska
   - Svaki rezultat: avatar vozača, ocena, vreme, cena, slobodna mesta, 
     ETA do polaska

3. **Detalji vožnje**
   - Mapa sa nacrtanom rutom (polyline između gradova)
   - Foto vozača, ime, ocena, broj vožnji, "verifikovan" badge
   - Auto: model, boja, registracija (parcijalno skrivena dok se ne rezerviše)
   - Cena, vreme, slobodna mesta
   - "Rezerviši mesto" CTA dugme — bottom sticky, full width

4. **Ponudi vožnju (vozač)**
   - Step-by-step wizard sa progress bar-om
   - Polazište → Odredište → Usputne stanice → Datum → Vreme → 
     Mesta → Cena → Napomene → Pregled
   - Svaki korak full-screen, velike touch zone, jedna akcija po ekranu
   - Map preview rute na kraju

5. **Aktivna vožnja (live tracking)**
   - Mapa sa pozicijom vozača u realnom vremenu (Supabase Realtime)
   - ETA, kontakt dugme (poziv/poruka)
   - Status: "Vozač je krenuo" / "Stigao na lokaciju" / "U toku" / "Završeno"

6. **Profil**
   - Foto, ime, ocena, broj završenih vožnji
   - Verifikacioni badge-evi (telefon, email, lična karta, vozačka)
   - Auto info ako je vozač
   - Istorija vožnji
   - Settings

7. **Chat**
   - In-app messaging između vozača i putnika
   - Realtime preko Supabase
   - Typing indicators, read receipts
   - Quick replies: "Stižem za 5 min", "Gde si tačno?", "Otkazujem"

---

## FUNKCIONALNOSTI

### Autentifikacija
- Email/password registracija
- Magic link (Supabase Auth)
- Google OAuth
- Apple OAuth (obavezno za iOS App Store)
- Verifikacija broja telefona preko OTP-a (Twilio ili Supabase phone auth)
- Onboarding tok: telefon → ime → foto → izbor uloge (putnik/vozač/oboje)

### Putnik može da:
- Pretražuje vožnje po polazištu, odredištu, datumu
- Filtrira po ceni, vremenu, broju mesta, oceni vozača
- Vidi rutu na mapi pre rezervacije
- Rezerviše mesto (bez plaćanja u app — dogovor van)
- Komunicira sa vozačem kroz in-app chat
- Sačuva pretragu i dobija push kad se pojavi vožnja
- Otkaže rezervaciju (sa razlogom)
- Oceni vozača posle vožnje (1-5 zvezdica + komentar)
- Prijavi vozača za neprimereno ponašanje

### Vozač može da:
- Objavi vožnju kroz wizard
- Postavi usputne stanice (bitno za rute kao Beograd-Niš preko Paraćina)
- Postavi cenu po segmentu (BG-Paraćin = 600 RSD, BG-Niš = 1000 RSD)
- Vidi rezervacije, prihvata/odbija putnike
- Otkaže vožnju (sa automatskim notifikacijama putnicima)
- Vidi istoriju i zaradu (ukupno, mesečno)
- Postavi recurring vožnje ("svakog radnog dana 07:00")
- Verifikuje vozačku dozvolu (foto upload + manuelna provera u admin panelu)

### Sistem poverenja (kritično — bez ovoga aplikacija ne radi)
- Verifikacija telefona je obavezna pre prve aktivnosti
- Verifikacija lične karte (foto napred + selfie) — opciono ali daje "Verified" badge
- Vozači moraju da uploaduju vozačku dozvolu i saobraćajnu pre prve ponude
- Sistem ocena 1-5 sa komentarima
- "Super Driver" badge za vozače sa 50+ vožnji i ocenom 4.8+
- Report sistem — 3 prijave = automatski suspend do ručne provere
- Public profil sa istorijom (broj vožnji, prosek ocena, "član od")

### Realtime funkcionalnosti
- Live pozicija vozača za putnike koji su rezervisali (samo na dan vožnje)
- Push kad neko rezerviše tvoju vožnju
- Push kad vozač prihvati/odbije rezervaciju
- Push 1h pre polaska (podsetnik)
- Push kad se pojavi vožnja koja matchuje saved search
- In-app chat sa typing indicators

### Pametne funkcije
- Auto-complete gradova sa fuzzy search (radi i sa "bg", "Beograd", "beograd")
- Sugestije ruta na osnovu istorije
- "Predloženo za tebe" — vožnje koje matchuju tvoje uobičajene rute
- Algoritam matching-a usputnih stanica (ako vozač ide BG-Niš, putnik koji 
  traži Paraćin-Niš dobija match)
- Detekcija duplikata — ako vozač pokušava da objavi istu rutu dvaput
- Smart pricing suggestion — bot predlaže cenu na osnovu prethodnih ruta

---

## DATABASE SCHEMA (Supabase / PostgreSQL)

Kreiraj sledeće tabele sa odgovarajućim RLS politikama:

- `profiles` (id, telegram_id, ime, prezime, telefon, foto_url, datum_rodjenja, 
  uloga ['putnik', 'vozac', 'oboje'], verifikovan_telefon, verifikovan_id, 
  ocena_prosek, broj_voznji, created_at)
- `vehicles` (id, vozac_id, marka, model, godina, boja, registracija, 
  saobracajna_url, fotografije[], verified)
- `rides` (id, vozac_id, vehicle_id, polaziste, odrediste, polaziste_coords, 
  odrediste_coords, datum, vreme_polaska, slobodna_mesta, cena_po_osobi, 
  napomene, status ['aktivna', 'u_toku', 'zavrsena', 'otkazana'], created_at)
- `ride_stops` (id, ride_id, grad, redni_broj, cena_do_grada)
- `bookings` (id, ride_id, putnik_id, broj_mesta, polazna_stanica, izlazna_stanica, 
  status ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], 
  napomena, created_at)
- `messages` (id, sender_id, receiver_id, ride_id, content, read, created_at)
- `reviews` (id, ride_id, ocenjivac_id, oceniti_id, ocena, komentar, 
  tip ['vozac_ocenjuje_putnika', 'putnik_ocenjuje_vozaca'], created_at)
- `reports` (id, prijavljivac_id, prijavljen_id, ride_id, razlog, opis, 
  status, created_at)
- `saved_searches` (id, user_id, polaziste, odrediste, datum_od, datum_do, 
  notify, created_at)
- `notifications` (id, user_id, tip, naslov, telo, data, read, created_at)

RLS politike:
- Profili: svi vide javne podatke, korisnik menja samo svoj
- Vožnje: svi vide aktivne, vozač menja samo svoje
- Rezervacije: vidi samo putnik koji je rezervisao i vozač
- Poruke: vide samo sender i receiver
- Reviews: svi čitaju, samo učesnici vožnje pišu
- Reports: pišu svi, čita samo admin

Indeksi: na (polaziste, odrediste, datum), na vozac_id, na putnik_id, 
na (sender_id, receiver_id), na ride_id u svim povezanim tabelama.

---

## STRUKTURA PROJEKTA
app/
(auth)/
login.tsx
register.tsx
onboarding/
[step].tsx
(tabs)/
index.tsx          # Home sa mapom
search.tsx         # Pretraga
offer.tsx          # Ponudi vožnju
chats.tsx          # Lista chat-ova
profile.tsx
ride/
[id].tsx           # Detalji vožnje
active/[id].tsx    # Aktivna vožnja
chat/
[userId].tsx
_layout.tsx
components/
ui/                  # Tamagui komponente
maps/
cards/
forms/
lib/
supabase.ts
notifications.ts
geocoding.ts
utils.ts
stores/
authStore.ts
rideStore.ts
hooks/
useAuth.ts
useRides.ts
useRealtime.ts
types/
database.ts          # Supabase generisani tipovi
index.ts

---



---

## VAŽNE NAPOMENE

- **Ne implementiraj plaćanje u aplikaciji** — komplikovano je pravno u Srbiji 
  (treba registrovana firma, PSP integracija, KYC). Neka se vozač i putnik 
  dogovore keš ili direktan transfer.
- **Privatnost** — registracija auta i tačna adresa se otkrivaju tek nakon 
  potvrđene rezervacije
- **GDPR/Zakon o zaštiti podataka** — pripremi privacy policy, mogućnost 
  brisanja naloga, export podataka
- **Bezbednost** — sve API pozive ide kroz Supabase RLS, nikad direktno 
  tabele iz klijenta sa service_role ključem
- **Performance** — koristi FlashList umesto FlatList za duge liste, 
  React.memo za skupe komponente, image caching kroz expo-image
- **Accessibility** — svi interaktivni elementi imaju accessibilityLabel, 
  podrška za screen readers, kontrast 4.5:1 minimum

