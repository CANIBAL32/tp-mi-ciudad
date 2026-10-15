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

import { Lugar, Categoria } from '../../tipos/lugares';
import { obtenerLugares, obtenerCategorias } from '../../servicios/lugares';
import {
  obtenerFavoritosIds,
  alternarFavorito,
} from '../../servicios/favoritos';
import { obtenerToken, obtenerUsuario } from '../../servicios/autenticacion';
import { inicializarBaseDatos } from '../../servicios/db';

import { useTema } from '../../contexto/TemaContext';

export default function PantallaCatalogo() {
  const { colores } = useTema();

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('cat-todas');
  const [busquedaLugar, setBusquedaLugar] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);

  useEffect(() => {
    async function inicializar() {
      try {
        await inicializarBaseDatos();
        const resCategorias = await obtenerCategorias();
        setCategorias(resCategorias.datos);
      } catch (error) {
        console.error('Error al inicializar el catálogo:', error);
      }
    }
    inicializar();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [busquedaLugar, categoriaSeleccionada])
  );

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const token = await obtenerToken();
      if (!token) {
        setFavoritosIds([]);
      } else {
        const usr = await obtenerUsuario();
        const usrId = usr?.email || 'usuario_invitado';
        const favs = await obtenerFavoritosIds(usrId);
        setFavoritosIds(favs);
      }

      const resLugares = await obtenerLugares(busquedaLugar, categoriaSeleccionada);
      setLugares(resLugares.datos);
    } catch (error) {
      console.error('Error al cargar lugares:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleIrAFavoritos = async () => {
    const token = await obtenerToken();
    if (!token) {
      router.push('/login');
    } else {
      router.push('/favoritos');
    }
  };

  const handleToggleFavorito = async (lugarId: string) => {
    try {
      const token = await obtenerToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const usr = await obtenerUsuario();
      const usrId = usr?.email || 'usuario_invitado';

      await alternarFavorito(lugarId, usrId);
      const favsActualizados = await obtenerFavoritosIds(usrId);
      setFavoritosIds(favsActualizados);
    } catch (error) {
      console.error('Error al alternar favorito:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colores.fondo }]}>
        
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.mainTitle, { color: colores.textoPrincipal }]}>
              Mi Ciudad - Colón
            </Text>
            <Text style={[styles.subTitle, { color: colores.textoSecundario }]}>
              Guía Turística Oficial
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleIrAFavoritos}>
              <Ionicons name="heart-outline" size={24} color="#0284c7" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/login')}>
              <Ionicons name="person-outline" size={24} color="#0284c7" />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colores.tarjetaFondo, borderColor: colores.tarjetaBorde },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colores.textoSecundario}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colores.textoPrincipal }]}
            placeholder="Buscar por nombre, termas, bodegas..."
            placeholderTextColor={colores.textoSecundario}
            value={busquedaLugar}
            onChangeText={setBusquedaLugar}
          />
        </View>

        {categorias.length > 0 && (
          <View style={styles.categoriesWrapper}>
            <FlatList
              horizontal
              data={categorias}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const esActiva = categoriaSeleccionada === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: esActiva
                          ? '#0284c7'
                          : colores.tarjetaFondo,
                        borderColor: esActiva ? '#0284c7' : colores.tarjetaBorde,
                      },
                    ]}
                    onPress={() => setCategoriaSeleccionada(item.id)}
                  >
                    <Ionicons
                      name={item.icono as any}
                      size={16}
                      color={esActiva ? '#FFF' : colores.textoSecundario}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: esActiva ? '#FFF' : colores.textoSecundario },
                        esActiva && styles.categoryChipTextActive,
                      ]}
                    >
                      {item.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {cargando ? (
          <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={lugares}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const esFav = favoritosIds.includes(item.id);

              const imagenUri = Array.isArray(item.imagenes) && item.imagenes.length > 0
                ? item.imagenes[0]
                : typeof item.imagenes === 'string'
                ? item.imagenes
                : '[suspicious link removed]';

              return (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colores.tarjetaFondo,
                      borderColor: colores.tarjetaBorde,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/lugar/${item.id}` as any)}
                  >
                    <Image source={{ uri: imagenUri }} style={styles.cardImage} />
                  </TouchableOpacity>

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <TouchableOpacity
                        style={{ flex: 1, marginRight: 8 }}
                        onPress={() => router.push(`/lugar/${item.id}` as any)}
                      >
                        <Text
                          style={[styles.cardTitle, { color: colores.textoPrincipal }]}
                          numberOfLines={1}
                        >
                          {item.nombre}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.favButton}
                        onPress={() => handleToggleFavorito(item.id)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Ionicons
                          name={esFav ? 'heart' : 'heart-outline'}
                          size={24}
                          color={esFav ? '#ef4444' : colores.textoSecundario}
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.push(`/lugar/${item.id}` as any)}
                    >
                      <Text
                        style={[
                          styles.cardDescription,
                          { color: colores.textoSecundario },
                        ]}
                        numberOfLines={2}
                      >
                        {item.descripcionCorta}
                      </Text>

                      <Text style={styles.cardPrice}>
                        {item.precioEntrada === 0
                          ? 'Entrada Gratuita'
                          : item.precioEntrada
                          ? `$${item.precioEntrada}`
                          : 'Sin costo especificado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colores.textoSecundario }]}>
                No se encontraron atractivos turísticos en esta categoría.
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 13,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  categoriesWrapper: {
    maxHeight: 42,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    fontWeight: 'bold',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  favButton: {
    padding: 4,
  },
  cardDescription: {
    fontSize: 14,
    marginVertical: 6,
    lineHeight: 20,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});