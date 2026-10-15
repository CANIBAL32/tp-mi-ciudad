import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';

import { Lugar } from '../../tipos/lugares'; 
import { obtenerLugarPorId } from '../../servicios/lugares';
import { obtenerFavoritosIds, alternarFavorito } from '../../servicios/favoritos';
import { useTema } from '../../contexto/TemaContext';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function DetalleLugarPantalla() {
  // Leemos el ID del lugar desde la ruta dinámica (ejemplo: /lugar/lug-004)
  const { id } = useLocalSearchParams<{ id: string }>();

  // 🎨 Consumimos los colores del tema
  const { colores } = useTema();

  const [detalleLugar, setDetalleLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [esFavorito, setEsFavorito] = useState<boolean>(false);

  useEffect(() => {
    async function cargarDetalle() {
      if (!id) return;
      setCargando(true);
      try {
        // 1. Obtener datos completos del atractivo
        const res = await obtenerLugarPorId(id);
        setDetalleLugar(res.datos);

        // 2. Verificar si está en la tabla SQLite de favoritos
        const favs = await obtenerFavoritosIds();
        setEsFavorito(favs.includes(id));
      } catch (error) {
        console.error('Error al obtener detalle del lugar:', error);
      } finally {
        setCargando(false);
      }
    }

    cargarDetalle();
  }, [id]);

  const handleToggleFavorito = async () => {
    if (!id) return;
    await alternarFavorito(id);
    const favsActualizados = await obtenerFavoritosIds();
    setEsFavorito(favsActualizados.includes(id));
  };

  if (cargando || !detalleLugar) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.containerCargando, { backgroundColor: colores.fondo }]}>
          <ActivityIndicator size="large" color="#0284c7" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/* 🎨 Fondo dinámico para el detalle */}
      <SafeAreaView style={[styles.container, { backgroundColor: colores.fondo }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {/* Imagen Principal */}
          <Image
            source={{
              uri: Array.isArray(detalleLugar.imagenes)
                ? detalleLugar.imagenes
                : (detalleLugar.imagenes as any),
            }}
            style={styles.detailImage}
          />

          <View style={styles.detailBody}>
            {/* Título y Botón Corazón (SQLite) */}
            <View style={styles.titleRow}>
              <Text style={[styles.detailTitle, { color: colores.textoPrincipal }]}>
                {detalleLugar.nombre}
              </Text>
              <TouchableOpacity onPress={handleToggleFavorito} hitSlop={10}>
                <Ionicons
                  name={esFavorito ? 'heart' : 'heart-outline'}
                  size={30}
                  color={esFavorito ? '#ef4444' : colores.textoSecundario}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailAddress, { color: colores.textoSecundario }]}>
              📍 Dirección: {detalleLugar.direccion}
            </Text>

            {/* Descripción */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colores.textoPrincipal }]}>
                Descripción
              </Text>
              <Text style={[styles.text, { color: colores.textoSecundario }]}>
                {detalleLugar.descripcion}
              </Text>
            </View>

            {/* Horarios de Atención */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colores.textoPrincipal }]}>
                Horarios de Atención
              </Text>
              {detalleLugar.horarios && detalleLugar.horarios.length > 0 ? (
                detalleLugar.horarios.map((h, i) => (
                  <Text key={i} style={[styles.text, { color: colores.textoSecundario }]}>
                    • {DIAS_SEMANA[h.dia]}: {h.abre} a {h.cierra} hs
                  </Text>
                ))
              ) : (
                <Text style={[styles.text, { color: colores.textoSecundario }]}>
                  Abierto todo el día / Sin horario específico
                </Text>
              )}
            </View>

            {/* Información del Atractivo */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colores.textoPrincipal }]}>
                Información del Atractivo
              </Text>
              <Text style={[styles.text, { color: colores.textoSecundario }]}>
                Entrada:{' '}
                {detalleLugar.precioEntrada === 0
                  ? 'Gratuita'
                  : detalleLugar.precioEntrada
                  ? `$${detalleLugar.precioEntrada}`
                  : 'No especificada'}
              </Text>
              {detalleLugar.telefono && (
                <Text style={[styles.text, { color: colores.textoSecundario }]}>
                  📞 Teléfono: {detalleLugar.telefono}
                </Text>
              )}
              <Text style={[styles.text, { color: colores.textoSecundario }]}>
                ♿ Accesibilidad:{' '}
                {detalleLugar.accesible
                  ? 'Apto para personas con movilidad reducida'
                  : 'No adaptado'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerCargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImage: {
    width: '100%',
    height: 240,
  },
  detailBody: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  detailAddress: {
    fontSize: 14,
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});