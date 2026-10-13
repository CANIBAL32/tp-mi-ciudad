import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';

// Servicios de autenticación
import {
  guardarToken,
  obtenerToken,
  borrarToken,
  autenticarConBiometria,
  guardarUsuario,
  obtenerUsuario,
  Usuario,
} from '../servicios/autenticacion';

const loginSchema = z.object({
  email: z.string().email('Ingresá un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPantalla() {
  const [cargando, setCargando] = useState<boolean>(true);
  const [haySesion, setHaySesion] = useState<boolean>(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Al abrir la pantalla, verificamos si ya hay un token en SecureStore
  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const token = await obtenerToken();
      const datosUsuario = await obtenerUsuario();

      if (token) {
        setHaySesion(true);
        setUsuario(
          datosUsuario || { nombre: 'Turista', email: 'turista@colon.gob.ar' }
        );
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
    const usuarioGuardado = await obtenerUsuario();

    // Verificamos si coincide el email Y contraseña guardados o la cuenta demo
    const esUsuarioRegistrado =
      usuarioGuardado &&
      usuarioGuardado.email.toLowerCase() === data.email.toLowerCase() &&
      (!usuarioGuardado.password || data.password === usuarioGuardado.password);

    const esCuentaDemo =
      data.email === 'turista@colon.gob.ar' && data.password === '123456';

    if (esUsuarioRegistrado || esCuentaDemo) {
      const nombreSesion = esUsuarioRegistrado
        ? usuarioGuardado.nombre
        : 'Turista en Colón';
      const emailSesion = esUsuarioRegistrado
        ? usuarioGuardado.email
        : 'turista@colon.gob.ar';

      await guardarToken(`mock_jwt_token_${Date.now()}`);
      await guardarUsuario({ nombre: nombreSesion, email: emailSesion });

      setHaySesion(true);
      setUsuario({ nombre: nombreSesion, email: emailSesion });

      Alert.alert('¡Bienvenido/a!', `Sesión iniciada como ${nombreSesion}`);
      router.replace('/');
    } else {
      Alert.alert(
        'Error',
        'Credenciales incorrectas. Verificá el correo y la contraseña.'
      );
    }
  };

  const handleProbarBiometria = async () => {
    const exito = await autenticarConBiometria();
    if (exito) {
      await guardarToken(`mock_jwt_token_${Date.now()}`);
      const datosUsuario = await obtenerUsuario();
      setHaySesion(true);
      setUsuario(
        datosUsuario || { nombre: 'Turista', email: 'turista@colon.gob.ar' }
      );
      router.replace('/');
    }
  };

  const handleCerrarSesion = async () => {
    await borrarToken();
    setHaySesion(false);
    setUsuario(null);
    Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente');
  };

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  // 👤 Vista cuando la sesión SÍ está activa
  if (haySesion) {
    return (
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <Text style={styles.avatar}>👤</Text>
          <Text style={styles.titulo}>
            ¡Hola, {usuario?.nombre || 'Turista'}!
          </Text>
          <Text style={styles.emailText}>
            {usuario?.email || 'turista@colon.gob.ar'}
          </Text>
          <Text style={styles.statusBadge}>✓ Sesión Activa</Text>
        </View>

        {/* Ir al Catálogo */}
        <Pressable
          style={styles.botonIngresar}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.botonTexto}>Ir al Catálogo de Atractivos</Text>
        </Pressable>

        {/* ⚙️ Botón para ir a Mi Perfil / Preferencias (SQLite) */}
        <Pressable
          style={styles.botonPerfil}
          onPress={() => router.push('/perfil')}
        >
          <Text style={styles.botonTextoPerfil}>⚙️ Mi Perfil y Preferencias</Text>
        </Pressable>

        {/* Cerrar Sesión */}
        <Pressable style={styles.botonCerrar} onPress={handleCerrarSesion}>
          <Text style={styles.botonTextoCerrar}>Cerrar Sesión</Text>
        </Pressable>
      </View>
    );
  }

  // 🔑 Formulario de ingreso cuando NO hay sesión
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Iniciar Sesión</Text>
        <Text style={styles.subtitulo}>
          Ingresá a tu cuenta para guardar tus favoritos de Colón
        </Text>

        {/* Campo Email */}
        <Text style={styles.label}>Correo electrónico</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="turista@colon.gob.ar"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}

        {/* Campo Contraseña */}
        <Text style={styles.label}>Contraseña</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="••••••"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry
            />
          )}
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        {/* Botón Iniciar Sesión */}
        <Pressable
          style={styles.botonIngresar}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.botonTexto}>Ingresar</Text>
        </Pressable>

        {/* Botón Biometría */}
        <Pressable
          style={styles.botonBiometria}
          onPress={handleProbarBiometria}
        >
          <Text style={styles.botonTextoBiometria}>
            Ingresar con Huella / Rostro 👆
          </Text>
        </Pressable>

        {/* 🚀 Enlace a Crear Cuenta / Registro */}
        <View style={styles.footerRegistro}>
          <Text style={styles.textoFooter}>¿No tenés una cuenta? </Text>
          <Pressable onPress={() => router.push('/registro')}>
            <Text style={styles.linkRegistro}>Crear Cuenta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    fontSize: 48,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  emailText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  botonIngresar: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonPerfil: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  botonTextoPerfil: {
    color: '#334155',
    fontSize: 15,
    fontWeight: 'bold',
  },
  botonBiometria: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  botonTextoBiometria: {
    color: '#0284c7',
    fontSize: 15,
    fontWeight: '600',
  },
  botonCerrar: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  botonTextoCerrar: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerRegistro: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  textoFooter: {
    color: '#64748b',
    fontSize: 14,
  },
  linkRegistro: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
