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
  photo_url text,
  birth_date date,
  wedding_date date,
  baptism_date date,
  first_visit_date date,
  status text not null default 'Visitante'
    check (status in ('Visitante', 'Membro', 'Obreiro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.members is 'Cadastro de pessoas da igreja (visitantes, membros e obreiros)';

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
  ('Pastoral'),
  ('Diaconato'),
  ('Louvor'),
  ('Dança'),
  ('Infantil'),
  ('Jovens'),
  ('Mídia'),
  ('Recepção')
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
