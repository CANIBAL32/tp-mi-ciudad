import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';

// 1. Importamos guardarToken Y guardarUsuario
import { guardarToken, guardarUsuario } from '../servicios/autenticacion';

export default function PantallaRegistro() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  const validarFormulario = (): boolean => {
    const nuevosErrores: { [key: string]: string } = {};

    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    }

    if (!email.trim()) {
      nuevosErrores.email = 'El correo es obligatorio.';
    } else if (!email.includes('@') || !email.includes('.')) {
      nuevosErrores.email = 'Ingresá un correo electrónico válido.';
    }

    if (!password) {
      nuevosErrores.password = 'La contraseña es obligatoria.';
    } else if (password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (password !== confirmPassword) {
      nuevosErrores.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleRegistro = async () => {
    if (!validarFormulario()) return;

    setCargando(true);
    try {
      const tokenSesion = `token_usr_${Date.now()}`;

      //  GUARDAMOS EL TOKEN Y LOS DATOS DEL USUARIO (incluida la contraseña)
      await guardarToken(tokenSesion);
      await guardarUsuario({ nombre, email, password });

      Alert.alert('¡Cuenta creada!', `Bienvenida/o, ${nombre}. Tu usuario fue guardado.`);

      // Redirigimos al inicio
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la cuenta. Intentalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Crear Cuenta</Text>
        <Text style={styles.subtitulo}>
          Registrate para guardar tus lugares favoritos de Colón
        </Text>

        {/* Campo Nombre */}
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={[styles.input, errores.nombre ? styles.inputError : null]}
          placeholder="Ej: Victoria Gómez"
          value={nombre}
          onChangeText={setNombre}
        />
        {errores.nombre && <Text style={styles.textoError}>{errores.nombre}</Text>}

        {/* Campo Email */}
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={[styles.input, errores.email ? styles.inputError : null]}
          placeholder="tuemail@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {errores.email && <Text style={styles.textoError}>{errores.email}</Text>}

        {/* Campo Contraseña */}
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={[styles.input, errores.password ? styles.inputError : null]}
          placeholder="******"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {errores.password && <Text style={styles.textoError}>{errores.password}</Text>}

        {/* Campo Confirmar Contraseña */}
        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          style={[
            styles.input,
            errores.confirmPassword ? styles.inputError : null,
          ]}
          placeholder="******"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {errores.confirmPassword && (
          <Text style={styles.textoError}>{errores.confirmPassword}</Text>
        )}

        {/* Botón de Registro */}
        <TouchableOpacity
          style={styles.boton}
          onPress={handleRegistro}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.textoBoton}>Registrarme</Text>
          )}
        </TouchableOpacity>

        {/* Enlace a Login */}
        <View style={styles.footerLink}>
          <Text style={styles.textoFooter}>¿Ya tenés una cuenta? </Text>
          <Link href="/login" style={[styles.link]}>
            Iniciar Sesión
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
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
  textoError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  boton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  textoBoton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  textoFooter: {
    color: '#64748b',
  },
  link: {
    color: '#0284c7',
    fontWeight: 'bold',
  },
});