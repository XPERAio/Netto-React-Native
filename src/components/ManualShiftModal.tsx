import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { Shift, ShiftType, SHIFT_TYPE_COLOR } from '../models/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../utils/theme';

const SHIFT_TYPES: ShiftType[] = ['רגילה', 'מחלה', 'חופש', 'חג', 'שבת', 'אבל', 'מילואים'];

export default function ManualShiftModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile, addShift } = useAppStore();

  const [type, setType] = useState<ShiftType>('רגילה');
  const [date, setDate] = useState(formatDate(new Date()));
  const [startHour, setStartHour] = useState('08:00');
  const [endHour, setEndHour] = useState('17:00');
  const [breakMins, setBreakMins] = useState('0');
  const [notes, setNotes] = useState('');

  function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function parseDateTime(dateStr: string, timeStr: string): Date | null {
    try {
      return new Date(`${dateStr}T${timeStr}:00`);
    } catch { return null; }
  }

  async function handleSave() {
    if (!profile) return;
    const start = parseDateTime(date, startHour);
    const end = parseDateTime(date, endHour);
    if (!start || !end) { Alert.alert('שגיאה', 'תאריך/שעה לא תקין'); return; }
    if (end <= start) { Alert.alert('שגיאה', 'שעת סיום חייבת להיות אחרי שעת התחלה'); return; }

    const shift: Shift = {
      id: Math.random().toString(36).slice(2) + Date.now(),
      ownerEmail: profile.email,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      type,
      hourlyRateSnapshot: profile.hourlyRate,
      breakDurationMinutes: parseInt(breakMins, 10) || 0,
      notes,
      isManualEntry: true,
      isHolidayWorkedByChoice: false,
      isShabbatWork: type === 'שבת',
      travelPaid: 0,
    };
    await addShift(shift);
    onClose();
    resetForm();
  }

  function resetForm() {
    setType('רגילה'); setDate(formatDate(new Date()));
    setStartHour('08:00'); setEndHour('17:00'); setBreakMins('0'); setNotes('');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>ביטול</Text></TouchableOpacity>
          <Text style={s.title}>משמרת ידנית</Text>
          <TouchableOpacity onPress={handleSave}><Text style={s.save}>שמור</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Shift type selector */}
          <Text style={s.label}>סוג משמרת</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll}>
            {SHIFT_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.typeChip, { borderColor: SHIFT_TYPE_COLOR[t] }, t === type && { backgroundColor: SHIFT_TYPE_COLOR[t] + '22' }]}
                onPress={() => setType(t)}
              >
                <Text style={[s.typeText, { color: SHIFT_TYPE_COLOR[t] }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date */}
          <Text style={s.label}>תאריך (YYYY-MM-DD)</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="2025-01-15" textAlign="right" />

          {/* Time range */}
          <View style={s.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>שעת התחלה</Text>
              <TextInput style={s.input} value={startHour} onChangeText={setStartHour} placeholder="08:00" textAlign="center" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>שעת סיום</Text>
              <TextInput style={s.input} value={endHour} onChangeText={setEndHour} placeholder="17:00" textAlign="center" />
            </View>
          </View>

          {/* Break */}
          <Text style={s.label}>הפסקה (דקות)</Text>
          <TextInput style={s.input} value={breakMins} onChangeText={setBreakMins} keyboardType="number-pad" textAlign="right" />

          {/* Notes */}
          <Text style={s.label}>הערות</Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes} onChangeText={setNotes}
            multiline placeholder="הערות..." textAlign="right"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#fff',
  },
  cancel: { fontSize: FontSize.md, color: Colors.textSecondary },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: '#0F172A' },
  save: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  scroll: { padding: Spacing.lg, gap: Spacing.sm },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: '#E2E8F0', fontSize: FontSize.md, color: '#0F172A',
    marginBottom: Spacing.md,
  },
  typeScroll: { marginBottom: Spacing.lg },
  typeChip: {
    borderWidth: 1.5, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  typeText: { fontSize: FontSize.sm, fontWeight: '700' },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
});
