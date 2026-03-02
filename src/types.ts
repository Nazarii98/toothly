// FDI World Dental Federation: перша цифра — квадрант (1–4), друга — зуб у квадранті (1–8)
export type ToothId = string; // "11" | "12" | ... | "48"

export interface ToothChange {
  id: string;
  toothId: ToothId;
  date: string; // ISO
  title: string;
  notes?: string;
  imageUri?: string;
  status?: string; // tooth record category id
}

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
  type: string; // global procedure category id
}

export interface CustomStatus {
  id: string;
  label: string;
  color: string; // hex, e.g. "#E91E63"
}

/** Custom item for tooth-record categories or global-procedure categories */
export interface CustomCategory {
  id: string;
  label: string;
  color: string; // hex
}

export interface AppData {
  teeth: Record<ToothId, ToothRecord>;
  globalProcedures: GlobalProcedure[];
  customStatuses: CustomStatus[];
  customToothCategories: CustomCategory[];
  customGlobalCategories: CustomCategory[];
}

/** Format for exported profile (backup/restore) */
export interface ExportedProfile {
  version: number;
  profileName: string;
  exportedAt: string; // ISO
  data: AppData;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
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

/** Tooth status maps (for ToothRecord.currentStatus) */
export function buildStatusMaps(
  customStatuses: CustomStatus[] = [],
): StatusMaps {
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

/** Tooth record category maps (for ToothChange.status) */
export function buildToothCategoryMaps(
  custom: CustomCategory[] = [],
): StatusMaps {
  const labels = { ...TOOTH_CATEGORY_LABELS };
  const colors = { ...TOOTH_CATEGORY_COLORS };
  const borderColors = { ...TOOTH_CATEGORY_BORDER_COLORS };
  for (const c of custom) {
    labels[c.id] = c.label;
    colors[c.id] = hexToRgba(c.color, 0.4);
    borderColors[c.id] = c.color;
  }
  return {
    labels,
    colors,
    borderColors,
    options: Object.entries(labels),
  };
}

/** Global procedure category maps (for GlobalProcedure.type) */
export function buildGlobalCategoryMaps(
  custom: CustomCategory[] = [],
): StatusMaps {
  const labels = { ...GLOBAL_PROCEDURE_TYPES };
  const colors = { ...GLOBAL_CATEGORY_COLORS };
  const borderColors = { ...GLOBAL_CATEGORY_BORDER_COLORS };
  for (const c of custom) {
    labels[c.id] = c.label;
    colors[c.id] = hexToRgba(c.color, 0.4);
    borderColors[c.id] = c.color;
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

// ── Tooth statuses (ToothRecord.currentStatus) ──────────────────────────────

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
  healthy: "rgba(76, 175, 80, 0.4)",
  treatment: "rgba(255, 152, 0, 0.45)",
  cavity: "rgba(244, 67, 54, 0.4)",
  filled: "rgba(33, 150, 243, 0.4)",
  extracted: "rgba(28, 27, 27, 0.6)",
  crown: "rgba(156, 39, 176, 0.4)",
  other: "rgba(158, 158, 158, 0.3)",
};

export const STATUS_BORDER_COLORS: Record<string, string> = {
  healthy: "#4CAF50",
  treatment: "#FF9800",
  cavity: "#F44336",
  filled: "#2196F3",
  extracted: "#000000",
  crown: "#9C27B0",
  other: "#9E9E9E",
};

// ── Tooth record categories (ToothChange.status) ─────────────────────────────

export const TOOTH_CATEGORY_LABELS: Record<string, string> = {
  checkup: "Огляд",
  treatment: "Лікування",
  filling: "Пломбування",
  extraction: "Видалення",
  xray: "Знімок",
  cleaning: "Чистка",
  other: "Інше",
};

export const TOOTH_CATEGORY_COLORS: Record<string, string> = {
  checkup: "rgba(33, 150, 243, 0.4)",
  treatment: "rgba(255, 152, 0, 0.45)",
  filling: "rgba(156, 39, 176, 0.4)",
  extraction: "rgba(244, 67, 54, 0.4)",
  xray: "rgba(96, 125, 139, 0.4)",
  cleaning: "rgba(76, 175, 80, 0.4)",
  other: "rgba(158, 158, 158, 0.3)",
};

export const TOOTH_CATEGORY_BORDER_COLORS: Record<string, string> = {
  checkup: "#2196F3",
  treatment: "#FF9800",
  filling: "#9C27B0",
  extraction: "#F44336",
  xray: "#607D8B",
  cleaning: "#4CAF50",
  other: "#9E9E9E",
};

// ── Global procedure categories (GlobalProcedure.type) ────────────────────────

export const GLOBAL_PROCEDURE_TYPES: Record<string, string> = {
  cleaning: "Чистка",
  whitening: "Відбілювання",
  fluoride: "Фторування",
  checkup: "Огляд",
  other: "Інше",
};

export const GLOBAL_CATEGORY_COLORS: Record<string, string> = {
  cleaning: "rgba(76, 175, 80, 0.4)",
  whitening: "rgba(255, 193, 7, 0.4)",
  fluoride: "rgba(0, 188, 212, 0.4)",
  checkup: "rgba(33, 150, 243, 0.4)",
  other: "rgba(158, 158, 158, 0.3)",
};

export const GLOBAL_CATEGORY_BORDER_COLORS: Record<string, string> = {
  cleaning: "#4CAF50",
  whitening: "#FFC107",
  fluoride: "#00BCD4",
  checkup: "#2196F3",
  other: "#9E9E9E",
};

// Усі 32 зуби за FDI
export const ALL_TOOTH_IDS: ToothId[] = (() => {
  const ids: ToothId[] = [];
  for (const q of ["1", "2", "3", "4"]) {
    for (let t = 1; t <= 8; t++) ids.push(`${q}${t}`);
  }
  return ids;
})();
