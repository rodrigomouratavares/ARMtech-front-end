# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2024-01-04

### ✨ Adicionado
- **Sistema de Autenticação JWT completo**
  - Login/logout com tokens JWT
  - Middleware de autenticação
  - Controle de acesso baseado em roles (admin, manager, employee)
  - Hash de senhas com bcrypt

- **CRUD Completo de Clientes**
  - Criação, leitura, atualização e exclusão
  - Validação de CPF brasileira com dígitos verificadores
  - Controle de unicidade para CPF e email
  - Busca e filtros avançados (nome, email, CPF, busca global)
  - Paginação e ordenação

- **CRUD Completo de Produtos**
  - Criação, leitura, atualização e exclusão
  - Geração automática de códigos únicos
  - Controle de estoque
  - Diferentes tipos de venda
  - Busca por nome, código ou descrição
  - Validação de preços

- **Sistema de Pré-vendas Avançado**
  - CRUD completo com itens
  - Sistema de status (draft, pending, approved, cancelled, converted)
  - Descontos por valor fixo ou percentual (global e por item)
  - Cálculos automáticos de totais
  - Relacionamento com clientes e produtos
  - Validação de estoque

- **Arquitetura Robusta**
  - Framework Fastify para alta performance
  - Drizzle ORM com PostgreSQL
  - Validação com Zod
  - Plugins organizados (CORS, Auth, Database, Error Handler)
  - Tratamento de erros padronizado
  - Logs estruturados

- **Sistema de Banco de Dados**
  - Migrações com Drizzle
  - Schemas TypeScript type-safe
  - Relacionamentos com foreign keys
  - Índices para performance
  - Constraints de unicidade

- **Testes Abrangentes**
  - Testes de integração para todos os serviços
  - Testes de API end-to-end
  - Testes de performance e concorrência
  - Setup automático de dados de teste
  - Coverage de código

- **Documentação Completa**
  - README.md detalhado
  - Documentação OpenAPI 3.0 (api.json)
  - Exemplos de uso da API
  - Guia de instalação e configuração

- **Scripts de Desenvolvimento**
  - Seed de dados para desenvolvimento
  - Verificação de dados
  - Geração e execução de migrações
  - Drizzle Studio para visualização

### 🔧 Configurações
- **Variáveis de Ambiente**
  - Configuração flexível para diferentes ambientes
  - Validação de variáveis obrigatórias
  - Suporte a desenvolvimento e produção

- **Segurança**
  - CORS configurável
  - Validação rigorosa de entrada
  - Sanitização de dados
  - Proteção contra SQL injection

### 📦 Dependências Principais
- `fastify` ^5.6.1 - Framework web
- `drizzle-orm` ^0.44.5 - ORM TypeScript
- `pg` ^8.16.3 - Driver PostgreSQL
- `zod` ^4.1.11 - Validação de schemas
- `jsonwebtoken` ^9.0.2 - Autenticação JWT
- `bcryptjs` ^3.0.2 - Hash de senhas
- `vitest` ^3.2.4 - Framework de testes

### 🗄️ Estrutura do Banco
- **users** - Usuários do sistema com roles
- **customers** - Clientes com validação de CPF
- **products** - Produtos com controle de estoque
- **presales** - Pré-vendas com status workflow
- **presale_items** - Itens das pré-vendas com descontos

### 🚀 Funcionalidades de Produção
- Health check endpoint
- Graceful shutdown
- Error handling centralizado
- Logs estruturados
- Validação de entrada
- Resposta padronizada

### 📊 Métricas e Monitoramento
- Logs de requisições
- Tempo de resposta
- Status codes
- Tratamento de erros

---

## Próximas Versões Planejadas

### [1.1.0] - Planejado
- Cache Redis para consultas frequentes
- Rate limiting para proteção
- Logs estruturados com Winston
- Métricas com Prometheus

### [1.2.0] - Planejado
- Sistema de relatórios
- Webhooks para eventos
- Backup automático
- Monitoramento avançado

### [2.0.0] - Futuro
- Microserviços
- Event sourcing
- CQRS pattern
- GraphQL API

---

## Convenções de Versionamento

- **MAJOR** - Mudanças incompatíveis na API
- **MINOR** - Funcionalidades adicionadas de forma compatível
- **PATCH** - Correções de bugs compatíveis

## Tipos de Mudanças

- `✨ Adicionado` - Novas funcionalidades
- `🔄 Alterado` - Mudanças em funcionalidades existentes
- `❌ Removido` - Funcionalidades removidas
- `🐛 Corrigido` - Correções de bugs
- `🔒 Segurança` - Correções de vulnerabilidades