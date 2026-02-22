// FDI World Dental Federation: перша цифра — квадрант (1–4), друга — зуб у квадранті (1–8)
export type ToothId = string; // "11" | "12" | ... | "48"

export interface ToothChange {
  id: string;
  toothId: ToothId;
  date: string; // ISO
  title: string;
  notes?: string;
  imageUri?: string;
  status?:
    | "healthy"
    | "treatment"
    | "cavity"
    | "filled"
    | "extracted"
    | "crown"
    | "other";
}

export type BuiltinStatus = 'healthy' | 'treatment' | 'cavity' | 'filled' | 'extracted' | 'crown' | 'other';
export type ToothStatus = string;

export interface ToothRecord {
  toothId: ToothId;
  currentStatus?: ToothStatus;
  changes: ToothChange[];
  lastUpdated?: string;
}

export interface GlobalProcedure {
  id: string;
  date: string;
  title: string;
  notes?: string;
  type: "cleaning" | "whitening" | "fluoride" | "checkup" | "other";
}

export interface CustomStatus {
  id: string;
  label: string;
  color: string; // hex, e.g. "#E91E63"
}

export interface AppData {
  teeth: Record<ToothId, ToothRecord>;
  globalProcedures: GlobalProcedure[];
  customStatuses: CustomStatus[];
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface StatusMaps {
  labels: Record<string, string>;
  colors: Record<string, string>;
  borderColors: Record<string, string>;
  options: [string, string][];
}

export function buildStatusMaps(customStatuses: CustomStatus[] = []): StatusMaps {
  const labels = { ...STATUS_LABELS };
  const colors = { ...STATUS_COLORS };
  const borderColors = { ...STATUS_BORDER_COLORS };
  for (const cs of customStatuses) {
    labels[cs.id] = cs.label;
    colors[cs.id] = hexToRgba(cs.color, 0.4);
    borderColors[cs.id] = cs.color;
  }
  return {
    labels,
    colors,
    borderColors,
    options: Object.entries(labels),
  };
}

export const QUADRANT_LABELS: Record<string, string> = {
  "1": "Верхня щелепа, права",
  "2": "Верхня щелепа, ліва",
  "3": "Нижня щелепа, ліва",
  "4": "Нижня щелепа, права",
};

export const TOOTH_NAMES: Record<string, string> = {
  "1": "Центральний різець",
  "2": "Бічний різець",
  "3": "Ікло",
  "4": "Перший премоляр",
  "5": "Другий премоляр",
  "6": "Перший моляр",
  "7": "Другий моляр",
  "8": "Третій моляр (зуб мудрості)",
};

export const STATUS_LABELS: Record<string, string> = {
  healthy: "Здоровий",
  treatment: "Лікування",
  cavity: "Карієс",
  filled: "Пломба",
  extracted: "Видалений",
  crown: "Коронка",
  other: "Інше",
};

export const STATUS_COLORS: Record<string, string> = {
  healthy: 'rgba(76, 175, 80, 0.4)',
  treatment: 'rgba(255, 152, 0, 0.45)',
  cavity: 'rgba(244, 67, 54, 0.4)',
  filled: 'rgba(33, 150, 243, 0.4)',
  extracted: 'rgba(117, 117, 117, 0.5)',
  crown: 'rgba(156, 39, 176, 0.4)',
  other: 'rgba(158, 158, 158, 0.3)',
};

export const STATUS_BORDER_COLORS: Record<string, string> = {
  healthy: '#4CAF50',
  treatment: '#FF9800',
  cavity: '#F44336',
  filled: '#2196F3',
  extracted: '#757575',
  crown: '#9C27B0',
  other: '#9E9E9E',
};

export const GLOBAL_PROCEDURE_TYPES: Record<string, string> = {
  cleaning: "Чистка",
  whitening: "Відбілювання",
  fluoride: "Фторування",
  checkup: "Огляд",
  other: "Інше",
};

// Усі 32 зуби за FDI
export const ALL_TOOTH_IDS: ToothId[] = (() => {
  const ids: ToothId[] = [];
  for (const q of ["1", "2", "3", "4"]) {
    for (let t = 1; t <= 8; t++) ids.push(`${q}${t}`);
  }
  return ids;
})();
