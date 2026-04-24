import {
  Shift,
  UserProfile,
  ManualPayment,
  SECTOR_MIN_HOURLY,
  WORKER_TYPE_WAGE_PCT,
  SECURITY_GRADE_RATE,
} from '../models/types';

// ─── Israeli Labor Law 2025 ────────────────────────────────────────────────────

const LAW = {
  monthlyBaseHours: 182,
  youthMonthlyBaseHours: 173,
  minimumWageMonthly: 6247.67,
  minimumWageHourly: 34.32,
  overtime125Rate: 1.25,
  overtime150Rate: 1.5,
  shabbatRate: 1.5,
  holidayRate: 1.5,
  maxTravelPerDay: 22.6,
  havraahDayRate: 418.0,
  havraahWarDeduction: 0.36,
  taxCreditPointValue: 242.0,
  globalOvertimeMaxMonthly: 16000,
};

// ─── Tax brackets 2025 (monthly) ──────────────────────────────────────────────

const TAX_BRACKETS: { limit: number; rate: number }[] = [
  { limit: 7010,     rate: 0.10 },
  { limit: 10060,    rate: 0.14 },
  { limit: 16150,    rate: 0.20 },
  { limit: 22440,    rate: 0.31 },
  { limit: 46690,    rate: 0.35 },
  { limit: 60130,    rate: 0.47 },
  { limit: Infinity, rate: 0.50 },
];

function calculateTax(taxableIncome: number): number {
  let remaining = taxableIncome;
  let tax = 0;
  let prev = 0;
  for (const b of TAX_BRACKETS) {
    const size = b.limit - prev;
    const portion = Math.min(remaining, size);
    if (portion > 0) { tax += portion * b.rate; remaining -= portion; }
    if (remaining <= 0) break;
    prev = b.limit;
  }
  return tax;
}

// ─── Bituach Leumi 2025 ────────────────────────────────────────────────────────

const BL = {
  tier1Limit: 7522,
  reducedNI: 0.0104,
  fullNI: 0.07,
  reducedHealth: 0.031,
  fullHealth: 0.05,
};

function calculateBituachLeumi(gross: number): { ni: number; health: number; total: number } {
  const t1 = Math.min(gross, BL.tier1Limit);
  const t2 = Math.max(0, gross - BL.tier1Limit);
  const ni = t1 * BL.reducedNI + t2 * BL.fullNI;
  const health = t1 * BL.reducedHealth + t2 * BL.fullHealth;
  return { ni, health, total: ni + health };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function getSeniorityYears(employmentStartDate: string): number {
  const ms = Date.now() - new Date(employmentStartDate).getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 365.25));
}

function getHavraahEntitlement(seniorityYears: number): number {
  if (seniorityYears < 1) return 0;
  if (seniorityYears < 2) return 5;
  if (seniorityYears <= 3) return 6;
  if (seniorityYears <= 10) return 7;
  if (seniorityYears <= 15) return 8;
  if (seniorityYears <= 19) return 9;
  return 10;
}

function getAnnualVacationDays(seniorityYears: number, isSixDay: boolean): number {
  const y = Math.floor(seniorityYears);
  if (isSixDay) {
    if (y < 4) return 12;
    if (y < 5) return 14;
    return Math.min(28, 14 + (y - 4));
  } else {
    if (y < 4) return 10;
    if (y < 5) return 12;
    return Math.min(24, 12 + (y - 4));
  }
}

function getShiftDurationHours(shift: Shift): number {
  if (!shift.endTime) return 0;
  const total = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 1000;
  return Math.max(0, (total - shift.breakDurationMinutes * 60) / 3600);
}

function getEffectiveHourlyRate(shift: Shift, profile: UserProfile): number {
  if (shift.hourlyRateSnapshot > 0) return shift.hourlyRateSnapshot;
  let base = profile.hourlyRate;
  const sectorMin = SECTOR_MIN_HOURLY[profile.sector];
  if (base < sectorMin) base = sectorMin;
  if (profile.sector === 'שמירה ואבטחה' && profile.securityGrade) {
    base = SECURITY_GRADE_RATE[profile.securityGrade];
  }
  const pct = WORKER_TYPE_WAGE_PCT[profile.workerType];
  return Math.max(base * pct, LAW.minimumWageHourly * pct);
}

function getSickDayIndex(currentShift: Shift, allShifts: Shift[]): number {
  const sickShifts = allShifts
    .filter(s => s.type === 'מחלה')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const idx = sickShifts.findIndex(s => s.id === currentShift.id);
  if (idx === -1) return 1;
  let streak = 1;
  let ptr = idx;
  while (ptr > 0) {
    const diff = (new Date(sickShifts[ptr].startTime).getTime() - new Date(sickShifts[ptr - 1].startTime).getTime()) / 86400000;
    if (diff <= 1) { streak++; ptr--; } else break;
  }
  return streak;
}

// ─── Public Types ──────────────────────────────────────────────────────────────

export interface PayResult {
  gross: number;
  hours100: number;
  hours125: number;
  hours150: number;
  travelPay: number;
  sickDayStatus?: string;
  shiftTypeBonus?: string;
}

export interface MonthlySlip {
  baseGross: number;
  additions: number;
  totalGross: number;
  incomeTax: number;
  bituachLeumi: number;
  healthInsurance: number;
  pension: number;
  kerenHishtalmut: number;
  net: number;
  employerPension: number;
  employerSeverance: number;
  employerStudyFund: number;
  employerBituachLeumi: number;
  totalEmployerCost: number;
}

// ─── Per-Shift Calculation ─────────────────────────────────────────────────────

export function calculateShift(shift: Shift, allShifts: Shift[], profile: UserProfile): PayResult {
  if (!shift.endTime) return { gross: 0, hours100: 0, hours125: 0, hours150: 0, travelPay: 0 };

  let breakMins = shift.breakDurationMinutes;
  const rawSeconds = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / 1000;
  if (breakMins === 0 && profile.autoBreakDuration > 0 && rawSeconds >= 6 * 3600) {
    breakMins = profile.autoBreakDuration;
  }
  const hours = Math.max(0, (rawSeconds - breakMins * 60) / 3600);
  const rate = getEffectiveHourlyRate(shift, profile);

  let h100 = 0, h125 = 0, h150 = 0, gross = 0;
  let sickDayStatus: string | undefined;
  let shiftTypeBonus: string | undefined;

  switch (shift.type) {
    case 'רגילה': {
      const threshold = 9;
      if (hours <= threshold) { h100 = hours; }
      else if (profile.isSixDayWorkWeek) { h100 = 9; h150 = hours - 9; }
      else {
        h100 = threshold;
        const ot = hours - threshold;
        if (ot <= 2) { h125 = ot; } else { h125 = 2; h150 = ot - 2; }
      }
      gross = h100 * rate + h125 * rate * LAW.overtime125Rate + h150 * rate * LAW.overtime150Rate;
      break;
    }
    case 'מחלה': {
      const idx = getSickDayIndex(shift, allShifts);
      if (idx === 1) { gross = 0; sickDayStatus = 'יום מחלה 1 (0%)'; }
      else if (idx <= 3) { gross = hours * rate * 0.5; sickDayStatus = `יום מחלה ${idx} (50%)`; }
      else { gross = hours * rate; sickDayStatus = `יום מחלה ${idx} (100%)`; }
      h100 = hours;
      break;
    }
    case 'חופש': { h100 = hours; gross = hours * rate; break; }
    case 'חג': { h150 = hours; gross = hours * rate * LAW.holidayRate; shiftTypeBonus = 'חג (150%)'; break; }
    case 'שבת': { h150 = hours; gross = hours * rate * LAW.shabbatRate; shiftTypeBonus = 'שבת (150%)'; break; }
    case 'אבל': { h100 = hours; gross = hours * rate; shiftTypeBonus = 'אבל (100%)'; break; }
    case 'מילואים': { h100 = hours; gross = hours * rate; shiftTypeBonus = 'מילואים (100%)'; break; }
  }

  let travelPay = 0;
  if (profile.fixedTravelPay === 0 && ['רגילה', 'חג', 'שבת'].includes(shift.type)) {
    travelPay = Math.min(profile.travelRatePerDay, LAW.maxTravelPerDay);
  }
  gross += travelPay;

  return { gross, hours100: h100, hours125: h125, hours150: h150, travelPay, sickDayStatus, shiftTypeBonus };
}

// ─── Monthly Slip ──────────────────────────────────────────────────────────────

export function calculateMonthlySlip(baseGross: number, profile: UserProfile): MonthlySlip {
  const additions = profile.fixedBonus + profile.cibusAmount + profile.fuelAmount + profile.fixedTravelPay;
  const totalGross = baseGross + additions;

  const pensionRate = profile.pensionEmployeeRate || 6;
  const pension = totalGross * (pensionRate / 100);

  const studyFundRate = profile.hasStudyFund ? (profile.studyFundEmployeeRate || 2.5) : 0;
  const kerenHishtalmut = totalGross * (studyFundRate / 100);

  const bl = calculateBituachLeumi(totalGross);

  const taxable = totalGross - pension - kerenHishtalmut;
  let tax = calculateTax(taxable);
  const credits = profile.taxCreditPoints * LAW.taxCreditPointValue;
  tax = Math.max(0, tax - credits);

  const net = totalGross - tax - bl.total - pension - kerenHishtalmut;

  const employerPensionRate = profile.pensionEmployerRate || 6.5;
  const employerPension = totalGross * (employerPensionRate / 100);
  const employerSeverance = totalGross * ((profile.severanceRate || 6) / 100);
  const employerStudyFundRate = profile.hasStudyFund ? 7.5 : 0;
  const employerStudyFund = totalGross * (employerStudyFundRate / 100);
  const employerBL = totalGross * 0.0751;
  const totalEmployerCost = totalGross + employerPension + employerSeverance + employerStudyFund + employerBL;

  return {
    baseGross, additions, totalGross, incomeTax: tax,
    bituachLeumi: bl.ni, healthInsurance: bl.health,
    pension, kerenHishtalmut, net,
    employerPension, employerSeverance, employerStudyFund,
    employerBituachLeumi: employerBL, totalEmployerCost,
  };
}

// ─── Havraah ───────────────────────────────────────────────────────────────────

export function calculateHavraah(profile: UserProfile, forYear = 2025): number {
  const years = getSeniorityYears(profile.employmentStartDate);
  const days = getHavraahEntitlement(years);
  if (days === 0) return 0;
  const rate = Math.max(LAW.havraahDayRate, (profile.sector === 'ניקיון ותחזוקה' ? 502.37 : profile.sector === 'שמירה ואבטחה' ? 501.9 : profile.sector === 'מגזר ציבורי' ? 471.4 : LAW.havraahDayRate));
  let total = days * rate;
  if (forYear === 2024 || forYear === 2025) total *= (1 - LAW.havraahWarDeduction);
  return total;
}

// ─── Monthly income helper ─────────────────────────────────────────────────────

export function calculateMonthlyIncome(
  shifts: Shift[],
  payments: ManualPayment[],
  profile: UserProfile,
  month: number,
  year: number,
): number {
  const shiftsIncome = shifts
    .filter(s => {
      const d = new Date(s.startTime);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((sum, s) => sum + calculateShift(s, shifts, profile).gross, 0);

  const paymentsIncome = payments
    .filter(p => {
      const d = new Date(p.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && p.includeInShiftCalculation;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return shiftsIncome + paymentsIncome;
}

export { getHavraahEntitlement, getAnnualVacationDays, getShiftDurationHours };
