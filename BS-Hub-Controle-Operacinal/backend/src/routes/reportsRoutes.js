const express=require('express');
const {auth,roles}=require('../middleware/auth');
const pool=require('../services/mysql');
const router=express.Router();
router.use(auth,roles('administrador'));
router.get('/',async(req,res)=>{try{
  const {inicio,fim}=req.query;const start=inicio||new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().slice(0,10);const end=fim||new Date().toISOString().slice(0,10);
  const [[summary]]=await pool.query(`SELECT COALESCE(SUM(a.status='concluido'),0) atendimentos,COALESCE(SUM(a.status IN ('agendado','confirmado')),0) agendados,COALESCE(SUM(a.status='cancelado'),0) cancelados,COALESCE(SUM(CASE WHEN a.status='concluido' THEN s.preco ELSE 0 END),0) faturamento FROM agendamentos a JOIN servicos s ON s.id=a.servico_id WHERE DATE(a.data_hora) BETWEEN ? AND ?`,[start,end]);
  const [services]=await pool.query(`SELECT s.nome,COUNT(*) quantidade,COALESCE(SUM(s.preco),0) faturamento FROM agendamentos a JOIN servicos s ON s.id=a.servico_id WHERE DATE(a.data_hora) BETWEEN ? AND ? AND a.status='concluido' GROUP BY s.id,s.nome ORDER BY quantidade DESC`,[start,end]);
  const [barbers]=await pool.query(`SELECT u.nome,COUNT(*) atendimentos,COALESCE(SUM(s.preco),0) faturamento FROM agendamentos a JOIN barbeiros b ON b.id=a.barbeiro_id JOIN usuarios u ON u.id=b.usuario_id JOIN servicos s ON s.id=a.servico_id WHERE DATE(a.data_hora) BETWEEN ? AND ? AND a.status='concluido' GROUP BY b.id,u.nome ORDER BY atendimentos DESC`,[start,end]);
  res.json({inicio:start,fim:end,...summary,servicos:services,barbeiros:barbers});
}catch(e){res.status(500).json({mensagem:e.message});}});
module.exports=router;
