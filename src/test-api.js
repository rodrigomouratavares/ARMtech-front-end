// Simple test to check API connectivity
async function testAPI() {
	try {
		console.log('Testing API connectivity...');

		const response = await fetch(
			'https://flow-crm-backend-58ub.onrender.com/api/auth/login',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: 'admin@flowcrm.com',
					password: 'admin123',
				}),
			},
		);

		console.log('Response status:', response.status);
		console.log('Response headers:', [...response.headers.entries()]);

		const data = await response.json();
		console.log('Response data:', data);
	} catch (error) {
		console.error('API Test Error:', error);
	}
}

// Run test
testAPI();
