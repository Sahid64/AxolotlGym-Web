-- =====================================================================
--  AXOLOTL · Optimización de rendimiento (índices + consultas en lote)
--  Supabase → SQL Editor → pegar todo → Run. Se puede ejecutar varias veces.
--
--  · Solo AGREGA índices, funciones y vistas nuevas. No cambia ni renombra
--    tablas, vistas ni funciones RPC existentes (la app Android sigue igual).
--  · Todos los índices usan IF NOT EXISTS y nombres nuevos, así que no chocan
--    con los que ya existen (clientes_eliminados_*, movimientos_rol_*,
--    registros_acceso_*, solicitudes_cancelacion_pendiente_uq, servicios_una_visita).
--  · Sin CONCURRENTLY porque el SQL Editor corre en una transacción; con el
--    tamaño actual de las tablas tarda segundos.
--  · El backend funciona aunque este script aún no se haya ejecutado (usa
--    las consultas anteriores como respaldo), pero va más lento.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ÍNDICES
-- ---------------------------------------------------------------------

-- clientes_lista: su LEFT JOIN LATERAL busca las membresías de CADA cliente.
-- Sin este índice se recorre membresias_cliente completa por cada cliente.
create index if not exists membresias_cliente_cliente_idx
  on membresias_cliente (cliente_id, fecha_fin desc, id desc);

-- _id_usuario(), foto_personal(), login y casi todas las RPC buscan por lower(gmail);
-- el UNIQUE(gmail) existente no sirve para esa expresión.
create index if not exists usuarios_gmail_lower_idx on usuarios (lower(gmail));

-- pagos: ingresos del dashboard, reportes, pagos pendientes y recibos
create index if not exists pagos_cliente_idx    on pagos (cliente_id);
create index if not exists pagos_membresia_idx  on pagos (membresia_cliente_id);
create index if not exists pagos_fecha_idx      on pagos (fecha_pago);
create index if not exists pagos_fecha_mx_idx   on pagos (((fecha_pago at time zone 'America/Mexico_City')::date)); -- ingresos_semana
create index if not exists pagos_pendientes_idx on pagos (fecha_pago) where estado = 'PENDIENTE' and tipo = 'PAGO';

-- Llaves foráneas sin índice (joins de las vistas y ON DELETE CASCADE de eliminar_cliente)
create index if not exists usuario_roles_rol_idx               on usuario_roles (rol_id);
create index if not exists solicitudes_asesoria_cliente_idx    on solicitudes_asesoria (cliente_id);
create index if not exists solicitudes_asesoria_instructor_idx on solicitudes_asesoria (instructor_id, estado);
create index if not exists solicitudes_cancelacion_mem_idx     on solicitudes_cancelacion (membresia_id, estado);
create index if not exists solicitudes_cancelacion_cliente_idx on solicitudes_cancelacion (cliente_id);
create index if not exists asistencias_cliente_idx             on asistencias (cliente_id);
create index if not exists rutinas_cliente_idx                 on rutinas (cliente_id);
create index if not exists rutinas_instructor_idx              on rutinas (instructor_id);
create index if not exists ejercicios_rutina_rutina_idx        on ejercicios_rutina (rutina_id);
create index if not exists visitas_fecha_idx                   on visitas (fecha);
create index if not exists gastos_fecha_idx                    on gastos (fecha desc);
create index if not exists clientes_dentro_idx                 on clientes (id) where dentro;

-- ---------------------------------------------------------------------
-- 2) FOTOS EN LOTE (antes: una petición + una RPC por cada fila de la tabla)
--    Mismo nivel de acceso que foto_cliente_por_id / foto_personal.
-- ---------------------------------------------------------------------
create or replace function fotos_clientes(p_ids bigint[])
returns table (r_id bigint, r_foto text)
language sql stable security definer set search_path = public as $$
  select id, foto_perfil from clientes where id = any(p_ids) and foto_perfil is not null
$$;

create or replace function fotos_personal(p_ids bigint[])
returns table (r_id bigint, r_foto text)
language sql stable security definer set search_path = public as $$
  select id, foto_perfil from usuarios where id = any(p_ids) and foto_perfil is not null
$$;

grant execute on function fotos_clientes(bigint[]) to anon, authenticated;
grant execute on function fotos_personal(bigint[]) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) PERSONAL CON DETALLE (antes: detalle_personal una vez por persona)
-- ---------------------------------------------------------------------
create or replace view personal_lista_detalle as
select p.id, p.nombre, p.gmail, p.estado, p.rol,
       coalesce(u.telefono, '') as telefono,
       i.costo_asesoria as costo,
       i.max_clientes
  from personal_lista p
  join usuarios u on u.id = p.id
  left join instructores i on i.usuario_id = p.id;

grant select on personal_lista_detalle to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) CONTEO DE CLIENTES PARA EL DASHBOARD
--    (antes el backend descargaba todos los clientes para contarlos)
--    Misma regla que la web: vigente = membresía activa y cuenta ACTIVA,
--    sin contar perfiles anonimizados por Derechos ARCO.
-- ---------------------------------------------------------------------
create or replace view resumen_clientes as
select count(*) filter (where activa and estado = 'ACTIVO')       as activos,
       count(*) filter (where not (activa and estado = 'ACTIVO')) as inactivos
  from clientes_lista
 where gmail not like '%@anonimo.axolotl'
   and nombre <> 'Cliente Eliminado';

grant select on resumen_clientes to anon, authenticated;

-- ---------------------------------------------------------------------
analyze usuarios, clientes, membresias_cliente, pagos;
notify pgrst, 'reload schema';

-- Verificación (opcional, ejecutar aparte):
--   explain analyze select * from clientes_lista order by nombre;
--   → dentro del loop debe aparecer "Index Scan using membresias_cliente_cliente_idx"
