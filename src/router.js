import { handleIndexRequest } from './handlers/indexHandler';
import { handleDayDataRequest } from './handlers/dayDataHandler';
import { storeDeviceData } from './handlers/dataHandler';
import { sendDownlink } from './handlers/downlinkHandler';
import { handleTemperaturePayload } from './handlers/temperatureHandler';

export async function handleRequest(request) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const method = request.method;

	if (method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	} else if ((method === 'POST' || method === 'GET') && pathname.endsWith('/busylight')) {
		const red = url.searchParams.get('red');
		const green = url.searchParams.get('green');
		const blue = url.searchParams.get('blue');
		return handleCors(sendDownlink(red, green, blue));
	} else if (method === 'POST') {
		const payload = await request.json();
		// Handle both temperature payload processing and data storage concurrently
		const temperaturePromise = handleTemperaturePayload(payload);
		const storeDataPromise = storeDeviceData(payload);

		// Wait for both processes to complete
		const [temperatureResponse, storeDataResponse] = await Promise.all([temperaturePromise, storeDataPromise]);

		// If both succeeded, return the last response, otherwise handle the error
		if (temperatureResponse.ok && storeDataResponse.ok) {
			return handleCors(new Response('Data processed and downlink sent', { status: 200 }));
		} else if (!temperatureResponse.ok) {
			return handleCors(temperatureResponse);
		} else {
			return handleCors(storeDataResponse);
		}
	} else if (method === 'GET' && pathname.endsWith('/index')) {
		const deviceName = pathname.split('/').slice(-2)[0];
		return handleCors(handleIndexRequest(deviceName));
	} else if (method === 'GET' && url.searchParams.get('date')) {
		const deviceName = pathname.split('/').pop();
		const date = url.searchParams.get('date');
		return handleCors(handleDayDataRequest(deviceName, date));
	} else {
		return handleCors(new Response('Not found', { status: 404 }));
	}
}

async function handleCors(responsePromise) {
	const response = await responsePromise;

	const newHeaders = new Headers(response.headers);
	newHeaders.set('Access-Control-Allow-Origin', '*');
	newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

	return new Response(response.body, {
		...response,
		headers: newHeaders,
	});
}
