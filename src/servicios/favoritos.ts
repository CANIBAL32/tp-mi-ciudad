import * as SQLite from 'expo-sqlite';
import { Favorito } from '../tipos/favoritos';

// Abrir base de datos SQLite
const db = SQLite.openDatabaseSync('miciudad.db');

const USUARIO_DEFAULT = 'usuario_invitado';

export async function inicializarBaseDatosFavoritos(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favoritos (
      id TEXT PRIMARY KEY NOT NULL,
      usuarioId TEXT NOT NULL,
      lugarId TEXT NOT NULL,
      creadoEn TEXT NOT NULL
    );
  `);
}

export async function obtenerFavoritosPorUsuario(usuarioId: string = USUARIO_DEFAULT): Promise<Favorito[]> {
  await inicializarBaseDatosFavoritos();
  const resultado = await db.getAllAsync<Favorito>(
    'SELECT * FROM favoritos WHERE usuarioId = ? ORDER BY creadoEn DESC;',
    [usuarioId]
  );
  return resultado;
}

// Devuelve los IDs de lugares favoritos (compatible con la vista de tu compañera)
export async function obtenerFavoritosIds(usuarioId: string = USUARIO_DEFAULT): Promise<string[]> {
  const lista = await obtenerFavoritosPorUsuario(usuarioId);
  return lista.map((item) => item.lugarId);
}

// Permite llamar con 1 parámetro (lugarId) o con 2 parámetros (usuarioId, lugarId)
export async function alternarFavorito(arg1: string, arg2?: string): Promise<boolean> {
  await inicializarBaseDatosFavoritos();

  const usuarioId = arg2 ? arg1 : USUARIO_DEFAULT;
  const lugarId = arg2 ? arg2 : arg1;

  const existe = await db.getFirstAsync<Favorito>(
    'SELECT * FROM favoritos WHERE usuarioId = ? AND lugarId = ?;',
    [usuarioId, lugarId]
  );

  if (existe) {
    await db.runAsync(
      'DELETE FROM favoritos WHERE usuarioId = ? AND lugarId = ?;',
      [usuarioId, lugarId]
    );
    return false; // Quitado de favoritos
  } else {
    const nuevoId = `fav-${Date.now()}`;
    const fecha = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO favoritos (id, usuarioId, lugarId, creadoEn) VALUES (?, ?, ?, ?);',
      [nuevoId, usuarioId, lugarId, fecha]
    );
    return true; // Agregado a favoritos
  }
}