// Configuración pública del periódico.
// supabaseUrl / supabaseKey: proyecto Supabase para comentarios, buzón y encuestas.
// La "publishable/anon key" es pública por diseño; la seguridad la ponen las políticas
// RLS de supabase/schema.sql (solo se puede insertar y leer, nunca borrar ni editar).
window.FLORIDA = {
  nombre: "FLORIDA",
  supabaseUrl: "https://sueumjrcfmpzsdgaubzc.supabase.co",
  supabaseKey: "sb_publishable_0YbvpfJz-DnmdnD5L0Yo3A_DxlVXN2E"
};
