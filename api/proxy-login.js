// Vercel serverless function to proxy login requests
export default async function handler(req, res) {
	// Only allow POST requests
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		console.log('Proxy: Received login request');

		// Forward the request to the backend
		const backendUrl =
			'https://flow-crm-backend-58ub.onrender.com/api/auth/login';

		const response = await fetch(backendUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		console.log('Proxy: Backend response status:', response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Proxy: Backend error:', errorText);
			return res.status(response.status).json({ error: errorText });
		}

		const data = await response.json();
		console.log('Proxy: Backend response received');

		// Set CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'POST');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		return res.status(200).json(data);
	} catch (error) {
		console.error('Proxy: Error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			message: error.message,
		});
	}
}
