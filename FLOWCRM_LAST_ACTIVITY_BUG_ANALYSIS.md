# Análise do Bug: flowcrm_last_activity

## Problema Identificado

O bug está relacionado ao sistema de controle de sessão baseado no `flowcrm_last_activity` no localStorage. Algumas vezes, quando o usuário tenta fazer login com credenciais corretas, o sistema processa mas retorna para a tela de login.

## Causa Raiz

Após análise do código, identifiquei os seguintes problemas:

### 1. **Condição de Corrida na Inicialização**
No `AuthContext.tsx`, linha 384-400, existe um `useEffect` que monitora timeout de sessão que pode estar executando antes da inicialização completa do contexto:

```typescript
useEffect(() => {
    if (!state.user || !state.isInitialized) return;

    const checkSessionTimeout = () => {
        const lastActivity = localStorage.getItem('flowcrm_last_activity');
        if (lastActivity) {
            const lastActivityDate = new Date(lastActivity);
            const now = new Date();
            const timeDiff = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);

            if (timeDiff > state.sessionTimeout) {
                authDebugLog('Session timeout detected');
                authService.logout();
                dispatch({ type: 'SESSION_EXPIRED' });
            }
        }
    };

    const interval = setInterval(checkSessionTimeout, 60000);
    return () => clearInterval(interval);
}, [state.user, state.isInitialized, state.sessionTimeout]);
```

### 2. **Problema no useSession Hook**
No `useSession.ts`, linha 45-65, há uma lógica que pode estar causando logout automático durante o processo de login:

```typescript
const lastActivityStr = localStorage.getItem('flowcrm_last_activity');
if (!lastActivityStr) {
    setSessionInfo(prev => ({
        ...prev,
        isActive: true,
        timeRemaining: prev.sessionTimeout,
        lastActivity: null,
        showWarning: false,
    }));
    return;
}
```

### 3. **Interceptor HTTP com Redirecionamento Automático**
No `httpClient.ts`, linha 94-100, há um interceptor que redireciona automaticamente para login em caso de 401:

```typescript
if (error.response?.status === 401) {
    tokenStorage.removeToken();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}
```

## Cenário do Bug

1. Usuário tenta fazer login
2. Durante o processo de login, o sistema verifica `flowcrm_last_activity`
3. Se não existe ou está expirado, pode disparar logout automático
4. Isso acontece antes do login ser completamente processado
5. Usuário é redirecionado de volta para login

## Soluções Propostas

### Solução 1: Desabilitar verificação de sessão durante login
### Solução 2: Melhorar a lógica de inicialização
### Solução 3: Adicionar flag de "login em progresso"