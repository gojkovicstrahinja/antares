import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleLogin = async () => {
    setError('');
    setInfo('');
    if (!email || !password) {
      setError('Unesite email i lozinku.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Unesite ispravnu email adresu.');
      return;
    }
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) setError(loginError.message);
  };

  const handleMagicLink = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Unesite email adresu za magic link.');
      return;
    }
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (otpError) setError(otpError.message);
    else setInfo('Magic link je poslat na ' + email + '. Proverite email.');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>antares</Text>
          <Text style={styles.tagline}>Deljenje prevoza u Srbiji</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ime@primer.rs"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            leftIcon={<Mail size={18} stroke={Colors.gray400} />}
          />
          <Input
            label="Lozinka"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            leftIcon={<Lock size={18} stroke={Colors.gray400} />}
          />

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} stroke={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {info ? (
            <View style={styles.infoBox}>
              <CheckCircle size={16} stroke={Colors.accent} />
              <Text style={styles.infoText}>{info}</Text>
            </View>
          ) : null}

          <Button title="Prijavite se" onPress={handleLogin} loading={loading} size="lg" />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ili</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Pošalji magic link"
            onPress={handleMagicLink}
            variant="secondary"
            size="lg"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nemate nalog?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}> Registrujte se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 32 },
  header: { alignItems: 'center', gap: 8 },
  logo: { fontSize: 42, fontWeight: '900', color: Colors.white, letterSpacing: -1 },
  tagline: { color: Colors.gray500, fontSize: 15 },
  form: { gap: 16 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,197,102,0.1)', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.accent,
  },
  infoText: { color: Colors.accent, fontSize: 13, flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.gray500, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: Colors.gray500, fontSize: 14 },
  footerLink: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
