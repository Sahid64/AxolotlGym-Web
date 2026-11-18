// Caché en memoria con vencimiento para catálogos que cambian poco (planes, servicios).
// Guarda la promesa, así varias peticiones simultáneas hacen una sola consulta a Supabase.
const memoria = new Map();

export function enCache(clave, ttlMs, cargar) {
  const hit = memoria.get(clave);
  if (hit && hit.vence > Date.now()) return hit.valor;
  const valor = cargar().catch((e) => {
    memoria.delete(clave);
    throw e;
  });
  memoria.set(clave, { valor, vence: Date.now() + ttlMs });
  return valor;
}

// Borra las claves que empiezan con el prefijo (p. ej. al editar servicios)
export function invalidar(prefijo) {
  for (const k of memoria.keys()) if (k.startsWith(prefijo)) memoria.delete(k);
}
