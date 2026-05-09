import type { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type Ride = Database['public']['Tables']['rides']['Row'];
export type RideStop = Database['public']['Tables']['ride_stops']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type SavedSearch = Database['public']['Tables']['saved_searches']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type LiveLocation = Database['public']['Tables']['live_locations']['Row'];

export type RideWithDriver = Ride & {
  profiles: Profile;
  vehicles: Vehicle | null;
  ride_stops: RideStop[];
  bookings: Booking[];
};

export type BookingWithRide = Booking & {
  rides: RideWithDriver;
};
