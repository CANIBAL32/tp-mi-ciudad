import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';

// Ajustá la ruta según tu carpeta de servicios
import { guardarToken, obtenerToken, borrarToken, autenticarConBiometria } from '../servicios/autenticacion';

const loginSchema = z.object({
  email: z.string().email('Ingresá un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPantalla() {
  const [cargando, setCargando] = useState<boolean>(true);
  const [haySesion, setHaySesion] = useState<boolean>(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Al abrir la pantalla, verificamos si ya hay un token en SecureStore
  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const token = await obtenerToken();
      if (token) {
        setHaySesion(true);
      } else {
        setHaySesion(false);
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
    } finally {
      setCargando(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    if (data.email === 'turista@colon.gob.ar' && data.password === '123456') {
      await guardarToken('mock_jwt_token_12345');
      setHaySesion(true);
      router.replace('/');
    } else {
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  const handleProbarBiometria = async () => {
    const exito = await autenticarConBiometria();
    if (exito) {
      await guardarToken('mock_jwt_token_12345');
      setHaySesion(true);
      router.replace('/');
    }
  };

  const handleCerrarSesion = async () => {
    await borrarToken();
    setHaySesion(false);
    Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente');
  };

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 👤 Vista cuando la sesión SÍ está activa
  if (haySesion) {
    return (
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <Text style={styles.avatar}>👤</Text>
          <Text style={styles.titulo}>¡Hola, Turista!</Text>
          <Text style={styles.emailText}>turista@colon.gob.ar</Text>
          <Text style={styles.statusBadge}>✓ Sesión Activa</Text>
        </View>

        <Pressable style={styles.botonCatalogo} onPress={() => router.replace('/')}>
          <Text style={styles.botonTexto}>Ir al Catálogo de Atractivos</Text>
        </Pressable>

        <Pressable style={styles.botonCerrar} onPress={handleCerrarSesion}>
          <Text style={styles.botonTextoCerrar}>Cerrar Sesión</Text>
        </Pressable>
      </View>
    );
  }

  // 🔑 Formulario de ingreso cuando NO hay sesión
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Iniciar Sesión</Text>
      
      <Text style={styles.label}>Correo Electrónico</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            value={value}
            onChangeText={onChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

      <Text style={styles.label}>Contraseña</Text>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="••••••"
            value={value}
            onChangeText={onChange}
            secureTextEntry
          />
        )}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      <Pressable style={styles.boton} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.botonTexto}>Ingresar</Text>
      </Pressable>

      <Pressable style={styles.botonBiometrico} onPress={handleProbarBiometria}>
        <Text style={styles.botonTexto}>Ingresar con Huella / Rostro 👆</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#FFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#1E293B' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 8, fontSize: 16 },
  errorText: { color: '#E74C3C', fontSize: 12, marginTop: 4 },
  boton: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  botonBiometrico: { backgroundColor: '#34C759', padding: 14, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  botonTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  profileCard: { alignItems: 'center', backgroundColor: '#F1F5F9', padding: 24, borderRadius: 16, marginBottom: 24 },
  avatar: { fontSize: 48, marginBottom: 8 },
  emailText: { fontSize: 16, color: '#64748B', marginBottom: 12 },
  statusBadge: { backgroundColor: '#DCFCE7', color: '#166534', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontWeight: 'bold', fontSize: 12 },
  botonCatalogo: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  botonCerrar: { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 8, alignItems: 'center' },
  botonTextoCerrar: { color: '#DC2626', fontWeight: 'bold', fontSize: 16 },
});