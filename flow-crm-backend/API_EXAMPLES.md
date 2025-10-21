# Flow CRM API - Exemplos de Uso

Este documento contém exemplos práticos de como usar a API do Flow CRM.

## 🔐 Autenticação

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@flowcrm.com",
    "password": "admin123"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@flowcrm.com",
      "name": "System Administrator",
      "role": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Verificar Perfil
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 👥 Clientes

### Listar Clientes
```bash
# Listar todos os clientes
curl -X GET http://localhost:3000/api/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Com filtros e paginação
curl -X GET "http://localhost:3000/api/customers?page=1&limit=10&search=João&sortBy=name&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Criar Cliente
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao.silva@empresa.com",
    "phone": "(11) 99999-1111",
    "cpf": "111.444.777-35",
    "address": "Rua das Flores, 123 - São Paulo, SP"
  }'
```

### Buscar Cliente por ID
```bash
curl -X GET http://localhost:3000/api/customers/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Atualizar Cliente
```bash
curl -X PUT http://localhost:3000/api/customers/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva Santos",
    "phone": "(11) 88888-8888"
  }'
```

### Excluir Cliente
```bash
curl -X DELETE http://localhost:3000/api/customers/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📦 Produtos

### Listar Produtos
```bash
# Listar todos os produtos
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Com filtros
curl -X GET "http://localhost:3000/api/products?search=notebook&saleType=retail" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Criar Produto
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notebook Dell Inspiron 15",
    "unit": "UN",
    "description": "Notebook Dell Inspiron 15 3000, Intel Core i5, 8GB RAM, 256GB SSD",
    "stock": 15,
    "purchasePrice": "1800.00",
    "salePrice": "2500.00",
    "saleType": "retail"
  }'
```

### Buscar Produto por ID
```bash
curl -X GET http://localhost:3000/api/products/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Atualizar Produto
```bash
curl -X PUT http://localhost:3000/api/products/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notebook Dell Inspiron 15 - Atualizado",
    "stock": 20,
    "salePrice": "2400.00"
  }'
```

## 💼 Pré-vendas

### Listar Pré-vendas
```bash
# Listar todas as pré-vendas
curl -X GET http://localhost:3000/api/presales \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filtrar por status
curl -X GET "http://localhost:3000/api/presales?status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filtrar por cliente
curl -X GET "http://localhost:3000/api/presales?customerId=uuid-here" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Criar Pré-venda
```bash
curl -X POST http://localhost:3000/api/presales \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-uuid-here",
    "status": "draft",
    "notes": "Orçamento para setup completo de escritório",
    "discount": "100.00",
    "discountType": "fixed",
    "items": [
      {
        "productId": "product-uuid-here",
        "quantity": "2",
        "unitPrice": "2500.00",
        "discount": "200.00",
        "discountType": "fixed"
      },
      {
        "productId": "another-product-uuid",
        "quantity": "2",
        "unitPrice": "350.00",
        "discount": "10.00",
        "discountType": "percentage"
      }
    ]
  }'
```

### Buscar Pré-venda por ID
```bash
curl -X GET http://localhost:3000/api/presales/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "customerId": "customer-uuid",
    "status": "draft",
    "total": "5500.00",
    "discount": "100.00",
    "discountType": "fixed",
    "discountPercentage": "0.00",
    "notes": "Orçamento para setup completo",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "customer": {
      "id": "customer-uuid",
      "name": "João Silva",
      "email": "joao.silva@empresa.com",
      "phone": "(11) 99999-1111",
      "cpf": "11144477735"
    },
    "items": [
      {
        "id": "item-uuid-1",
        "productId": "product-uuid-1",
        "quantity": "2.000",
        "unitPrice": "2500.00",
        "totalPrice": "4800.00",
        "discount": "200.00",
        "discountType": "fixed",
        "discountPercentage": "0.00",
        "product": {
          "id": "product-uuid-1",
          "code": "NB001",
          "name": "Notebook Dell Inspiron 15",
          "unit": "UN"
        }
      }
    ]
  },
  "message": "Pre-sale retrieved successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Atualizar Pré-venda
```bash
curl -X PUT http://localhost:3000/api/presales/uuid-here \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "pending",
    "notes": "Orçamento revisado e enviado para aprovação",
    "items": [
      {
        "productId": "product-uuid-here",
        "quantity": "3",
        "unitPrice": "2400.00",
        "discount": "5.00",
        "discountType": "percentage"
      }
    ]
  }'
```

### Alterar Status da Pré-venda
```bash
curl -X PUT http://localhost:3000/api/presales/uuid-here/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

## 🔍 Filtros e Busca Avançada

### Clientes
```bash
# Busca por nome
curl -X GET "http://localhost:3000/api/customers?name=João" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Busca por email
curl -X GET "http://localhost:3000/api/customers?email=@empresa.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Busca por CPF
curl -X GET "http://localhost:3000/api/customers?cpf=111.444" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Busca global
curl -X GET "http://localhost:3000/api/customers?search=João" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Paginação e ordenação
curl -X GET "http://localhost:3000/api/customers?page=2&limit=5&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Produtos
```bash
# Busca por nome
curl -X GET "http://localhost:3000/api/products?name=notebook" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Busca por código
curl -X GET "http://localhost:3000/api/products?code=NB001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filtro por tipo de venda
curl -X GET "http://localhost:3000/api/products?saleType=retail" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Busca global
curl -X GET "http://localhost:3000/api/products?search=dell" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Pré-vendas
```bash
# Filtro por status
curl -X GET "http://localhost:3000/api/presales?status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filtro por cliente
curl -X GET "http://localhost:3000/api/presales?customerId=customer-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Ordenação por data
curl -X GET "http://localhost:3000/api/presales?sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Ordenação por valor
curl -X GET "http://localhost:3000/api/presales?sortBy=total&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Respostas de Erro

### Erro de Validação (422)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Invalid email format",
      "cpf": "CPF must be a valid Brazilian CPF"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/customers"
}
```

### Erro de Autenticação (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/customers"
}
```

### Erro de Conflito (409)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "A customer with this CPF already exists"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/customers"
}
```

### Erro de Não Encontrado (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Customer not found"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/customers/uuid-here"
}
```

## 🧪 Testando com Postman/Insomnia

### 1. Importe a coleção
Use o arquivo `api.json` para importar todas as rotas no Postman ou Insomnia.

### 2. Configure as variáveis
- `base_url`: http://localhost:3000
- `jwt_token`: (obtido após login)

### 3. Workflow de teste
1. **Login** → Obter token JWT
2. **Criar Cliente** → Obter ID do cliente
3. **Criar Produto** → Obter ID do produto
4. **Criar Pré-venda** → Usar IDs obtidos
5. **Alterar Status** → Testar workflow

## 🔧 Dicas de Desenvolvimento

### Headers Obrigatórios
```bash
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

### Formato de Datas
Todas as datas são retornadas no formato ISO 8601:
```
2024-01-01T00:00:00.000Z
```

### Formato de Valores Monetários
Valores são sempre strings com 2 casas decimais:
```json
{
  "salePrice": "2500.00",
  "total": "5000.00"
}
```

### CPF
Aceita com ou sem formatação:
```json
{
  "cpf": "111.444.777-35"  // ou "11144477735"
}
```

### UUIDs
Todos os IDs são UUIDs v4:
```
550e8400-e29b-41d4-a716-446655440000
```

## 🚀 Próximos Passos

1. **Implementar Cache** - Redis para consultas frequentes
2. **Logs Estruturados** - Winston ou Pino
3. **Métricas** - Prometheus + Grafana
4. **Rate Limiting** - Proteção contra abuso
5. **Webhooks** - Notificações de eventos
6. **Relatórios** - Endpoints para dashboards

---

Para mais informações, consulte a documentação completa no `README.md` e `api.json`.