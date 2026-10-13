import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Lugar, Categoria } from '../tipos/lugares';
import { obtenerLugares, obtenerCategorias } from '../servicios/lugares';
import {
  inicializarBaseDatosFavoritos,
  obtenerFavoritosIds,
  alternarFavorito,
} from '../servicios/favoritos';
import { obtenerToken } from '../servicios/autenticacion';

export default function PantallaCatalogo() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('cat-todas');
  const [busquedaLugar, setBusquedaLugar] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);

  // Inicializar SQLite y cargar Categorías al montar el componente
  useEffect(() => {
    async function inicializar() {
      try {
        await inicializarBaseDatosFavoritos();
        const resCategorias = await obtenerCategorias();
        setCategorias(resCategorias.datos);
      } catch (error) {
        console.error('Error al inicializar el catálogo:', error);
      }
    }
    inicializar();
  }, []);

  // Recargar Lugares y Favoritos de SQLite cada vez que la pantalla toma foco
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [busquedaLugar, categoriaSeleccionada])
  );

  const cargarDatos = async () => {
  setCargando(true);
  try {
    // 1. Verificamos si hay un token de sesión activo antes de leer SQLite
    const token = await obtenerToken();

    if (!token) {
      // Si cerró sesión, no mostramos ningún corazón marcado
      setFavoritosIds([]);
    } else {
      // Si hay sesión activa, leemos los favoritos guardados en la base de datos
      const favs = await obtenerFavoritosIds();
      setFavoritosIds(favs);
    }

    // 2. Traer lugares filtrados por categoría / búsqueda
    const resLugares = await obtenerLugares(busquedaLugar, categoriaSeleccionada);
    setLugares(resLugares.datos);
  } catch (error) {
    console.error('Error al cargar lugares:', error);
  } finally {
    setCargando(false);
  }
};

  // Ir a favoritos con verificación de inicio de sesión
  const handleIrAFavoritos = async () => {
    const token = await obtenerToken();
    if (!token) {
      // Si no hay sesión iniciada, manda a Iniciar Sesión
      router.push('/login');
    } else {
      // Si hay sesión, entra a Favoritos
      router.push('/favoritos');
    }
  };

  // Alternar favorito con verificación de sesión
  const handleToggleFavorito = async (lugarId: string) => {
    const token = await obtenerToken();
    if (!token) {
      // Si el turista no inició sesión, lo redirigimos al login
      router.push('/login');
      return;
    }

    // Si está autenticado, guarda/quita en la base de datos local SQLite
    await alternarFavorito(lugarId);
    const favsActualizados = await obtenerFavoritosIds();
    setFavoritosIds(favsActualizados);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Encabezado Principal con botones de Login y Favoritos */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.mainTitle}>Mi Ciudad - Colón</Text>
            <Text style={styles.subTitle}>Guía de Atractivos Turísticos</Text>
          </View>

          <View style={styles.headerButtons}>
            {/* Botón Acceso a Favoritos */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleIrAFavoritos}
            >
              <Ionicons name="heart" size={22} color="#E74C3C" />
            </TouchableOpacity>

            {/* Botón Acceso a Iniciar Sesión / Perfil */}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: '#E0F2FE' }]}
              onPress={() => router.push('/login')}
            >
              <Ionicons name="person" size={22} color="#0284C7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Buscador por Texto */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por nombre, termas, bodegas..."
            value={busquedaLugar}
            onChangeText={setBusquedaLugar}
            style={styles.searchInput}
          />
        </View>

        {/* Chips de Categorías */}
        <View style={styles.categoriesWrapper}>
          <FlatList
            horizontal
            data={categorias}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  categoriaSeleccionada === item.id && styles.categoryChipActive,
                ]}
                onPress={() => setCategoriaSeleccionada(item.id)}
              >
                <Ionicons
                  name={item.icono as any}
                  size={16}
                  color={categoriaSeleccionada === item.id ? '#FFF' : '#475569'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    categoriaSeleccionada === item.id && styles.categoryChipTextActive,
                  ]}
                >
                  {item.nombre}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Listado de Atractivos Turísticos */}
        {cargando ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={lugares}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const esFav = favoritosIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(`/lugar/${item.id}` as any)}
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

                      {/* Corazón SQLite con validación de Sesión */}
                      <TouchableOpacity
                        onPress={() => handleToggleFavorito(item.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={esFav ? 'heart' : 'heart-outline'}
                          size={24}
                          color={esFav ? '#E74C3C' : '#94A3B8'}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {item.descripcionCorta}
                    </Text>

                    <Text style={styles.cardPrice}>
                      {item.precioEntrada === 0
                        ? 'Entrada Gratuita'
                        : item.precioEntrada
                        ? `$${item.precioEntrada}`
                        : 'Sin costo especificado'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No se encontraron atractivos turísticos que coincidan con tu búsqueda.
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  subTitle: { fontSize: 14, color: '#64748B' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    padding: 8,
    backgroundColor: '#FFE2E2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  categoriesWrapper: { maxHeight: 42, marginBottom: 16 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#007AFF' },
  categoryChipText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  categoryChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardImage: { width: '100%', height: 160 },
  cardContent: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1, marginRight: 8 },
  cardDescription: { fontSize: 14, color: '#64748B', marginVertical: 8, lineHeight: 20 },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 15 },
});