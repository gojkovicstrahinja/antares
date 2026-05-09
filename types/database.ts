export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          ime: string;
          prezime: string;
          telefon: string | null;
          foto_url: string | null;
          datum_rodjenja: string | null;
          uloga: 'putnik' | 'vozac' | 'oboje';
          verifikovan_telefon: boolean;
          verifikovan_id: boolean;
          ocena_prosek: number;
          broj_voznji: number;
          suspended: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          ime: string;
          prezime: string;
          telefon?: string | null;
          foto_url?: string | null;
          datum_rodjenja?: string | null;
          uloga?: 'putnik' | 'vozac' | 'oboje';
          verifikovan_telefon?: boolean;
          verifikovan_id?: boolean;
          ocena_prosek?: number;
          broj_voznji?: number;
          suspended?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          ime?: string;
          prezime?: string;
          telefon?: string | null;
          foto_url?: string | null;
          datum_rodjenja?: string | null;
          uloga?: 'putnik' | 'vozac' | 'oboje';
          verifikovan_telefon?: boolean;
          verifikovan_id?: boolean;
          ocena_prosek?: number;
          broj_voznji?: number;
          suspended?: boolean;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          vozac_id: string;
          marka: string;
          model: string;
          godina: number | null;
          boja: string | null;
          registracija: string | null;
          saobracajna_url: string | null;
          fotografije: string[] | null;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          vozac_id: string;
          marka: string;
          model: string;
          godina?: number | null;
          boja?: string | null;
          registracija?: string | null;
          saobracajna_url?: string | null;
          fotografije?: string[] | null;
          verified?: boolean;
        };
        Update: {
          id?: string;
          vozac_id?: string;
          marka?: string;
          model?: string;
          godina?: number | null;
          boja?: string | null;
          registracija?: string | null;
          saobracajna_url?: string | null;
          fotografije?: string[] | null;
          verified?: boolean;
        };
        Relationships: [];
      };
      rides: {
        Row: {
          id: string;
          vozac_id: string;
          vehicle_id: string | null;
          polaziste: string;
          odrediste: string;
          polaziste_coords: { x: number; y: number } | null;
          odrediste_coords: { x: number; y: number } | null;
          datum: string;
          vreme_polaska: string;
          slobodna_mesta: number;
          cena_po_osobi: number;
          napomene: string | null;
          status: 'aktivna' | 'u_toku' | 'zavrsena' | 'otkazana';
          recurring: boolean;
          recurring_days: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vozac_id: string;
          vehicle_id?: string | null;
          polaziste: string;
          odrediste: string;
          polaziste_coords?: { x: number; y: number } | null;
          odrediste_coords?: { x: number; y: number } | null;
          datum: string;
          vreme_polaska: string;
          slobodna_mesta: number;
          cena_po_osobi: number;
          napomene?: string | null;
          status?: 'aktivna' | 'u_toku' | 'zavrsena' | 'otkazana';
          recurring?: boolean;
          recurring_days?: number[] | null;
        };
        Update: {
          id?: string;
          vozac_id?: string;
          vehicle_id?: string | null;
          polaziste?: string;
          odrediste?: string;
          polaziste_coords?: { x: number; y: number } | null;
          odrediste_coords?: { x: number; y: number } | null;
          datum?: string;
          vreme_polaska?: string;
          slobodna_mesta?: number;
          cena_po_osobi?: number;
          napomene?: string | null;
          status?: 'aktivna' | 'u_toku' | 'zavrsena' | 'otkazana';
          recurring?: boolean;
          recurring_days?: number[] | null;
        };
        Relationships: [];
      };
      ride_stops: {
        Row: {
          id: string;
          ride_id: string;
          grad: string;
          redni_broj: number;
          cena_do_grada: number | null;
          coords: { x: number; y: number } | null;
        };
        Insert: {
          id?: string;
          ride_id: string;
          grad: string;
          redni_broj: number;
          cena_do_grada?: number | null;
          coords?: { x: number; y: number } | null;
        };
        Update: {
          id?: string;
          ride_id?: string;
          grad?: string;
          redni_broj?: number;
          cena_do_grada?: number | null;
          coords?: { x: number; y: number } | null;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          ride_id: string;
          putnik_id: string;
          broj_mesta: number;
          polazna_stanica: string | null;
          izlazna_stanica: string | null;
          status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
          napomena: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ride_id: string;
          putnik_id: string;
          broj_mesta?: number;
          polazna_stanica?: string | null;
          izlazna_stanica?: string | null;
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
          napomena?: string | null;
        };
        Update: {
          id?: string;
          ride_id?: string;
          putnik_id?: string;
          broj_mesta?: number;
          polazna_stanica?: string | null;
          izlazna_stanica?: string | null;
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
          napomena?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          ride_id: string | null;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          ride_id?: string | null;
          content: string;
          read?: boolean;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          ride_id?: string | null;
          content?: string;
          read?: boolean;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          ride_id: string;
          ocenjivac_id: string;
          oceniti_id: string;
          ocena: number;
          komentar: string | null;
          tip: 'vozac_ocenjuje_putnika' | 'putnik_ocenjuje_vozaca';
          created_at: string;
        };
        Insert: {
          id?: string;
          ride_id: string;
          ocenjivac_id: string;
          oceniti_id: string;
          ocena: number;
          komentar?: string | null;
          tip: 'vozac_ocenjuje_putnika' | 'putnik_ocenjuje_vozaca';
        };
        Update: {
          id?: string;
          ride_id?: string;
          ocenjivac_id?: string;
          oceniti_id?: string;
          ocena?: number;
          komentar?: string | null;
          tip?: 'vozac_ocenjuje_putnika' | 'putnik_ocenjuje_vozaca';
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          prijavljivac_id: string;
          prijavljen_id: string;
          ride_id: string | null;
          razlog: string;
          opis: string | null;
          status: 'pending' | 'reviewed' | 'resolved';
          created_at: string;
        };
        Insert: {
          id?: string;
          prijavljivac_id: string;
          prijavljen_id: string;
          ride_id?: string | null;
          razlog: string;
          opis?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved';
        };
        Update: {
          id?: string;
          prijavljivac_id?: string;
          prijavljen_id?: string;
          ride_id?: string | null;
          razlog?: string;
          opis?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved';
        };
        Relationships: [];
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          polaziste: string;
          odrediste: string;
          datum_od: string | null;
          datum_do: string | null;
          notify: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          polaziste: string;
          odrediste: string;
          datum_od?: string | null;
          datum_do?: string | null;
          notify?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          polaziste?: string;
          odrediste?: string;
          datum_od?: string | null;
          datum_do?: string | null;
          notify?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          tip: string;
          naslov: string;
          telo: string | null;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tip: string;
          naslov: string;
          telo?: string | null;
          data?: Json | null;
          read?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          tip?: string;
          naslov?: string;
          telo?: string | null;
          data?: Json | null;
          read?: boolean;
        };
        Relationships: [];
      };
      live_locations: {
        Row: {
          id: string;
          ride_id: string;
          vozac_id: string;
          coords: { x: number; y: number };
          updated_at: string;
        };
        Insert: {
          id?: string;
          ride_id: string;
          vozac_id: string;
          coords: { x: number; y: number };
        };
        Update: {
          id?: string;
          ride_id?: string;
          vozac_id?: string;
          coords?: { x: number; y: number };
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
