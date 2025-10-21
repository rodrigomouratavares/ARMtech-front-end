# Debug dos Checkboxes Individuais - Correções Aplicadas

## Problema Identificado
Os checkboxes individuais não estavam marcando/desmarcando quando clicados, mesmo com os botões "Habilitar Todas" e "Desabilitar Todas" funcionando.

## PROBLEMA REAL ENCONTRADO
O usuário reportou que ao clicar no checkbox, **nenhum log aparece no console**, indicando que o evento `onChange` não está sendo disparado. Isso aponta para um problema estrutural no HTML.

## Hipótese Principal
O problema está na gestão do estado entre o UserForm e o PermissionsEditor. O estado não está sendo atualizado corretamente quando os checkboxes individuais são clicados.

## Correções Aplicadas

### 1. CORREÇÃO CRÍTICA: Estrutura HTML do Label
**Problema**: O `<label>` estava envolvendo toda a estrutura do checkbox, causando conflitos de eventos.

**Correção**:
```typescript
// Antes - Label envolvendo tudo
<label className="flex items-start...">
  <input type="checkbox" ... />
  <div>...</div>
</label>

// Depois - Label específico com htmlFor
<div className="flex items-start...">
  <input type="checkbox" id="..." ... />
  <label htmlFor="..." className="...">...</label>
</div>
```

### 2. Inicialização do Estado no UserForm
**Problema**: O estado estava sendo inicializado diretamente com `getDefaultPermissions('employee')`, que pode retornar uma referência que não é atualizada corretamente.

**Correção**:
```typescript
// Antes
const [permissions, setPermissions] = useState<UserPermissions>(
    getDefaultPermissions('employee'),
);

// Depois
const [permissions, setPermissions] = useState<UserPermissions>(() => {
    const defaultPerms = getDefaultPermissions('employee');
    return {
        modules: { ...defaultPerms.modules },
        presales: { ...defaultPerms.presales },
    };
});
```

### 2. Função onChange Estável
**Problema**: A função onChange pode estar sendo recriada a cada render, causando problemas de referência.

**Correção**:
```typescript
const handlePermissionsChange = useCallback(
    (newPermissions: UserPermissions) => {
        setPermissions({
            modules: { ...newPermissions.modules },
            presales: { ...newPermissions.presales },
        });
    },
    [],
);
```

### 3. Logs de Debug Adicionados
Para identificar onde exatamente o fluxo está falhando:

- **PermissionsEditor**: Log quando as props mudam e quando setPermissionValue é chamado
- **UserForm**: Log quando handlePermissionsChange é chamado

## Como Testar

1. Abra o console do navegador
2. Abra o formulário de usuário
3. Tente clicar em um checkbox individual
4. Observe os logs no console para identificar se:
   - `setPermissionValue` está sendo chamado
   - `onChange` está sendo chamado com os novos valores
   - `handlePermissionsChange` está sendo chamado no UserForm
   - As props do PermissionsEditor estão sendo atualizadas

## Próximos Passos

Se os logs mostrarem que tudo está funcionando mas os checkboxes ainda não respondem, o problema pode estar em:

1. **CSS/Styling**: Algum elemento pode estar bloqueando os cliques
2. **Event Propagation**: Eventos podem estar sendo interceptados
3. **React Strict Mode**: Pode estar causando comportamentos inesperados em desenvolvimento

## Logs Esperados

Ao clicar em um checkbox, você deve ver:
```
setPermissionValue called: { path: "modules.products", value: true, currentPermissions: {...} }
Calling onChange with: { modules: { products: true, ... }, presales: { ... } }
UserForm: handlePermissionsChange called with: { modules: { products: true, ... }, presales: { ... } }
PermissionsEditor: permissions prop changed: { modules: { products: true, ... }, presales: { ... } }
```