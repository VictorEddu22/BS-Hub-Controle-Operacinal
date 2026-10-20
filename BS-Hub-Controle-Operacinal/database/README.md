# Banco MySQL

O BSHub usa somente MySQL. Não há mais banco JSON/fallback local.

1. Instale e inicie o MySQL local.
2. Ajuste `backend/.env` com usuário e senha do MySQL.
3. Em `backend`, rode `npm install`.
4. Rode `npm run db:init` para criar/recriar o banco e inserir os dados iniciais.
5. Rode `npm start`.

`RESET_DB=true` faz o comando `db:init` recriar o banco de desenvolvimento. Depois de ter dados reais, altere para `RESET_DB=false` e não use o reset.

Logins iniciais:
- Administrador: `admin@bshub.local` / `Admin@123`
- Cliente: `cliente@bshub.local` / `Cliente@123`

Barbeiros de exemplo também são criados para permitir testar a agenda. O administrador pode cadastrar novos barbeiros e administradores pelo próprio sistema.
