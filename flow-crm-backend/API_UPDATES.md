# 📚 Atualizações do API.json - Flow CRM Backend

Este documento detalha todas as adições e modificações necessárias no arquivo `api.json` para documentar os novos endpoints e schemas.

## 🔧 Como Aplicar as Atualizações

Este documento contém as especificações que devem ser adicionadas ao `api.json` existente. As seções estão organizadas por:

1. **Novos Schemas** - Adicionar em `components.schemas`
2. **Novos Endpoints** - Adicionar em `paths`
3. **Novas Tags** - Adicionar em `tags`

---

## 📦 1. NOVOS SCHEMAS

### Adicionar em `components.schemas`:

```json
"UserDetailed": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "name": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": ["admin", "manager", "employee"]
    },
    "userType": {
      "type": "string",
      "enum": ["admin", "employee"],
      "description": "Tipo de usuário no sistema"
    },
    "isActive": {
      "type": "boolean",
      "description": "Status do usuário"
    },
    "avatar": {
      "type": "string",
      "nullable": true,
      "description": "URL do avatar do usuário"
    },
    "lastLoginAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "createdBy": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "permissions": {
      "$ref": "#/components/schemas/UserPermissions"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  }
},

"UserPermissions": {
  "type": "object",
  "properties": {
    "modules": {
      "type": "object",
      "properties": {
        "products": {
          "type": "boolean"
        },
        "customers": {
          "type": "boolean"
        },
        "reports": {
          "type": "boolean"
        },
        "paymentMethods": {
          "type": "boolean"
        },
        "userManagement": {
          "type": "boolean"
        }
      }
    },
    "presales": {
      "type": "object",
      "properties": {
        "canCreate": {
          "type": "boolean"
        },
        "canViewOwn": {
          "type": "boolean"
        },
        "canViewAll": {
          "type": "boolean"
        }
      }
    }
  }
},

"CreateUserRequest": {
  "type": "object",
  "required": ["email", "password", "name", "userType"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "password": {
      "type": "string",
      "minLength": 6
    },
    "name": {
      "type": "string",
      "minLength": 2
    },
    "userType": {
      "type": "string",
      "enum": ["admin", "employee"]
    },
    "role": {
      "type": "string",
      "enum": ["admin", "manager", "employee"]
    },
    "permissions": {
      "$ref": "#/components/schemas/UserPermissions"
    },
    "avatar": {
      "type": "string"
    }
  }
},

"UpdateUserRequest": {
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "format": "email"
    },
    "name": {
      "type": "string",
      "minLength": 2
    },
    "isActive": {
      "type": "boolean"
    },
    "avatar": {
      "type": "string"
    }
  }
},

"AuditLog": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "userName": {
      "type": "string"
    },
    "action": {
      "type": "string",
      "enum": ["login", "logout", "create", "update", "delete", "view"]
    },
    "resource": {
      "type": "string",
      "description": "Tipo de recurso afetado"
    },
    "resourceId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "details": {
      "type": "string",
      "nullable": true
    },
    "ipAddress": {
      "type": "string",
      "nullable": true
    },
    "userAgent": {
      "type": "string",
      "nullable": true
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  }
},

"PaymentMethod": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "code": {
      "type": "string",
      "description": "Código único auto-gerado"
    },
    "description": {
      "type": "string",
      "description": "Nome da forma de pagamento"
    },
    "isActive": {
      "type": "boolean"
    },
    "createdBy": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  }
},

"CreatePaymentMethodRequest": {
  "type": "object",
  "required": ["description"],
  "properties": {
    "description": {
      "type": "string",
      "minLength": 2
    },
    "isActive": {
      "type": "boolean",
      "default": true
    }
  }
},

"StockAdjustment": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "productId": {
      "type": "string",
      "format": "uuid"
    },
    "productCode": {
      "type": "string"
    },
    "productName": {
      "type": "string"
    },
    "adjustmentType": {
      "type": "string",
      "enum": ["add", "remove", "correction"]
    },
    "quantity": {
      "type": "integer"
    },
    "reason": {
      "type": "string"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "userName": {
      "type": "string"
    },
    "previousStock": {
      "type": "integer"
    },
    "newStock": {
      "type": "integer"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    }
  }
},

"CreateStockAdjustmentRequest": {
  "type": "object",
  "required": ["productId", "adjustmentType", "quantity", "reason"],
  "properties": {
    "productId": {
      "type": "string",
      "format": "uuid"
    },
    "adjustmentType": {
      "type": "string",
      "enum": ["add", "remove", "correction"]
    },
    "quantity": {
      "type": "integer",
      "minimum": 1
    },
    "reason": {
      "type": "string",
      "minLength": 5
    }
  }
},

"InventoryAlert": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "productId": {
      "type": "string",
      "format": "uuid"
    },
    "productName": {
      "type": "string"
    },
    "currentStock": {
      "type": "integer"
    },
    "minimumStock": {
      "type": "integer"
    },
    "severity": {
      "type": "string",
      "enum": ["low", "critical"]
    },
    "isResolved": {
      "type": "boolean"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "resolvedAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    }
  }
},

"DashboardMetrics": {
  "type": "object",
  "properties": {
    "salesToday": {
      "type": "object",
      "properties": {
        "value": {
          "type": "number"
        },
        "trend": {
          "type": "object",
          "properties": {
            "value": {
              "type": "number"
            },
            "isPositive": {
              "type": "boolean"
            }
          }
        }
      }
    },
    "totalProducts": {
      "type": "object",
      "properties": {
        "value": {
          "type": "number"
        },
        "trend": {
          "type": "object",
          "properties": {
            "value": {
              "type": "number"
            },
            "isPositive": {
              "type": "boolean"
            }
          }
        }
      }
    },
    "lowStockProducts": {
      "type": "object",
      "properties": {
        "value": {
          "type": "number"
        },
        "trend": {
          "type": "object",
          "properties": {
            "value": {
              "type": "number"
            },
            "isPositive": {
              "type": "boolean"
            }
          }
        }
      }
    },
    "monthlyRevenue": {
      "type": "object",
      "properties": {
        "value": {
          "type": "number"
        },
        "trend": {
          "type": "object",
          "properties": {
            "value": {
              "type": "number"
            },
            "isPositive": {
              "type": "boolean"
            }
          }
        }
      }
    }
  }
},

"SalesChartData": {
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "format": "date"
    },
    "sales": {
      "type": "number"
    },
    "revenue": {
      "type": "number"
    }
  }
},

"RecentActivity": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "type": {
      "type": "string",
      "enum": ["sale", "product", "customer", "inventory"]
    },
    "description": {
      "type": "string"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "userName": {
      "type": "string"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  }
},

"PaymentMethodReport": {
  "type": "object",
  "properties": {
    "period": {
      "type": "object",
      "properties": {
        "startDate": {
          "type": "string",
          "format": "date"
        },
        "endDate": {
          "type": "string",
          "format": "date"
        }
      }
    },
    "paymentMethods": {
      "type": "array",
      "items": {
        "$ref": "#/components/schemas/PaymentMethodSummary"
      }
    },
    "totalConvertedPresales": {
      "type": "object",
      "properties": {
        "count": {
          "type": "integer"
        },
        "totalValue": {
          "type": "number"
        }
      }
    }
  }
},

"PaymentMethodSummary": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "code": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "totalSales": {
      "type": "number"
    },
    "salesCount": {
      "type": "integer"
    },
    "percentage": {
      "type": "number"
    }
  }
},

"SystemSettings": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "key": {
      "type": "string"
    },
    "value": {
      "type": "object"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "updatedBy": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  }
},

"CompanyInfo": {
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string"
    },
    "cnpj": {
      "type": "string",
      "nullable": true
    },
    "email": {
      "type": "string",
      "format": "email",
      "nullable": true
    },
    "phone": {
      "type": "string",
      "nullable": true
    },
    "address": {
      "type": "string",
      "nullable": true
    },
    "logoUrl": {
      "type": "string",
      "nullable": true
    },
    "updatedBy": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  }
},

"UpdateCompanyInfoRequest": {
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2
    },
    "cnpj": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "address": {
      "type": "string"
    },
    "logoUrl": {
      "type": "string"
    }
  }
}
```

---

## 🛣️ 2. NOVOS ENDPOINTS

### Adicionar em `paths`:

### 2.1 User Management Endpoints

```json
"/api/users": {
  "get": {
    "tags": ["Users"],
    "summary": "Listar usuários",
    "description": "Retorna lista paginada de usuários do sistema. Apenas administradores têm acesso.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "default": 1}
      },
      {
        "name": "limit",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 50}
      },
      {
        "name": "isActive",
        "in": "query",
        "schema": {"type": "boolean"}
      },
      {
        "name": "userType",
        "in": "query",
        "schema": {"type": "string", "enum": ["admin", "employee"]}
      }
    ],
    "responses": {
      "200": {
        "description": "Lista de usuários",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/PaginatedResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/UserDetailed"}
                    }
                  }
                }
              ]
            }
          }
        }
      },
      "403": {
        "description": "Acesso negado",
        "content": {
          "application/json": {
            "schema": {"$ref": "#/components/schemas/ErrorResponse"}
          }
        }
      }
    }
  },
  "post": {
    "tags": ["Users"],
    "summary": "Criar usuário",
    "description": "Cria um novo usuário no sistema. Apenas administradores podem criar usuários.",
    "security": [{"bearerAuth": []}],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {"$ref": "#/components/schemas/CreateUserRequest"}
        }
      }
    },
    "responses": {
      "201": {
        "description": "Usuário criado com sucesso",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/UserDetailed"}
                  }
                }
              ]
            }
          }
        }
      },
      "409": {
        "description": "Email já existe",
        "content": {
          "application/json": {
            "schema": {"$ref": "#/components/schemas/ErrorResponse"}
          }
        }
      }
    }
  }
},

"/api/users/{id}": {
  "get": {
    "tags": ["Users"],
    "summary": "Buscar usuário por ID",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "200": {
        "description": "Usuário encontrado",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/UserDetailed"}
                  }
                }
              ]
            }
          }
        }
      },
      "404": {
        "description": "Usuário não encontrado",
        "content": {
          "application/json": {
            "schema": {"$ref": "#/components/schemas/ErrorResponse"}
          }
        }
      }
    }
  },
  "put": {
    "tags": ["Users"],
    "summary": "Atualizar usuário",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {"$ref": "#/components/schemas/UpdateUserRequest"}
        }
      }
    },
    "responses": {
      "200": {
        "description": "Usuário atualizado",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/UserDetailed"}
                  }
                }
              ]
            }
          }
        }
      },
      "404": {
        "description": "Usuário não encontrado"
      }
    }
  },
  "delete": {
    "tags": ["Users"],
    "summary": "Excluir usuário (soft delete)",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "204": {
        "description": "Usuário excluído com sucesso"
      },
      "404": {
        "description": "Usuário não encontrado"
      },
      "409": {
        "description": "Não é possível excluir o usuário (último admin ou auto-exclusão)"
      }
    }
  }
},

"/api/users/{id}/permissions": {
  "put": {
    "tags": ["Users"],
    "summary": "Atualizar permissões do usuário",
    "description": "Atualiza as permissões granulares de um usuário. Apenas administradores.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {"$ref": "#/components/schemas/UserPermissions"}
        }
      }
    },
    "responses": {
      "200": {
        "description": "Permissões atualizadas",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/UserDetailed"}
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
},

"/api/users/{id}/audit-logs": {
  "get": {
    "tags": ["Users"],
    "summary": "Logs de auditoria do usuário",
    "description": "Retorna histórico de ações do usuário no sistema.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      },
      {
        "name": "page",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "default": 1}
      },
      {
        "name": "limit",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 50}
      },
      {
        "name": "action",
        "in": "query",
        "schema": {"type": "string", "enum": ["login", "logout", "create", "update", "delete", "view"]}
      },
      {
        "name": "startDate",
        "in": "query",
        "schema": {"type": "string", "format": "date"}
      },
      {
        "name": "endDate",
        "in": "query",
        "schema": {"type": "string", "format": "date"}
      }
    ],
    "responses": {
      "200": {
        "description": "Lista de logs",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/PaginatedResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/AuditLog"}
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### 2.2 Payment Methods Endpoints

```json
"/api/payment-methods": {
  "get": {
    "tags": ["Payment Methods"],
    "summary": "Listar formas de pagamento",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "default": 1}
      },
      {
        "name": "limit",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 50}
      },
      {
        "name": "isActive",
        "in": "query",
        "schema": {"type": "boolean"}
      }
    ],
    "responses": {
      "200": {
        "description": "Lista de formas de pagamento",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/PaginatedResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/PaymentMethod"}
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "post": {
    "tags": ["Payment Methods"],
    "summary": "Criar forma de pagamento",
    "description": "Cria nova forma de pagamento com código auto-gerado.",
    "security": [{"bearerAuth": []}],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {"$ref": "#/components/schemas/CreatePaymentMethodRequest"}
        }
      }
    },
    "responses": {
      "201": {
        "description": "Forma de pagamento criada",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/PaymentMethod"}
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
},

"/api/payment-methods/{id}": {
  "get": {
    "tags": ["Payment Methods"],
    "summary": "Buscar forma de pagamento por ID",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "200": {
        "description": "Forma de pagamento encontrada",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/PaymentMethod"}
                  }
                }
              ]
            }
          }
        }
      },
      "404": {
        "description": "Forma de pagamento não encontrada"
      }
    }
  },
  "put": {
    "tags": ["Payment Methods"],
    "summary": "Atualizar forma de pagamento",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {"$ref": "#/components/schemas/CreatePaymentMethodRequest"}
        }
      }
    },
    "responses": {
      "200": {
        "description": "Forma de pagamento atualizada"
      }
    }
  },
  "delete": {
    "tags": ["Payment Methods"],
    "summary": "Excluir forma de pagamento (soft delete)",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "204": {
        "description": "Forma de pagamento excluída"
      },
      "409": {
        "description": "Forma de pagamento está em uso"
      }
    }
  }
}
```

### 2.3 Inventory Control Endpoints

```json
"/api/inventory/adjustments": {
  "get": {
    "tags": ["Inventory"],
    "summary": "Listar ajustes de estoque",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "default": 1}
      },
      {
        "name": "limit",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 50}
      },
      {
        "name": "productId",
        "in": "query",
        "schema": {"type": "string", "format": "uuid"}
      },
      {
        "name": "adjustmentType",
        "in": "query",
        "schema": {"type": "string", "enum": ["add", "remove", "correction"]}
      },
      {
        "name": "startDate",
        "in": "query",
        "schema": {"type": "string", "format": "date"}
      },
      {
        "name": "endDate",
        "in": "query",
        "schema": {"type": "string", "format": "date"}
      }
    ],
    "responses": {
      "200": {
        "description": "Lista de ajustes",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/PaginatedResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/StockAdjustment"}
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "post": {
    "tags": ["Inventory"],
    "summary": "Criar ajuste de estoque",
    "description": "Adiciona, remove ou corrige estoque de um produto.",
    "security": [{"bearerAuth": []}],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {"$ref": "#/components/schemas/CreateStockAdjustmentRequest"}
        }
      }
    },
    "responses": {
      "201": {
        "description": "Ajuste criado",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/StockAdjustment"}
                  }
                }
              ]
            }
          }
        }
      },
      "400": {
        "description": "Estoque negativo não permitido"
      }
    }
  }
},

"/api/inventory/alerts": {
  "get": {
    "tags": ["Inventory"],
    "summary": "Listar alertas de estoque baixo",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "page",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "default": 1}
      },
      {
        "name": "severity",
        "in": "query",
        "schema": {"type": "string", "enum": ["low", "critical"]}
      },
      {
        "name": "isResolved",
        "in": "query",
        "schema": {"type": "boolean", "default": false}
      }
    ],
    "responses": {
      "200": {
        "description": "Lista de alertas",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/PaginatedResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/InventoryAlert"}
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
},

"/api/inventory/movements": {
  "get": {
    "tags": ["Inventory"],
    "summary": "Histórico de movimentações de estoque",
    "description": "Retorna todas as movimentações incluindo ajustes e vendas.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "productId",
        "in": "query",
        "schema": {"type": "string", "format": "uuid"}
      },
      {
        "name": "startDate",
        "in": "query",
        "schema": {"type": "string", "format": "date"}
      },
      {
        "name": "endDate",
        "in": "query",
        "schema": {"type": "string", "format": "date"}
      }
    ],
    "responses": {
      "200": {
        "description": "Histórico de movimentações"
      }
    }
  }
},

"/api/inventory/bulk-update": {
  "post": {
    "tags": ["Inventory"],
    "summary": "Atualização em lote de estoque",
    "description": "Atualiza estoque de múltiplos produtos simultaneamente.",
    "security": [{"bearerAuth": []}],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "adjustments": {
                "type": "array",
                "items": {"$ref": "#/components/schemas/CreateStockAdjustmentRequest"}
              }
            }
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Ajustes aplicados em lote"
      }
    }
  }
},

"/api/products/{id}/stock": {
  "get": {
    "tags": ["Inventory"],
    "summary": "Consultar estoque específico de um produto",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "200": {
        "description": "Informações de estoque detalhadas"
      }
    }
  }
}
```

### 2.4 Dashboard Endpoints

```json
"/api/dashboard/metrics": {
  "get": {
    "tags": ["Dashboard"],
    "summary": "Métricas principais do dashboard",
    "description": "Retorna KPIs principais: vendas do dia, total de produtos, estoque baixo, receita mensal.",
    "security": [{"bearerAuth": []}],
    "responses": {
      "200": {
        "description": "Métricas do dashboard",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/DashboardMetrics"}
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
},

"/api/dashboard/sales-chart": {
  "get": {
    "tags": ["Dashboard"],
    "summary": "Dados para gráfico de vendas",
    "description": "Retorna dados de vendas dos últimos 30 dias para visualização em gráficos.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "days",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "maximum": 365, "default": 30}
      }
    ],
    "responses": {
      "200": {
        "description": "Dados do gráfico",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/SalesChartData"}
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
},

"/api/dashboard/recent-activity": {
  "get": {
    "tags": ["Dashboard"],
    "summary": "Atividades recentes",
    "description": "Retorna últimas atividades do sistema (vendas, cadastros, ajustes de estoque).",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "limit",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "maximum": 50, "default": 10}
      }
    ],
    "responses": {
      "200": {
        "description": "Lista de atividades recentes",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/RecentActivity"}
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
},

"/api/dashboard/alerts": {
  "get": {
    "tags": ["Dashboard"],
    "summary": "Alertas do sistema",
    "description": "Retorna alertas importantes (estoque baixo, pré-vendas pendentes, etc.).",
    "security": [{"bearerAuth": []}],
    "responses": {
      "200": {
        "description": "Lista de alertas"
      }
    }
  }
}
```

### 2.5 Reports Endpoints

```json
"/api/reports/sales-summary": {
  "get": {
    "tags": ["Reports"],
    "summary": "Resumo de vendas",
    "description": "Gera relatório resumido de vendas por período.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "startDate",
        "in": "query",
        "required": true,
        "schema": {"type": "string", "format": "date"}
      },
      {
        "name": "endDate",
        "in": "query",
        "required": true,
        "schema": {"type": "string", "format": "date"}
      }
    ],
    "responses": {
      "200": {
        "description": "Resumo de vendas"
      }
    }
  }
},

"/api/reports/payment-methods": {
  "get": {
    "tags": ["Reports"],
    "summary": "Relatório de vendas por forma de pagamento",
    "description": "Agrupado por finalizadora com totais e percentuais.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "startDate",
        "in": "query",
        "required": true,
        "schema": {"type": "string", "format": "date"}
      },
      {
        "name": "endDate",
        "in": "query",
        "required": true,
        "schema": {"type": "string", "format": "date"}
      },
      {
        "name": "paymentMethodId",
        "in": "query",
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "200": {
        "description": "Relatório de formas de pagamento",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/PaymentMethodReport"}
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
},

"/api/reports/payment-methods/export": {
  "get": {
    "tags": ["Reports"],
    "summary": "Exportar relatório de formas de pagamento",
    "description": "Exporta relatório em PDF ou Excel.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "startDate",
        "in": "query",
        "required": true,
        "schema": {"type": "string", "format": "date"}
      },
      {
        "name": "endDate",
        "in": "query",
        "required": true,
        "schema": {"type": "string", "format": "date"}
      },
      {
        "name": "format",
        "in": "query",
        "required": true,
        "schema": {"type": "string", "enum": ["pdf", "excel"]}
      }
    ],
    "responses": {
      "200": {
        "description": "Arquivo exportado",
        "content": {
          "application/pdf": {
            "schema": {"type": "string", "format": "binary"}
          },
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
            "schema": {"type": "string", "format": "binary"}
          }
        }
      }
    }
  }
}
```

### 2.6 Settings Endpoints

```json
"/api/settings": {
  "get": {
    "tags": ["Settings"],
    "summary": "Obter configurações do sistema",
    "security": [{"bearerAuth": []}],
    "responses": {
      "200": {
        "description": "Configurações do sistema",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"$ref": "#/components/schemas/SystemSettings"}
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "put": {
    "tags": ["Settings"],
    "summary": "Atualizar configurações do sistema",
    "description": "Apenas administradores podem atualizar configurações.",
    "security": [{"bearerAuth": []}],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "settings": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "key": {"type": "string"},
                    "value": {"type": "object"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Configurações atualizadas"
      }
    }
  }
},

"/api/settings/company": {
  "get": {
    "tags": ["Settings"],
    "summary": "Obter dados da empresa",
    "security": [{"bearerAuth": []}],
    "responses": {
      "200": {
        "description": "Dados da empresa",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {"$ref": "#/components/schemas/CompanyInfo"}
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "put": {
    "tags": ["Settings"],
    "summary": "Atualizar dados da empresa",
    "description": "Apenas administradores podem atualizar.",
    "security": [{"bearerAuth": []}],
    "requestBody": {
      "required": true,
      "content": {
        "application/json": {
          "schema": {"$ref": "#/components/schemas/UpdateCompanyInfoRequest"}
        }
      }
    },
    "responses": {
      "200": {
        "description": "Dados da empresa atualizados"
      }
    }
  }
}
```

### 2.7 Enhanced PreSales Endpoints

```json
"/api/presales/{id}/convert": {
  "post": {
    "tags": ["PreSales"],
    "summary": "Converter pré-venda em venda final",
    "description": "Converte pré-venda aprovada em venda finalizada, atualizando estoque.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "200": {
        "description": "Pré-venda convertida com sucesso"
      },
      "400": {
        "description": "Pré-venda não pode ser convertida (status inválido ou estoque insuficiente)"
      }
    }
  }
},

"/api/presales/{id}/duplicate": {
  "post": {
    "tags": ["PreSales"],
    "summary": "Duplicar pré-venda",
    "description": "Cria uma cópia da pré-venda com status 'draft'.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "201": {
        "description": "Pré-venda duplicada com sucesso"
      }
    }
  }
},

"/api/presales/by-salesperson": {
  "get": {
    "tags": ["PreSales"],
    "summary": "Listar pré-vendas por vendedor",
    "description": "Filtra pré-vendas por vendedor específico.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "salespersonId",
        "in": "query",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      },
      {
        "name": "page",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "default": 1}
      },
      {
        "name": "limit",
        "in": "query",
        "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 50}
      }
    ],
    "responses": {
      "200": {
        "description": "Lista de pré-vendas do vendedor"
      }
    }
  }
}
```

### 2.8 Enhanced Products Endpoints

```json
"/api/products/categories": {
  "get": {
    "tags": ["Products"],
    "summary": "Listar categorias de produtos",
    "description": "Retorna lista única de categorias em uso.",
    "security": [{"bearerAuth": []}],
    "responses": {
      "200": {
        "description": "Lista de categorias",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {"$ref": "#/components/schemas/SuccessResponse"},
                {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {"type": "string"}
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  }
},

"/api/products/bulk-import": {
  "post": {
    "tags": ["Products"],
    "summary": "Importação em lote de produtos",
    "description": "Importa múltiplos produtos via CSV ou Excel.",
    "security": [{"bearerAuth": []}],
    "requestBody": {
      "required": true,
      "content": {
        "multipart/form-data": {
          "schema": {
            "type": "object",
            "properties": {
              "file": {
                "type": "string",
                "format": "binary"
              }
            }
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Importação concluída",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "success": {"type": "boolean"},
                "imported": {"type": "integer"},
                "failed": {"type": "integer"},
                "errors": {
                  "type": "array",
                  "items": {"type": "object"}
                }
              }
            }
          }
        }
      }
    }
  }
},

"/api/products/{id}/pricing": {
  "get": {
    "tags": ["Products"],
    "summary": "Cálculos de preço detalhados",
    "description": "Retorna análise completa de preço, margem, markup e sugestões.",
    "security": [{"bearerAuth": []}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": true,
        "schema": {"type": "string", "format": "uuid"}
      }
    ],
    "responses": {
      "200": {
        "description": "Análise de precificação detalhada"
      }
    }
  }
}
```

---

## 🏷️ 3. NOVAS TAGS

### Adicionar em `tags`:

```json
{
  "name": "Users",
  "description": "Gerenciamento avançado de usuários e permissões"
},
{
  "name": "Payment Methods",
  "description": "Gerenciamento de formas de pagamento (finalizadoras)"
},
{
  "name": "Inventory",
  "description": "Controle de estoque, ajustes e alertas"
},
{
  "name": "Dashboard",
  "description": "Métricas, gráficos e KPIs do dashboard"
},
{
  "name": "Reports",
  "description": "Relatórios e exportações"
},
{
  "name": "Settings",
  "description": "Configurações do sistema e dados da empresa"
}
```

---

## 📝 4. MODIFICAÇÕES NO SCHEMA User EXISTENTE

### Substituir schema `User` existente por `UserDetailed`:

O schema `User` atual deve ser expandido para incluir os novos campos. Você pode:

**Opção 1:** Substituir o schema `User` existente pelo novo `UserDetailed`
**Opção 2:** Manter ambos e usar `UserDetailed` nos novos endpoints

---

## 📝 5. MODIFICAÇÕES NO SCHEMA Product EXISTENTE

### Adicionar campos ao schema `Product`:

```json
"Product": {
  "type": "object",
  "properties": {
    // ... campos existentes ...
    "saleType": {
      "type": "string",
      "enum": ["unit", "fractional"],
      "description": "Tipo de venda"
    },
    "suggestedSalePrice": {
      "type": "number",
      "nullable": true,
      "description": "Preço de venda sugerido"
    },
    "category": {
      "type": "string",
      "nullable": true
    },
    "supplier": {
      "type": "string",
      "nullable": true
    },
    "barcode": {
      "type": "string",
      "nullable": true
    },
    "weight": {
      "type": "number",
      "nullable": true
    },
    "dimensions": {
      "type": "object",
      "nullable": true,
      "properties": {
        "length": {"type": "number"},
        "width": {"type": "number"},
        "height": {"type": "number"}
      }
    },
    "minimumStock": {
      "type": "integer",
      "default": 0
    },
    "maximumStock": {
      "type": "integer",
      "nullable": true
    }
  }
}
```

---

## 📝 6. MODIFICAÇÕES NO SCHEMA PreSale EXISTENTE

### Adicionar campos ao schema `PreSale`:

```json
"PreSale": {
  "type": "object",
  "properties": {
    // ... campos existentes ...
    "paymentMethodId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "salespersonId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "salespersonName": {
      "type": "string",
      "nullable": true
    },
    "validUntil": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "terms": {
      "type": "string",
      "nullable": true
    },
    "internalNotes": {
      "type": "string",
      "nullable": true
    }
  }
}
```

### Adicionar campos ao schema `PreSaleItem`:

```json
"PreSaleItem": {
  "type": "object",
  "properties": {
    // ... campos existentes ...
    "availableStock": {
      "type": "integer"
    },
    "reservedQuantity": {
      "type": "number"
    }
  }
}
```

---

## ✅ CHECKLIST DE APLICAÇÃO

- [ ] Backup do api.json atual (já criado como api.json.backup)
- [ ] Adicionar todos os novos schemas em `components.schemas`
- [ ] Adicionar todos os novos endpoints em `paths`
- [ ] Adicionar novas tags em `tags`
- [ ] Modificar schema `User` para incluir novos campos
- [ ] Modificar schema `Product` para incluir novos campos
- [ ] Modificar schema `PreSale` para incluir novos campos
- [ ] Modificar schema `PreSaleItem` para incluir novos campos
- [ ] Validar JSON com linter
- [ ] Testar com Swagger UI
- [ ] Atualizar versão da API no `info.version`

---

## 🔄 PRÓXIMOS PASSOS

1. **Validar o api.json atualizado** com ferramentas online (Swagger Editor)
2. **Gerar Postman Collection** a partir do OpenAPI spec
3. **Documentar exemplos** de request/response
4. **Criar testes automatizados** baseados na spec
5. **Publicar documentação** para o time frontend

---

**Última atualização:** 2025-10-10  
**Versão do documento:** 1.0.0  
**Status:** Pronto para implementação
