// Vercel serverless function to proxy all API requests
export default async function handler(req, res) {
	try {
		// Extract the API path from query parameters
		const { path } = req.query;

		if (!path) {
			return res.status(400).json({ error: 'API path is required' });
		}

		// Construct the backend URL
		const backendUrl = `https://flow-crm-backend-58ub.onrender.com/api/${Array.isArray(path) ? path.join('/') : path}`;

		// Forward query parameters
		const url = new URL(backendUrl);
		Object.keys(req.query).forEach((key) => {
			if (key !== 'path') {
				url.searchParams.append(key, req.query[key]);
			}
		});

		console.log(`Proxy: ${req.method} ${url.toString()}`);

		// Prepare headers
		const headers = {
			'Content-Type': 'application/json',
		};

		// Add Authorization header if present
		if (req.headers.authorization) {
			headers.Authorization = req.headers.authorization;
		}

		// Make the request to backend
		const fetchOptions = {
			method: req.method,
			headers,
		};

		// Add body for POST, PUT, PATCH requests
		if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
			fetchOptions.body = JSON.stringify(req.body);
		}

		const response = await fetch(url.toString(), fetchOptions);

		console.log(`Proxy: Backend response ${response.status}`);

		// Set CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader(
			'Access-Control-Allow-Methods',
			'GET, POST, PUT, DELETE, PATCH, OPTIONS',
		);
		res.setHeader(
			'Access-Control-Allow-Headers',
			'Content-Type, Authorization',
		);

		// Handle OPTIONS request
		if (req.method === 'OPTIONS') {
			return res.status(200).end();
		}

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Proxy: Backend error ${response.status}:`, errorText);
			return res.status(response.status).json({
				error: errorText || 'Backend error',
				status: response.status,
			});
		}

		const data = await response.json();
		return res.status(response.status).json(data);
	} catch (error) {
		console.error('Proxy: Error:', error);
		return res.status(500).json({
			error: 'Internal server error',
			message: error.message,
		});
	}
}
