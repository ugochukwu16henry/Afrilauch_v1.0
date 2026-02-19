import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api, type Project } from '../api';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Projects'>;

export default function ProjectsScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!token) return;
    try {
      const list = await api.projects.list(token);
      setProjects(list);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />}
        ListEmptyComponent={<Text style={styles.empty}>No projects yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
              rootNavigation?.navigate('ProjectDetail', { projectId: item.id });
            }}
          >
            <Text style={styles.cardTitle}>{item.projectName}</Text>
            <Text style={styles.cardStage}>{item.stage}</Text>
            <Text style={styles.cardProgress}>Progress: {item.progressPercent}%</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  cardStage: { fontSize: 14, color: '#6366f1', marginTop: 4 },
  cardProgress: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
