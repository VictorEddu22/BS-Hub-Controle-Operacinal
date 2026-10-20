const express=require('express');
const {auth,roles}=require('../middleware/auth');
const pool=require('../services/mysql');
const {toMinutes,toTime,dayOfWeek,hoursUntil,conflict}=require('../services/helpers');
const router=express.Router();
router.use(auth);

async function settings(){const [[s]]=await pool.query('SELECT * FROM configuracoes WHERE id=1');return s||{};}
async function notify(userId,appointmentId,canal,titulo,mensagem){await pool.query("INSERT INTO notificacoes(usuario_id,agendamento_id,canal,titulo,mensagem,status) VALUES (?,?,?,?,?,'pendente')",[userId,appointmentId,canal,titulo,mensagem]);}
function whatsappUrl(base,message){if(!base)return '';let url=String(base).trim();if(/^\d+$/.test(url))url=`https://wa.me/${url}`;if(!/^https?:\/\//i.test(url))return '';return `${url}${url.includes('?')?'&':'?'}text=${encodeURIComponent(message)}`;}
function brDate(data){return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');}

async function availability(data,serviceId,ignoreAppointmentId=null){
  const [[service]]=await pool.query('SELECT id,nome,duracao,preco FROM servicos WHERE id=? AND ativo=1',[serviceId]);
  if(!service)return {error:'Serviço não encontrado.'};
  const cfg=await settings();
  const target=new Date(`${data}T12:00:00`);const today=new Date();today.setHours(0,0,0,0);
  const max=new Date(today);max.setDate(max.getDate()+Number(cfg.antecedencia_dias||30));
  if(Number.isNaN(target.getTime())||target<today||target>max)return {data,duracao:service.duracao,horarios:[]};
  const dow=dayOfWeek(data);
  const [[general]]=await pool.query("SELECT dia,nome,aberto,TIME_FORMAT(inicio,'%H:%i') inicio,TIME_FORMAT(fim,'%H:%i') fim FROM horarios_funcionamento WHERE dia=?",[dow]);
  if(!general?.aberto)return {data,duracao:service.duracao,horarios:[]};
  const [barbers]=await pool.query(`SELECT b.id,u.nome,u.foto_perfil,b.especialidades,b.dias_trabalho,TIME_FORMAT(b.hora_inicio,'%H:%i') hora_inicio,TIME_FORMAT(b.hora_fim,'%H:%i') hora_fim
    FROM barbeiros b JOIN usuarios u ON u.id=b.usuario_id WHERE b.ativo=1 AND u.ativo=1`);
  const [apps]=await pool.query(`SELECT a.id,a.barbeiro_id,TIME_FORMAT(a.data_hora,'%H:%i') hora,s.duracao FROM agendamentos a JOIN servicos s ON s.id=a.servico_id
    WHERE DATE(a.data_hora)=? AND a.status<>'cancelado' ${ignoreAppointmentId?'AND a.id<>?':''}`,[data,...(ignoreAppointmentId?[ignoreAppointmentId]:[])]);
  const [blocks]=await pool.query("SELECT barbeiro_id,TIME_FORMAT(inicio,'%H:%i') inicio,TIME_FORMAT(fim,'%H:%i') fim FROM bloqueios_agenda WHERE data=?",[data]);
  const step=Number(cfg.intervalo_minutos||30),horarios=[];
  for(let m=toMinutes(general.inicio);m+Number(service.duracao)<=toMinutes(general.fim);m+=step){
    const hora=toTime(m);
    const available=barbers.filter(b=>String(b.dias_trabalho||'').split(',').includes(String(dow))&&m>=toMinutes(b.hora_inicio)&&m+Number(service.duracao)<=toMinutes(b.hora_fim)).filter(b=>
      !blocks.some(x=>(!x.barbeiro_id||Number(x.barbeiro_id)===b.id)&&conflict(hora,service.duracao,x.inicio,toMinutes(x.fim)-toMinutes(x.inicio))) &&
      !apps.some(a=>a.barbeiro_id===b.id&&conflict(hora,service.duracao,a.hora,a.duracao))
    );
    if(available.length)horarios.push({hora,barbeiros:available.map(({id,nome,especialidades,foto_perfil})=>({id,nome,especialidades,foto_perfil}))});
  }
  return {data,duracao:service.duracao,horarios};
}

async function appointmentById(id){const [[a]]=await pool.query(`SELECT a.*,c.nome cliente,b.usuario_id barbeiro_usuario_id,bu.nome barbeiro,bu.whatsapp_url,bu.foto_perfil,s.nome servico,s.preco,s.duracao,
  DATE_FORMAT(a.data_hora,'%Y-%m-%d') data,TIME_FORMAT(a.data_hora,'%H:%i') hora
  FROM agendamentos a JOIN usuarios c ON c.id=a.cliente_id JOIN barbeiros b ON b.id=a.barbeiro_id JOIN usuarios bu ON bu.id=b.usuario_id JOIN servicos s ON s.id=a.servico_id WHERE a.id=?`,[id]);return a;}

router.get('/availability',async(req,res)=>{const {data,servico_id}=req.query;if(!data||!servico_id)return res.status(400).json({mensagem:'Data e serviço são obrigatórios.'});try{const r=await availability(data,Number(servico_id));if(r.error)return res.status(404).json({mensagem:r.error});res.json(r);}catch(e){res.status(500).json({mensagem:e.message});}});

router.get('/',async(req,res)=>{try{let where='',params=[];if(req.user.role==='cliente'){where='WHERE a.cliente_id=?';params=[req.user.id];}else if(req.user.role==='barbeiro'){where='WHERE b.usuario_id=?';params=[req.user.id];}const [r]=await pool.query(`SELECT a.id,a.cliente_id,a.barbeiro_id,a.servico_id,DATE_FORMAT(a.data_hora,'%Y-%m-%d') data,TIME_FORMAT(a.data_hora,'%H:%i') hora,a.data_hora,a.status,a.observacao,
  c.nome cliente,bu.nome barbeiro,bu.whatsapp_url,bu.foto_perfil,s.nome servico,s.preco,s.duracao
  FROM agendamentos a JOIN usuarios c ON c.id=a.cliente_id JOIN barbeiros b ON b.id=a.barbeiro_id JOIN usuarios bu ON bu.id=b.usuario_id JOIN servicos s ON s.id=a.servico_id ${where} ORDER BY a.data_hora DESC`,params);res.json(r);}catch(e){res.status(500).json({mensagem:e.message});}});

router.post('/',roles('administrador','cliente'),async(req,res)=>{
  const {barbeiro_id,servico_id,data,hora,observacao=''}=req.body||{};const cliente_id=req.user.role==='cliente'?req.user.id:Number(req.body.cliente_id);
  if(!cliente_id||!barbeiro_id||!servico_id||!data||!hora)return res.status(400).json({mensagem:'Preencha cliente, barbeiro, serviço, data e horário.'});
  try{
    const slots=await availability(data,Number(servico_id));const slot=slots.horarios?.find(h=>h.hora===hora);
    if(!slot?.barbeiros.some(b=>b.id===Number(barbeiro_id)))return res.status(409).json({mensagem:'Horário indisponível. Escolha outro horário.'});
    const [r]=await pool.query("INSERT INTO agendamentos(cliente_id,barbeiro_id,servico_id,data_hora,status,observacao) VALUES (?,?,?,?, 'agendado',?)",[cliente_id,barbeiro_id,servico_id,`${data} ${hora}:00`,observacao]);
    const a=await appointmentById(r.insertId);
    await notify(cliente_id,r.insertId,'whatsapp','Agendamento criado',`Seu horário com ${a.barbeiro} foi agendado para ${brDate(data)} às ${hora}.`);
    const text=`Olá, ${a.barbeiro}! Agendei ${a.servico} para ${brDate(data)} às ${hora} pelo BSHub. Gostaria de confirmar meu horário.`;
    res.status(201).json({id:r.insertId,mensagem:'Agendamento criado.',appointment:a,whatsapp:{barbeiro:a.barbeiro,mensagem:text,url:whatsappUrl(a.whatsapp_url,text),configurado:Boolean(a.whatsapp_url)}});
  }catch(e){res.status(500).json({mensagem:e.message});}
});

router.put('/:id/reschedule',async(req,res)=>{
  if(req.user.role==='barbeiro')return res.status(403).json({mensagem:'Barbeiros não podem reagendar em nome do cliente.'});
  const id=Number(req.params.id),{barbeiro_id,servico_id,data,hora}=req.body||{};
  try{
    const a=await appointmentById(id);if(!a)return res.status(404).json({mensagem:'Agendamento não encontrado.'});
    if(req.user.role==='cliente'&&a.cliente_id!==req.user.id)return res.status(403).json({mensagem:'Acesso negado.'});
    const cfg=await settings();if(req.user.role==='cliente'&&hoursUntil(a.data_hora)<Number(cfg.reagendamento_horas||4))return res.status(400).json({mensagem:`Reagendamento permitido até ${cfg.reagendamento_horas}h antes.`});
    const slots=await availability(data,Number(servico_id),id);const slot=slots.horarios?.find(h=>h.hora===hora);if(!slot?.barbeiros.some(b=>b.id===Number(barbeiro_id)))return res.status(409).json({mensagem:'Novo horário indisponível.'});
    await pool.query("UPDATE agendamentos SET barbeiro_id=?,servico_id=?,data_hora=?,status='agendado' WHERE id=?",[barbeiro_id,servico_id,`${data} ${hora}:00`,id]);
    const updated=await appointmentById(id);await notify(updated.cliente_id,id,'whatsapp','Agendamento reagendado',`Seu novo horário com ${updated.barbeiro} é ${brDate(data)} às ${hora}.`);res.json({mensagem:'Agendamento reagendado.',appointment:updated});
  }catch(e){res.status(500).json({mensagem:e.message});}
});

router.patch('/:id/cancel',async(req,res)=>{
  if(req.user.role==='barbeiro')return res.status(403).json({mensagem:'Barbeiros não podem cancelar em nome do cliente.'});
  const id=Number(req.params.id);
  try{const a=await appointmentById(id);if(!a)return res.status(404).json({mensagem:'Agendamento não encontrado.'});if(req.user.role==='cliente'&&a.cliente_id!==req.user.id)return res.status(403).json({mensagem:'Acesso negado.'});const cfg=await settings();if(req.user.role==='cliente'&&hoursUntil(a.data_hora)<Number(cfg.cancelamento_horas||4))return res.status(400).json({mensagem:`Cancelamento permitido até ${cfg.cancelamento_horas}h antes.`});await pool.query("UPDATE agendamentos SET status='cancelado' WHERE id=?",[id]);await notify(a.cliente_id,id,'email','Agendamento cancelado','Seu agendamento foi cancelado conforme solicitado.');res.json({mensagem:'Agendamento cancelado.'});}catch(e){res.status(500).json({mensagem:e.message});}
});

router.patch('/:id/status',roles('administrador','barbeiro'),async(req,res)=>{
  const id=Number(req.params.id),status=req.body?.status;const allowed=['agendado','confirmado','concluido','cancelado'];if(!allowed.includes(status))return res.status(400).json({mensagem:'Status inválido.'});
  try{if(req.user.role==='barbeiro'){const [[ok]]=await pool.query('SELECT a.id FROM agendamentos a JOIN barbeiros b ON b.id=a.barbeiro_id WHERE a.id=? AND b.usuario_id=?',[id,req.user.id]);if(!ok)return res.status(403).json({mensagem:'Esse atendimento não pertence à sua agenda.'});}await pool.query('UPDATE agendamentos SET status=? WHERE id=?',[status,id]);res.json({mensagem:'Status atualizado.'});}catch(e){res.status(500).json({mensagem:e.message});}
});
module.exports=router;
