import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, TextInput, Switch, Alert,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { ManualPayment } from '../models/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../utils/theme';

const PAYMENT_TYPES = ['bonus', 'havraah', 'holiday', 'commission', 'other'];
const PAYMENT_LABELS: Record<string, string> = {
  bonus: 'בונוס', havraah: 'הבראה', holiday: 'דמי חג', commission: 'עמלה', other: 'אחר',
};

export default function ManualPaymentModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile, addPayment } = useAppStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentType, setPaymentType] = useState('other');
  const [includeInCalc, setIncludeInCalc] = useState(true);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  async function handleSave() {
    if (!profile) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('שגיאה', 'יש להזין סכום תקין'); return; }
    if (!description.trim()) { Alert.alert('שגיאה', 'יש להזין תיאור'); return; }

    const payment: ManualPayment = {
      id: Math.random().toString(36).slice(2) + Date.now(),
      ownerEmail: profile.email,
      date: new Date(date).toISOString(),
      amount: amt,
      paymentDescription: description.trim(),
      includeInShiftCalculation: includeInCalc,
      paymentType,
    };
    await addPayment(payment);
    onClose();
    setAmount(''); setDescription(''); setPaymentType('other'); setIncludeInCalc(true);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>ביטול</Text></TouchableOpacity>
          <Text style={s.title}>תשלום ידני</Text>
          <TouchableOpacity onPress={handleSave}><Text style={s.save}>שמור</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>

          <Text style={s.label}>סכום (₪)</Text>
          <TextInput
            style={s.input} value={amount} onChangeText={setAmount}
            keyboardType="decimal-pad" placeholder="0.00" textAlign="right"
          />

          <Text style={s.label}>תיאור</Text>
          <TextInput
            style={s.input} value={description} onChangeText={setDescription}
            placeholder="תיאור התשלום" textAlign="right"
          />

          <Text style={s.label}>תאריך (YYYY-MM-DD)</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} textAlign="right" />

          <Text style={s.label}>סוג תשלום</Text>
          <View style={s.typeGrid}>
            {PAYMENT_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.typeChip, t === paymentType && s.typeChipActive]}
                onPress={() => setPaymentType(t)}
              >
                <Text style={[s.typeText, t === paymentType && s.typeTextActive]}>{PAYMENT_LABELS[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.toggleRow}>
            <Text style={s.label}>כלול בחישוב משמרות</Text>
            <Switch
              value={includeInCalc}
              onValueChange={setIncludeInCalc}
              trackColor={{ true: Colors.primary }}
            />
          </View>
          <Text style={s.hint}>
            {includeInCalc ? 'התשלום יחושב עם ניכויי מס' : 'התשלום ירשם כנטו ללא ניכויים'}
          </Text>
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
  scroll: { padding: Spacing.lg },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: '#E2E8F0', fontSize: FontSize.md, color: '#0F172A',
    marginBottom: Spacing.md,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  typeChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: '#F1F5F9',
  },
  typeChipActive: { backgroundColor: Colors.primary },
  typeText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  hint: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.lg },
});
