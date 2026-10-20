const express=require('express');
const pool=require('../services/mysql');
const router=express.Router();
router.get('/landing',async(req,res)=>{try{const [[settings]]=await pool.query('SELECT * FROM configuracoes WHERE id=1');const [services]=await pool.query('SELECT id,nome,descricao,duracao,preco FROM servicos WHERE ativo=1 ORDER BY nome');const [barbers]=await pool.query(`SELECT b.id,u.nome,u.foto_perfil,b.especialidades,TIME_FORMAT(b.hora_inicio,'%H:%i') hora_inicio,TIME_FORMAT(b.hora_fim,'%H:%i') hora_fim FROM barbeiros b JOIN usuarios u ON u.id=b.usuario_id WHERE b.ativo=1 AND u.ativo=1 ORDER BY u.nome`);res.json({settings:settings||{},services,barbers});}catch(e){res.status(500).json({mensagem:'Falha ao carregar dados públicos.',erro:e.message});}});
module.exports=router;
