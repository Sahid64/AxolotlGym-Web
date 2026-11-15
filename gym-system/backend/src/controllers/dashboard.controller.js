import { supabase, rpc, consulta, manejar, numero } from "../data/supabase.js";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DIAS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]; // dia_semana 1..7 (ISO)

// Tarjetas del dashboard (vista resumen_dashboard, descontando perfiles eliminados por ARCO)
export const resumenDashboard = manejar(async (req, res) => {
  const [filas, clientes] = await Promise.all([
    consulta(supabase.from("resumen_dashboard").select("*").limit(1)),
    consulta(supabase.from("clientes_lista").select("gmail, nombre, activa, estado")),
  ]);
  const r = filas?.[0] || {};
  const visibles = (clientes || []).filter(
    (c) => !String(c.gmail || "").endsWith("@anonimo.axolotl") && c.nombre !== "Cliente Eliminado"
  );
  const activos = visibles.filter((c) => c.activa && c.estado === "ACTIVO").length;
  const inactivos = visibles.length - activos;

  res.json({
    ok: true,
    resumen: {
      clientesActivos: visibles.length ? activos : numero(r.activos),
      clientesInactivos: visibles.length ? inactivos : numero(r.inactivos),
      ingresosMes: numero(r.ingresos_mes),
    },
  });
});

// Ocupacion de hoy por hora (vista ocupacion_por_hora), rellenando horas sin gente
export const ocupacionPorHora = manejar(async (req, res) => {
  const filas = await consulta(supabase.from("ocupacion_por_hora").select("*"));
  const porHora = Object.fromEntries(filas.map((f) => [parseInt(f.hora, 10), numero(f.personas)]));
  const data = Array.from({ length: 18 }, (_, i) => i + 6).map((h) => ({
    hora: `${h}:00`,
    personas: porHora[h] || 0,
  }));
  res.json({ ok: true, ocupacion: data });
});

// Clientes activos / inactivos de los ultimos 12 meses (vista clientes_por_mes)
export const clientesPorMes = manejar(async (req, res) => {
  const filas = await consulta(supabase.from("clientes_por_mes").select("*").order("periodo"));
  const data = filas.map((f) => ({
    mes: MESES[parseInt(f.periodo.slice(5, 7), 10) - 1],
    periodo: f.periodo,
    activos: numero(f.activos),
    inactivos: numero(f.inactivos),
  }));
  res.json({ ok: true, data });
});

// Promedio de entradas por dia de la semana, ultimas 4 semanas (vista afluencia_semanal)
export const entradasPorDia = manejar(async (req, res) => {
  const filas = await consulta(supabase.from("afluencia_semanal").select("dia_semana, promedio"));
  const totales = Array(7).fill(0);
  filas.forEach((f) => {
    totales[f.dia_semana - 1] += numero(f.promedio);
  });
  const data = DIAS.map((dia, i) => ({ dia, entradas: Math.round(totales[i]) }));
  res.json({ ok: true, data });
});
// Personas dentro del gimnasio en este momento (igual que la tarjeta de la app)
export const ocupacionActual = manejar(async (req, res) => {
  const dentro = await rpc("ocupacion_actual");
  res.json({ ok: true, dentro: numero(dentro) });
});

// Ingresos por día de esta semana (vista ingresos_semana, la misma gráfica de la app)
export const ingresosPorDia = manejar(async (req, res) => {
  const filas = await consulta(supabase.from("ingresos_semana").select("fecha, dia_semana, total"));
  const totales = Array(7).fill(0);
  filas.forEach((f) => {
    if (f.dia_semana >= 1 && f.dia_semana <= 7) totales[f.dia_semana - 1] += numero(f.total);
  });
  const data = DIAS.map((dia, i) => ({ dia, ingresos: totales[i] }));
  res.json({ ok: true, data });
});
