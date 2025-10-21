# 📊 Demonstração do Cálculo de Sugestão de Preços

## Como Funciona o Sistema de Sugestão de Preços

O sistema implementado calcula automaticamente uma sugestão de preço de venda baseado no preço de compra informado, aplicando uma margem de lucro configurável.

## 🔢 Fórmula do Cálculo

### Fórmula Base:
```
Preço de Venda Sugerido = Preço de Compra × (1 + Margem de Lucro)
```

### Configuração Padrão:
- **Margem padrão**: 30% (0.3)
- **Margem mínima**: 5% (0.05)  
- **Margem máxima**: 500% (5.0)

## 📝 Exemplos Práticos

### Exemplo 1: Produto Básico
```typescript
Preço de Compra: R$ 10,00
Margem: 30% (padrão)
Cálculo: 10,00 × (1 + 0.3) = 10,00 × 1.3 = R$ 13,00
```

### Exemplo 2: Produto com Margem Personalizada
```typescript
Preço de Compra: R$ 25,00
Margem: 50% (0.5)
Cálculo: 25,00 × (1 + 0.5) = 25,00 × 1.5 = R$ 37,50
```

### Exemplo 3: Produto de Alto Valor
```typescript
Preço de Compra: R$ 100,00
Margem: 30% (padrão)
Cálculo: 100,00 × (1 + 0.3) = 100,00 × 1.3 = R$ 130,00
```

### Exemplo 4: Validação de Limites
```typescript
// Margem muito baixa (será ajustada para o mínimo)
Preço de Compra: R$ 50,00
Margem tentada: 1% → Ajustada para: 5% (mínimo)
Cálculo: 50,00 × (1 + 0.05) = 50,00 × 1.05 = R$ 52,50

// Margem muito alta (será ajustada para o máximo)  
Preço de Compra: R$ 20,00
Margem tentada: 1000% → Ajustada para: 500% (máximo)
Cálculo: 20,00 × (1 + 5.0) = 20,00 × 6.0 = R$ 120,00
```

## 💻 Implementação no Código

### 1. Função Principal de Cálculo
```typescript
calculateSuggestedPrice(purchasePrice: number, marginPercentage?: number): number {
    if (purchasePrice <= 0) return 0;

    const margin = marginPercentage ?? this.config.defaultMarginPercentage; // 0.3 (30%)
    const clampedMargin = Math.max(this.config.minMargin, Math.min(this.config.maxMargin, margin));
    
    return Math.round((purchasePrice * (1 + clampedMargin)) * 100) / 100;
}
```

### 2. Configuração do Sistema
```typescript
// Instanciar o serviço
const priceCalculationService = new PriceCalculationService({
    defaultMarginPercentage: 0.3,  // 30% de margem padrão
    minMargin: 0.05,              // 5% margem mínima
    maxMargin: 5.0,               // 500% margem máxima
});
```

### 3. Integração com o Formulário
```typescript
// Quando o usuário digita o preço de compra
const handleInputChange = (field: string) => (value: string) => {
    setFormData((prev) => {
        const updated = { ...prev, [field]: value };

        // Auto-sugerir preço de venda quando preço de compra muda
        if (field === 'purchasePrice' && value) {
            const purchasePrice = priceCalculationService.parsePrice(value);
            if (purchasePrice > 0) {
                const suggestedPrice = priceCalculationService.calculateSuggestedPrice(purchasePrice);
                // Só preenche automaticamente se o preço de venda estiver vazio
                if (!prev.salePrice) {
                    updated.salePrice = suggestedPrice.toFixed(2);
                }
            }
        }

        return updated;
    });
};
```

## 🎯 Comportamento na Interface

### Quando o Usuário Digita o Preço de Compra:

1. **Campo vazio de preço de venda**: 
   - ✅ Sistema preenche automaticamente com a sugestão

2. **Campo preenchido de preço de venda**: 
   - ✅ Sistema mostra a sugestão abaixo do campo, mas NÃO sobrescreve
   - ✅ Usuário mantém controle total

3. **Exibição da Sugestão**:
   ```html
   <p className="text-xs text-gray-500 mt-1">
       Sugestão: R$ {priceCalculationService.calculateSuggestedPrice(
           priceCalculationService.parsePrice(formData.purchasePrice)
       ).toFixed(2)}
   </p>
   ```

## 🔧 Funcionalidades Extras

### Parsing de Preços (Brasileiro)
```typescript
// Converte string para número, lidando com formato brasileiro
parsePrice(priceString: string): number {
    // Remove símbolos de moeda e espaços: "R$ 10,50" → "10,50"
    const cleanString = priceString.replace(/[R$\s]/g, '');
    
    // Converte vírgula para ponto: "10,50" → "10.50" 
    const normalized = cleanString.replace(',', '.');
    
    const parsed = parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : parsed;
}
```

### Formatação de Moeda
```typescript
// Formata número para moeda brasileira
formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(price);
}
```

### Cálculo de Margem Reversa
```typescript
// Calcula qual foi a margem aplicada entre compra e venda
calculateMarginPercentage(purchasePrice: number, salePrice: number): number {
    if (purchasePrice <= 0) return 0;
    return (salePrice - purchasePrice) / purchasePrice;
}
```

## 🧮 Exemplos de Uso no Sistema

### Cenário 1: Cadastro de Produto Simples
```
1. Usuário vai para aba "Preços e Estoque"
2. Digita "50" no campo "Preço de Compra"
3. Sistema automaticamente preenche "65.00" no "Preço de Venda"
4. Sistema mostra "Sugestão: R$ 65,00" abaixo do campo
```

### Cenário 2: Usuário com Preço Próprio
```
1. Usuário digita "50" no "Preço de Compra" 
2. Usuário digita "80" no "Preço de Venda" (antes da sugestão)
3. Depois digita "100" no "Preço de Compra"
4. Sistema NÃO altera o "80" já digitado
5. Sistema mostra "Sugestão: R$ 130,00" (mas mantém os 80 do usuário)
```

## ⚙️ Configurações Avançadas

### Alterar Margem Padrão
```typescript
// Mudar para 25%
priceCalculationService.updateConfig({
    defaultMarginPercentage: 0.25
});
```

### Alterar Limites
```typescript
// Margem entre 10% e 200%
priceCalculationService.updateConfig({
    minMargin: 0.1,    // 10%
    maxMargin: 2.0     // 200%
});
```

## 📊 Arredondamento e Precisão

O sistema arredonda os resultados para 2 casas decimais usando a fórmula:
```typescript
Math.round((valor * 100)) / 100
```

### Exemplos:
- `10.666666` → `10.67`
- `25.333333` → `25.33` 
- `99.999999` → `100.00`

---

**🎯 Resumo**: O sistema oferece sugestões inteligentes de preço mantendo sempre o controle nas mãos do usuário, com cálculos precisos, formatação brasileira e configurações flexíveis.