import { SolarDate } from "lunar-date-vn";

const CAN = [
  "Giáp",
  "Ất",
  "Bính",
  "Đinh",
  "Mậu",
  "Kỷ",
  "Canh",
  "Tân",
  "Nhâm",
  "Quý",
];
const CHI = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
];

export function getCanChi(year: number): string {
  const can = CAN[(year + 6) % 10];
  const chi = CHI[(year + 8) % 12];
  return `${can} ${chi}`;
}

export function formatDateWithLunar(dateStr?: string): string {
  if (!dateStr) return "—";

  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const solar = new SolarDate(new Date(y, m - 1, d));
    const lunar = solar.toLunarDate();

    const solarDisplay = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
    const lunarDay = String(lunar.day).padStart(2, "0");
    const lunarMonth = String(lunar.month).padStart(2, "0");
    const canChi = getCanChi(lunar.year);

    return `${solarDisplay} (AL: ${lunarDay}/${lunarMonth}/${lunar.year} - ${canChi})`;
  } catch {
    // Fallback nếu ngày không hợp lệ
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }
}
