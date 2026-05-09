import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, AlertCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const [ime, setIme] = useState('');
  const [prezime, setPrezime] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!ime || !prezime || !email || !password) {
      setError('Sva polja su obavezna.');
      return;
    }
    if (password.length < 8) {
      setError('Lozinka mora imati najmanje 8 karaktera.');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { ime, prezime } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✉️</Text>
        <Text style={styles.successTitle}>Proverite email</Text>
        <Text style={styles.successText}>
          Poslali smo vam link za potvrdu registracije na{'\n'}
          <Text style={styles.successEmail}>{email}</Text>
        </Text>
        <Button title="Nazad na prijavu" onPress={() => router.replace('/(auth)/login')} variant="secondary" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>antares</Text>
          <Text style={styles.tagline}>Kreirajte nalog</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <Input
              label="Ime"
              value={ime}
              onChangeText={setIme}
              placeholder="Marko"
              leftIcon={<User size={18} stroke={Colors.gray400} />}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Prezime"
              value={prezime}
              onChangeText={setPrezime}
              placeholder="Marković"
              containerStyle={{ flex: 1 }}
            />
          </View>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="ime@primer.rs"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={18} stroke={Colors.gray400} />}
          />
          <Input
            label="Lozinka"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 8 karaktera"
            secureTextEntry
            leftIcon={<Lock size={18} stroke={Colors.gray400} />}
          />

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} stroke={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.terms}>
            Registracijom prihvatate naše{' '}
            <Text style={styles.termsLink}>Uslove korišćenja</Text> i{' '}
            <Text style={styles.termsLink}>Politiku privatnosti</Text>.
          </Text>

          <Button title="Registrujte se" onPress={handleRegister} loading={loading} size="lg" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Već imate nalog?</Text>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}> Prijavite se</Text>
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
  row: { flexDirection: 'row', gap: 12 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.error,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  terms: { color: Colors.gray500, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.accent },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: Colors.gray500, fontSize: 14 },
  footerLink: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  successContainer: {
    flex: 1, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 20,
  },
  successIcon: { fontSize: 64 },
  successTitle: { color: Colors.white, fontSize: 26, fontWeight: '800' },
  successText: { color: Colors.gray400, fontSize: 15, textAlign: 'center', lineHeight: 24 },
  successEmail: { color: Colors.accent, fontWeight: '600' },
});
