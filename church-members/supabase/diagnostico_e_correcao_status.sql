-- ============================================================
-- Diagnóstico e correção de status (Membro Criança / Membro Jovem)
-- Copie e cole no "SQL Editor" do Supabase.
--
-- PARTE 1 é só leitura (não muda nada) — rode primeiro para ver
-- quem provavelmente precisa mudar de status.
-- PARTE 2 é onde você efetivamente corrige os registros — edite
-- a lista de nomes antes de rodar essa parte.
-- ============================================================


-- ============================================================
-- PARTE 1 — Diagnóstico (só leitura, seguro rodar quantas vezes quiser)
-- ============================================================

-- 1a) Obreiros que já têm data de nascimento cadastrada, do mais novo
--     para o mais velho. Quem aparecer aqui com poucos anos de idade
--     provavelmente deveria ser "Membro Criança" ou "Membro Jovem",
--     não "Obreiro".
select
  full_name,
  birth_date,
  date_part('year', age(current_date, birth_date))::int as idade,
  status
from public.members
where status = 'Obreiro'
  and birth_date is not null
order by birth_date desc;

-- 1b) Todo mundo que está em algum departamento do "Salém Kids" ou
--     "Jovens Salém" hoje, com o status atual — ajuda a ver quem
--     precisa ser corrigido.
select
  m.full_name,
  m.status,
  m.birth_date,
  d.name as departamento
from public.member_departments md
join public.members m on m.id = md.member_id
join public.departments d on d.id = md.department_id
where d.name in ('Berçario-Salém Kids', 'Primário-Salém Kids', 'Juniores-Salém Kids', 'Jovens Salém')
order by d.name, m.full_name;


-- ============================================================
-- PARTE 2 — Correção (edite a lista de nomes antes de rodar!)
-- ============================================================
-- Troque os nomes de exemplo abaixo pelos nomes reais (exatamente como
-- estão cadastrados) das pessoas que devem passar para cada status.
-- Se algum nome não existir exatamente assim, a linha simplesmente não
-- muda nada (não dá erro).

-- 2a) Marcar como "Membro Criança"
update public.members
set status = 'Membro Criança'
where full_name in (
  'Nome Completo da Criança 1',
  'Nome Completo da Criança 2'
);

-- 2b) Marcar como "Membro Jovem"
update public.members
set status = 'Membro Jovem'
where full_name in (
  'Nome Completo do Jovem 1',
  'Nome Completo do Jovem 2'
);

-- 2c) (Opcional) Depois de corrigir os status acima, você pode conferir
--     o resultado rodando a consulta 1b de novo.
