import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Modal, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { calculateMonthlyIncome } from '../services/SalaryCalculator';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../utils/theme';
import ManualShiftModal from '../components/ManualShiftModal';
import ManualPaymentModal from '../components/ManualPaymentModal';

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TrackerScreen({ navigation }: any) {
  const {
    profile, shifts, payments, activeShiftStartTime,
    startShift, stopShift,
  } = useAppStore();

  const [elapsed, setElapsed] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const isWorking = activeShiftStartTime > 0;

  // Spinning ring animation
  const spin = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef<Animated.CompositeAnimation | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isWorking) {
      spinAnim.current = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 3000, useNativeDriver: true })
      );
      spinAnim.current.start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      spinAnim.current?.stop();
      spin.setValue(0);
      pulse.setValue(1.0);
    }
  }, [isWorking]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeShiftStartTime > 0) {
        setElapsed(Date.now() - activeShiftStartTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeShiftStartTime]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  async function handleToggle() {
    Vibration.vibrate(30);
    if (isWorking) {
      await stopShift();
      setElapsed(0);
    } else {
      startShift();
    }
  }

  const now = new Date();
  const monthlyIncome = profile
    ? calculateMonthlyIncome(shifts.filter(s => s.ownerEmail === profile.email), payments.filter(p => p.ownerEmail === profile.email), profile, now.getMonth() + 1, now.getFullYear())
    : 0;
  const goal = profile?.monthlyGoal ?? 10000;
  const progressPct = Math.min(1, monthlyIncome / Math.max(goal, 1));

  return (
    <View style={s.container}>
      {/* Background gradient blob */}
      <View style={s.blobBg} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Timer Ring */}
        <View style={s.ringWrap}>
          {/* Background circle */}
          <View style={s.ringBg} />

          {/* Spinning arc */}
          {isWorking && (
            <Animated.View style={[s.arc, { transform: [{ rotate }] }]}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary, 'transparent']}
                style={s.arcGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
            </Animated.View>
          )}

          {/* Center content */}
          <View style={s.ringCenter}>
            <Text style={[s.statusText, { color: isWorking ? Colors.success : Colors.textSecondary }]}>
              {isWorking ? 'משמרת פעילה' : 'מוכן לעבודה'}
            </Text>
            <Text style={s.timerText}>{formatElapsed(elapsed)}</Text>
            <Text style={s.timerLabel}>זמן שעבר</Text>
          </View>
        </View>

        {/* Start / Stop button */}
        <Animated.View style={{ transform: [{ scale: isWorking ? pulse : 1 }] }}>
          <TouchableOpacity onPress={handleToggle} activeOpacity={0.85}>
            {isWorking ? (
              <View style={[s.mainBtn, s.stopBtn]}>
                <Text style={[s.mainBtnIcon, { color: Colors.danger }]}>⏹</Text>
                <Text style={[s.mainBtnText, { color: Colors.danger }]}>סיים משמרת</Text>
              </View>
            ) : (
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.mainBtn, s.startBtn]}
              >
                <Text style={[s.mainBtnIcon, { color: '#fff' }]}>▶</Text>
                <Text style={[s.mainBtnText, { color: '#fff' }]}>התחל משמרת</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Quick actions */}
        <View style={s.actionsGrid}>
          <ActionCard icon="✏️" title="משמרת ידנית" color={Colors.primary} onPress={() => setShowManual(true)} />
          <ActionCard icon="💵" title="תשלום ידני" color={Colors.success} onPress={() => setShowPayment(true)} />
          <ActionCard icon="✨" title="סריקת תלוש" color={Colors.secondary} onPress={() => navigation.navigate('AIInsights')} />
          <ActionCard icon="📊" title="היסטוריה" color={Colors.warning} onPress={() => navigation.navigate('History')} />
        </View>

        {/* Monthly progress */}
        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <Text style={s.progressTitle}>מצב חודשי</Text>
            <Text style={s.progressGoal}>יעד: ₪{goal.toFixed(0)}</Text>
          </View>
          <View style={s.progressBar}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.progressFill, { width: `${Math.round(progressPct * 100)}%` }]}
            />
          </View>
          <View style={s.progressFooter}>
            <Text style={s.progressAmount}>₪{monthlyIncome.toFixed(0)}</Text>
            <Text style={s.progressPct}>{Math.round(progressPct * 100)}%</Text>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <ManualShiftModal visible={showManual} onClose={() => setShowManual(false)} />
      <ManualPaymentModal visible={showPayment} onClose={() => setShowPayment(false)} />
    </View>
  );
}

function ActionCard({ icon, title, color, onPress }: { icon: string; title: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.actionCard}>
      <View style={[s.actionIcon, { backgroundColor: color + '22' }]}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={s.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const RING_SIZE = 260;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  blobBg: {
    position: 'absolute', top: -120, alignSelf: 'center',
    width: 380, height: 380, borderRadius: 190,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  scroll: { alignItems: 'center', paddingTop: Spacing.xl + Spacing.md },
  ringWrap: {
    width: RING_SIZE + 20, height: RING_SIZE + 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  ringBg: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2,
    borderWidth: 18, borderColor: 'rgba(0,0,0,0.06)',
  },
  arc: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2,
    overflow: 'hidden',
  },
  arcGradient: {
    width: RING_SIZE / 2, height: RING_SIZE,
  },
  ringCenter: { alignItems: 'center' },
  statusText: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 4 },
  timerText: { fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'], color: '#0F172A' },
  timerLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  mainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: 200, height: 54, borderRadius: BorderRadius.full,
    gap: Spacing.sm, marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  startBtn: {},
  stopBtn: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1.5, borderColor: Colors.danger,
  },
  mainBtnIcon: { fontSize: 18 },
  mainBtnText: { fontSize: FontSize.lg, fontWeight: '700' },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: '100%', paddingHorizontal: Spacing.lg, gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    width: '47%', backgroundColor: '#fff',
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'center', gap: Spacing.sm,
    ...Shadow.sm,
  },
  actionIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: FontSize.sm, fontWeight: '600', color: '#0F172A', textAlign: 'center' },
  progressCard: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: BorderRadius.xl, padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    ...Shadow.sm,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  progressTitle: { fontSize: FontSize.md, fontWeight: '700', color: '#0F172A' },
  progressGoal: { fontSize: FontSize.sm, color: Colors.textSecondary },
  progressBar: { height: 12, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 6, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: '100%', borderRadius: 6 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressAmount: { fontSize: FontSize.xl, fontWeight: '800', color: '#0F172A' },
  progressPct: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  textSecondary: { color: Colors.textSecondary },
});
