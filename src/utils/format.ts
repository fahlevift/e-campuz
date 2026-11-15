const HARI_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  0: 'Minggu',
};

const BULAN_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const BULAN_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function getDayName(day: number): string {
  return HARI_NAMES[day] || 'Senin';
}

export function getCurrentScheduleDay(): 1 | 2 | 3 | 4 | 5 | 6 {
  const jsDay = new Date().getDay();
  if (jsDay >= 1 && jsDay <= 6) {
    return jsDay as 1 | 2 | 3 | 4 | 5 | 6;
  }
  return 1;
}

export function getGreetingByTime(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export function formatRupiah(amount: number): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${formatted}`;
}

export function formatTimeDot(timeStr: string): string {
  const clean = timeStr.slice(0, 5);
  return clean.replace(':', '.');
}

export function formatScheduleHeader(day: number, startTime: string, endTime: string, dateObj?: Date): string {
  const d = dateObj || new Date();
  const dayName = getDayName(day);
  const dateNum = d.getDate();
  const monthShort = BULAN_SHORT[d.getMonth()];
  return `${dayName}, ${dateNum} ${monthShort} · ${formatTimeDot(startTime)}–${formatTimeDot(endTime)}`;
}

export function formatDateIdShort(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return String(isoOrDate);
  return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateIdLong(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return String(isoOrDate);
  const dayName = HARI_NAMES[d.getDay()];
  return `${dayName}, ${d.getDate()} ${BULAN_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTimeId(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return String(isoOrDate);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${BULAN_SHORT[d.getMonth()]} ${d.getFullYear()} · ${hh}.${mm} WIB`;
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDateIdShort(date);
}

export function formatRemainingTime(targetIso: string): {
  label: string;
  isUrgent: boolean;
  isOverdue: boolean;
  hoursLeft: number;
  daysLeft: number;
} {
  const target = new Date(targetIso);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const hoursLeft = diffMs / (1000 * 60 * 60);
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return {
      label: overdueDays > 0 ? `Terlambat ${overdueDays} hari` : 'Lewat batas waktu',
      isUrgent: true,
      isOverdue: true,
      hoursLeft,
      daysLeft,
    };
  }

  if (hoursLeft <= 1) {
    const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return { label: `${mins} menit lagi`, isUrgent: true, isOverdue: false, hoursLeft, daysLeft };
  }
  if (hoursLeft <= 24) {
    return {
      label: `${Math.round(hoursLeft)} jam lagi`,
      isUrgent: true,
      isOverdue: false,
      hoursLeft,
      daysLeft,
    };
  }
  return {
    label: `${daysLeft} hari lagi`,
    isUrgent: daysLeft <= 3,
    isOverdue: false,
    hoursLeft,
    daysLeft,
  };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '1,2 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function getNotificationGroupLabel(isoDate: string): 'Hari ini' | 'Kemarin' | 'Minggu ini' | 'Lebih lama' {
  const date = new Date(isoDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (date >= startOfToday) return 'Hari ini';
  if (date >= startOfYesterday) return 'Kemarin';
  if (date >= startOfWeek) return 'Minggu ini';
  return 'Lebih lama';
}
