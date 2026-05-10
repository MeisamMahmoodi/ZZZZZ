export function getInitials(firstName: string, lastName: string): string {
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

const avatarColors = [
  '#22C55E', '#3B82F6', '#F97316', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F59E0B', '#6366F1', '#06B6D4',
];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  return `${h}:${m}`;
}

export function getDayAbbrev(date: Date): string {
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return days[date.getDay()];
}

export function getTodayDayAbbrev(): string {
  return getDayAbbrev(new Date());
}

export function formatDateLong(date: Date, locale = 'de-DE'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  return phone;
}

export function propertyTypeIcon(type: string): string {
  switch (type) {
    case 'office': return 'building-2';
    case 'school': return 'graduation-cap';
    case 'supermarket': return 'shopping-cart';
    case 'doctor': return 'heart-pulse';
    default: return 'building';
  }
}

export function propertyTypeLabel(type: string): string {
  switch (type) {
    case 'office': return 'Büro';
    case 'school': return 'Schule';
    case 'supermarket': return 'Supermarkt';
    case 'doctor': return 'Arztpraxis';
    default: return 'Objekt';
  }
}
