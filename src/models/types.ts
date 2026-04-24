// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserGender = 'זכר' | 'נקבה' | 'אחר';

export type ShiftType =
  | 'רגילה'
  | 'מחלה'
  | 'חופש'
  | 'חג'
  | 'שבת'
  | 'אבל'
  | 'מילואים';

export type WorkerSector =
  | 'כללי'
  | 'שמירה ואבטחה'
  | 'ניקיון ותחזוקה'
  | 'הסעדה'
  | 'בנייה ושיפוצים'
  | 'מלונאות'
  | 'כוח אדם'
  | 'הוראה'
  | 'מגזר ציבורי';

export type WorkerType =
  | 'בוגר'
  | 'נוער עד 16'
  | 'נוער 16-17'
  | 'נוער 17-18'
  | 'חניך'
  | 'בעל מוגבלות';

export type SecurityGrade =
  | 'מאבטח בסיס'
  | 'מאבטח מתקדם א׳'
  | 'מאבטח מתקדם ב׳'
  | 'מאבטח בכיר'
  | 'מאבטח בכיר ירושלים';

// ─── Shift Type Metadata ───────────────────────────────────────────────────────

export const SHIFT_TYPE_ICON: Record<ShiftType, string> = {
  'רגילה': 'briefcase',
  'מחלה': 'thermometer',
  'חופש': 'airplane',
  'חג': 'star',
  'שבת': 'moon',
  'אבל': 'heart',
  'מילואים': 'shield',
};

export const SHIFT_TYPE_COLOR: Record<ShiftType, string> = {
  'רגילה': '#2563EB',
  'מחלה': '#F97316',
  'חופש': '#9333EA',
  'חג': '#EAB308',
  'שבת': '#4F46E5',
  'אבל': '#6B7280',
  'מילואים': '#16A34A',
};

// ─── Sector Metadata ───────────────────────────────────────────────────────────

export const SECTOR_MIN_HOURLY: Record<WorkerSector, number> = {
  'כללי': 34.32,
  'שמירה ואבטחה': 37.75,
  'ניקיון ותחזוקה': 38.03,
  'הסעדה': 37.76,
  'בנייה ושיפוצים': 34.32,
  'מלונאות': 34.32,
  'כוח אדם': 34.32,
  'הוראה': 34.32,
  'מגזר ציבורי': 34.32,
};

export const SECTOR_MAX_SICK_DAYS: Record<WorkerSector, number> = {
  'כללי': 90,
  'שמירה ואבטחה': 130,
  'ניקיון ותחזוקה': 90,
  'הסעדה': 90,
  'בנייה ושיפוצים': 161,
  'מלונאות': 220,
  'כוח אדם': 130,
  'הוראה': 90,
  'מגזר ציבורי': 90,
};

export const SECTOR_SICK_DAYS_PER_MONTH: Record<WorkerSector, number> = {
  'כללי': 1.5,
  'שמירה ואבטחה': 2.0,
  'ניקיון ותחזוקה': 1.5,
  'הסעדה': 1.5,
  'בנייה ושיפוצים': 2.08,
  'מלונאות': 1.5,
  'כוח אדם': 2.0,
  'הוראה': 1.5,
  'מגזר ציבורי': 1.5,
};

export const SECTOR_HAVRAAH_RATE: Record<WorkerSector, number> = {
  'כללי': 418.0,
  'שמירה ואבטחה': 501.9,
  'ניקיון ותחזוקה': 502.37,
  'הסעדה': 418.0,
  'בנייה ושיפוצים': 418.0,
  'מלונאות': 418.0,
  'כוח אדם': 418.0,
  'הוראה': 418.0,
  'מגזר ציבורי': 471.4,
};

export const WORKER_TYPE_WAGE_PCT: Record<WorkerType, number> = {
  'בוגר': 1.0,
  'נוער עד 16': 0.7,
  'נוער 16-17': 0.75,
  'נוער 17-18': 0.83,
  'חניך': 0.6,
  'בעל מוגבלות': 1.0,
};

export const SECURITY_GRADE_RATE: Record<SecurityGrade, number> = {
  'מאבטח בסיס': 39.47,
  'מאבטח מתקדם א׳': 48.05,
  'מאבטח מתקדם ב׳': 51.48,
  'מאבטח בכיר': 54.91,
  'מאבטח בכיר ירושלים': 54.91,
};

export const CONSTRUCTION_GRADE_MONTHLY: Record<number, number> = {
  1: 6247.67, 2: 6247.67, 3: 6900, 4: 7600,
  5: 8300, 6: 9000, 7: 9700, 8: 10400,
};

// ─── Data Models ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  birthDate: string; // ISO string
  profileImageUri?: string;
  gender: UserGender;
  monthlyGoal: number;

  sector: WorkerSector;
  workerType: WorkerType;
  securityGrade?: SecurityGrade;
  constructionGrade?: number;
  workCapacityPercent?: number;

  hourlyRate: number;
  travelRatePerDay: number;
  isSixDayWorkWeek: boolean;
  taxCreditPoints: number;
  pensionEmployeeRate: number;
  pensionEmployerRate: number;
  severanceRate: number;
  studyFundEmployeeRate: number;
  studyFundEmployerRate: number;
  autoBreakDuration: number;

  employmentStartDate: string; // ISO string
  accumulatedSickDays: number;
  usedSickDays: number;
  accumulatedVacationDays: number;
  usedVacationDays: number;
  lastHavraahPaymentDate?: string;

  fixedTravelPay: number;
  fixedBonus: number;
  cibusAmount: number;
  fuelAmount: number;
  globalOvertimePay: number;

  hasAdditionalIncome: boolean;
  hasStudyFund: boolean;

  maritalStatus: string;
  hasChildren: boolean;
  childrenCount: number;
  childrenUnder18Count: number;

  isNewImmigrant: boolean;
  immigrationDate?: string;
  isSingleParent: boolean;
  isDischargedSoldier: boolean;
  dischargeDate?: string;
}

export const defaultUserProfile = (email: string, name: string): UserProfile => ({
  id: Math.random().toString(36).slice(2),
  email,
  name,
  lastName: '',
  phone: '',
  birthDate: new Date().toISOString(),
  gender: 'זכר',
  monthlyGoal: 10000,
  sector: 'כללי',
  workerType: 'בוגר',
  hourlyRate: 34.32,
  travelRatePerDay: 22.60,
  isSixDayWorkWeek: false,
  taxCreditPoints: 2.25,
  pensionEmployeeRate: 6.0,
  pensionEmployerRate: 6.5,
  severanceRate: 6.0,
  studyFundEmployeeRate: 2.5,
  studyFundEmployerRate: 7.5,
  autoBreakDuration: 0,
  employmentStartDate: new Date().toISOString(),
  accumulatedSickDays: 0,
  usedSickDays: 0,
  accumulatedVacationDays: 0,
  usedVacationDays: 0,
  fixedTravelPay: 0,
  fixedBonus: 0,
  cibusAmount: 0,
  fuelAmount: 0,
  globalOvertimePay: 0,
  hasAdditionalIncome: false,
  hasStudyFund: false,
  maritalStatus: 'רווק',
  hasChildren: false,
  childrenCount: 0,
  childrenUnder18Count: 0,
  isNewImmigrant: false,
  isSingleParent: false,
  isDischargedSoldier: false,
});

export interface Shift {
  id: string;
  ownerEmail: string;
  startTime: string; // ISO string
  endTime?: string;  // ISO string
  type: ShiftType;
  hourlyRateSnapshot: number;
  breakDurationMinutes: number;
  notes?: string;
  isManualEntry: boolean;
  isHolidayWorkedByChoice: boolean;
  isShabbatWork: boolean;
  travelPaid: number;
}

export interface ManualPayment {
  id: string;
  ownerEmail: string;
  date: string; // ISO string
  amount: number;
  paymentDescription: string;
  includeInShiftCalculation: boolean;
  paymentType: string;
}

export interface PayslipDoc {
  id: string;
  ownerEmail: string;
  monthDate: string; // ISO string
  imageUri?: string;
  isPDF: boolean;
  foundSalary?: number;
  discrepancy?: number;
  isMatch?: boolean;
}
