const express=require('express');
const {auth,roles}=require('../middleware/auth');
const pool=require('../services/mysql');
const router=express.Router();
router.use(auth,roles('administrador'));
router.get('/',async(req,res)=>{try{const [r]=await pool.query("SELECT id,nome,email,telefone,whatsapp_url,foto_perfil,criado_em FROM usuarios WHERE role='cliente' AND ativo=1 ORDER BY nome");res.json(r);}catch(e){res.status(500).json({mensagem:e.message});}});
module.exports=router;
