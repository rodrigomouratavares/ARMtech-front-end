import type React from 'react';
import { useState } from 'react';
import type { User } from '../../../types';
import UserForm from './UserForm';
import UsersList from './UsersList';

type TabType = 'list' | 'register';

const UsersPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabType>('list');
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		if (tab === 'list') {
			setEditingUser(null);
		}
	};

	const handleEditUser = (user: User) => {
		setEditingUser(user);
		setActiveTab('register');
	};

	const handleUserSaved = () => {
		setActiveTab('list');
		setEditingUser(null);
		setRefreshKey((prev) => prev + 1); // Force refresh of UsersList
	};

	const renderTabContent = () => {
		if (activeTab === 'list') {
			return <UsersList key={refreshKey} onEditUser={handleEditUser} />;
		}

		// Register tab content
		return (
			<UserForm
				editingUser={editingUser}
				onUserSaved={handleUserSaved}
				onCancel={() => {
					setActiveTab('list');
					setEditingUser(null);
				}}
			/>
		);
	};

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">Usuários</h1>

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
							{editingUser ? 'Editar' : 'Cadastro'}
						</button>
					</nav>
				</div>
			</div>

			{/* Tab Content */}
			<div className="mt-6">{renderTabContent()}</div>
		</div>
	);
};

export default UsersPage;
