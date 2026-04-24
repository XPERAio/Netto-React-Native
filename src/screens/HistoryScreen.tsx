import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SectionList,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { calculateShift } from '../services/SalaryCalculator';
import { Shift, ManualPayment, SHIFT_TYPE_COLOR, SHIFT_TYPE_ICON } from '../models/types';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme';
import MonthYearPicker from '../components/MonthYearPicker';

function formatHM(decimalHours: number): string {
  const h = Math.floor(decimalHours);
  const m = Math.floor((decimalHours - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export default function HistoryScreen() {
  const { profile, shifts, payments, removeShift, removePayment } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'shifts' | 'payments' | 'net'>('shifts');
  const [showPicker, setShowPicker] = useState(false);

  if (!profile) return null;

  const myShifts = shifts.filter(s => s.ownerEmail === profile.email);
  const myPayments = payments.filter(p => p.ownerEmail === profile.email);

  const filteredShifts = myShifts.filter(s => isSameMonth(s.startTime, selectedDate));
  const filteredPayments = myPayments.filter(p => isSameMonth(p.date, selectedDate) && p.includeInShiftCalculation);
  const filteredNet = myPayments.filter(p => isSameMonth(p.date, selectedDate) && !p.includeInShiftCalculation);

  const shiftsTotal = filteredShifts.reduce((sum, s) => sum + calculateShift(s, myShifts, profile).gross, 0);
  const paymentsTotal = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalHours = filteredShifts.reduce((sum, s) => {
    const r = calculateShift(s, myShifts, profile);
    return sum + r.hours100 + r.hours125 + r.hours150;
  }, 0);

  function confirmDeleteShift(shift: Shift) {
    Alert.alert('מחיקת משמרת', 'האם למחוק את המשמרת?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => removeShift(shift.id) },
    ]);
  }

  function confirmDeletePayment(payment: ManualPayment) {
    Alert.alert('מחיקת תשלום', 'האם למחוק את התשלום?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: () => removePayment(payment.id) },
    ]);
  }

  const monthLabel = selectedDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  return (
    <View style={s.container}>

      {/* Summary banner */}
      {(filteredShifts.length > 0 || filteredPayments.length > 0) && (
        <View style={s.banner}>
          <Text style={s.bannerLabel}>סה״כ לחודש</Text>
          <Text style={s.bannerTotal}>₪{(shiftsTotal + paymentsTotal).toFixed(2)}</Text>
          <View style={s.bannerRow}>
            <Text style={s.bannerSub}>⏰ ₪{shiftsTotal.toFixed(0)}</Text>
            <Text style={s.bannerSub}>💵 ₪{paymentsTotal.toFixed(0)}</Text>
            <Text style={s.bannerSub}>⏳ {formatHM(totalHours)} שעות</Text>
          </View>
        </View>
      )}

      {/* Tab + date picker header */}
      <View style={s.tabRow}>
        {(['shifts', 'payments', 'net'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'shifts' ? 'משמרות' : tab === 'payments' ? 'תשלומים' : 'נטו'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => setShowPicker(true)} style={s.datePicker}>
          <Text style={s.datePickerText}>📅 {monthLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* List content */}
      {activeTab === 'shifts' && (
        <FlatList
          data={filteredShifts}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<EmptyState text={`אין משמרות ב-${monthLabel}`} />}
          renderItem={({ item }) => (
            <ShiftRow shift={item} allShifts={myShifts} profile={profile} onDelete={() => confirmDeleteShift(item)} />
          )}
        />
      )}
      {activeTab === 'payments' && (
        <FlatList
          data={filteredPayments}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<EmptyState text={`אין תשלומים ב-${monthLabel}`} />}
          renderItem={({ item }) => <PaymentRow payment={item} onDelete={() => confirmDeletePayment(item)} />}
        />
      )}
      {activeTab === 'net' && (
        <FlatList
          data={filteredNet}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<EmptyState text={`אין תשלומים נטו ב-${monthLabel}`} />}
          renderItem={({ item }) => <PaymentRow payment={item} onDelete={() => confirmDeletePayment(item)} />}
        />
      )}

      <MonthYearPicker
        visible={showPicker}
        date={selectedDate}
        onConfirm={d => { setSelectedDate(d); setShowPicker(false); }}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
}

function ShiftRow({ shift, allShifts, profile, onDelete }: any) {
  const result = calculateShift(shift, allShifts, profile);
  const d = new Date(shift.startTime);
  const dayNum = d.getDate();
  const dayName = d.toLocaleDateString('he-IL', { weekday: 'short' });
  const startStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const endStr = shift.endTime
    ? new Date(shift.endTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : 'פעיל';
  const totalHours = result.hours100 + result.hours125 + result.hours150;

  return (
    <TouchableOpacity style={s.row} onLongPress={onDelete} activeOpacity={0.85}>
      <View style={s.dayBadge}>
        <Text style={s.dayNum}>{dayNum}</Text>
        <Text style={s.dayName}>{dayName}</Text>
      </View>
      <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
        <Text style={s.rowTitle}>{formatHM(totalHours)} שעות</Text>
        <Text style={s.rowSub}>{startStr} - {endStr}</Text>
      </View>
      <Text style={s.rowAmount}>₪{result.gross.toFixed(0)}</Text>
    </TouchableOpacity>
  );
}

function PaymentRow({ payment, onDelete }: any) {
  const d = new Date(payment.date);
  return (
    <TouchableOpacity style={s.row} onLongPress={onDelete} activeOpacity={0.85}>
      <View style={[s.dayBadge, { backgroundColor: 'rgba(22,163,74,0.1)' }]}>
        <Text style={s.dayNum}>{d.getDate()}</Text>
        <Text style={s.dayName}>{d.toLocaleDateString('he-IL', { weekday: 'short' })}</Text>
      </View>
      <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
        <Text style={s.rowTitle}>תשלום ידני</Text>
        <Text style={s.rowSub} numberOfLines={1}>{payment.paymentDescription}</Text>
      </View>
      <Text style={[s.rowAmount, { color: Colors.success }]}>₪{payment.amount.toFixed(0)}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ text }: { text: string }) {
  return <View style={s.empty}><Text style={s.emptyText}>{text}</Text></View>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  banner: {
    backgroundColor: '#fff', padding: Spacing.md, alignItems: 'center',
    ...Shadow.sm,
  },
  bannerLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  bannerTotal: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  bannerRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: 4 },
  bannerSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  datePicker: {
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    backgroundColor: '#F1F5F9', borderRadius: BorderRadius.md, margin: Spacing.sm,
  },
  datePickerText: { fontSize: FontSize.xs, color: '#0F172A', fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 120 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadow.sm,
  },
  dayBadge: {
    width: 45, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: BorderRadius.sm, padding: Spacing.xs,
  },
  dayNum: { fontSize: FontSize.lg, fontWeight: '800', color: '#0F172A' },
  dayName: { fontSize: FontSize.xs, color: Colors.textSecondary },
  rowTitle: { fontSize: FontSize.md, fontWeight: '700', color: '#0F172A' },
  rowSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  rowAmount: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.success },
  empty: { padding: Spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
});
