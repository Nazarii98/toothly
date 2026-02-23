import type { ToothId } from "./types";

export type ToothDef = {
  id: ToothId;
  x: number;
  y: number;
  nx: number;
  ny: number;
  w?: number;
  h?: number;
  r?: number;
  rtl?: number;
  rtr?: number;
  rbl?: number;
  rbr?: number;
};

// prettier-ignore
export const TOOTH_POSITIONS: ToothDef[] = [
  // Верхня щелепа — ліва сторона (права пацієнта, квадрант 1: 18→11)
  { id: "18", x: 19.5, y: 42, nx: 7, ny: 41, w: 9.5, h: 7, rtl: 5, rtr: 3, rbl: 12, rbr: 8 }, // done
  { id: "17", x: 20, y: 36, nx: 6, ny: 34, w: 10.5, h: 6, rtl: 4, rtr: 4, rbl: 4, rbr: 5 },// done
  { id: "16", x: 21.5, y: 30, nx: 9, ny: 28, w: 9, h: 7, rtl: 5, rtr: 5, rbl: 3, rbr: 6 },// done
  { id: "15", x: 24.5, y: 24.2, nx: 12.5, ny: 22, w: 9.5, h: 6, rtl: 5, rtr: 5, rbl: 4, rbr: 5 },// done
  { id: "14", x: 28.5, y: 19.2, nx: 16.5, ny: 16.5, w: 9.5, h: 6, rtl: 5, rtr: 5, rbl: 4, rbr: 5 },// done
  { id: "13", x: 32.5, y: 14.5, nx: 21.5, ny: 9, w: 8, h: 6, rtl: 5, rtr: 8, rbl: 8, rbr: 5 },// done
  { id: "12", x: 37.5, y: 11, nx: 35, ny: 4, w: 8, h: 6, rtl: 10, rtr: 6, rbl: 12, rbr: 3 },// done
  { id: "11", x: 45.5, y: 9.4, nx: 43.5, ny: 2, w: 9, h: 7, rtl: 10, rtr: 6, rbl: 12, rbr: 7 },// done

  // Верхня щелепа — права сторона (ліва пацієнта, квадрант 2: 21→28)
  { id: "21", x: 55, y: 9.4, nx: 54, ny: 2, w: 10, h: 7, rtl: 4, rtr: 6, rbl: 10, rbr: 12 },// done
  { id: "22", x: 64, y: 10.5, nx: 63.5, ny: 4, w: 9, h: 6, rtl: 6, rtr: 12, rbl:2 , rbr: 9 },// done
  { id: "23", x: 68.5, y: 14.8, nx: 77, ny: 9, w: 9, h: 6, rtl: 10, rtr: 5, rbl: 5, rbr: 10 },// done
  { id: "24", x: 72.5, y: 19.5, nx: 82, ny: 16.5, w: 10, h: 6, rtl: 5, rtr: 5, rbl: 5, rbr: 5 },// done
  { id: "25", x: 76.5, y: 24.6, nx: 86, ny: 22, w: 10.5, h: 6, rtl: 5, rtr: 5, rbl: 5, rbr: 5 },// done
  { id: "26", x: 79.5, y: 30, nx: 90, ny: 28, w: 10.5, h: 6, rtl: 5, rtr: 4, rbl: 4, rbr: 5 },// done
  { id: "27", x: 81.5, y: 36, nx: 94, ny: 34, w: 11, h: 7.5, rtl: 5, rtr: 5, rbl: 5, rbr: 5 },// done
  { id: "28", x: 81, y: 42.5, nx: 92, ny: 41, w: 11, h: 6, rtl: 4, rtr: 4, rbl: 4, rbr: 4 },// done

  // Нижня щелепа — ліва сторона (права пацієнта, квадрант 4: 48→41)
  { id: "48", x: 19.5, y: 58.5, nx: 6, ny: 57, w: 10, h: 7, rtl: 5, rtr: 5, rbl: 4, rbr: 4 },// done
  { id: "47", x: 19, y: 65.5, nx: 4, ny: 64, w: 10, h: 7.5, rtl: 5, rtr: 6, rbl: 4, rbr: 4 },// done
  { id: "46", x: 21, y: 72.3, nx: 8, ny: 71, w: 10, h: 6.5, rtl: 4, rtr: 5, rbl: 5, rbr: 3 },// done
  { id: "45", x: 25, y: 78.5, nx: 12, ny: 77.5, w: 10, h: 6.5, rtl: 4, rtr: 4, rbl: 9, rbr: 6 },// done
  { id: "44", x: 30.5, y: 83.5, nx: 17, ny: 84, w: 9, h: 6, rtl: 4, rtr: 5, rbl: 7, rbr: 4 }, // done
  { id: "43", x: 35.5, y: 87.5, nx: 23, ny: 91.5, w: 6.5, h:4.5, rtl: 7, rtr: 5, rbl: 2, rbr: 5 }, // done
  { id: "42", x: 40, y: 90, nx: 38, ny: 95, w: 6.5, h: 4.5, rtl: 10, rtr: 5, rbl: 10, rbr: 5 }, // done
  { id: "41", x: 46.5, y: 90.5, nx: 45, ny: 96.5, w: 7.5, h: 4.5, rtl: 12, rtr: 10, rbl: 7, rbr: 4 }, // done

  // Нижня щелепа — права сторона (ліва пацієнта, квадрант 3: 31→38)
  { id: "31", x: 53, y: 90.5, nx: 52, ny: 96.5, w: 6.5, h: 4.5, rtl: 10, rtr: 10, rbl: 3, rbr: 3 }, // done
  { id: "32", x: 59, y: 89.5, nx: 59, ny: 95, w: 6.5, h: 5, rtl: 10, rtr: 20, rbl: 10, rbr: 10 }, // done
  { id: "33", x: 64, y: 87.5, nx: 74, ny: 91.5, w: 7, h: 5, rtl: 5, rtr: 7, rbl: 5, rbr: 5 },// done
  { id: "34", x: 69, y: 83.2, nx: 80, ny: 84, w: 9.5, h: 6, rtl: 5, rtr: 4, rbl: 5, rbr: 5 },// done
  { id: "35", x: 74.5, y: 77.5, nx: 84, ny: 77.5, w: 10, h: 7, rtl: 7, rtr: 5, rbl: 5, rbr: 7 }, // done
  { id: "36", x: 79.2, y: 71.2, nx: 89, ny: 71, w: 9, h: 7, rtl: 6, rtr: 3, rbl: 3, rbr: 5 },// done
  { id: "37", x: 80.7, y: 65, nx: 93, ny: 64, w: 11, h: 6, rtl: 4, rtr: 3, rbl: 4, rbr: 4 },// done
  { id: "38", x: 81, y: 58.8, nx: 91, ny: 57, w: 10, h: 7, rtl: 4, rtr: 6, rbl: 2, rbr: 3 },// done
];
