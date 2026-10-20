const express=require('express');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const pool=require('../services/mysql');
const {auth}=require('../middleware/auth');
const router=express.Router();

function sign(user){return jwt.sign({id:user.id,nome:user.nome,role:user.role},process.env.JWT_SECRET||'dev-secret',{expiresIn:'8h'});}
function safeUser(u){return {id:u.id,nome:u.nome,email:u.email,telefone:u.telefone||'',role:u.role,whatsapp_url:u.whatsapp_url||'',foto_perfil:u.foto_perfil||null};}

router.post('/login',async(req,res)=>{
  const {email,senha}=req.body||{};
  if(!email||!senha)return res.status(400).json({mensagem:'E-mail e senha são obrigatórios.'});
  try{
    const [[user]]=await pool.query('SELECT * FROM usuarios WHERE email=? AND ativo=1 LIMIT 1',[email]);
    if(!user||!await bcrypt.compare(senha,user.senha))return res.status(401).json({mensagem:'E-mail ou senha inválidos.'});
    const safe=safeUser(user);res.json({...safe,token:sign(safe)});
  }catch(e){res.status(500).json({mensagem:'Não foi possível entrar.',erro:e.message});}
});

router.post('/cadastro',async(req,res)=>{
  const {nome,email,telefone='',senha}=req.body||{};
  if(!nome||!email||!senha)return res.status(400).json({mensagem:'Preencha nome, e-mail e senha.'});
  try{
    const [exists]=await pool.query('SELECT id FROM usuarios WHERE email=?',[email]);
    if(exists.length)return res.status(409).json({mensagem:'E-mail já cadastrado.'});
    const hash=await bcrypt.hash(senha,10);
    const [r]=await pool.query("INSERT INTO usuarios(nome,email,telefone,senha,role) VALUES (?,?,?,?,'cliente')",[nome,email,telefone,hash]);
    const safe={id:r.insertId,nome,email,telefone,role:'cliente',whatsapp_url:'',foto_perfil:null};
    res.status(201).json({...safe,token:sign(safe)});
  }catch(e){res.status(500).json({mensagem:'Não foi possível criar a conta.',erro:e.message});}
});

router.get('/me',auth,async(req,res)=>{
  const [[u]]=await pool.query('SELECT id,nome,email,telefone,role,whatsapp_url,foto_perfil FROM usuarios WHERE id=?',[req.user.id]);
  if(!u)return res.status(404).json({mensagem:'Usuário não encontrado.'});
  res.json(safeUser(u));
});
module.exports=router;
