import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Lugar } from '../tipos/lugares';
import { obtenerLugares } from '../servicios/lugares';
import { obtenerFavoritosIds, alternarFavorito } from '../servicios/favoritos';

export default function FavoritosPantalla() {
  const [lugaresFavoritos, setLugaresFavoritos] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // useFocusEffect recarga los datos cada vez que la pantalla pasa a estar en primer plano
  useFocusEffect(
    useCallback(() => {
      async function cargarFavoritos() {
        setCargando(true);
        try {
          // 1. Obtener los IDs de la base de datos local SQLite
          const favIds = await obtenerFavoritosIds();

          if (favIds.length === 0) {
            setLugaresFavoritos([]);
          } else {
            // 2. Traer todos los lugares y filtrar solo los que están en SQLite
            const respuesta = await obtenerLugares();
            const filtrados = respuesta.datos.filter((lugar) => favIds.includes(lugar.id));
            setLugaresFavoritos(filtrados);
          }
        } catch (error) {
          console.error('Error al cargar la lista de favoritos:', error);
        } finally {
          setCargando(false);
        }
      }

      cargarFavoritos();
    }, [])
  );

  const handleQuitarFavorito = async (lugarId: string) => {
    await alternarFavorito(lugarId);
    // Quitar del estado local para que desaparezca de la pantalla al instante
    setLugaresFavoritos((prev) => prev.filter((item) => item.id !== lugarId));
  };

  if (cargando) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={lugaresFavoritos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/lugar/${item.id}`)}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri: Array.isArray(item.imagenes) ? item.imagenes : (item.imagenes as any),
                }}
                style={styles.cardImage}
              />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.nombre}</Text>
                  <TouchableOpacity
                    onPress={() => handleQuitarFavorito(item.id)}
                    hitSlop={10}
                  >
                    <Ionicons name="heart" size={24} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.descripcionCorta}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={60} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Sin favoritos guardados</Text>
              <Text style={styles.emptySubtext}>
                Tocá el ícono del corazón en los atractivos turísticos para guardarlos acá.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: { width: '100%', height: 160 },
  cardContent: { padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', flex: 1, marginRight: 8 },
  cardDescription: { fontSize: 14, color: '#64748B', marginTop: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6 },
});