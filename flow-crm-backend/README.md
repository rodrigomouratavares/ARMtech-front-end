# Flow CRM Backend

REST API backend para o sistema Flow CRM - Gerenciamento completo de clientes, produtos e pré-vendas.

## 🚀 Tecnologias

- **Node.js** 18+ com TypeScript
- **Fastify** - Framework web rápido e eficiente
- **PostgreSQL** - Banco de dados relacional
- **Drizzle ORM** - ORM type-safe para TypeScript
- **JWT** - Autenticação stateless
- **Zod** - Validação de schemas
- **Vitest** - Framework de testes
- **bcrypt** - Hash de senhas

## 📋 Funcionalidades

### 🔐 Autenticação
- Login/logout com JWT
- Controle de acesso baseado em roles (admin, manager, employee)
- Registro de usuários (apenas administradores)
- Middleware de autenticação automática

### 👥 Gerenciamento de Clientes
- CRUD completo de clientes
- Validação de CPF brasileira
- Busca e filtros avançados
- Paginação e ordenação
- Controle de unicidade (CPF e email)

### 📦 Gerenciamento de Produtos
- CRUD completo de produtos
- Geração automática de códigos únicos
- Controle de estoque
- Diferentes tipos de venda
- Busca por nome, código ou descrição

### 💼 Gerenciamento de Pré-vendas
- CRUD completo de pré-vendas
- Gerenciamento de itens com descontos
- Sistema de status (draft, pending, approved, cancelled, converted)
- Cálculos automáticos de totais
- Descontos por valor fixo ou percentual
- Relacionamento com clientes e produtos

## 🏗️ Arquitetura

```
src/
├── config/           # Configurações (env, database, jwt)
├── controllers/      # Controladores HTTP
├── db/              # Conexão, schemas e migrações
├── plugins/         # Plugins Fastify (auth, cors, etc)
├── routes/          # Definição de rotas
├── schemas/         # Validação Zod
├── services/        # Lógica de negócio
├── types/           # Tipos TypeScript
├── utils/           # Utilitários
├── app.ts           # Configuração da aplicação
└── server.ts        # Entrada principal
```

## 🗄️ Banco de Dados

### Entidades Principais

#### Users (Usuários)
- Autenticação JWT
- Roles: admin, manager, employee
- Hash de senhas com bcrypt

#### Customers (Clientes)
- Validação de CPF brasileira
- Unicidade de CPF e email
- Endereço opcional

#### Products (Produtos)
- Código único gerado automaticamente
- Controle de estoque
- Preços de compra e venda
- Tipos de venda configuráveis

#### PreSales (Pré-vendas)
- Status workflow completo
- Itens com descontos individuais
- Descontos globais da pré-venda
- Cálculos automáticos

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repository-url>
cd flow-crm-backend
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/flowcrm
JWT_SECRET=sua-chave-secreta-jwt-muito-longa-e-segura
JWT_EXPIRES_IN=7d
```

### 4. Configure o banco de dados
```bash
# Criar banco de dados
createdb flowcrm

# Executar migrações
npm run db:migrate

# Popular com dados de exemplo (opcional)
npm run db:seed
```

### 5. Inicie o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📚 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em modo desenvolvimento
npm run build            # Compila TypeScript para JavaScript
npm start               # Inicia servidor em produção

# Banco de dados
npm run db:generate     # Gera nova migração
npm run db:migrate      # Executa migrações
npm run db:seed         # Popula banco com dados de exemplo
npm run db:verify       # Verifica dados do seed
npm run db:studio       # Abre Drizzle Studio

# Testes
npm test               # Executa todos os testes
npm run test:watch     # Executa testes em modo watch
```

## 🔑 Credenciais Padrão (após seed)

```
Admin:    admin@flowcrm.com / admin123
Manager:  manager@flowcrm.com / manager123
Employee: employee@flowcrm.com / employee123
```

## 📖 Documentação da API

A documentação completa da API está disponível no arquivo `api.json` (OpenAPI 3.0).

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil do usuário
- `POST /api/auth/register` - Registro (admin apenas)
- `POST /api/auth/logout` - Logout

#### Clientes
- `GET /api/customers` - Listar clientes
- `GET /api/customers/:id` - Buscar cliente
- `POST /api/customers` - Criar cliente
- `PUT /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Excluir cliente

#### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Buscar produto
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Excluir produto

#### Pré-vendas
- `GET /api/presales` - Listar pré-vendas
- `GET /api/presales/:id` - Buscar pré-venda
- `POST /api/presales` - Criar pré-venda
- `PUT /api/presales/:id` - Atualizar pré-venda
- `DELETE /api/presales/:id` - Excluir pré-venda
- `PUT /api/presales/:id/status` - Alterar status

### Autenticação

Todas as rotas (exceto login) requerem autenticação via JWT:

```bash
Authorization: Bearer <jwt-token>
```

### Filtros e Paginação

Todos os endpoints de listagem suportam:

```bash
# Paginação
?page=1&limit=50

# Ordenação
?sortBy=name&sortOrder=asc

# Filtros específicos
?name=João&email=@empresa.com

# Busca global
?search=termo
```

## 🧪 Testes

O projeto inclui testes de integração abrangentes:

```bash
# Executar todos os testes
npm test

# Executar testes específicos
npm test -- auth-service
npm test -- customer-service

# Executar com coverage
npm test -- --coverage
```

### Tipos de Testes
- **Integração de Serviços** - Testa lógica de negócio com banco real
- **Integração de API** - Testa endpoints HTTP completos
- **Performance** - Testa performance sob carga
- **End-to-End** - Testa workflows completos

## 🔒 Segurança

### Implementações de Segurança
- **JWT** com expiração configurável
- **bcrypt** para hash de senhas (salt rounds: 12)
- **CORS** configurável por ambiente
- **Validação** rigorosa com Zod
- **Rate limiting** (recomendado para produção)
- **Helmet** (recomendado para produção)

### Validações
- **CPF** brasileiro com dígitos verificadores
- **Email** formato válido
- **Senhas** mínimo 6 caracteres
- **Preços** formato decimal válido
- **UUIDs** para todos os IDs

## 🚀 Deploy

### Variáveis de Ambiente para Produção
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET=chave-super-secreta-de-pelo-menos-32-caracteres
JWT_EXPIRES_IN=24h
```

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no repositório ou entre em contato:
- Email: dev@flowcrm.com
- GitHub Issues: [Link para issues]

## 📊 Status do Projeto

- ✅ Autenticação JWT
- ✅ CRUD Completo (Users, Customers, Products, PreSales)
- ✅ Validações Brasileiras (CPF)
- ✅ Sistema de Descontos
- ✅ Testes de Integração
- ✅ Documentação OpenAPI
- ✅ Seed de Dados
- 🔄 Logs Estruturados (em desenvolvimento)
- 🔄 Métricas e Monitoramento (planejado)
- 🔄 Cache Redis (planejado)

---

**Flow CRM Backend** - Sistema completo de gerenciamento comercial 🚀