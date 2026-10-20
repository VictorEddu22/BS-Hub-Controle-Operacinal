const express=require('express');
const bcrypt=require('bcrypt');
const pool=require('../services/mysql');
const {auth}=require('../middleware/auth');
const router=express.Router();
router.use(auth);

router.get('/',async(req,res)=>{
  try{
    const [[u]]=await pool.query('SELECT id,nome,email,telefone,role,whatsapp_url,foto_perfil FROM usuarios WHERE id=? AND ativo=1',[req.user.id]);
    if(!u)return res.status(404).json({mensagem:'Perfil não encontrado.'});
    if(u.role==='barbeiro'){
      const [[b]]=await pool.query("SELECT id,especialidades,dias_trabalho,TIME_FORMAT(hora_inicio,'%H:%i') hora_inicio,TIME_FORMAT(hora_fim,'%H:%i') hora_fim FROM barbeiros WHERE usuario_id=?",[u.id]);
      u.barbeiro=b||null;
    }
    res.json(u);
  }catch(e){res.status(500).json({mensagem:e.message});}
});

router.put('/',async(req,res)=>{
  const {nome,telefone='',whatsapp_url='',foto_perfil=null}=req.body||{};
  if(!nome)return res.status(400).json({mensagem:'Nome é obrigatório.'});
  if(foto_perfil && String(foto_perfil).length>2_000_000)return res.status(413).json({mensagem:'A foto é muito grande. Use uma imagem menor.'});
  try{
    await pool.query('UPDATE usuarios SET nome=?,telefone=?,whatsapp_url=?,foto_perfil=? WHERE id=?',[nome,telefone,whatsapp_url,foto_perfil||null,req.user.id]);
    const [[u]]=await pool.query('SELECT id,nome,email,telefone,role,whatsapp_url,foto_perfil FROM usuarios WHERE id=?',[req.user.id]);
    res.json(u);
  }catch(e){res.status(500).json({mensagem:e.message});}
});

router.put('/password',async(req,res)=>{
  const {senha_atual,nova_senha}=req.body||{};
  if(!senha_atual||!nova_senha||nova_senha.length<6)return res.status(400).json({mensagem:'Informe a senha atual e uma nova senha com pelo menos 6 caracteres.'});
  try{
    const [[u]]=await pool.query('SELECT senha FROM usuarios WHERE id=?',[req.user.id]);
    if(!u||!await bcrypt.compare(senha_atual,u.senha))return res.status(400).json({mensagem:'Senha atual incorreta.'});
    await pool.query('UPDATE usuarios SET senha=? WHERE id=?',[await bcrypt.hash(nova_senha,10),req.user.id]);
    res.json({mensagem:'Senha alterada com sucesso.'});
  }catch(e){res.status(500).json({mensagem:e.message});}
});
module.exports=router;
