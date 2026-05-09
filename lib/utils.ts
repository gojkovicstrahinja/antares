import { format, parseISO } from 'date-fns';
import { sr } from 'date-fns/locale';

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd/MM');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString('sr-RS') + ' RSD';
}

export function getInitials(ime: string, prezime: string): string {
  return `${ime.charAt(0)}${prezime.charAt(0)}`.toUpperCase();
}

export function avatarUrl(ime: string, prezime: string, fotoUrl?: string | null): string {
  if (fotoUrl) return fotoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(ime)}+${encodeURIComponent(prezime)}&background=1A1A1A&color=00C566&size=200`;
}
