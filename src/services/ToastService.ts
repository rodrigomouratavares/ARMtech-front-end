import { type ToastOptions, toast } from 'react-toastify';

// Configuração padrão dos toasts conforme especificado
const DEFAULT_TOAST_OPTIONS: ToastOptions = {
	position: 'bottom-right',
	autoClose: 5000,
	hideProgressBar: false,
	closeOnClick: true,
	pauseOnHover: true,
	draggable: true,
	theme: 'light',
};

// Mensagens padronizadas em português brasileiro
export const TOAST_MESSAGES = {
	// Pré-vendas
	presale: {
		created: 'Pré-venda criada com sucesso!',
		updated: 'Pré-venda atualizada com sucesso!',
		deleted: 'Pré-venda excluída com sucesso!',
		statusChanged: 'Status da pré-venda alterado com sucesso!',
		invalidData: 'Selecione um cliente e adicione pelo menos um item!',
		deleteConfirm: 'Tem certeza que deseja excluir esta pré-venda?',
	},

	// Produtos
	product: {
		created: 'Produto cadastrado com sucesso!',
		updated: 'Produto atualizado com sucesso!',
		deleted: 'Produto excluído com sucesso!',
		invalidData: 'Preencha todos os campos obrigatórios!',
		deleteConfirm: 'Tem certeza que deseja excluir este produto?',
	},

	// Clientes
	customer: {
		created: 'Cliente cadastrado com sucesso!',
		updated: 'Cliente atualizado com sucesso!',
		deleted: 'Cliente excluído com sucesso!',
		invalidData: 'Preencha todos os campos obrigatórios!',
		deleteConfirm: 'Tem certeza que deseja excluir este cliente?',
	},

	// Inventário
	inventory: {
		adjusted: 'Estoque ajustado com sucesso!',
		stockAdded: 'Quantidade adicionada ao estoque com sucesso!',
		stockRemoved: 'Quantidade removida do estoque com sucesso!',
		productNotFound: 'Produto não encontrado!',
		invalidData: 'Preencha todos os campos obrigatórios!',
		insufficientStock: 'Estoque insuficiente para esta operação!',
		searchError: 'Erro ao buscar produtos. Tente novamente.',
		historyLoadError: 'Erro ao carregar histórico de ajustes. Tente novamente.',
		networkError: 'Erro de conexão. Verifique sua internet e tente novamente.',
		serverError: 'Erro no servidor. Tente novamente em alguns minutos.',
		validationError: 'Dados inválidos. Verifique os campos e tente novamente.',
		unauthorizedError: 'Você não tem permissão para realizar esta operação.',
		conflictError: 'Conflito detectado. Atualize os dados e tente novamente.',
		retrying: 'Tentando novamente...',
		operationCancelled: 'Operação cancelada pelo usuário.',
		formValidationError: 'Por favor, corrija os erros no formulário.',
		dateRangeError: 'Intervalo de datas inválido.',
		quantityTooHigh: 'Quantidade muito alta para esta operação.',
		reasonTooShort: 'Motivo deve ter pelo menos 3 caracteres.',
		reasonTooLong: 'Motivo deve ter no máximo 500 caracteres.',
		productCodeRequired: 'Código do produto é obrigatório.',
		quantityRequired: 'Quantidade é obrigatória.',
		reasonRequired: 'Motivo é obrigatório.',
		invalidQuantity: 'Quantidade deve ser um número maior que zero.',
		loadingProducts: 'Carregando produtos...',
		loadingHistory: 'Carregando histórico...',
		processingAdjustment: 'Processando ajuste de estoque...',
		historyUpdated: 'Histórico atualizado com sucesso!',
		filtersCleared: 'Filtros limpos com sucesso!',
		noProductsFound: 'Nenhum produto encontrado.',
		noHistoryFound: 'Nenhum ajuste de estoque encontrado.',
		offlineMode:
			'Você está offline. Algumas funcionalidades podem não estar disponíveis.',
		connectionRestored: 'Conexão restaurada!',
	},

	// Formas de pagamento
	paymentMethod: {
		created: 'Forma de pagamento criada com sucesso!',
		updated: 'Forma de pagamento atualizada com sucesso!',
		deleted: 'Forma de pagamento excluída com sucesso!',
		invalidData: 'Preencha todos os campos obrigatórios!',
		deleteConfirm: 'Tem certeza que deseja excluir esta forma de pagamento?',
		duplicateCode: 'Já existe uma forma de pagamento com este código!',
		inUse: 'Esta forma de pagamento está sendo usada e não pode ser excluída!',
		networkError: 'Erro de conexão. Verifique sua internet e tente novamente.',
		serverError: 'Erro no servidor. Tente novamente em alguns minutos.',
		loadError: 'Erro ao carregar formas de pagamento. Tente novamente.',
		retrying: 'Tentando novamente...',
	},

	// Genéricas
	generic: {
		success: 'Operação realizada com sucesso!',
		error: 'Erro ao realizar operação!',
		warning: 'Atenção! Verifique os dados informados.',
		info: 'Informação registrada.',
	},
} as const;

/**
 * Classe instanciável para gerenciar toasts
 * Permite configuração personalizada por instância
 */
export class ToastService {
	private config: ToastOptions;

	/**
	 * Cria uma nova instância do ToastService
	 * @param config - Configuração personalizada para os toasts
	 */
	constructor(config: Partial<ToastOptions> = {}) {
		this.config = { ...DEFAULT_TOAST_OPTIONS, ...config };
	}

	/**
	 * Exibe toast de sucesso
	 */
	success(message: string, options?: Partial<ToastOptions>) {
		return toast.success(message, { ...this.config, ...options });
	}

	/**
	 * Exibe toast de erro
	 */
	error(message: string, options?: Partial<ToastOptions>) {
		return toast.error(message, { ...this.config, ...options });
	}

	/**
	 * Exibe toast de aviso
	 */
	warning(message: string, options?: Partial<ToastOptions>) {
		return toast.warning(message, { ...this.config, ...options });
	}

	/**
	 * Exibe toast de informação
	 */
	info(message: string, options?: Partial<ToastOptions>) {
		return toast.info(message, { ...this.config, ...options });
	}

	/**
	 * Remove todos os toasts da tela
	 */
	dismiss() {
		return toast.dismiss();
	}

	/**
	 * Verifica se um toast está ativo
	 */
	isActive(toastId: string | number) {
		return toast.isActive(toastId);
	}

	/**
	 * Atualiza a configuração padrão da instância
	 */
	updateConfig(newConfig: Partial<ToastOptions>) {
		this.config = { ...this.config, ...newConfig };
	}

	/**
	 * Retorna a configuração atual da instância
	 */
	getConfig(): ToastOptions {
		return { ...this.config };
	}
}

// Instância padrão com configurações default
const toastService = new ToastService();

// Export da instância padrão como default
export default toastService;

// Funções de conveniência para retrocompatibilidade
// @deprecated Use a instância padrão: toastService.success()
export const showSuccess = toastService.success.bind(toastService);
// @deprecated Use a instância padrão: toastService.error()
export const showError = toastService.error.bind(toastService);
// @deprecated Use a instância padrão: toastService.warning()
export const showWarning = toastService.warning.bind(toastService);
// @deprecated Use a instância padrão: toastService.info()
export const showInfo = toastService.info.bind(toastService);
