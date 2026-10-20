CREATE DATABASE IF NOT EXISTS bshub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bshub;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  telefone VARCHAR(30) NOT NULL DEFAULT '',
  senha VARCHAR(255) NOT NULL,
  role ENUM('administrador','cliente','barbeiro') NOT NULL DEFAULT 'cliente',
  whatsapp_url VARCHAR(500) NOT NULL DEFAULT '',
  foto_perfil LONGTEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS servicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(500) NOT NULL DEFAULT '',
  duracao INT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS barbeiros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  especialidades VARCHAR(255) NOT NULL DEFAULT '',
  dias_trabalho VARCHAR(30) NOT NULL DEFAULT '1,2,3,4,5,6',
  hora_inicio TIME NOT NULL DEFAULT '09:00:00',
  hora_fim TIME NOT NULL DEFAULT '19:00:00',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_barbeiro_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS horarios_funcionamento (
  dia TINYINT PRIMARY KEY,
  nome VARCHAR(20) NOT NULL,
  aberto TINYINT(1) NOT NULL DEFAULT 1,
  inicio TIME NOT NULL DEFAULT '09:00:00',
  fim TIME NOT NULL DEFAULT '19:00:00'
);

CREATE TABLE IF NOT EXISTS bloqueios_agenda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  barbeiro_id INT NULL,
  data DATE NOT NULL,
  inicio TIME NOT NULL DEFAULT '00:00:00',
  fim TIME NOT NULL DEFAULT '23:59:00',
  motivo VARCHAR(180) NOT NULL DEFAULT 'Bloqueio',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bloqueio_barbeiro FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  barbeiro_id INT NOT NULL,
  servico_id INT NOT NULL,
  data_hora DATETIME NOT NULL,
  status ENUM('agendado','confirmado','concluido','cancelado') NOT NULL DEFAULT 'agendado',
  observacao VARCHAR(500) NOT NULL DEFAULT '',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ag_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
  CONSTRAINT fk_ag_barbeiro FOREIGN KEY (barbeiro_id) REFERENCES barbeiros(id),
  CONSTRAINT fk_ag_servico FOREIGN KEY (servico_id) REFERENCES servicos(id),
  INDEX idx_agenda_barbeiro_data (barbeiro_id,data_hora),
  INDEX idx_agenda_cliente (cliente_id,data_hora)
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  agendamento_id INT NULL,
  canal ENUM('email','whatsapp') NOT NULL DEFAULT 'email',
  titulo VARCHAR(160) NOT NULL,
  mensagem TEXT NOT NULL,
  status ENUM('pendente','enviado','simulado','erro') NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enviado_em DATETIME NULL,
  CONSTRAINT fk_not_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_not_agendamento FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS configuracoes (
  id TINYINT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  slogan VARCHAR(180) NOT NULL DEFAULT '',
  descricao TEXT NOT NULL,
  endereco VARCHAR(255) NOT NULL DEFAULT '',
  telefone VARCHAR(30) NOT NULL DEFAULT '',
  whatsapp VARCHAR(30) NOT NULL DEFAULT '',
  email VARCHAR(160) NOT NULL DEFAULT '',
  logo_url LONGTEXT NULL,
  cancelamento_horas INT NOT NULL DEFAULT 4,
  reagendamento_horas INT NOT NULL DEFAULT 4,
  intervalo_minutos INT NOT NULL DEFAULT 30,
  antecedencia_dias INT NOT NULL DEFAULT 30
);

INSERT INTO configuracoes (id,nome,slogan,descricao,endereco,telefone,whatsapp,email,cancelamento_horas,reagendamento_horas,intervalo_minutos,antecedencia_dias)
VALUES (1,'BSHub Studio','Agenda, gestão e experiência em um só lugar.','Uma gestão leve para barbearias que querem organizar agenda, equipe, serviços e relacionamento com clientes sem complicação.','Av. Exemplo, 120 - Centro, Belo Horizonte - MG','(31) 3333-2026','5531999999999','contato@bshub.local',4,4,30,30)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO servicos (id,nome,descricao,duracao,preco,ativo) VALUES
(1,'Corte Essencial','Corte personalizado com acabamento e finalização.',45,45.00,1),
(2,'Barba Ritual','Modelagem, toalha quente e acabamento.',30,32.00,1),
(3,'Combo Signature','Corte + barba em uma experiência completa.',75,68.00,1)
ON DUPLICATE KEY UPDATE nome=VALUES(nome),descricao=VALUES(descricao),duracao=VALUES(duracao),preco=VALUES(preco),ativo=VALUES(ativo);

INSERT INTO horarios_funcionamento (dia,nome,aberto,inicio,fim) VALUES
(0,'Domingo',0,'09:00','18:00'),(1,'Segunda',1,'09:00','19:00'),(2,'Terça',1,'09:00','19:00'),
(3,'Quarta',1,'09:00','19:00'),(4,'Quinta',1,'09:00','20:00'),(5,'Sexta',1,'09:00','20:00'),(6,'Sábado',1,'09:00','18:00')
ON DUPLICATE KEY UPDATE nome=VALUES(nome),aberto=VALUES(aberto),inicio=VALUES(inicio),fim=VALUES(fim);
