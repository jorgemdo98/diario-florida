-- FLORIDA · base de datos del buzón, comentarios y encuestas (Supabase / Postgres)
-- Pegar entero en Supabase → SQL Editor → Run.
-- Los lectores (rol "anon") solo pueden LEER e INSERTAR. Nadie puede editar ni borrar
-- desde la web; la moderación se hace desde el panel de Supabase.

create table if not exists public.comentarios (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  edicion     text not null check (edicion ~ '^\d{4}-\d{2}-\d{2}$'),
  pieza       text check (char_length(pieza) <= 60),
  tipo        text not null default 'comentario' check (tipo in ('comentario','sugerencia','meme')),
  nombre      text not null check (char_length(nombre) between 1 and 40),
  titulo      text check (char_length(titulo) <= 200),
  texto       text not null check (char_length(texto) between 1 and 3000),
  enlace      text check (enlace is null or (enlace ~ '^https?://' and char_length(enlace) <= 600)),
  oculto      boolean not null default false,   -- marcar a true desde el panel para moderar
  usado_en    text                              -- edición en la que la redacción lo usó
);
create index if not exists comentarios_edicion_pieza on public.comentarios (edicion, pieza);

create table if not exists public.votos (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  edicion     text not null,
  encuesta    text not null check (char_length(encuesta) <= 60),
  opcion      smallint not null check (opcion between 0 and 9),
  votante     text not null check (char_length(votante) between 8 and 64),
  unique (encuesta, votante)
);

alter table public.comentarios enable row level security;
alter table public.votos enable row level security;

drop policy if exists "leer comentarios" on public.comentarios;
create policy "leer comentarios" on public.comentarios for select to anon using (not oculto);
drop policy if exists "escribir comentarios" on public.comentarios;
create policy "escribir comentarios" on public.comentarios for insert to anon with check (not oculto and usado_en is null);

drop policy if exists "leer votos" on public.votos;
create policy "leer votos" on public.votos for select to anon using (true);
drop policy if exists "votar" on public.votos;
create policy "votar" on public.votos for insert to anon with check (true);

-- Columnas que el rol anon puede ver (el identificador del votante no se expone).
revoke select on public.votos from anon;
grant select (edicion, encuesta, opcion) on public.votos to anon;
grant insert on public.votos to anon;
grant select, insert on public.comentarios to anon;
