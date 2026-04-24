// Israeli holidays 2025
const HOLIDAYS_2025 = [
  '2025-03-14', // Purim
  '2025-04-13', // Pesach Day 1
  '2025-04-14', // Pesach Day 2
  '2025-04-19', // Pesach Day 7
  '2025-04-20', // Pesach Day 8
  '2025-05-02', // Yom HaZikaron
  '2025-05-03', // Yom HaAtzmaut
  '2025-06-02', // Shavuot
  '2025-09-23', // Rosh Hashana Day 1
  '2025-09-24', // Rosh Hashana Day 2
  '2025-10-02', // Yom Kippur
  '2025-10-07', // Sukkot Day 1
  '2025-10-08', // Sukkot Day 2
  '2025-10-14', // Simchat Torah
];

export function isIsraeliHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return HOLIDAYS_2025.includes(`${y}-${m}-${d}`);
}

export function holidaysInMonth(year: number, month: number): Date[] {
  return HOLIDAYS_2025
    .filter(s => {
      const [y, m] = s.split('-').map(Number);
      return y === year && m === month;
    })
    .map(s => new Date(s));
}
