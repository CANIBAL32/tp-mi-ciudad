import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { estaConectado } from '../servicios/red'; // Ajustá la ruta según dónde tengas red.ts

// Componente del banner definido aquí mismo
function BannerRed() {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    async function revisarConexion() {
      const hayInternet = await estaConectado();
      setOnline(hayInternet);
    }

    revisarConexion();
    const intervalo = setInterval(revisarConexion, 10000);

    return () => clearInterval(intervalo);
  }, []);

  if (online) return null;

  return (
    <View style={stylesBanner.banner}>
      <Ionicons name="cloud-offline-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
      <Text style={stylesBanner.texto}>
        Sin conexión — Navegás con datos guardados en SQLite
      </Text>
    </View>
  );
}

const stylesBanner = StyleSheet.create({
  banner: {
    backgroundColor: '#b91c1c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

// Layout Principal de la App
export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Banner de alerta de red */}
      <BannerRed />

      {/* Navegador de pantallas */}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0284c7' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Mi Ciudad - Colón' }} />
        <Stack.Screen name="lugar/[id]" options={{ title: 'Detalle del Atractivo' }} />
        <Stack.Screen name="favoritos" options={{ title: 'Mis Favoritos' }} />
        <Stack.Screen name="login" options={{ title: 'Iniciar Sesión' }} />
        <Stack.Screen name="registro" options={{ title: 'Crear Cuenta' }} />
        <Stack.Screen name="perfil" options={{ title: 'Mi Perfil' }} />
      </Stack>
    </View>
  );
}