import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../utils/theme';

const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

interface Props {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export default function MonthYearPicker({ visible, date, onConfirm, onCancel }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  function confirm() {
    onConfirm(new Date(selectedYear, selectedMonth, 1));
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onCancel}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onCancel}><Text style={s.cancel}>ביטול</Text></TouchableOpacity>
          <Text style={s.title}>בחר חודש</Text>
          <TouchableOpacity onPress={confirm}><Text style={s.confirm}>אישור</Text></TouchableOpacity>
        </View>

        {/* Year selector */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>שנה</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {years.map(y => (
              <TouchableOpacity
                key={y}
                style={[s.chip, y === selectedYear && s.chipActive]}
                onPress={() => setSelectedYear(y)}
              >
                <Text style={[s.chipText, y === selectedYear && s.chipTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Month grid */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>חודש</Text>
          <View style={s.monthGrid}>
            {MONTHS_HE.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[s.monthChip, i === selectedMonth && s.chipActive]}
                onPress={() => setSelectedMonth(i)}
              >
                <Text style={[s.chipText, i === selectedMonth && s.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  confirm: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  section: { padding: Spacing.lg },
  sectionLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700', marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: '#F1F5F9', marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  monthChip: {
    width: '30%', paddingVertical: Spacing.md, alignItems: 'center',
    borderRadius: BorderRadius.lg, backgroundColor: '#F1F5F9',
  },
});
