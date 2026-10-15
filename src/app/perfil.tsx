import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { obtenerUsuario, borrarToken, Usuario } from '../servicios/autenticacion';
import { useTema } from '../contexto/TemaContext';

export default function PantallaPerfil() {
  const { colores, modo, setModo } = useTema();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      const usr = await obtenerUsuario();
      if (usr) setUsuario(usr);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

  const handleCerrarSesion = () => {
    Alert.alert('Cerrar Sesión', '¿Estás segura de que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await borrarToken();
            router.replace('/login');
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colores.fondo }]}>
      {/* 👤 Tarjeta de Perfil */}
      <View style={[styles.card, { backgroundColor: colores.tarjetaFondo, borderColor: colores.tarjetaBorde }]}>
        <Ionicons name="person-circle-outline" size={72} color="#0284c7" />
        <Text style={[styles.nombre, { color: colores.textoPrincipal }]}>
          {usuario?.nombre || 'Turista en Colón'}
        </Text>
        <Text style={[styles.email, { color: colores.textoSecundario }]}>
          {usuario?.email || 'turista@colon.gob.ar'}
        </Text>
      </View>

      {/* 🎨 Selector de Tema Visual */}
      <View style={[styles.seccionTema, { backgroundColor: colores.tarjetaFondo, borderColor: colores.tarjetaBorde }]}>
        <Text style={[styles.tituloSeccion, { color: colores.textoPrincipal }]}>
          Apariencia de la App
        </Text>
        <Text style={[styles.subtituloSeccion, { color: colores.textoSecundario }]}>
          Seleccioná el tema visual que prefieras:
        </Text>

        <View style={styles.botonesTemaRow}>
          <TouchableOpacity
            style={[styles.btnTema, modo === 'claro' && styles.btnTemaActivo]}
            onPress={() => setModo('claro')}
          >
            <Ionicons name="sunny-outline" size={18} color={modo === 'claro' ? '#fff' : colores.textoPrincipal} />
            <Text style={[styles.btnTemaTexto, modo === 'claro' ? styles.btnTemaTextoActivo : { color: colores.textoPrincipal }]}>
              Claro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnTema, modo === 'oscuro' && styles.btnTemaActivo]}
            onPress={() => setModo('oscuro')}
          >
            <Ionicons name="moon-outline" size={18} color={modo === 'oscuro' ? '#fff' : colores.textoPrincipal} />
            <Text style={[styles.btnTemaTexto, modo === 'oscuro' ? styles.btnTemaTextoActivo : { color: colores.textoPrincipal }]}>
              Oscuro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnTema, modo === 'sistema' && styles.btnTemaActivo]}
            onPress={() => setModo('sistema')}
          >
            <Ionicons name="phone-portrait-outline" size={18} color={modo === 'sistema' ? '#fff' : colores.textoPrincipal} />
            <Text style={[styles.btnTemaTexto, modo === 'sistema' ? styles.btnTemaTextoActivo : { color: colores.textoPrincipal }]}>
              Auto
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🚪 Botón Cerrar Sesión */}
      <TouchableOpacity style={styles.botonCerrar} onPress={handleCerrarSesion}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={styles.textoCerrar}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  card: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  nombre: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  email: { fontSize: 14, marginTop: 4 },
  seccionTema: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  tituloSeccion: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtituloSeccion: { fontSize: 13, marginBottom: 16 },
  botonesTemaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btnTema: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, marginHorizontal: 4, borderWidth: 1, borderColor: '#cbd5e1' },
  btnTemaActivo: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  btnTemaTexto: { fontSize: 13, fontWeight: '600', marginLeft: 6 },
  btnTemaTextoActivo: { color: '#ffffff' },
  botonCerrar: { flexDirection: 'row', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textoCerrar: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
});