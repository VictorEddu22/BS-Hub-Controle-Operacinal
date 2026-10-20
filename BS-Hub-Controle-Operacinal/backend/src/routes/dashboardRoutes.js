const express=require('express');
const {auth,roles}=require('../middleware/auth');
const pool=require('../services/mysql');
const router=express.Router();
router.use(auth,roles('administrador'));
router.get('/',async(req,res)=>{try{const [[kpi]]=await pool.query(`SELECT COALESCE(SUM(CASE WHEN a.status='concluido' THEN s.preco ELSE 0 END),0) receita,(SELECT COUNT(*) FROM agendamentos WHERE DATE(data_hora)=CURDATE() AND status<>'cancelado') agendamentosHoje,(SELECT COUNT(*) FROM usuarios WHERE role='cliente' AND ativo=1) clientes,(SELECT COUNT(*) FROM barbeiros WHERE ativo=1) barbeiros FROM agendamentos a LEFT JOIN servicos s ON s.id=a.servico_id`);const [agenda]=await pool.query(`SELECT a.id,TIME_FORMAT(a.data_hora,'%H:%i') hora,a.status,c.nome cliente,buser.nome barbeiro,s.nome servico FROM agendamentos a JOIN usuarios c ON c.id=a.cliente_id JOIN barbeiros b ON b.id=a.barbeiro_id JOIN usuarios buser ON buser.id=b.usuario_id JOIN servicos s ON s.id=a.servico_id WHERE DATE(a.data_hora)=CURDATE() AND a.status<>'cancelado' ORDER BY a.data_hora`);res.json({...kpi,agendaHoje:agenda});}catch(e){res.status(500).json({mensagem:e.message});}});
module.exports=router;
