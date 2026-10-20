const express=require('express');
const bcrypt=require('bcrypt');
const pool=require('../services/mysql');
const {auth,roles}=require('../middleware/auth');
const router=express.Router();
router.use(auth);

async function emailExists(email,ignoreId=null){const [r]=await pool.query('SELECT id FROM usuarios WHERE email=? AND (? IS NULL OR id<>?)',[email,ignoreId,ignoreId]);return r.length>0;}

router.get('/',async(req,res)=>{
  try{
    const [r]=await pool.query(`SELECT b.id,b.usuario_id,u.nome,u.email,u.telefone,u.whatsapp_url,u.foto_perfil,b.especialidades,b.dias_trabalho,
      TIME_FORMAT(b.hora_inicio,'%H:%i') hora_inicio,TIME_FORMAT(b.hora_fim,'%H:%i') hora_fim,b.ativo
      FROM barbeiros b JOIN usuarios u ON u.id=b.usuario_id ORDER BY u.nome`);
    res.json(r);
  }catch(e){res.status(500).json({mensagem:e.message});}
});

router.get('/admins',roles('administrador'),async(req,res)=>{
  try{const [r]=await pool.query("SELECT id,nome,email,telefone,whatsapp_url,foto_perfil,ativo,criado_em FROM usuarios WHERE role='administrador' ORDER BY nome");res.json(r);}catch(e){res.status(500).json({mensagem:e.message});}
});

router.post('/admins',roles('administrador'),async(req,res)=>{
  const {nome,email,telefone='',senha,whatsapp_url='',foto_perfil=null}=req.body||{};
  if(!nome||!email||!senha)return res.status(400).json({mensagem:'Nome, e-mail e senha inicial são obrigatórios.'});
  try{
    if(await emailExists(email))return res.status(409).json({mensagem:'E-mail já cadastrado.'});
    const hash=await bcrypt.hash(senha,10);
    const [r]=await pool.query("INSERT INTO usuarios(nome,email,telefone,senha,role,whatsapp_url,foto_perfil) VALUES (?,?,?,?,'administrador',?,?)",[nome,email,telefone,hash,whatsapp_url,foto_perfil||null]);
    res.status(201).json({id:r.insertId,mensagem:'Administrador criado.'});
  }catch(e){res.status(500).json({mensagem:e.message});}
});

router.put('/admins/:id',roles('administrador'),async(req,res)=>{
  const id=Number(req.params.id);const {nome,email,telefone='',senha='',whatsapp_url='',foto_perfil=null,ativo=true}=req.body||{};
  try{
    if(await emailExists(email,id))return res.status(409).json({mensagem:'E-mail já cadastrado.'});
    await pool.query('UPDATE usuarios SET nome=?,email=?,telefone=?,whatsapp_url=?,foto_perfil=?,ativo=? WHERE id=? AND role=\'administrador\'',[nome,email,telefone,whatsapp_url,foto_perfil||null,ativo?1:0,id]);
    if(senha)await pool.query('UPDATE usuarios SET senha=? WHERE id=?',[await bcrypt.hash(senha,10),id]);
    res.json({mensagem:'Administrador atualizado.'});
  }catch(e){res.status(500).json({mensagem:e.message});}
});

router.post('/',roles('administrador'),async(req,res)=>{
  const {nome,email,telefone='',senha,whatsapp_url='',foto_perfil=null,especialidades='',dias_trabalho='1,2,3,4,5,6',hora_inicio='09:00',hora_fim='19:00',ativo=true}=req.body||{};
  if(!nome||!email||!senha)return res.status(400).json({mensagem:'Nome, e-mail e senha inicial são obrigatórios.'});
  const conn=await pool.getConnection();
  try{
    if(await emailExists(email))return res.status(409).json({mensagem:'E-mail já cadastrado.'});
    await conn.beginTransaction();
    const hash=await bcrypt.hash(senha,10);
    const [u]=await conn.query("INSERT INTO usuarios(nome,email,telefone,senha,role,whatsapp_url,foto_perfil,ativo) VALUES (?,?,?,?,'barbeiro',?,?,?)",[nome,email,telefone,hash,whatsapp_url,foto_perfil||null,ativo?1:0]);
    const [b]=await conn.query('INSERT INTO barbeiros(usuario_id,especialidades,dias_trabalho,hora_inicio,hora_fim,ativo) VALUES (?,?,?,?,?,?)',[u.insertId,especialidades,dias_trabalho,hora_inicio,hora_fim,ativo?1:0]);
    await conn.commit();res.status(201).json({id:b.insertId,usuario_id:u.insertId,mensagem:'Barbeiro criado.'});
  }catch(e){await conn.rollback();res.status(500).json({mensagem:e.message});}finally{conn.release();}
});

router.put('/:id',roles('administrador'),async(req,res)=>{
  const id=Number(req.params.id);const {nome,email,telefone='',senha='',whatsapp_url='',foto_perfil=null,especialidades='',dias_trabalho='',hora_inicio='09:00',hora_fim='19:00',ativo=true}=req.body||{};
  const conn=await pool.getConnection();
  try{
    const [[b]]=await conn.query('SELECT usuario_id FROM barbeiros WHERE id=?',[id]);
    if(!b)return res.status(404).json({mensagem:'Barbeiro não encontrado.'});
    if(await emailExists(email,b.usuario_id))return res.status(409).json({mensagem:'E-mail já cadastrado.'});
    await conn.beginTransaction();
    await conn.query('UPDATE usuarios SET nome=?,email=?,telefone=?,whatsapp_url=?,foto_perfil=?,ativo=? WHERE id=?',[nome,email,telefone,whatsapp_url,foto_perfil||null,ativo?1:0,b.usuario_id]);
    if(senha)await conn.query('UPDATE usuarios SET senha=? WHERE id=?',[await bcrypt.hash(senha,10),b.usuario_id]);
    await conn.query('UPDATE barbeiros SET especialidades=?,dias_trabalho=?,hora_inicio=?,hora_fim=?,ativo=? WHERE id=?',[especialidades,dias_trabalho,hora_inicio,hora_fim,ativo?1:0,id]);
    await conn.commit();res.json({mensagem:'Barbeiro atualizado.'});
  }catch(e){await conn.rollback();res.status(500).json({mensagem:e.message});}finally{conn.release();}
});

router.delete('/:id',roles('administrador'),async(req,res)=>{
  const id=Number(req.params.id);
  try{
    const [[b]]=await pool.query('SELECT usuario_id FROM barbeiros WHERE id=?',[id]);
    if(!b)return res.status(404).json({mensagem:'Barbeiro não encontrado.'});
    await pool.query('UPDATE barbeiros SET ativo=0 WHERE id=?',[id]);
    await pool.query('UPDATE usuarios SET ativo=0 WHERE id=?',[b.usuario_id]);
    res.json({mensagem:'Barbeiro desativado.'});
  }catch(e){res.status(500).json({mensagem:e.message});}
});
module.exports=router;
