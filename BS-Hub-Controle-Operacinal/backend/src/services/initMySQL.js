require('dotenv').config();
const fs=require('fs');
const path=require('path');
const mysql=require('mysql2/promise');
const bcrypt=require('bcrypt');

async function upsertUser(conn,{id,nome,email,telefone,senha,role,whatsapp_url=''}){
  const hash=await bcrypt.hash(senha,10);
  await conn.query(`INSERT INTO usuarios(id,nome,email,telefone,senha,role,whatsapp_url,ativo)
    VALUES (?,?,?,?,?,?,?,1)
    ON DUPLICATE KEY UPDATE nome=VALUES(nome),telefone=VALUES(telefone),senha=VALUES(senha),role=VALUES(role),whatsapp_url=VALUES(whatsapp_url),ativo=1`,
    [id,nome,email,telefone,hash,role,whatsapp_url]);
}

(async()=>{
  const conn=await mysql.createConnection({
    host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||3306),
    user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',multipleStatements:true
  });
  const db=process.env.DB_NAME||'bshub';
  if(String(process.env.RESET_DB||'false').toLowerCase()==='true') await conn.query(`DROP DATABASE IF EXISTS \`${db}\``);
  const sql=fs.readFileSync(path.join(__dirname,'../../../database/schema.sql'),'utf8');
  await conn.query(sql);
  await conn.query(`USE \`${db}\``);

  await upsertUser(conn,{id:1,nome:'Administrador Teste',email:'admin@bshub.local',telefone:'(31) 99999-0001',senha:'Admin@123',role:'administrador',whatsapp_url:'https://wa.me/5531999990001'});
  await upsertUser(conn,{id:2,nome:'Cliente Teste',email:'cliente@bshub.local',telefone:'(31) 99999-0002',senha:'Cliente@123',role:'cliente'});
  await upsertUser(conn,{id:3,nome:'Caio Martins',email:'caio@bshub.local',telefone:'(31) 98888-1111',senha:'Barbeiro@123',role:'barbeiro',whatsapp_url:'https://wa.me/5531988881111'});
  await upsertUser(conn,{id:4,nome:'Lucas Rocha',email:'lucas@bshub.local',telefone:'(31) 98888-2222',senha:'Barbeiro@123',role:'barbeiro',whatsapp_url:'https://wa.me/5531988882222'});

  await conn.query(`INSERT INTO barbeiros(id,usuario_id,especialidades,dias_trabalho,hora_inicio,hora_fim,ativo)
    VALUES (1,3,'Corte clássico, fade','1,2,3,4,5,6','09:00','19:00',1)
    ON DUPLICATE KEY UPDATE usuario_id=VALUES(usuario_id),especialidades=VALUES(especialidades),dias_trabalho=VALUES(dias_trabalho),hora_inicio=VALUES(hora_inicio),hora_fim=VALUES(hora_fim),ativo=1`);
  await conn.query(`INSERT INTO barbeiros(id,usuario_id,especialidades,dias_trabalho,hora_inicio,hora_fim,ativo)
    VALUES (2,4,'Barba, tesoura','2,3,4,5,6','10:00','19:00',1)
    ON DUPLICATE KEY UPDATE usuario_id=VALUES(usuario_id),especialidades=VALUES(especialidades),dias_trabalho=VALUES(dias_trabalho),hora_inicio=VALUES(hora_inicio),hora_fim=VALUES(hora_fim),ativo=1`);

  await conn.end();
  console.log('MySQL inicializado. Admin: admin@bshub.local / Admin@123 | Cliente: cliente@bshub.local / Cliente@123');
})().catch(e=>{console.error(e);process.exit(1)});
