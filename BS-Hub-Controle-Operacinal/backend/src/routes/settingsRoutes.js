const express=require('express');
const {auth,roles}=require('../middleware/auth');
const pool=require('../services/mysql');
const router=express.Router();
router.use(auth,roles('administrador'));
router.get('/',async(req,res)=>{try{const [[r]]=await pool.query('SELECT * FROM configuracoes WHERE id=1');res.json(r||{});}catch(e){res.status(500).json({mensagem:e.message});}});
router.put('/',async(req,res)=>{const s=req.body||{};try{await pool.query(`UPDATE configuracoes SET nome=?,slogan=?,descricao=?,endereco=?,telefone=?,whatsapp=?,email=?,logo_url=?,cancelamento_horas=?,reagendamento_horas=?,intervalo_minutos=?,antecedencia_dias=? WHERE id=1`,[s.nome||'',s.slogan||'',s.descricao||'',s.endereco||'',s.telefone||'',s.whatsapp||'',s.email||'',s.logoUrl||s.logo_url||null,Number(s.cancelamentoHoras??s.cancelamento_horas??4),Number(s.reagendamentoHoras??s.reagendamento_horas??4),Number(s.intervaloMinutos??s.intervalo_minutos??30),Number(s.antecedenciaDias??s.antecedencia_dias??30)]);res.json({mensagem:'Configurações salvas.'});}catch(e){res.status(500).json({mensagem:e.message});}});
module.exports=router;
