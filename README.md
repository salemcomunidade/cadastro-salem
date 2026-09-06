# Cadastro da Igreja

Sistema simples e moderno para cadastrar visitantes, membros e obreiros da igreja, pensado para ser usado no celular na recepção antes do culto. Guarda foto, nome, telefone, datas importantes (nascimento, casamento, batismo, 1ª visita) e status. No fim do mês, gera a lista de aniversariantes de qualquer mês, pronta para imprimir/PDF ou copiar para o WhatsApp.

Este guia foi escrito para quem **nunca mexeu com programação**. Siga os passos na ordem. Nenhum deles tem custo (dentro dos limites gratuitos descritos no final).

---

## Visão geral do que vamos montar

- **O aplicativo** (a telinha que você usa no celular) — já está pronto, é o código desta pasta.
- **O banco de dados na nuvem** — vamos usar o **Supabase** (gratuito), que guarda os cadastros e as fotos com segurança.
- **A publicação do site** — vamos usar a **Vercel** (gratuita), que coloca o aplicativo em um endereço de internet (ex: `cadastro-igreja.vercel.app`) que você acessa pelo celular.

Depois de publicado, você "instala" esse endereço na tela inicial do celular e ele funciona como um aplicativo normal.

---

## Passo 1 — Criar o banco de dados (Supabase)

1. Acesse **https://supabase.com** e clique em **"Start your project"**. Crie uma conta gratuita (pode entrar com Google ou GitHub).
2. Clique em **"New project"**.
   - Dê um nome, por exemplo `cadastro-igreja`.
   - Crie uma **senha do banco de dados** (guarde essa senha em um lugar seguro — não é a senha de login do app, é só do banco).
   - Escolha a região mais próxima do Brasil (ex: `South America (São Paulo)`, se disponível).
3. Aguarde alguns minutos até o projeto ficar pronto.

### 1.1 Criar as tabelas e a segurança

1. No menu lateral do Supabase, clique em **"SQL Editor"**.
2. Clique em **"New query"**.
3. Abra o arquivo **`supabase/schema.sql`** (está dentro desta pasta do projeto), copie **todo o conteúdo** e cole no editor do Supabase.
4. Clique em **"Run"** (ou `Ctrl+Enter`).
5. Deve aparecer "Success". Isso já criou: a tabela de cadastros, as regras de segurança (só quem tem login vê os dados) e o espaço de armazenamento das fotos.

### 1.2 Pegar as chaves de acesso

1. No menu lateral, clique em **"Project Settings" (ícone de engrenagem) → "Data API"** (ou "API", dependendo da versão).
2. Anote dois valores:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
   - **anon public key** (uma chave longa de letras e números)

Você vai usar esses dois valores no Passo 2.

### 1.3 Criar o login de quem vai usar o sistema

Não existe tela de "criar conta" dentro do aplicativo — por segurança, só você (o administrador) cria os acessos.

1. No menu lateral do Supabase, clique em **"Authentication" → "Users"**.
2. Clique em **"Add user" → "Create new user"**.
3. Preencha e-mail e senha da pessoa (ex: a recepcionista) e marque **"Auto Confirm User"** (assim ela já pode entrar direto, sem precisar confirmar e-mail).
4. Repita para cada pessoa que for usar o sistema.

Guarde esses e-mails e senhas — é o que a pessoa vai digitar na tela de login do aplicativo.

---

## Passo 2 — Publicar o aplicativo (Vercel)

A forma mais simples de publicar sem precisar instalar nada no seu computador é enviar esta pasta para o **GitHub** e conectar no **Vercel**. Se você já tem alguém (um "TI da igreja", um amigo que mexe com programação, ou eu mesmo em uma próxima conversa) para ajudar nessa parte, esse é o único passo que pede algum conhecimento técnico.

1. Acesse **https://github.com**, crie uma conta gratuita (se ainda não tiver).
2. Crie um novo repositório (botão **"New repository"**), por exemplo `cadastro-igreja`, e envie todos os arquivos desta pasta para ele (dá para fazer isso pela própria interface do GitHub, em **"uploading an existing file"**, arrastando os arquivos).
3. Acesse **https://vercel.com** e crie uma conta gratuita (pode entrar com sua conta do GitHub, é o mais fácil).
4. Clique em **"Add New..." → "Project"** e selecione o repositório que você acabou de criar.
5. Antes de clicar em "Deploy", abra **"Environment Variables"** e adicione:
   - `VITE_SUPABASE_URL` = a **Project URL** que você anotou no passo 1.2
   - `VITE_SUPABASE_ANON_KEY` = a **anon public key** que você anotou no passo 1.2
6. Clique em **"Deploy"**. Em 1 ou 2 minutos o Vercel te dá um endereço, por exemplo `https://cadastro-igreja.vercel.app`.

Pronto — esse é o endereço que a recepção vai usar.

> **Dica:** sempre que você (ou quem for te ajudar) quiser mudar algo no sistema no futuro, basta atualizar os arquivos no GitHub que o Vercel publica a nova versão sozinho.

---

## Passo 3 — Instalar no celular (como um aplicativo)

### Android (Chrome)
1. Abra o endereço do site (ex: `https://cadastro-igreja.vercel.app`) no Chrome.
2. Toque nos três pontinhos (menu) no canto superior direito.
3. Toque em **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
4. Confirme. O ícone da igreja aparecerá na tela inicial do celular, igual a um app baixado da loja.

### iPhone (Safari)
1. Abra o endereço do site no **Safari** (precisa ser o Safari, não funciona pelo Chrome no iPhone).
2. Toque no ícone de **Compartilhar** (o quadrado com a seta para cima).
3. Escolha **"Adicionar à Tela de Início"**.
4. Confirme. O ícone aparecerá na tela inicial.

A partir daí, é só tocar no ícone — abre em tela cheia, sem barra de navegador, como um aplicativo de verdade.

---

## Como usar no dia a dia

- **Tela "Membros"**: lista todos os cadastros, com busca por nome/telefone e filtro por Visitante/Membro/Obreiro. Toque no botão **"+"** (canto inferior direito) para cadastrar alguém novo.
- **Cadastro**: toque em "Adicionar foto" para tirar uma foto na hora (ou escolher da galeria), preencha nome, telefone, status e as datas que tiver disponíveis. Não é obrigatório preencher todas as datas.
- **Editar/excluir**: toque em qualquer pessoa da lista para abrir o cadastro dela, alterar dados ou excluir.
- **Tela "Aniversariantes"**: escolha o mês (e o ano, se quiser calcular a idade certa) e veja a lista ordenada por dia. Use:
  - **"Imprimir / salvar PDF"** — abre a tela de impressão do celular/computador; escolha "Salvar como PDF" se quiser um arquivo em vez de imprimir no papel.
  - **"Copiar p/ WhatsApp"** — copia um texto já formatado com a lista, para colar direto em um grupo do WhatsApp.

Para tirar a lista dos aniversariantes **do mês seguinte** (como no fechamento do mês), basta selecionar o próximo mês no seletor antes de imprimir.

---

## Rodando no seu computador (opcional, para quem for mexer no código)

Se quiser testar ou alterar o sistema no computador antes de publicar:

```bash
npm install
cp .env.example .env   # depois preencha com a URL e a chave do Supabase
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).

---

## Custos

Para o tamanho normal de uma igreja (algumas centenas de cadastros e fotos), tudo isso funciona **dentro do plano gratuito**:

- **Supabase (grátis)**: até 500 MB de banco de dados e 1 GB de armazenamento de arquivos/fotos.
- **Vercel (grátis)**: hospedagem do site sem custo para esse tipo de uso.

Se um dia a igreja crescer muito e passar desses limites, os dois serviços avisam por e-mail e você decide se quer fazer upgrade (pago) — não é algo que acontece sem aviso.

---

## Segurança dos dados

- Só entra no sistema quem tiver usuário e senha criados por você (Passo 1.3).
- As fotos e os dados ficam nos servidores do Supabase, com criptografia, e só usuários logados conseguem cadastrar, editar ou excluir.
- Recomenda-se trocar a senha de cada usuário periodicamente e remover o acesso de quem não usa mais o sistema (na mesma tela "Authentication → Users" do Supabase).

---

## Se precisar de ajuda

Qualquer passo que travar — criar o projeto no Supabase, publicar no Vercel, ou até mudar alguma tela do sistema — você pode voltar nesta conversa e me pedir ajuda que eu te guio parte por parte.
