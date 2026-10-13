import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

const TOKEN_KEY = 'user_session_token';

export async function guardarToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function obtenerToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function borrarToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function autenticarConBiometria(): Promise<boolean> {
  try {
    const tieneHardware = await LocalAuthentication.hasHardwareAsync();
    const estaInscripto = await LocalAuthentication.isEnrolledAsync();

    if (!tieneHardware) {
      Alert.alert('Diagnóstico', 'El celular no detecta sensor biométrico.');
      return false;
    }

    if (!estaInscripto) {
      Alert.alert('Diagnóstico', 'Falta configurar huella, rostro o PIN en los Ajustes del celular.');
      return false;
    }

    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ingresar a Mi Ciudad Colón',
      fallbackLabel: 'Usar contraseña',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false, // Permite usar el PIN/Patrón si falla el sensor
    });

    if (!resultado.success) {
      Alert.alert('Diagnóstico', 'La autenticación no fue exitosa o se canceló.');
    }

    return resultado.success;
  } catch (error) {
    Alert.alert('Error inesperado', String(error));
    return false;
  }
}