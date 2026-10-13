import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as SQLite from 'expo-sqlite';

// Servicios de autenticación
import {
  obtenerUsuario,
  borrarToken,
  Usuario,
} from '../servicios/autenticacion'; // Ajustá a '../src/servicios/autenticacion' si tu carpeta lleva /src/

const CATEGORIAS_DISPONIBLES = [
  { id: 'cat-termas', nombre: 'Termas', icono: 'water-outline' },
  { id: 'cat-playas', nombre: 'Playas y Ríos', icono: 'sunny-outline' },
  { id: 'cat-museos', nombre: 'Historia y Museos', icono: 'library-outline' },
  { id: 'cat-gastronomia', nombre: 'Gastronomía', icono: 'restaurant-outline' },
  { id: 'cat-naturaleza', nombre: 'Naturaleza', icono: 'leaf-outline' },
];

export default function PantallaPerfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  // Estados de Preferencias
  const [tema, setTema] = useState<'claro' | 'oscuro' | 'sistema'>('claro');
  const [categoriasInteres, setCategoriasInteres] = useState<string[]>(['cat-termas']);

  const systemColorScheme = useColorScheme();

  // 🌙 Evaluamos si el tema visual activo debe ser oscuro
  const esOscuro =
    tema === 'oscuro' || (tema === 'sistema' && systemColorScheme === 'dark');

  // Recargar perfil y SQLite cada vez que la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      cargarPerfilYPreferencias();
    }, [])
  );

  const cargarPerfilYPreferencias = async () => {
    setCargando(true);
    try {
      // 1. Cargar usuario registrado desde SecureStore
      const usr = await obtenerUsuario();
      if (usr) {
        setUsuario(usr);
      }

      // 2. Cargar preferencias guardadas en SQLite
      const db = await SQLite.openDatabaseAsync('miciudad.db');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS preferencias (
          clave TEXT PRIMARY KEY NOT NULL,
          valor TEXT NOT NULL
        );
      `);

      const regTema = await db.getFirstAsync<{ valor: string }>(
        'SELECT valor FROM preferencias WHERE clave = ?;',
        ['tema_visual']
      );
      if (regTema?.valor) {
        setTema(regTema.valor as any);
      }

      const regCat = await db.getFirstAsync<{ valor: string }>(
        'SELECT valor FROM preferencias WHERE clave = ?;',
        ['categorias_interes']
      );
      if (regCat?.valor) {
        setCategoriasInteres(JSON.parse(regCat.valor));
      }
    } catch (error) {
      console.error('Error al cargar perfil o SQLite:', error);
    } finally {
      setCargando(false);
    }
  };

  // 🎨 Guardar cambio de Tema en SQLite
  const handleCambiarTema = async (nuevoTema: 'claro' | 'oscuro' | 'sistema') => {
    setTema(nuevoTema);
    try {
      const db = await SQLite.openDatabaseAsync('miciudad.db');
      await db.runAsync(
        'INSERT OR REPLACE INTO preferencias (clave, valor) VALUES (?, ?);',
        ['tema_visual', nuevoTema]
      );
    } catch (error) {
      console.error('Error guardando tema en SQLite:', error);
    }
  };

  // 🏷️ Seleccionar/Deseleccionar categorías en SQLite
  const handleToggleCategoria = async (catId: string) => {
    let seleccionadas: string[];
    if (categoriasInteres.includes(catId)) {
      seleccionadas = categoriasInteres.filter((id) => id !== catId);
    } else {
      seleccionadas = [...categoriasInteres, catId];
    }

    setCategoriasInteres(seleccionadas);

    try {
      const db = await SQLite.openDatabaseAsync('miciudad.db');
      await db.runAsync(
        'INSERT OR REPLACE INTO preferencias (clave, valor) VALUES (?, ?);',
        ['categorias_interes', JSON.stringify(seleccionadas)]
      );
    } catch (error) {
      console.error('Error guardando categorías en SQLite:', error);
    }
  };

  // 🚪 Cerrar sesión
  const handleCerrarSesion = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás segura de que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await borrarToken();
          Alert.alert('Sesión finalizada', 'Has cerrado sesión correctamente.');
          router.replace('/login');
        },
      },
    ]);
  };

  // 🎨 Paleta de colores dinámica para Modo Oscuro y Claro
  const colores = {
    fondo: esOscuro ? '#0f172a' : '#f8fafc',
    tarjetaFondo: esOscuro ? '#1e293b' : '#fff',
    tarjetaBorde: esOscuro ? '#334155' : '#e2e8f0',
    textoPrincipal: esOscuro ? '#f8fafc' : '#0f172a',
    textoSecundario: esOscuro ? '#94a3b8' : '#64748b',
    botonTemaInactivo: esOscuro ? '#1e293b' : '#fff',
    botonTemaTextoInactivo: esOscuro ? '#cbd5e1' : '#475569',
  };

  if (cargando) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colores.fondo }]}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colores.fondo }]}>
      {/* 👤 Tarjeta de Perfil de Usuario */}
      <View
        style={[
          styles.cardPerfil,
          { backgroundColor: colores.tarjetaFondo, borderColor: colores.tarjetaBorde },
        ]}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={72} color="#0284c7" />
        </View>
        <Text style={[styles.nombreUsuario, { color: colores.textoPrincipal }]}>
          {usuario?.nombre || 'Turista en Colón'}
        </Text>
        <Text style={[styles.emailUsuario, { color: colores.textoSecundario }]}>
          {usuario?.email || 'turista@colon.gob.ar'}
        </Text>
        <View style={styles.badgeSesion}>
          <Text style={styles.badgeTexto}>✓ Sesión Activa (SecureStore)</Text>
        </View>
      </View>

      {/* 🎨 Sección de Apariencia / Tema Visual */}
      <Text style={[styles.seccionTitulo, { color: colores.textoPrincipal }]}>
        Apariencia de la App
      </Text>
      <View style={styles.opcionesRow}>
        <TouchableOpacity
          style={[
            styles.botonTema,
            { backgroundColor: colores.botonTemaInactivo, borderColor: colores.tarjetaBorde },
            tema === 'claro' && styles.botonTemaActivo,
          ]}
          onPress={() => handleCambiarTema('claro')}
        >
          <Ionicons
            name="sunny-outline"
            size={22}
            color={tema === 'claro' ? '#fff' : colores.botonTemaTextoInactivo}
          />
          <Text
            style={[
              styles.textoTema,
              { color: colores.botonTemaTextoInactivo },
              tema === 'claro' && styles.textoTemaActivo,
            ]}
          >
            Claro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonTema,
            { backgroundColor: colores.botonTemaInactivo, borderColor: colores.tarjetaBorde },
            tema === 'oscuro' && styles.botonTemaActivo,
          ]}
          onPress={() => handleCambiarTema('oscuro')}
        >
          <Ionicons
            name="moon-outline"
            size={22}
            color={tema === 'oscuro' ? '#fff' : colores.botonTemaTextoInactivo}
          />
          <Text
            style={[
              styles.textoTema,
              { color: colores.botonTemaTextoInactivo },
              tema === 'oscuro' && styles.textoTemaActivo,
            ]}
          >
            Oscuro
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonTema,
            { backgroundColor: colores.botonTemaInactivo, borderColor: colores.tarjetaBorde },
            tema === 'sistema' && styles.botonTemaActivo,
          ]}
          onPress={() => handleCambiarTema('sistema')}
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={tema === 'sistema' ? '#fff' : colores.botonTemaTextoInactivo}
          />
          <Text
            style={[
              styles.textoTema,
              { color: colores.botonTemaTextoInactivo },
              tema === 'sistema' && styles.textoTemaActivo,
            ]}
          >
            Sistema
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🏷️ Sección de Categorías de Interés (SQLite) */}
      <Text style={[styles.seccionTitulo, { color: colores.textoPrincipal }]}>
        Tus Intereses Turísticos (SQLite)
      </Text>
      <Text style={[styles.seccionSubtitulo, { color: colores.textoSecundario }]}>
        Tocá las categorías para elegirlas o desmarcarlas:
      </Text>

      <View style={styles.chipsContainer}>
        {CATEGORIAS_DISPONIBLES.map((cat) => {
          const seleccionada = categoriasInteres.includes(cat.id);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chipInteres,
                {
                  backgroundColor: esOscuro ? '#1e293b' : '#e0f2fe',
                  borderColor: esOscuro ? '#334155' : '#bae6fd',
                },
                seleccionada && styles.chipInteresActivo,
              ]}
              onPress={() => handleToggleCategoria(cat.id)}
            >
              <Ionicons
                name={cat.icono as any}
                size={18}
                color={seleccionada ? '#fff' : esOscuro ? '#38bdf8' : '#0284c7'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.textoChip,
                  { color: esOscuro ? '#38bdf8' : '#0284c7' },
                  seleccionada && styles.textoChipActivo,
                ]}
              >
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 🚪 Botón de Cerrar Sesión */}
      <TouchableOpacity style={styles.botonCerrar} onPress={handleCerrarSesion}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={styles.textoBotonCerrar}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    flexGrow: 1,
  },
  cardPerfil: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  nombreUsuario: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emailUsuario: {
    fontSize: 14,
    marginTop: 2,
  },
  badgeSesion: {
    marginTop: 12,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeTexto: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
  },
  seccionSubtitulo: {
    fontSize: 13,
    marginBottom: 12,
  },
  opcionesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  botonTema: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  botonTemaActivo: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  textoTema: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  textoTemaActivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  chipInteres: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
  },
  chipInteresActivo: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  textoChip: {
    fontSize: 14,
    fontWeight: '600',
  },
  textoChipActivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botonCerrar: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  textoBotonCerrar: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
});