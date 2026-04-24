import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { calculateShift, calculateMonthlySlip } from '../services/SalaryCalculator';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme';

// Gemini API key – set your real key here (base64-decode if needed)
const GEMINI_API_KEY = 'AIzaSyDgHIU8-LRyDaYzS8VstYbkcdQVsyIWXxc';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

interface Analysis {
  foundSalary: number | null;
  appCalculated: number;
  discrepancy: number;
  isMatch: boolean;
}

export default function AIInsightsScreen() {
  const { profile, shifts, payments, hasActiveSubscription, aiCredits } = useAppStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  if (!profile) return null;

  const canUseAI = hasActiveSubscription || aiCredits > 0;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('הרשאה נדרשת', 'נדרשת גישה לגלריה כדי לבחור תלוש שכר.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri ?? null);
      setImageBase64(asset.base64 ?? null);
      setAnalysis(null);
    }
  }

  async function analyzePayslip() {
    if (!imageBase64) { Alert.alert('שגיאה', 'נא לבחור תלוש שכר'); return; }
    if (!canUseAI) { Alert.alert('פרימיום נדרש', 'יש לשדרג למנוי פרימיום לשימוש ב-AI'); return; }

    setIsAnalyzing(true);
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: 'Extract the net salary (שכר נטו) from this Israeli payslip. Return ONLY the number, nothing else. Example: 6540.50',
              },
              {
                inlineData: { mimeType: 'image/jpeg', data: imageBase64 },
              },
            ],
          }],
        }),
      });

      const json = await response.json();
      const rawText: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const foundSalary = parseFloat(rawText.replace(/[^0-9.]/g, '')) || null;

      // Calculate app's estimate for current month
      const now = new Date();
      const myShifts = shifts.filter(s => s.ownerEmail === profile.email && isSameMonth(s.startTime, now));
      const myPayments = payments.filter(p => p.ownerEmail === profile.email && isSameMonth(p.date, now) && p.includeInShiftCalculation);
      const base = myShifts.reduce((sum, s) => sum + calculateShift(s, shifts, profile).gross, 0)
                 + myPayments.reduce((sum, p) => sum + p.amount, 0);
      const slip = calculateMonthlySlip(base, profile);
      const discrepancy = (foundSalary ?? 0) - slip.net;

      setAnalysis({
        foundSalary,
        appCalculated: slip.net,
        discrepancy,
        isMatch: Math.abs(discrepancy) < 50,
      });
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן לנתח את התלוש. נסה שוב.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>ניתוח תלוש AI</Text>
      <Text style={s.subtitle}>העלה תלוש שכר ונשווה עם החישוב שלנו</Text>

      {/* Image picker */}
      <TouchableOpacity onPress={pickImage} style={s.pickBtn} activeOpacity={0.85}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.previewImage} resizeMode="contain" />
        ) : (
          <View style={s.pickPlaceholder}>
            <Text style={s.pickIcon}>📄</Text>
            <Text style={s.pickText}>בחר תלוש שכר</Text>
            <Text style={s.pickHint}>לחץ לבחירת תמונה מהגלריה</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Analyze button */}
      {imageUri && (
        <TouchableOpacity onPress={analyzePayslip} disabled={isAnalyzing || !canUseAI} activeOpacity={0.85}>
          <LinearGradient
            colors={canUseAI ? [Colors.primary, Colors.secondary] : ['#9CA3AF', '#6B7280']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.analyzeBtn}
          >
            {isAnalyzing
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.analyzeBtnText}>{canUseAI ? '✨ נתח תלוש' : '🔒 נדרש מנוי פרימיום'}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Analysis result */}
      {analysis && (
        <View style={s.resultCard}>
          <Text style={s.resultTitle}>תוצאות הניתוח</Text>

          <View style={[s.matchBanner, { backgroundColor: analysis.isMatch ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }]}>
            <Text style={[s.matchIcon, { color: analysis.isMatch ? Colors.success : Colors.danger }]}>
              {analysis.isMatch ? '✅' : '⚠️'}
            </Text>
            <Text style={[s.matchText, { color: analysis.isMatch ? Colors.success : Colors.danger }]}>
              {analysis.isMatch ? 'השכר תואם את החישוב' : 'נמצאה אי-התאמה'}
            </Text>
          </View>

          <ResultRow label="שכר נטו בתלוש" value={analysis.foundSalary !== null ? `₪${analysis.foundSalary.toFixed(2)}` : 'לא נמצא'} />
          <ResultRow label="חישוב האפליקציה" value={`₪${analysis.appCalculated.toFixed(2)}`} />
          <ResultRow
            label="הפרש"
            value={`₪${Math.abs(analysis.discrepancy).toFixed(2)}`}
            valueColor={analysis.discrepancy >= 0 ? Colors.success : Colors.danger}
          />
          {!analysis.isMatch && (
            <Text style={s.warningText}>
              {analysis.discrepancy < 0
                ? 'ייתכן שקיבלת פחות ממגיע לך. מומלץ לבדוק עם המעסיק.'
                : 'קיבלת יותר מהחישוב — ייתכן תשלומים נוספים שלא נרשמו.'}
            </Text>
          )}
        </View>
      )}

      {!canUseAI && (
        <View style={s.premiumBanner}>
          <Text style={s.premiumTitle}>👑 פרימיום נדרש</Text>
          <Text style={s.premiumText}>שדרג למנוי פרימיום לניתוח תלושי שכר עם AI ללא הגבלה.</Text>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function ResultRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={s.resultRow}>
      <Text style={s.resultLabel}>{label}</Text>
      <Text style={[s.resultValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
  pickBtn: {
    borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg,
    borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', minHeight: 180,
    backgroundColor: '#fff', ...Shadow.sm,
  },
  pickPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  pickIcon: { fontSize: 48, marginBottom: Spacing.sm },
  pickText: { fontSize: FontSize.lg, fontWeight: '700', color: '#0F172A' },
  pickHint: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  previewImage: { width: '100%', height: 240 },
  analyzeBtn: { borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  analyzeBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  resultCard: { backgroundColor: '#fff', borderRadius: BorderRadius.xl, padding: Spacing.lg, ...Shadow.md, gap: Spacing.sm },
  resultTitle: { fontSize: FontSize.lg, fontWeight: '800', color: '#0F172A', marginBottom: Spacing.sm },
  matchBanner: { borderRadius: BorderRadius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  matchIcon: { fontSize: 22 },
  matchText: { fontSize: FontSize.md, fontWeight: '700' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  resultLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  resultValue: { fontSize: FontSize.sm, fontWeight: '700', color: '#0F172A' },
  warningText: { fontSize: FontSize.sm, color: Colors.warning, fontStyle: 'italic', marginTop: Spacing.sm },
  premiumBanner: {
    marginTop: Spacing.lg, backgroundColor: 'rgba(37,99,235,0.08)',
    borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center',
  },
  premiumTitle: { fontSize: FontSize.xl, fontWeight: '800', color: '#0F172A', marginBottom: Spacing.sm },
  premiumText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
});
