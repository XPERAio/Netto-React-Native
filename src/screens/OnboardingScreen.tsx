import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, I18nManager,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { Colors, BorderRadius, Spacing, FontSize } from '../utils/theme';

// Force RTL for Hebrew
I18nManager.forceRTL(true);

export default function OnboardingScreen() {
  const { login, signUp, resetPassword, isLoading, authError } = useAppStore();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function handleAuth() {
    setError('');
    if (!email.trim() || !password.trim()) { setError('אנא מלא את כל השדות'); return; }
    const cleanEmail = email.trim().toLowerCase();
    if (isSignUp) {
      if (!name.trim()) { setError('אנא הזן שם'); return; }
      const ok = await signUp(cleanEmail, password, name.trim());
      if (!ok) setError(authError ?? 'שגיאה ביצירת חשבון');
    } else {
      const ok = await login(cleanEmail, password);
      if (!ok) setError(authError ?? 'שגיאה בהתחברות');
    }
  }

  async function handleReset() {
    if (!email.trim()) { Alert.alert('שגיאה', 'נא להזין אימייל לאיפוס'); return; }
    try {
      await resetPassword(email.trim().toLowerCase());
      Alert.alert('איפוס סיסמה', `נשלח מייל לאיפוס סיסמה לכתובת:\n${email}`);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשלוח מייל לאיפוס');
    }
  }

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E', '#16213E']} style={s.container}>
      {/* Decorative blobs */}
      <View style={[s.blob, { top: -60, left: -80, backgroundColor: 'rgba(37,99,235,0.3)' }]} />
      <View style={[s.blob, { bottom: 100, right: -80, backgroundColor: 'rgba(147,51,234,0.3)' }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo area */}
          <View style={s.logoArea}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={s.logoCircle}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={s.logoText}>₪</Text>
            </LinearGradient>
            <Text style={s.appName}>נטו</Text>
            <Text style={s.subtitle}>{isSignUp ? 'יצירת חשבון חדש' : 'ברוך שובך'}</Text>
          </View>

          {/* Form card */}
          <View style={s.card}>
            {isSignUp && (
              <InputField icon="👤" placeholder="שם מלא" value={name} onChangeText={setName} />
            )}
            <InputField
              icon="✉️" placeholder="אימייל" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
            />
            <InputField
              icon="🔒" placeholder="סיסמה" value={password} onChangeText={setPassword}
              secureTextEntry
            />

            {!isSignUp && (
              <TouchableOpacity onPress={handleReset} style={{ alignSelf: 'flex-end', marginBottom: Spacing.sm }}>
                <Text style={s.forgotText}>שכחת סיסמה?</Text>
              </TouchableOpacity>
            )}

            {error !== '' && <Text style={s.errorText}>{error}</Text>}

            <TouchableOpacity onPress={handleAuth} disabled={isLoading} style={s.btnWrap}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.btn}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>{isSignUp ? 'צור חשבון' : 'התחבר'}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Toggle sign-up/login */}
          <TouchableOpacity
            onPress={() => { setIsSignUp(v => !v); setError(''); }}
            style={s.toggleWrap}
          >
            <Text style={s.toggleGray}>{isSignUp ? 'יש לך כבר משתמש? ' : 'אין לך משתמש? '}</Text>
            <Text style={s.toggleBold}>{isSignUp ? 'התחבר כאן' : 'הירשם עכשיו'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function InputField({
  icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry,
}: {
  icon: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; keyboardType?: any;
  autoCapitalize?: any; secureTextEntry?: boolean;
}) {
  return (
    <View style={s.inputRow}>
      <Text style={s.inputIcon}>{icon}</Text>
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        secureTextEntry={secureTextEntry}
        textAlign="right"
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  blob: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 20, elevation: 12,
  },
  logoText: { fontSize: 52, color: '#fff', fontWeight: '900' },
  appName: { fontSize: 36, fontWeight: '900', color: '#fff', marginTop: Spacing.md },
  subtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  inputIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: { flex: 1, color: '#fff', fontSize: FontSize.md, paddingVertical: 14 },
  forgotText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
  errorText: { color: '#F87171', textAlign: 'center', marginBottom: Spacing.sm },
  btnWrap: { marginTop: Spacing.sm },
  btn: { borderRadius: BorderRadius.lg, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  toggleWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  toggleGray: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.sm },
  toggleBold: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
});
