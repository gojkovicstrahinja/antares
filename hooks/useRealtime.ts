import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/types';

export function useRealtimeMessages(
  senderId: string,
  receiverId: string,
  onMessage: (msg: Message) => void
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!senderId || !receiverId) return;

    const channel = supabase
      .channel(`messages-${senderId}-${receiverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${senderId}`,
        },
        (payload) => onMessage(payload.new as Message)
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [senderId, receiverId]);
}

export function useRealtimeLocation(
  rideId: string,
  onLocationUpdate: (coords: { x: number; y: number }) => void
) {
  useEffect(() => {
    if (!rideId) return;

    const channel = supabase
      .channel(`location-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const loc = payload.new as { coords: { x: number; y: number } };
          if (loc?.coords) onLocationUpdate(loc.coords);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rideId]);
}

export function useRealtimeBookings(
  rideId: string,
  onBooking: (booking: unknown) => void
) {
  useEffect(() => {
    if (!rideId) return;

    const channel = supabase
      .channel(`bookings-${rideId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `ride_id=eq.${rideId}` },
        (payload) => onBooking(payload.new)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rideId]);
}
