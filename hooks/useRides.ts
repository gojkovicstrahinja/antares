import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RideWithDriver } from '@/types';

export function useSearchRides(
  polaziste: string,
  odrediste: string,
  datum: string,
  brPutnika: number,
  enabled: boolean = false,
) {
  return useQuery({
    queryKey: ['rides-search', polaziste, odrediste, datum, brPutnika],
    queryFn: async (): Promise<RideWithDriver[]> => {
      let query = supabase
        .from('rides')
        .select(`*, profiles (*), vehicles (*), ride_stops (*), bookings (*)`)
        .eq('status', 'aktivna')
        .gte('slobodna_mesta', brPutnika)
        .order('vreme_polaska', { ascending: true });

      if (polaziste) query = query.ilike('polaziste', `%${polaziste}%`);
      if (odrediste) query = query.ilike('odrediste', `%${odrediste}%`);
      if (datum) query = query.eq('datum', datum);

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as RideWithDriver[]) ?? [];
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useRide(id: string) {
  return useQuery({
    queryKey: ['ride', id],
    queryFn: async (): Promise<RideWithDriver | null> => {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          profiles (*),
          vehicles (*),
          ride_stops (*),
          bookings (*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as RideWithDriver;
    },
  });
}

export function useMyRides(vozacId: string) {
  return useQuery({
    queryKey: ['my-rides', vozacId],
    queryFn: async (): Promise<RideWithDriver[]> => {
      const { data, error } = await supabase
        .from('rides')
        .select(`*, profiles (*), vehicles (*), ride_stops (*), bookings (*)`)
        .eq('vozac_id', vozacId)
        .order('datum', { ascending: false });
      if (error) throw error;
      return (data as unknown as RideWithDriver[]) ?? [];
    },
    enabled: !!vozacId,
  });
}

export function useCreateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ride: {
      vozac_id: string;
      vehicle_id?: string;
      polaziste: string;
      odrediste: string;
      datum: string;
      vreme_polaska: string;
      slobodna_mesta: number;
      cena_po_osobi: number;
      napomene?: string;
    }) => {
      const { data, error } = await supabase.from('rides').insert(ride).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rides'] }),
  });
}

export function useBookRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      ride_id: string;
      putnik_id: string;
      broj_mesta: number;
      polazna_stanica?: string;
      izlazna_stanica?: string;
      napomena?: string;
    }) => {
      const { data, error } = await supabase.from('bookings').insert(booking).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['ride', vars.ride_id] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

export function useMyBookings(putnikId: string) {
  return useQuery({
    queryKey: ['my-bookings', putnikId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, rides (*, profiles (*), vehicles (*), ride_stops (*))`)
        .eq('putnik_id', putnikId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!putnikId,
  });
}
