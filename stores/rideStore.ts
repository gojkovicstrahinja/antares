import { create } from 'zustand';
import type { RideWithDriver } from '@/types';

interface SearchParams {
  polaziste: string;
  odrediste: string;
  datum: string;
  brPutnika: number;
}

interface RideState {
  searchParams: SearchParams;
  searchResults: RideWithDriver[];
  selectedRide: RideWithDriver | null;
  setSearchParams: (params: Partial<SearchParams>) => void;
  setSearchResults: (rides: RideWithDriver[]) => void;
  setSelectedRide: (ride: RideWithDriver | null) => void;
  resetSearch: () => void;
}

const defaultSearch: SearchParams = {
  polaziste: '',
  odrediste: '',
  datum: new Date().toISOString().split('T')[0],
  brPutnika: 1,
};

export const useRideStore = create<RideState>((set) => ({
  searchParams: defaultSearch,
  searchResults: [],
  selectedRide: null,

  setSearchParams: (params) =>
    set((state) => ({ searchParams: { ...state.searchParams, ...params } })),

  setSearchResults: (rides) => set({ searchResults: rides }),

  setSelectedRide: (ride) => set({ selectedRide: ride }),

  resetSearch: () => set({ searchParams: defaultSearch, searchResults: [] }),
}));
