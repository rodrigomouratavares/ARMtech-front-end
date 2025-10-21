import Dashboard from './components/features/dashboard';
import Layout from './components/layout/Layout';
import { mockUser } from './data/mockUser';

function App() {
	return (
		<Layout title="Dashboard" user={mockUser}>
			<Dashboard />
		</Layout>
	);
}

export default App;
