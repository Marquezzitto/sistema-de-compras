-- Cria o banco de dados se ele não existir
CREATE DATABASE IF NOT EXISTS seu_projeto_db;

-- Seleciona o banco de dados para que as próximas tabelas sejam criadas nele
USE seu_projeto_db;

-- 1. Tabela de Filiais
CREATE TABLE filiais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) UNIQUE NOT NULL
);

-- 2. Tabela de Usuários
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(50),
    filial_id INT,
    FOREIGN KEY (filial_id) REFERENCES filiais(id)
);

-- 3. Tabela de Fornecedores
CREATE TABLE fornecedores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    tipo_fiscal VARCHAR(50) NOT NULL,
    filial_id INT NOT NULL,
    FOREIGN KEY (filial_id) REFERENCES filiais(id)
);

-- 4. Tabela de Requisições
CREATE TABLE requisicoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    data DATE NOT NULL,
    requisicao VARCHAR(255),
    nf VARCHAR(50),
    oc VARCHAR(50),
    observacao TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    tipo_fiscal VARCHAR(50),
    status_pagamento VARCHAR(50) DEFAULT NULL,
    
    fornecedor_id INT NOT NULL,
    filial_id INT NOT NULL,
    
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
    FOREIGN KEY (filial_id) REFERENCES filiais(id)
);

-- Inserir alguns dados de exemplo (opcional, mas recomendado)
INSERT INTO filiais (nome) VALUES ('MTZ'), ('SAO'), ('PTO'), ('IGU'), ('LDB'), ('CCX');
