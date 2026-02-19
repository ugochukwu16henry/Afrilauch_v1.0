import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api, type Project } from '../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.projects
      .get(projectId, token)
      .then(setProject)
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [token, projectId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }
  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Project not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{project.projectName}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{project.stage}</Text>
      </View>
      <Text style={styles.label}>Progress</Text>
      <Text style={styles.value}>{project.progressPercent}%</Text>
      {project.description ? (
        <>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{project.description}</Text>
        </>
      ) : null}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate('ChatThread', { projectId: project.id, projectName: project.projectName })}
      >
        <Text style={styles.chatButtonText}>Open project chat</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#dc2626' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 16 },
  badgeText: { color: '#6366f1', fontWeight: '600', fontSize: 14 },
  label: { fontSize: 12, color: '#6b7280', marginTop: 12, marginBottom: 4 },
  value: { fontSize: 16, color: '#374151' },
  chatButton: { marginTop: 24, backgroundColor: '#6366f1', padding: 14, borderRadius: 8, alignItems: 'center' },
  chatButtonText: { color: '#fff', fontWeight: '600' },
});
