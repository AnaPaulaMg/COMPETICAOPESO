# Competição de Peso

Site da competição entre Ana, Luis e Sabrina. O site mostra o placar, o histórico de cada pessoa e uma calculadora de IMC. Use o peso mais recente registrado no cálculo; a altura digitada não é salva.

## Configuração do banco de dados

O site usa Supabase para guardar os pesos. O banco não pode ser criado sem entrar em uma conta Supabase, mas a configuração abaixo é feita uma única vez.

### 1. Criar o projeto Supabase

1. Acesse [supabase.com](https://supabase.com/) e crie uma conta ou entre na sua conta.
2. Crie um projeto e escolha o plano **Free**.
3. Anote a senha do banco definida na criação do projeto e aguarde o projeto terminar de ser criado.

### 2. Criar as tabelas e proteger os pesos

1. Abra seu projeto Supabase.
2. No menu lateral, abra **SQL Editor** e escolha uma consulta nova.
3. No computador, abra o arquivo [`supabase/schema.sql`](./supabase/schema.sql), copie todo o conteúdo e cole no SQL Editor.
4. Clique em **Run**. O script cria as tabelas e as regras de acesso. Não precisa alterar o script.

### 3. Criar sua conta de administradora

1. No Supabase, abra **Authentication → Users** e crie/invite o usuário que você vai usar para entrar no painel do site.
2. Depois, volte para o **SQL Editor**, crie uma consulta e cole o comando abaixo.
3. Troque `seu-email@exemplo.com` pelo mesmo e-mail da conta criada. Execute a consulta.

   ```sql
   insert into public.site_admins (email)
   values ('seu-email@exemplo.com');
   ```

Só o e-mail incluído nessa tabela pode cadastrar, alterar ou excluir pesagens. Não habilite o cadastro público de usuários. Os visitantes podem consultar os pesos, mas não podem modificá-los.

### 4. Conectar o site ao Supabase

1. No Supabase, abra **Project Settings → API** (ou **API Keys**).
2. Copie a **Project URL** e a chave pública **anon / publishable**. Nunca use a chave `service_role` no site.
3. Na pasta do projeto no seu computador, crie um arquivo chamado `.env.local`.
4. Coloque nele as duas linhas abaixo, substituindo pelos valores copiados:

   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica
   ```

   Não compartilhe o conteúdo desse arquivo. Ele já está excluído do Git.

## Testar no computador

Abra um terminal na pasta do projeto e execute:

```sh
npm install
npm run dev
```

Abra no navegador o endereço local mostrado no terminal. Em `/admin`, entre com seu e-mail e senha do Supabase para registrar a data e o peso de Ana, Luis e Sabrina.

## Publicar no Vercel

1. Envie o projeto para um repositório Git e importe esse repositório no [Vercel](https://vercel.com/).
2. No Vercel, abra **Project → Settings → Environment Variables** e adicione:
   - A URL do projeto (`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` ou `VITE_SUPABASE_URL`).
   - A chave pública anon/publishable (`SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `VITE_SUPABASE_ANON_KEY`).
   
   O app reconhece esses nomes automaticamente. Não use `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY` nem credenciais `POSTGRES_*` no navegador.
3. Salve as variáveis e faça um novo deploy para que o Vite as inclua no build.

O Vercel detecta automaticamente o Vite. O comando de build é `npm run build` e a pasta publicada é `dist`. O arquivo [`vercel.json`](./vercel.json) configura as rotas diretas e atualizações de página.

## Páginas

- `/` — placar da competição e evolução semanal.
- `/participante/ana`, `/participante/luis` e `/participante/sabrina` — histórico individual.
- `/imc` — calculadora de IMC, ligada à pesagem mais recente.
- `/admin` — painel privado para administrar as pesagens.

## Como funciona o placar

- A primeira pesagem cadastrada é a referência inicial.
- A liderança considera quem perdeu mais quilos entre a primeira e a pesagem mais recente; o percentual de redução também aparece para comparação.
- O formulário do painel recebe os três pesos na mesma data. Salvar novamente uma data existente atualiza aquela semana.
- A calculadora de IMC é apenas informativa, usa o peso mais recente escolhido e não armazena a altura. Não substitui orientação de um profissional de saúde.
