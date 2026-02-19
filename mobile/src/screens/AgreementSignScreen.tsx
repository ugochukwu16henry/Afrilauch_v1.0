import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AgreementSign'>;

export default function AgreementSignScreen({ route, navigation }: Props) {
  const { agreementId, title } = route.params;
  const { token } = useAuth();
  const [signatureText, setSignatureText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSign() {
    if (!token) return;
    if (!signatureText.trim()) {
      Alert.alert('Required', 'Enter your full name to sign.');
      return;
    }
    setLoading(true);
    try {
      await api.agreements.sign(agreementId, { signatureText: signatureText.trim() }, token);
      Alert.alert('Signed', 'Agreement signed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Signing failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.label}>Full name (signature)</Text>
      <TextInput
        style={styles.input}
        placeholder="Type your full name"
        value={signatureText}
        onChangeText={setSignatureText}
        editable={!loading}
      />
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSign} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign agreement</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  label: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 24, fontSize: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#6366f1', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
