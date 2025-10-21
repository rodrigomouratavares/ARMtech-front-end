import { SquarePen, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { paymentMethodService } from '../../../services/paymentMethodService';
import toastService, { TOAST_MESSAGES } from '../../../services/ToastService';
import type { PaymentMethod } from '../../../types';
import { AutoCodeService } from '../../../utils';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Modal from '../../common/Modal';
import Switch from '../../common/Switch';

type TabType = 'list' | 'register';

interface ConfirmationDialogState {
	isOpen: boolean;
	paymentMethod: PaymentMethod | null;
}

interface EditDialogState {
	isOpen: boolean;
	paymentMethod: PaymentMethod | null;
}

const PaymentMethodsPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabType>('list');
	const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [confirmationDialog, setConfirmationDialog] =
		useState<ConfirmationDialogState>({
			isOpen: false,
			paymentMethod: null,
		});
	const [editDialog, setEditDialog] = useState<EditDialogState>({
		isOpen: false,
		paymentMethod: null,
	});
	const [editFormData, setEditFormData] = useState({
		description: '',
		isActive: true,
	});

	// Load payment methods on component mount
	useEffect(() => {
		const loadPaymentMethods = async () => {
			setIsLoading(true);
			try {
				const data = await paymentMethodService.getAll();
				setPaymentMethods(data);

				// Initialize auto code service with existing codes
				const existingCodes = data
					.map((pm: any) => pm.code)
					.filter((code: any) => code && typeof code === 'string');
				AutoCodeService.initializeFromExisting('paymentMethod', existingCodes);
			} catch (error) {
				console.error('Error loading payment methods:', error);
				toastService.error(TOAST_MESSAGES.paymentMethod.loadError);
			} finally {
				setIsLoading(false);
			}
		};

		loadPaymentMethods();
	}, []);

	const [formData, setFormData] = useState({
		code: '',
		description: '',
		isActive: true,
	});

	const handleInputChange = (field: string) => (value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Generate new payment method code when switching to register tab
	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		if (tab === 'register' && !formData.code) {
			const newCode = AutoCodeService.generateCode('paymentMethod');
			setFormData((prev) => ({ ...prev, code: newCode }));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.description.trim()) {
			toastService.error(TOAST_MESSAGES.paymentMethod.invalidData);
			return;
		}

		setIsLoading(true);
		try {
			const newPaymentMethod = await paymentMethodService.create({
				code: formData.code,
				description: formData.description.trim(),
				isActive: formData.isActive,
			});

			// Update local state
			setPaymentMethods((prev) => [...prev, newPaymentMethod]);

			// Reset form after submit
			setFormData({
				code: '',
				description: '',
				isActive: true,
			});

			// Switch to list tab to show the newly created item
			setActiveTab('list');

			// Show success message
			toastService.success(TOAST_MESSAGES.paymentMethod.created);

			console.log('Forma de pagamento criada:', newPaymentMethod);
		} catch (error) {
			console.error('Erro ao criar forma de pagamento:', error);

			// Show specific error message based on error type
			if (error instanceof Error) {
				if (
					error.message.includes('duplicate') ||
					error.message.includes('já existe')
				) {
					toastService.error(TOAST_MESSAGES.paymentMethod.duplicateCode);
				} else {
					toastService.error(error.message);
				}
			} else {
				toastService.error(TOAST_MESSAGES.paymentMethod.invalidData);
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Handle delete confirmation dialog
	const handleDeleteClick = (paymentMethod: PaymentMethod) => {
		setConfirmationDialog({
			isOpen: true,
			paymentMethod,
		});
	};

	const handleDeleteConfirm = async () => {
		if (!confirmationDialog.paymentMethod) return;

		setIsLoading(true);
		try {
			const success = await paymentMethodService.delete(
				confirmationDialog.paymentMethod.id,
			);

			if (success) {
				// Update local state by removing the deleted item
				setPaymentMethods((prev) =>
					prev.filter((pm) => pm.id !== confirmationDialog.paymentMethod!.id),
				);

				// Show success message
				toastService.success(TOAST_MESSAGES.paymentMethod.deleted);
			} else {
				toastService.error('Forma de pagamento não encontrada.');
			}
		} catch (error) {
			console.error('Erro ao excluir forma de pagamento:', error);

			// Show specific error message based on error type
			if (error instanceof Error) {
				if (
					error.message.includes('being used') ||
					error.message.includes('sendo usada')
				) {
					toastService.error(TOAST_MESSAGES.paymentMethod.inUse);
				} else {
					toastService.error(error.message);
				}
			} else {
				toastService.error(
					'Erro ao excluir forma de pagamento. Tente novamente.',
				);
			}
		} finally {
			setIsLoading(false);
			// Close confirmation dialog
			setConfirmationDialog({
				isOpen: false,
				paymentMethod: null,
			});
		}
	};

	const handleDeleteCancel = () => {
		setConfirmationDialog({
			isOpen: false,
			paymentMethod: null,
		});
	};

	// Handle edit functionality
	const handleEditClick = (paymentMethod: PaymentMethod) => {
		setEditFormData({
			description: paymentMethod.description,
			isActive: paymentMethod.isActive,
		});
		setEditDialog({
			isOpen: true,
			paymentMethod,
		});
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!editDialog.paymentMethod) return;

		if (!editFormData.description.trim()) {
			toastService.error(TOAST_MESSAGES.paymentMethod.invalidData);
			return;
		}

		setIsLoading(true);
		try {
			const updatedPaymentMethod = await paymentMethodService.update(
				editDialog.paymentMethod.id,
				{
					description: editFormData.description.trim(),
					isActive: editFormData.isActive,
				},
			);

			if (updatedPaymentMethod) {
				// Update local state
				setPaymentMethods((prev) =>
					prev.map((pm) =>
						pm.id === editDialog.paymentMethod!.id ? updatedPaymentMethod : pm,
					),
				);

				// Close edit dialog
				setEditDialog({
					isOpen: false,
					paymentMethod: null,
				});

				// Show success message
				toastService.success(TOAST_MESSAGES.paymentMethod.updated);

				console.log('Forma de pagamento atualizada:', updatedPaymentMethod);
			} else {
				toastService.error('Forma de pagamento não encontrada.');
			}
		} catch (error) {
			console.error('Erro ao atualizar forma de pagamento:', error);

			// Show specific error message based on error type
			if (error instanceof Error) {
				if (
					error.message.includes('duplicate') ||
					error.message.includes('já existe')
				) {
					toastService.error(TOAST_MESSAGES.paymentMethod.duplicateCode);
				} else if (
					error.message.includes('validation') ||
					error.message.includes('inválidos')
				) {
					toastService.error(TOAST_MESSAGES.paymentMethod.invalidData);
				} else {
					toastService.error(error.message);
				}
			} else {
				toastService.error(
					'Erro ao atualizar forma de pagamento. Tente novamente.',
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditCancel = () => {
		setEditDialog({
			isOpen: false,
			paymentMethod: null,
		});
		setEditFormData({
			description: '',
			isActive: true,
		});
	};

	const handleEditInputChange = (field: string) => (value: string) => {
		setEditFormData((prev) => ({ ...prev, [field]: value }));
	};

	const renderTabContent = () => {
		if (activeTab === 'list') {
			return (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-800">
							Formas de Pagamento Cadastradas
						</h2>
						<span className="text-sm text-gray-500">
							{paymentMethods.length} formas de pagamento
						</span>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{paymentMethods.map((paymentMethod) => (
							<div
								key={paymentMethod.id}
								className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full"
							>
								<div className="flex justify-between items-start mb-2">
									<div className="flex-grow pr-2">
										<h3 className="font-semibold text-gray-900 line-clamp-1">
											{paymentMethod.description}
										</h3>
										<p className="text-xs text-gray-600">
											Código Interno: {paymentMethod.code}
										</p>
									</div>
									<div className="text-right flex-shrink-0">
										<span
											className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												paymentMethod.isActive
													? 'bg-green-100 text-green-800'
													: 'bg-red-100 text-red-800'
											}`}
										>
											{paymentMethod.isActive ? 'Ativo' : 'Inativo'}
										</span>
									</div>
								</div>
								<div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto">
									<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
										Disponível
									</span>
									<div className="flex space-x-2">
										<button
											type="button"
											className="text-blue-600 hover:text-blue-800 text-sm"
											title="Editar forma de pagamento"
											onClick={() => handleEditClick(paymentMethod)}
											disabled={isLoading}
										>
											<SquarePen size={16} />
										</button>
										<button
											type="button"
											className="text-red-600 hover:text-red-800 text-sm"
											title="Excluir forma de pagamento"
											onClick={() => handleDeleteClick(paymentMethod)}
											disabled={isLoading}
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>

					{paymentMethods.length === 0 && (
						<div className="text-center py-8">
							<p className="text-gray-500">
								Nenhuma forma de pagamento cadastrada ainda.
							</p>
						</div>
					)}
				</div>
			);
		}

		// Register tab: form for creating new payment methods
		return (
			<form onSubmit={handleSubmit} className="space-y-8">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Input
								label="Código*"
								value={formData.code}
								onChange={handleInputChange('code')}
								placeholder="Código auto-gerado"
								readOnly
								className="w-2/3"
								required
							/>

							<Input
								label="Descrição*"
								value={formData.description}
								onChange={handleInputChange('description')}
								placeholder="Digite a descrição da forma de pagamento"
								required
							/>
						</div>

						<div className="pt-4 border-t border-gray-200">
							<Switch
								checked={formData.isActive}
								onChange={(checked) =>
									setFormData((prev) => ({ ...prev, isActive: checked }))
								}
								label="Forma de pagamento ativa"
								description="Quando ativa, esta forma de pagamento estará disponível para uso nas vendas"
							/>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex justify-end space-x-3">
					<Button
						type="button"
						variant="secondary"
						onClick={() => {
							setFormData({
								code: '',
								description: '',
								isActive: true,
							});
						}}
					>
						Limpar
					</Button>
					<Button type="submit" variant="primary" disabled={isLoading}>
						{isLoading ? 'Salvando...' : 'Cadastrar Forma de Pagamento'}
					</Button>
				</div>
			</form>
		);
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">
				Formas de Pagamento
			</h1>

			{/* Tabs */}
			<div className="mb-6">
				<div className="border-b border-gray-200">
					<nav className="-mb-px flex space-x-8" aria-label="Tabs">
						<button
							type="button"
							onClick={() => handleTabChange('list')}
							className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
								activeTab === 'list'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							Listagem
						</button>
						<button
							type="button"
							onClick={() => handleTabChange('register')}
							className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
								activeTab === 'register'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							Cadastro
						</button>
					</nav>
				</div>
			</div>

			{/* Tab Content */}
			<div className="mt-6">{renderTabContent()}</div>

			{/* Delete Confirmation Dialog */}
			<Modal
				isOpen={confirmationDialog.isOpen}
				onClose={handleDeleteCancel}
				title="Confirmar Exclusão"
			>
				<div className="space-y-4">
					<p className="text-gray-700">
						Tem certeza que deseja excluir a forma de pagamento{' '}
						<strong>"{confirmationDialog.paymentMethod?.description}"</strong>?
					</p>
					<p className="text-sm text-gray-500">
						Esta ação não pode ser desfeita. Se esta forma de pagamento estiver
						sendo usada em vendas, ela não poderá ser excluída.
					</p>
					<div className="flex justify-end space-x-3 pt-4">
						<Button
							type="button"
							variant="secondary"
							onClick={handleDeleteCancel}
							disabled={isLoading}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							variant="danger"
							onClick={handleDeleteConfirm}
							disabled={isLoading}
						>
							{isLoading ? 'Excluindo...' : 'Excluir'}
						</Button>
					</div>
				</div>
			</Modal>

			{/* Edit Payment Method Dialog */}
			<Modal
				isOpen={editDialog.isOpen}
				onClose={handleEditCancel}
				title="Editar Forma de Pagamento"
			>
				<form onSubmit={handleEditSubmit} className="space-y-6">
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Código
							</label>
							<input
								type="text"
								value={editDialog.paymentMethod?.code || ''}
								readOnly
								className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
								placeholder="Código não pode ser alterado"
							/>
							<p className="text-xs text-gray-500 mt-1">
								O código não pode ser alterado após a criação
							</p>
						</div>

						<Input
							label="Descrição*"
							value={editFormData.description}
							onChange={handleEditInputChange('description')}
							placeholder="Digite a descrição da forma de pagamento"
							required
						/>

						<div className="pt-4 border-t border-gray-200">
							<Switch
								checked={editFormData.isActive}
								onChange={(checked) =>
									setEditFormData((prev) => ({ ...prev, isActive: checked }))
								}
								label="Forma de pagamento ativa"
								description="Quando ativa, esta forma de pagamento estará disponível para uso nas vendas"
							/>
						</div>
					</div>

					<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
						<Button
							type="button"
							variant="secondary"
							onClick={handleEditCancel}
							disabled={isLoading}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							variant="primary"
							disabled={isLoading || !editFormData.description.trim()}
						>
							{isLoading ? 'Salvando...' : 'Salvar Alterações'}
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
};

export default PaymentMethodsPage;
