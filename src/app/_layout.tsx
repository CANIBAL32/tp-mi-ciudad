import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Ajustá la ruta según si tu carpeta servicios está dentro de src (ej: '../src/servicios/favoritos')
import { inicializarBaseDatosFavoritos } from '../servicios/favoritos';

export default function RootLayout() {
  useEffect(() => {
    async function prepararBD() {
      try {
        await inicializarBaseDatosFavoritos();
      } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
      }
    }
    prepararBD();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {/* 1. Pantalla Principal Pública (Catálogo) -> ¡Abre primero! */}
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false, 
            title: 'Mi Ciudad' 
          }} 
        />

        {/* 2. Pantalla de Detalle del Atractivo */}
        <Stack.Screen 
          name="lugar/[id]" 
          options={{ 
            headerShown: true, 
            title: 'Detalle del Atractivo',
            headerBackTitle: 'Volver'
          }} 
        />

        {/* 3. Pantalla de Favoritos */}
        <Stack.Screen 
          name="favoritos" 
          options={{ 
            headerShown: true, 
            title: 'Mis Favoritos' 
          }} 
        />

        {/* 4. Pantalla de Iniciar Sesión */}
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false, 
            title: 'Iniciar Sesión' 
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}