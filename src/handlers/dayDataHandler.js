export async function handleDayDataRequest(deviceName, date) {
	const recordKey = `${deviceName}:${date}`;
	const data = await CHIRPSTACK_KV.get(recordKey);

	if (data) {
		return new Response(data, {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} else {
		return new Response('No data found for this date', { status: 404 });
	}
}
