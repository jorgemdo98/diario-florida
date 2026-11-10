// Configuración pública del periódico.
// supabaseUrl / supabaseKey: proyecto Supabase para comentarios, buzón y encuestas.
// La "publishable/anon key" es pública por diseño; la seguridad la ponen las políticas
// RLS de supabase/schema.sql (solo se puede insertar y leer, nunca borrar ni editar).
window.PIXARRA = {
  nombre: "PIXARRA",
  supabaseUrl: "",
  supabaseKey: ""
};
