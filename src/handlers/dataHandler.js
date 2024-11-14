export async function storeDeviceData(payload) {
	try {
		console.log('Received payload');

		const deviceName = encodeURIComponent(payload.deviceInfo.deviceName);

		const dataObject = payload.object;

		const timestamp = Date.now();
		const date = new Date(timestamp).toISOString().split('T')[0];
		const recordKey = `${deviceName}:${date}`;

		let dailyData = await CHIRPSTACK_KV.get(recordKey);

		dailyData = dailyData ? JSON.parse(dailyData) : [];

		dailyData.push({
			timestamp,
			data: dataObject,
		});

		await CHIRPSTACK_KV.put(recordKey, JSON.stringify(dailyData));

		let dateIndex = await CHIRPSTACK_KV.get(`${deviceName}:index`);

		dateIndex = dateIndex ? JSON.parse(dateIndex) : [];

		if (!dateIndex.includes(date)) {
			dateIndex.push(date);
			await CHIRPSTACK_KV.put(`${deviceName}:index`, JSON.stringify(dateIndex));
		}

		return new Response('Data stored successfully', { status: 200 });
	} catch (error) {
		console.error('Error storing data:', error);
		return new Response('Failed to store data', { status: 500 });
	}
}
