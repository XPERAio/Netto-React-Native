import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { calculateShift, calculateMonthlySlip } from '../services/SalaryCalculator';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme';
import MonthYearPicker from '../components/MonthYearPicker';

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export default function StatsScreen() {
  const { profile, shifts, payments } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  if (!profile) return null;

  const myShifts = shifts.filter(s => s.ownerEmail === profile.email);
  const myPayments = payments.filter(p => p.ownerEmail === profile.email);

  const filteredShifts = myShifts.filter(s => isSameMonth(s.startTime, selectedDate));
  const filteredPayments = myPayments.filter(p => isSameMonth(p.date, selectedDate) && p.includeInShiftCalculation);

  const shiftsBase = filteredShifts.reduce((sum, s) => sum + calculateShift(s, myShifts, profile).gross, 0);
  const paymentsTotal = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const slip = calculateMonthlySlip(shiftsBase + paymentsTotal, profile);

  const isEmpty = filteredShifts.length === 0 && filteredPayments.length === 0;
  const monthLabel = selectedDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  // Bar chart data (daily earnings)
  const dailyMap: Record<number, number> = {};
  filteredShifts.forEach(s => {
    const day = new Date(s.startTime).getDate();
    const pay = calculateShift(s, myShifts, profile).gross;
    dailyMap[day] = (dailyMap[day] ?? 0) + pay;
  });
  const maxPay = Math.max(...Object.values(dailyMap), 1);

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>תובנות</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={s.datePicker}>
            <Text style={s.datePickerText}>📅 {monthLabel}</Text>
          </TouchableOpacity>
        </View>

        {isEmpty ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>אין נתונים לחודש זה</Text>
          </View>
        ) : (
          <>
            {/* Net salary card */}
            <View style={s.slipCard}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.slipHeader}
              >
                <Text style={s.slipHeaderLabel}>נטו משוער</Text>
                <Text style={s.slipHeaderAmount}>₪{slip.net.toFixed(2)}</Text>
              </LinearGradient>

              <View style={s.slipBody}>
                <SlipRow label="שכר בסיס" amount={slip.baseGross} />
                {slip.additions > 0 && <SlipRow label="תוספות" amount={slip.additions} color={Colors.success} />}
                <View style={s.divider} />
                <SlipRow label="ברוטו" amount={slip.totalGross} bold />
                <View style={s.divider} />
                <SlipRow label="ביטוח לאומי" amount={-slip.bituachLeumi} color={Colors.danger} />
                <SlipRow label="מס הכנסה" amount={-slip.incomeTax} color={Colors.danger} />
                <SlipRow label="פנסיה" amount={-slip.pension} color={Colors.warning} />
                {slip.kerenHishtalmut > 0 && (
                  <SlipRow label="קרן השתלמות" amount={-slip.kerenHishtalmut} color={Colors.warning} />
                )}
                <View style={s.divider} />
                <SlipRow label="נטו" amount={slip.net} bold color={Colors.success} />
              </View>
            </View>

            {/* Daily bar chart */}
            {Object.keys(dailyMap).length > 0 && (
              <View style={s.chartCard}>
                <Text style={s.chartTitle}>הכנסות יומיות</Text>
                <View style={s.chart}>
                  {Object.entries(dailyMap).map(([day, pay]) => (
                    <View key={day} style={s.bar}>
                      <LinearGradient
                        colors={[Colors.primary, Colors.secondary]}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        style={[s.barFill, { height: Math.max(4, (pay / maxPay) * 120) }]}
                      />
                      <Text style={s.barLabel}>{day}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Employer cost breakdown */}
            <View style={s.employerCard}>
              <Text style={s.chartTitle}>עלות מעסיק</Text>
              <SlipRow label="פנסיה מעסיק" amount={slip.employerPension} />
              <SlipRow label="פיצויים" amount={slip.employerSeverance} />
              {slip.employerStudyFund > 0 && <SlipRow label="קרן השתלמות מעסיק" amount={slip.employerStudyFund} />}
              <SlipRow label="ביטוח לאומי מעסיק" amount={slip.employerBituachLeumi} />
              <View style={s.divider} />
              <SlipRow label="עלות כוללת" amount={slip.totalEmployerCost} bold color={Colors.primary} />
            </View>
          </>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      <MonthYearPicker
        visible={showPicker}
        date={selectedDate}
        onConfirm={d => { setSelectedDate(d); setShowPicker(false); }}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
}

function SlipRow({ label, amount, bold, color }: { label: string; amount: number; bold?: boolean; color?: string }) {
  const isNeg = amount < 0;
  return (
    <View style={s.slipRow}>
      <Text style={[s.slipLabel, bold && { fontWeight: '700' }]}>{label}</Text>
      <Text style={[s.slipAmount, bold && { fontWeight: '800' }, color ? { color } : isNeg ? { color: Colors.danger } : {}]}>
        ₪{Math.abs(amount).toFixed(2)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: '900', color: '#0F172A' },
  datePicker: {
    backgroundColor: '#fff', borderRadius: BorderRadius.md, padding: Spacing.sm, ...Shadow.sm,
  },
  datePickerText: { fontSize: FontSize.sm, fontWeight: '600', color: '#0F172A' },
  empty: { alignItems: 'center', padding: Spacing.xxl },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  slipCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg, ...Shadow.md },
  slipHeader: { padding: Spacing.xl, alignItems: 'center' },
  slipHeaderLabel: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, fontWeight: '600' },
  slipHeaderAmount: { color: '#fff', fontSize: 46, fontWeight: '900' },
  slipBody: { backgroundColor: '#fff', padding: Spacing.lg, gap: Spacing.sm },
  slipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  slipLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  slipAmount: { fontSize: FontSize.sm, fontWeight: '600', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: Spacing.xs },
  chartCard: { backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.sm },
  chartTitle: { fontSize: FontSize.md, fontWeight: '700', color: '#0F172A', marginBottom: Spacing.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 4 },
  bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 2 },
  employerCard: { backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadow.sm, gap: Spacing.sm },
});
