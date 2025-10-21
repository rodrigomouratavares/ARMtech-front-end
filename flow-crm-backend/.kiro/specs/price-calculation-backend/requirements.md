# Requirements Document

## Introduction

Esta funcionalidade visa migrar os cálculos de preço, margem e markup do frontend para o backend, centralizando a lógica de negócio e garantindo maior consistência, segurança e performance. O sistema deve fornecer endpoints dedicados para cálculos de preço com validação rigorosa e suporte a diferentes cenários de negócio.

## Requirements

### Requirement 1

**User Story:** Como um usuário do sistema, eu quero que os cálculos de preço sejam processados no backend, para que eu tenha resultados consistentes e confiáveis independentemente do cliente utilizado.

#### Acceptance Criteria

1. WHEN um cálculo de preço é solicitado THEN o sistema SHALL processar no backend e retornar o resultado
2. WHEN múltiplos clientes fazem o mesmo cálculo THEN o sistema SHALL retornar resultados idênticos
3. IF o frontend não estiver disponível THEN o sistema SHALL ainda conseguir processar cálculos via API

### Requirement 2

**User Story:** Como um desenvolvedor, eu quero endpoints bem documentados para cálculo de preços, para que eu possa integrar facilmente com diferentes interfaces.

#### Acceptance Criteria

1. WHEN um endpoint de cálculo é chamado THEN o sistema SHALL validar todos os parâmetros de entrada
2. WHEN parâmetros inválidos são enviados THEN o sistema SHALL retornar erro 400 com detalhes específicos
3. WHEN um cálculo é bem-sucedido THEN o sistema SHALL retornar resposta estruturada com todos os componentes do cálculo
4. IF a documentação da API é consultada THEN o sistema SHALL mostrar exemplos claros de uso dos endpoints

### Requirement 3

**User Story:** Como um analista de negócios, eu quero que o sistema calcule margem e markup corretamente, para que eu possa tomar decisões de precificação precisas.

#### Acceptance Criteria

1. WHEN um cálculo de margem é solicitado THEN o sistema SHALL aplicar a fórmula: margem = (preço_venda - custo) / preço_venda * 100
2. WHEN um cálculo de markup é solicitado THEN o sistema SHALL aplicar a fórmula: markup = (preço_venda - custo) / custo * 100
3. WHEN descontos são aplicados THEN o sistema SHALL recalcular margem e markup baseado no preço final
4. IF histórico do cliente existe THEN o sistema SHALL considerar descontos personalizados no cálculo

### Requirement 4

**User Story:** Como um administrador do sistema, eu quero que os cálculos sejam auditáveis e performáticos, para que eu possa monitorar o uso e garantir boa experiência.

#### Acceptance Criteria

1. WHEN um cálculo é executado THEN o sistema SHALL registrar log com parâmetros e resultado
2. WHEN muitas requisições são feitas THEN o sistema SHALL aplicar rate limiting para prevenir abuso
3. IF o cálculo demora mais que 2 segundos THEN o sistema SHALL registrar alerta de performance
4. WHEN logs são consultados THEN o sistema SHALL mostrar histórico completo de cálculos para auditoria

### Requirement 5

**User Story:** Como um usuário do sistema, eu quero que impostos e promoções sejam considerados automaticamente, para que eu tenha o preço final correto sem cálculos manuais.

#### Acceptance Criteria

1. WHEN um produto tem impostos configurados THEN o sistema SHALL incluir no cálculo final
2. WHEN promoções ativas existem THEN o sistema SHALL aplicar automaticamente no cálculo
3. WHEN múltiplos descontos se aplicam THEN o sistema SHALL aplicar na ordem de prioridade configurada
4. IF arredondamento é necessário THEN o sistema SHALL aplicar regras de negócio definidas

### Requirement 6

**User Story:** Como um desenvolvedor, eu quero testes abrangentes para os cálculos, para que eu possa confiar na precisão dos resultados em produção.

#### Acceptance Criteria

1. WHEN testes unitários são executados THEN o sistema SHALL validar todas as fórmulas de cálculo
2. WHEN testes de integração são executados THEN o sistema SHALL validar endpoints completos
3. WHEN cenários edge case são testados THEN o sistema SHALL tratar adequadamente valores extremos
4. IF regressões são introduzidas THEN o sistema SHALL falhar nos testes automatizados