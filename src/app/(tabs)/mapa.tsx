import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Lugar, Categoria } from '../../tipos/lugares';
import { obtenerLugares, obtenerCategorias } from '../../servicios/lugares';
import {
  obtenerUbicacionActual,
  calcularDistanciaKm,
  formatearDistancia,
  abrirMapaNativo,
  Coordenadas,
  COLON_CENTRO,
} from '../../servicios/ubicacion';
import { useTema } from '../../contexto/TemaContext';

export default function PantallaMapa() {
  const { colores } = useTema();

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSel, setCategoriaSel] = useState<string>('cat-todas');
  const [miUbicacion, setMiUbicacion] = useState<Coordenadas | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const pos = await obtenerUbicacionActual();
      if (pos) setMiUbicacion(pos);

      const resCat = await obtenerCategorias();
      setCategorias(resCat.datos || []);

      const resLug = await obtenerLugares();
      setLugares(resLug.datos || []);
    } catch (error) {
      console.error('Error al cargar datos del mapa:', error);
    } finally {
      setCargando(false);
    }
  };

  const lugaresFiltrados = lugares.filter((l) => {
    if (categoriaSel === 'cat-todas') return true;
    return l.categoriaId === categoriaSel;
  });

  const origen = miUbicacion || COLON_CENTRO;

  const lugaresConDistancia = lugaresFiltrados
    .map((lugar) => {
      const dist = calcularDistanciaKm(origen, {
        latitud: lugar.coordenadas.latitud,
        longitud: lugar.coordenadas.longitud,
      });
      return { ...lugar, distanciaKm: dist };
    })
    .sort((a, b) => a.distanciaKm - b.distanciaKm);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colores.fondo }]}>
      {/* 🗺️ Contenedor del Mapa */}
      <View style={styles.mapaContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.mapa}
          initialRegion={{
            latitude: -32.2227,
            longitude: -58.1408,
            latitudeDelta: 0.045,
            longitudeDelta: 0.045,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {lugaresFiltrados
            .filter(
              (lugar) =>
                lugar &&
                lugar.coordenadas &&
                typeof lugar.coordenadas.latitud === 'number' &&
                typeof lugar.coordenadas.longitud === 'number'
            )
            .map((lugar) => (
              <Marker
                key={lugar.id}
                coordinate={{
                  latitude: lugar.coordenadas.latitud,
                  longitude: lugar.coordenadas.longitud,
                }}
                title={lugar.nombre}
              >
                <Callout onPress={() => router.push(`/lugar/${lugar.id}` as any)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitulo}>{lugar.nombre}</Text>
                    <Text style={styles.calloutSub}>Ver detalle ➔</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
        </MapView>

        {/* Chips de Filtro flotantes sobre el mapa */}
        <View style={styles.filtrosOverlay}>
          <FlatList
            horizontal
            data={categorias}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chip,
                  categoriaSel === item.id && styles.chipActivo,
                ]}
                onPress={() => setCategoriaSel(item.id)}
              >
                <Text
                  style={[
                    styles.chipTexto,
                    categoriaSel === item.id && styles.chipTextoActivo,
                  ]}
                >
                  {item.nombre}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/* 📍 Lista "Cerca tuyo" */}
      <View style={[styles.panelCerca, { backgroundColor: colores.tarjetaFondo }]}>
        <Text style={[styles.tituloSeccion, { color: colores.textoPrincipal }]}>
          📍 Cerca tuyo
        </Text>

        {cargando ? (
          <ActivityIndicator color="#0284c7" style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            data={lugaresConDistancia}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.tarjetaFila, { borderColor: colores.tarjetaBorde }]}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => router.push(`/lugar/${item.id}` as any)}
                >
                  <Text style={[styles.nombreLugar, { color: colores.textoPrincipal }]}>
                    {item.nombre}
                  </Text>
                  <Text style={[styles.distanciaLugar, { color: colores.textoSecundario }]}>
                    A {formatearDistancia(item.distanciaKm)} de vos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnIr}
                  onPress={() =>
                    abrirMapaNativo(
                      item.coordenadas.latitud,
                      item.coordenadas.longitud,
                      item.nombre
                    )
                  }
                >
                  <Ionicons name="navigate-outline" size={16} color="#0284c7" />
                  <Text style={styles.btnIrTexto}>Ir</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  mapaContainer: { 
    height: 380, 
    width: '100%',
    position: 'relative', // Sin overflow: 'hidden'
  },
  mapa: { 
    width: '100%', 
    height: '100%' 
  },
  filtrosOverlay: { 
    position: 'absolute', 
    top: 12, 
    left: 12, 
    right: 12,
    zIndex: 10, 
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipActivo: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  chipTexto: { fontSize: 13, color: '#334155' },
  chipTextoActivo: { color: '#ffffff', fontWeight: 'bold' },
  callout: { padding: 4, width: 140 },
  calloutTitulo: { fontWeight: 'bold', fontSize: 13 },
  calloutSub: { fontSize: 11, color: '#0284c7', marginTop: 2 },
  panelCerca: { 
    flex: 1, 
    borderTopRightRadius: 20, 
    padding: 16 
  },
  tituloSeccion: { fontSize: 17, fontWeight: 'bold', marginBottom: 12 },
  tarjetaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  nombreLugar: { fontSize: 15, fontWeight: '600' },
  distanciaLugar: { fontSize: 12, marginTop: 2 },
  btnIr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnIrTexto: { color: '#0284c7', fontWeight: 'bold', marginLeft: 4, fontSize: 13 },
});