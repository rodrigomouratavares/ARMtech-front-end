import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import toastService from '../../../services/ToastService';
import {
	getDefaultPermissions,
	userService,
} from '../../../services/userService';
import type {
	CreateUserRequest,
	UpdateUserRequest,
	User,
	UserPermissions,
} from '../../../types';
import {
	formatEmail,
	sanitizeUserInput,
	validateField,
	validateUserForm,
} from '../../../utils/validationUtils';
import Button from '../../common/Button';
import Input from '../../common/Input';
import type { SelectOption } from '../../common/Select';
import Select from '../../common/Select';
import PermissionsEditor from './PermissionsEditor';

interface UserFormProps {
	editingUser?: User | null;
	onUserSaved?: () => void;
	onCancel?: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
	editingUser,
	onUserSaved,
	onCancel,
}) => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		userType: 'employee' as 'admin' | 'employee',
		isActive: true,
	});

	const [permissions, setPermissions] = useState<UserPermissions>(() => {
		const defaultPerms = getDefaultPermissions('employee');
		return {
			modules: { ...defaultPerms.modules },
			presales: { ...defaultPerms.presales },
		};
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [existingUsers, setExistingUsers] = useState<User[]>([]);
	const [emailCheckLoading, setEmailCheckLoading] = useState(false);
	const { handleAsyncOperation } = useErrorHandler();

	// Stable onChange function for permissions
	const handlePermissionsChange = useCallback(
		(newPermissions: UserPermissions) => {
			setPermissions(() => {
				return {
					modules: { ...newPermissions.modules },
					presales: { ...newPermissions.presales },
				};
			});
		},
		[],
	);

	// User type options
	const userTypeOptions: SelectOption[] = [
		{ value: 'employee', label: 'Funcionário' },
		{ value: 'admin', label: 'Administrador' },
	];

	// Load existing users for email validation
	useEffect(() => {
		const loadUsers = async () => {
			const users = await handleAsyncOperation(
				() => userService.getAllUsers(),
				{ action: 'load_users_for_validation' },
			);
			if (users) {
				setExistingUsers(users);
			}
		};
		loadUsers();
	}, [handleAsyncOperation]);

	// Load user data when editing
	useEffect(() => {
		if (editingUser) {
			setFormData({
				name: editingUser.name,
				email: editingUser.email,
				password: '',
				confirmPassword: '',
				userType: editingUser.userType,
				isActive: editingUser.isActive,
			});
			setPermissions({
				modules: { ...editingUser.permissions.modules },
				presales: { ...editingUser.permissions.presales },
			});
		} else {
			// Reset form for new user
			setFormData({
				name: '',
				email: '',
				password: '',
				confirmPassword: '',
				userType: 'employee',
				isActive: true,
			});
			const defaultPerms = getDefaultPermissions('employee');
			setPermissions({
				modules: { ...defaultPerms.modules },
				presales: { ...defaultPerms.presales },
			});
		}
		setErrors({});
	}, [editingUser]);

	// Update permissions when user type changes
	useEffect(() => {
		if (!editingUser) {
			const defaultPerms = getDefaultPermissions(formData.userType);
			setPermissions({
				modules: { ...defaultPerms.modules },
				presales: { ...defaultPerms.presales },
			});
		}
	}, [formData.userType, editingUser]);

	// Get existing emails for validation (excluding current user if editing)
	const getExistingEmails = useCallback(() => {
		return existingUsers
			.filter((user) => !editingUser || user.id !== editingUser.id)
			.map((user) => user.email.toLowerCase());
	}, [existingUsers, editingUser]);

	// Real-time field validation
	const validateFieldRealTime = useCallback(
		(fieldName: string, value: string | boolean) => {
			const existingEmails = getExistingEmails();
			const error = validateField(
				fieldName,
				value,
				formData,
				!!editingUser,
				existingEmails,
			);

			setErrors((prev) => ({
				...prev,
				[fieldName]: error,
			}));
		},
		[formData, editingUser, getExistingEmails],
	);

	const handleInputChange = (field: string) => (value: string | boolean) => {
		let processedValue = value;

		// Process text inputs
		if (typeof value === 'string') {
			if (field === 'email') {
				processedValue = formatEmail(value);
			} else if (field === 'name') {
				// Para o campo nome, preservamos acentos e espaços durante a digitação
				// Apenas removemos múltiplos espaços consecutivos, mas mantemos espaços normais
				processedValue = value.replace(/\s{2,}/g, ' ');
			} else if (['name', 'email'].includes(field)) {
				processedValue = sanitizeUserInput(value);
			}
		}

		setFormData((prev) => ({ ...prev, [field]: processedValue }));

		// Real-time validation for critical fields
		if (['name', 'email', 'password', 'confirmPassword'].includes(field)) {
			// Small delay for email validation to avoid excessive API calls
			if (field === 'email') {
				setEmailCheckLoading(true);
				setTimeout(() => {
					validateFieldRealTime(field, processedValue);
					setEmailCheckLoading(false);
				}, 500);
			} else {
				validateFieldRealTime(field, processedValue);
			}
		}
	};

	const validateForm = () => {
		const existingEmails = getExistingEmails();
		const validation = validateUserForm(
			formData,
			!!editingUser,
			existingEmails,
		);

		setErrors(validation.errors);
		return validation.isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);

		const result = await handleAsyncOperation(
			async () => {
				if (editingUser) {
					// Update existing user
					const updateData: UpdateUserRequest = {
						name: formData.name.trim(),
						email: formData.email.trim(),
						userType: formData.userType,
						isActive: formData.isActive,
						permissions,
					};

					// Only include password if it was changed
					if (formData.password) {
						updateData.password = formData.password;
					}

					await userService.updateUser(editingUser.id, updateData);
					return { action: 'update', name: formData.name };
				} else {
					// Create new user
					const createData: CreateUserRequest = {
						name: formData.name.trim(),
						email: formData.email.trim(),
						password: formData.password,
						userType: formData.userType,
						permissions,
					};

					await userService.createUser(createData);
					return { action: 'create', name: formData.name };
				}
			},
			{ action: editingUser ? 'update_user' : 'create_user' },
		);

		if (result) {
			// Show success message
			const successMessage =
				result.action === 'update'
					? `Usuário ${result.name} atualizado com sucesso!`
					: `Usuário ${result.name} criado com sucesso!`;
			toastService.success(successMessage);

			// Reset form
			setFormData({
				name: '',
				email: '',
				password: '',
				confirmPassword: '',
				userType: 'employee',
				isActive: true,
			});
			const defaultPerms = getDefaultPermissions('employee');
			setPermissions({
				modules: { ...defaultPerms.modules },
				presales: { ...defaultPerms.presales },
			});
			setErrors({});

			// Notify parent component
			if (onUserSaved) {
				onUserSaved();
			}
		}

		setLoading(false);
	};

	const handleCancel = () => {
		// Reset form
		setFormData({
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
			userType: 'employee',
			isActive: true,
		});
		const defaultPerms = getDefaultPermissions('employee');
		setPermissions({
			modules: { ...defaultPerms.modules },
			presales: { ...defaultPerms.presales },
		});
		setErrors({});

		if (onCancel) {
			onCancel();
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			{/* Basic Information */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h3 className="text-lg font-medium text-gray-900 mb-6">
					{editingUser
						? `Editar Usuário: ${editingUser.name}`
						: 'Cadastrar Novo Usuário'}
				</h3>

				<div className="space-y-6">
					{/* First row: Name and Email */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Input
							label="Nome Completo*"
							value={formData.name}
							onChange={handleInputChange('name')}
							placeholder="Digite o nome completo"
							error={errors.name}
							required
						/>

						<div className="relative">
							<Input
								label="E-mail*"
								type="email"
								value={formData.email}
								onChange={handleInputChange('email')}
								placeholder="exemplo@email.com"
								error={errors.email}
								required
							/>
							{emailCheckLoading && (
								<div className="absolute right-3 top-9 flex items-center">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
								</div>
							)}
						</div>
					</div>

					{/* Second row: User Type and Status */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Select
							label="Tipo de Usuário*"
							value={formData.userType}
							onChange={handleInputChange('userType')}
							options={userTypeOptions}
							placeholder="Selecione o tipo"
							required
						/>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Status
							</label>
							<div className="flex items-center space-x-4">
								<label className="flex items-center">
									<input
										type="radio"
										name="isActive"
										checked={formData.isActive}
										onChange={() => handleInputChange('isActive')(true)}
										className="mr-2"
									/>
									<span className="text-sm text-gray-700">Ativo</span>
								</label>
								<label className="flex items-center">
									<input
										type="radio"
										name="isActive"
										checked={!formData.isActive}
										onChange={() => handleInputChange('isActive')(false)}
										className="mr-2"
									/>
									<span className="text-sm text-gray-700">Inativo</span>
								</label>
							</div>
						</div>
					</div>

					{/* Third row: Password fields */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Input
							label={
								editingUser
									? 'Nova Senha (deixe em branco para manter)'
									: 'Senha*'
							}
							type="password"
							value={formData.password}
							onChange={handleInputChange('password')}
							placeholder="Digite a senha"
							error={errors.password}
							required={!editingUser}
						/>

						<Input
							label={editingUser ? 'Confirmar Nova Senha' : 'Confirmar Senha*'}
							type="password"
							value={formData.confirmPassword}
							onChange={handleInputChange('confirmPassword')}
							placeholder="Confirme a senha"
							error={errors.confirmPassword}
							required={!editingUser || !!formData.password}
						/>
					</div>
				</div>
			</div>

			{/* Basic Permissions */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h3 className="text-lg font-medium text-gray-900 mb-6">
					Configuração de Permissões
				</h3>

				<PermissionsEditor
					permissions={permissions}
					onChange={handlePermissionsChange}
					userType={formData.userType}
					disabled={loading}
				/>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-end space-x-3">
				<Button
					type="button"
					variant="secondary"
					onClick={handleCancel}
					disabled={loading}
				>
					{editingUser ? 'Cancelar' : 'Limpar'}
				</Button>
				<Button
					type="submit"
					variant="primary"
					loading={loading}
					disabled={loading}
				>
					{editingUser ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
				</Button>
			</div>
		</form>
	);
};

export default UserForm;
