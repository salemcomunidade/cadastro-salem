-- ============================================================
-- Sistema de Cadastro da Igreja — schema do banco de dados
-- Copie TODO este arquivo e cole no "SQL Editor" do Supabase,
-- depois clique em "Run". Veja o passo a passo no README.md.
-- ============================================================

-- Tabela principal de membros / visitantes / obreiros
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  photo_url text,
  birth_date date,
  wedding_date date,
  baptism_date date,
  first_visit_date date,
  gender text check (gender is null or gender in ('Feminino', 'Masculino')),
  status text not null default 'Visitante'
    check (status in ('Visitante', 'Membro', 'Membro Criança', 'Membro Jovem', 'Obreiro', 'Inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.members is 'Cadastro de pessoas da igreja (visitantes, membros e obreiros)';

-- Garante a coluna de e-mail em bancos que já existiam antes desse campo
alter table public.members add column if not exists email text;

-- Garante a coluna de sexo (usada para ordenar esposa/marido no relatório
-- de aniversário de casamento) em bancos que já existiam antes desse campo
alter table public.members add column if not exists gender text;
alter table public.members drop constraint if exists members_gender_check;
alter table public.members add constraint members_gender_check
  check (gender is null or gender in ('Feminino', 'Masculino'));

-- Garante os status "Inativo", "Membro Criança" e "Membro Jovem" em bancos
-- que já existiam antes desses tipos
alter table public.members drop constraint if exists members_status_check;
alter table public.members add constraint members_status_check
  check (status in ('Visitante', 'Membro', 'Membro Criança', 'Membro Jovem', 'Obreiro', 'Inativo'));

-- Índice para buscas rápidas por mês de aniversário
create index if not exists idx_members_birth_month
  on public.members (extract(month from birth_date));

create index if not exists idx_members_full_name
  on public.members (full_name);

-- Mantém "updated_at" sempre atualizado automaticamente
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_members_updated_at on public.members;
create trigger trg_members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- ============================================================
-- Segurança (RLS) — só quem estiver logado pode ver/editar dados
-- ============================================================
alter table public.members enable row level security;

drop policy if exists "members_select_authenticated" on public.members;
create policy "members_select_authenticated"
  on public.members for select
  to authenticated
  using (true);

drop policy if exists "members_insert_authenticated" on public.members;
create policy "members_insert_authenticated"
  on public.members for insert
  to authenticated
  with check (true);

drop policy if exists "members_update_authenticated" on public.members;
create policy "members_update_authenticated"
  on public.members for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "members_delete_authenticated" on public.members;
create policy "members_delete_authenticated"
  on public.members for delete
  to authenticated
  using (true);

-- ============================================================
-- Armazenamento das fotos (Storage)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

drop policy if exists "member_photos_public_read" on storage.objects;
create policy "member_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'member-photos');

drop policy if exists "member_photos_insert_authenticated" on storage.objects;
create policy "member_photos_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'member-photos');

drop policy if exists "member_photos_update_authenticated" on storage.objects;
create policy "member_photos_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'member-photos');

drop policy if exists "member_photos_delete_authenticated" on storage.objects;
create policy "member_photos_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'member-photos');

-- ============================================================
-- Departamentos da igreja e associação com os obreiros
-- ============================================================
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.departments is 'Departamentos/ministérios da igreja (ex: Louvor, Mídia, Infantil)';

insert into public.departments (name) values
  ('Administração'),
  ('Casais'),
  ('Conselho'),
  ('Dança'),
  ('Diaconato'),
  ('Expresso Esperança'),
  ('Infantil'),
  ('Jovens'),
  ('Jovens Salém'),
  ('Louvor'),
  ('Mídia'),
  ('Pastoral'),
  ('Recepção'),
  ('Berçario-Salém Kids'),
  ('Primário-Salém Kids'),
  ('Juniores-Salém Kids')
on conflict (name) do nothing;

alter table public.departments enable row level security;

drop policy if exists "departments_select_authenticated" on public.departments;
create policy "departments_select_authenticated"
  on public.departments for select
  to authenticated
  using (true);

drop policy if exists "departments_insert_authenticated" on public.departments;
create policy "departments_insert_authenticated"
  on public.departments for insert
  to authenticated
  with check (true);

drop policy if exists "departments_update_authenticated" on public.departments;
create policy "departments_update_authenticated"
  on public.departments for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "departments_delete_authenticated" on public.departments;
create policy "departments_delete_authenticated"
  on public.departments for delete
  to authenticated
  using (true);

-- Tabela de associação: um obreiro pode estar em vários departamentos
create table if not exists public.member_departments (
  member_id uuid not null references public.members(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, department_id)
);

comment on table public.member_departments is 'Associação N:N entre membros (obreiros) e departamentos';

create index if not exists idx_member_departments_member
  on public.member_departments (member_id);

create index if not exists idx_member_departments_department
  on public.member_departments (department_id);

alter table public.member_departments enable row level security;

drop policy if exists "member_departments_select_authenticated" on public.member_departments;
create policy "member_departments_select_authenticated"
  on public.member_departments for select
  to authenticated
  using (true);

drop policy if exists "member_departments_insert_authenticated" on public.member_departments;
create policy "member_departments_insert_authenticated"
  on public.member_departments for insert
  to authenticated
  with check (true);

drop policy if exists "member_departments_delete_authenticated" on public.member_departments;
create policy "member_departments_delete_authenticated"
  on public.member_departments for delete
  to authenticated
  using (true);

-- ============================================================
-- Parentescos / relacionamentos entre membros
-- ============================================================
-- Cada tipo já guarda o nome "de ida" e o nome "de volta" (inverso),
-- assim ao cadastrar "Marcelo é Pai de Paulo Victor" o sistema já
-- sabe mostrar "Filho(a) de Marcelo" automaticamente no cadastro
-- do Paulo Victor, sem precisar cadastrar duas vezes.
create table if not exists public.relationship_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  inverse_name text not null,
  created_at timestamptz not null default now()
);

comment on table public.relationship_types is 'Tipos de parentesco/relacionamento entre membros (ex: Pai/Filho(a), Esposo(a)/Esposo(a))';

insert into public.relationship_types (name, inverse_name) values
  ('Pai', 'Filho(a)'),
  ('Mãe', 'Filho(a)'),
  ('Filho(a)', 'Pai/Mãe'),
  ('Esposo(a)', 'Esposo(a)'),
  ('Irmão(ã)', 'Irmão(ã)'),
  ('Avô/Avó', 'Neto(a)'),
  ('Neto(a)', 'Avô/Avó'),
  ('Padrinho/Madrinha', 'Afilhado(a)'),
  ('Afilhado(a)', 'Padrinho/Madrinha'),
  ('Tutor(a)', 'Tutelado(a)'),
  ('Tutelado(a)', 'Tutor(a)')
on conflict (name) do nothing;

alter table public.relationship_types enable row level security;

drop policy if exists "relationship_types_select_authenticated" on public.relationship_types;
create policy "relationship_types_select_authenticated"
  on public.relationship_types for select
  to authenticated
  using (true);

drop policy if exists "relationship_types_insert_authenticated" on public.relationship_types;
create policy "relationship_types_insert_authenticated"
  on public.relationship_types for insert
  to authenticated
  with check (true);

drop policy if exists "relationship_types_update_authenticated" on public.relationship_types;
create policy "relationship_types_update_authenticated"
  on public.relationship_types for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "relationship_types_delete_authenticated" on public.relationship_types;
create policy "relationship_types_delete_authenticated"
  on public.relationship_types for delete
  to authenticated
  using (true);

-- Associações entre dois membros (uma linha = uma direção da relação;
-- a direção contrária é calculada na hora, usando o inverse_name do tipo).
create table if not exists public.member_relationships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  related_member_id uuid not null references public.members(id) on delete cascade,
  relationship_type_id uuid not null references public.relationship_types(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint member_relationships_not_self check (member_id <> related_member_id),
  constraint member_relationships_unique unique (member_id, related_member_id, relationship_type_id)
);

comment on table public.member_relationships is 'Parentescos entre membros: member_id é o "tipo.name" de related_member_id';

create index if not exists idx_member_relationships_member
  on public.member_relationships (member_id);

create index if not exists idx_member_relationships_related_member
  on public.member_relationships (related_member_id);

alter table public.member_relationships enable row level security;

drop policy if exists "member_relationships_select_authenticated" on public.member_relationships;
create policy "member_relationships_select_authenticated"
  on public.member_relationships for select
  to authenticated
  using (true);

drop policy if exists "member_relationships_insert_authenticated" on public.member_relationships;
create policy "member_relationships_insert_authenticated"
  on public.member_relationships for insert
  to authenticated
  with check (true);

drop policy if exists "member_relationships_delete_authenticated" on public.member_relationships;
create policy "member_relationships_delete_authenticated"
  on public.member_relationships for delete
  to authenticated
  using (true);

-- ============================================================
-- Cultos
-- ============================================================
create table if not exists public.cultos (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  service_type text not null default 'Presencial'
    check (service_type in ('Presencial', 'On-Line')),
  pastor_name text,
  attendance_count integer
    check (attendance_count is null or attendance_count >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cultos is 'Registro dos cultos realizados pela igreja (data, tipo, pastor, presença e observações)';

create index if not exists idx_cultos_service_date
  on public.cultos (service_date);

drop trigger if exists trg_cultos_updated_at on public.cultos;
create trigger trg_cultos_updated_at
  before update on public.cultos
  for each row execute function public.set_updated_at();

alter table public.cultos enable row level security;

drop policy if exists "cultos_select_authenticated" on public.cultos;
create policy "cultos_select_authenticated"
  on public.cultos for select
  to authenticated
  using (true);

drop policy if exists "cultos_insert_authenticated" on public.cultos;
create policy "cultos_insert_authenticated"
  on public.cultos for insert
  to authenticated
  with check (true);

drop policy if exists "cultos_update_authenticated" on public.cultos;
create policy "cultos_update_authenticated"
  on public.cultos for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "cultos_delete_authenticated" on public.cultos;
create policy "cultos_delete_authenticated"
  on public.cultos for delete
  to authenticated
  using (true);
