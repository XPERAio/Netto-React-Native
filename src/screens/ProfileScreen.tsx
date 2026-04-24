import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { UserProfile, WorkerSector, WorkerType, SecurityGrade } from '../models/types';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme';

const ALL_SECTORS: WorkerSector[] = [
  'כללי', 'שמירה ואבטחה', 'ניקיון ותחזוקה', 'הסעדה',
  'בנייה ושיפוצים', 'מלונאות', 'כוח אדם', 'הוראה', 'מגזר ציבורי',
];
const ALL_WORKER_TYPES: WorkerType[] = [
  'בוגר', 'נוער עד 16', 'נוער 16-17', 'נוער 17-18', 'חניך', 'בעל מוגבלות',
];
const ALL_SECURITY_GRADES: SecurityGrade[] = [
  'מאבטח בסיס', 'מאבטח מתקדם א׳', 'מאבטח מתקדם ב׳', 'מאבטח בכיר', 'מאבטח בכיר ירושלים',
];

export default function ProfileScreen() {
  const { profile, saveProfile, logout, deleteAccount } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  if (!profile) return null;

  const current = draft ?? profile;

  function startEdit() { setDraft({ ...profile }); setIsEditing(true); }

  function update(key: keyof UserProfile, value: any) {
    setDraft(prev => prev ? { ...prev, [key]: value } : null);
  }

  async function handleSave() {
    if (!draft) return;
    setIsSaving(true);
    try {
      await saveProfile(draft);
      setIsEditing(false);
      setDraft(null);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשמור. נסה שוב.');
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEdit() { setDraft(null); setIsEditing(false); }

  function confirmLogout() {
    Alert.alert('התנתקות', 'האם להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התנתק', onPress: logout },
    ]);
  }

  function confirmDelete() {
    Alert.alert('מחיקת חשבון', 'פעולה זו תמחק את כל המידע שלך ולא ניתן לשחזר אותה.', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק לצמיתות', style: 'destructive', onPress: deleteAccount },
    ]);
  }

  return (
    <View style={s.container}>
      {/* Sticky header */}
      <View style={s.stickyHeader}>
        <Text style={s.headerTitle}>פרופיל אישי</Text>
        {isEditing ? (
          <View style={s.headerActions}>
            <TouchableOpacity onPress={cancelEdit} style={s.cancelBtn}>
              <Text style={s.cancelBtnText}>ביטול</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={s.saveBtn} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>שמור</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={startEdit} style={s.editBtn}>
            <Text style={s.editBtnText}>✏️ ערוך</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSaved && (
        <View style={s.savedToast}>
          <Text style={s.savedToastText}>✅ הפרופיל נשמר בהצלחה</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <View style={s.avatarRow}>
          <View style={s.avatar}>
            <Text style={s.avatarInitial}>{current.name.charAt(0) || '?'}</Text>
          </View>
          <Text style={s.avatarName}>{current.name} {current.lastName}</Text>
          <Text style={s.avatarEmail}>{current.email}</Text>
        </View>

        {/* Card: Personal Info */}
        <ProfileCard title="פרטים אישיים" icon="👤">
          <InputRow label="שם פרטי" value={current.name} editable={isEditing} onChangeText={v => update('name', v)} />
          <Divider />
          <InputRow label="שם משפחה" value={current.lastName} editable={isEditing} onChangeText={v => update('lastName', v)} />
          <Divider />
          <InputRow label="טלפון" value={current.phone} editable={isEditing} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
        </ProfileCard>

        {/* Card: Employment */}
        <ProfileCard title="תנאי העסקה" icon="💼">
          <NumberRow label="יעד חודשי (₪)" value={current.monthlyGoal} editable={isEditing} onChange={v => update('monthlyGoal', v)} />
          <Divider />
          <NumberRow label="שכר שעתי (₪)" value={current.hourlyRate} editable={isEditing} onChange={v => update('hourlyRate', v)} />
          <Divider />
          <ToggleRow label="שבוע עבודה 6 ימים" value={current.isSixDayWorkWeek} editable={isEditing} onChange={v => update('isSixDayWorkWeek', v)} />
          <Divider />
          <PickerRow
            label="מגזר"
            value={current.sector}
            options={ALL_SECTORS}
            editable={isEditing}
            onChange={v => update('sector', v)}
          />
          <Divider />
          <PickerRow
            label="סוג עובד"
            value={current.workerType}
            options={ALL_WORKER_TYPES}
            editable={isEditing}
            onChange={v => update('workerType', v)}
          />
          {current.sector === 'שמירה ואבטחה' && (
            <>
              <Divider />
              <PickerRow
                label="דרגת אבטחה"
                value={current.securityGrade ?? ''}
                options={ALL_SECURITY_GRADES}
                editable={isEditing}
                onChange={v => update('securityGrade', v)}
              />
            </>
          )}
        </ProfileCard>

        {/* Card: Tax & Deductions */}
        <ProfileCard title="מיסים והפרשות" icon="📊">
          <NumberRow label="נקודות זיכוי" value={current.taxCreditPoints} editable={isEditing} onChange={v => update('taxCreditPoints', v)} />
          <Divider />
          <NumberRow label="פנסיה עובד (%)" value={current.pensionEmployeeRate} editable={isEditing} onChange={v => update('pensionEmployeeRate', v)} />
          <Divider />
          <NumberRow label="פנסיה מעסיק (%)" value={current.pensionEmployerRate} editable={isEditing} onChange={v => update('pensionEmployerRate', v)} />
          <Divider />
          <ToggleRow label="קרן השתלמות" value={current.hasStudyFund} editable={isEditing} onChange={v => update('hasStudyFund', v)} />
          {current.hasStudyFund && (
            <>
              <Divider />
              <NumberRow label="קרן עובד (%)" value={current.studyFundEmployeeRate} editable={isEditing} onChange={v => update('studyFundEmployeeRate', v)} />
            </>
          )}
        </ProfileCard>

        {/* Card: Additions */}
        <ProfileCard title="תוספות קבועות" icon="➕">
          <NumberRow label="נסיעות יומיות (₪)" value={current.travelRatePerDay} editable={isEditing} onChange={v => update('travelRatePerDay', v)} />
          <Divider />
          <NumberRow label="בונוס קבוע (₪)" value={current.fixedBonus} editable={isEditing} onChange={v => update('fixedBonus', v)} />
          <Divider />
          <NumberRow label="סיבוס / אוכל (₪)" value={current.cibusAmount} editable={isEditing} onChange={v => update('cibusAmount', v)} />
        </ProfileCard>

        {/* Card: Personal Status */}
        <ProfileCard title="מצב אישי" icon="🏠">
          <ToggleRow label="עולה חדש" value={current.isNewImmigrant} editable={isEditing} onChange={v => update('isNewImmigrant', v)} />
          <Divider />
          <ToggleRow label="הורה יחידני" value={current.isSingleParent} editable={isEditing} onChange={v => update('isSingleParent', v)} />
          <Divider />
          <ToggleRow label="חייל משוחרר" value={current.isDischargedSoldier} editable={isEditing} onChange={v => update('isDischargedSoldier', v)} />
          <Divider />
          <ToggleRow label="יש ילדים" value={current.hasChildren} editable={isEditing} onChange={v => update('hasChildren', v)} />
          {current.hasChildren && (
            <>
              <Divider />
              <NumberRow label="מס׳ ילדים מתחת 18" value={current.childrenUnder18Count} editable={isEditing} onChange={v => update('childrenUnder18Count', Math.round(v))} />
            </>
          )}
        </ProfileCard>

        {/* Logout / Delete */}
        <View style={s.actionRow}>
          <TouchableOpacity onPress={confirmLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>🚪 התנתק</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={s.deleteBtn}>
            <Text style={s.deleteText}>🗑 מחק חשבון</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={c.card}>
      <View style={c.cardHeader}>
        <Text style={c.cardIcon}>{icon}</Text>
        <Text style={c.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Divider() { return <View style={c.divider} />; }

function InputRow({ label, value, editable, onChangeText, keyboardType }: {
  label: string; value: string; editable: boolean;
  onChangeText: (v: string) => void; keyboardType?: any;
}) {
  return (
    <View style={c.row}>
      <Text style={c.rowLabel}>{label}</Text>
      {editable ? (
        <TextInput
          style={c.textInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          textAlign="right"
          placeholderTextColor={Colors.textSecondary}
        />
      ) : (
        <Text style={c.rowValue}>{value || '-'}</Text>
      )}
    </View>
  );
}

function NumberRow({ label, value, editable, onChange }: {
  label: string; value: number; editable: boolean; onChange: (v: number) => void;
}) {
  return (
    <View style={c.row}>
      <Text style={c.rowLabel}>{label}</Text>
      {editable ? (
        <TextInput
          style={c.numInput}
          value={String(value)}
          onChangeText={t => { const n = parseFloat(t); if (!isNaN(n)) onChange(n); }}
          keyboardType="decimal-pad"
          textAlign="center"
        />
      ) : (
        <Text style={c.rowValue}>{value}</Text>
      )}
    </View>
  );
}

function ToggleRow({ label, value, editable, onChange }: {
  label: string; value: boolean; editable: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={c.row}>
      <Text style={c.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} disabled={!editable} trackColor={{ true: Colors.primary }} />
    </View>
  );
}

function PickerRow({ label, value, options, editable, onChange }: {
  label: string; value: string; options: string[]; editable: boolean; onChange: (v: string) => void;
}) {
  if (!editable) {
    return (
      <View style={c.row}>
        <Text style={c.rowLabel}>{label}</Text>
        <Text style={c.rowValue}>{value || '-'}</Text>
      </View>
    );
  }
  return (
    <View style={c.pickerWrap}>
      <Text style={c.rowLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[c.chip, opt === value && c.chipActive]}
          >
            <Text style={[c.chipText, opt === value && c.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  stickyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '900', color: '#0F172A' },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  editBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 8, paddingHorizontal: 16 },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  saveBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.full, paddingVertical: 8, paddingHorizontal: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  cancelBtn: { backgroundColor: '#F1F5F9', borderRadius: BorderRadius.full, paddingVertical: 8, paddingHorizontal: 16 },
  cancelBtnText: { color: '#0F172A', fontWeight: '600', fontSize: FontSize.sm },
  savedToast: {
    position: 'absolute', top: 70, alignSelf: 'center', zIndex: 100,
    backgroundColor: 'rgba(22,163,74,0.9)', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  savedToastText: { color: '#fff', fontWeight: '700' },
  scroll: { padding: Spacing.lg },
  avatarRow: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  avatarInitial: { fontSize: 42, color: '#fff', fontWeight: '900' },
  avatarName: { fontSize: FontSize.xl, fontWeight: '800', color: '#0F172A' },
  avatarEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  logoutBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    padding: Spacing.md, alignItems: 'center', ...Shadow.sm,
  },
  logoutText: { fontWeight: '700', color: '#0F172A', fontSize: FontSize.md },
  deleteBtn: {
    flex: 1, backgroundColor: Colors.danger, borderRadius: BorderRadius.xl,
    padding: Spacing.md, alignItems: 'center', ...Shadow.sm,
  },
  deleteText: { fontWeight: '700', color: '#fff', fontSize: FontSize.md },
});

const c = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  cardIcon: { fontSize: 18 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontWeight: '600', color: '#0F172A', textAlign: 'right' },
  textInput: {
    fontSize: FontSize.sm, color: '#0F172A', textAlign: 'right',
    borderBottomWidth: 1, borderBottomColor: Colors.primary, minWidth: 120, paddingBottom: 2,
  },
  numInput: {
    fontSize: FontSize.sm, color: '#0F172A', textAlign: 'center',
    backgroundColor: '#F1F5F9', borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 6, minWidth: 80,
  },
  pickerWrap: { paddingVertical: 4 },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: '#F1F5F9',
    marginRight: Spacing.sm, marginBottom: Spacing.xs,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});
