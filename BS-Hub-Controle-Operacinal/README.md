# BSHub Completo

Sistema de gestão para barbearias com React/Vite, Node/Express e MySQL.

## Rodar

### Banco e backend
1. Instale/inicie o MySQL local.
2. Ajuste `backend/.env` (`DB_USER` e `DB_PASSWORD`).
3. Abra um terminal em `backend`.
4. Rode `npm install`.
5. Rode `npm run db:init`.
6. Rode `npm start`.

Backend: `http://localhost:3000`

### Frontend
1. Abra outro terminal em `frontend`.
2. Rode `npm install`.
3. Rode `npm run dev`.

Frontend: `http://localhost:5173`

## Logins MySQL de teste
- Administrador: `admin@bshub.local` / `Admin@123`
- Cliente: `cliente@bshub.local` / `Cliente@123`

## Permissões
- Administrador: gestão completa; cria outros administradores e barbeiros com e-mail e senha inicial.
- Barbeiro: acessa a própria agenda e edita apenas o próprio perfil/senha.
- Cliente: agenda, cancela, reage e edita o próprio perfil/senha.
- Cadastro público: cria somente clientes.

## Agendamento e WhatsApp
O cliente seleciona serviço, data pelo calendário, barbeiro e só então o horário. Ao confirmar, é redirecionado para `Meus horários` e recebe um pop-up para abrir o WhatsApp configurado no perfil do barbeiro selecionado.

## Perfil
Todos os perfis podem cadastrar foto, telefone e link próprio do WhatsApp e podem trocar a própria senha.

## Notificações
As notificações ficam registradas no banco. Para envio externo automático por e-mail/WhatsApp, configure `EMAIL_WEBHOOK_URL` e/ou `WHATSAPP_WEBHOOK_URL` no `.env`.
