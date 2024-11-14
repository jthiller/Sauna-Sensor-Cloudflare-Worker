export async function handleIndexRequest(deviceName) {
	const indexKey = `${deviceName}:index`;
	const dateIndex = await CHIRPSTACK_KV.get(indexKey);

	if (dateIndex) {
		return new Response(dateIndex, {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} else {
		return new Response('No dates found for this device', { status: 404 });
	}
}
