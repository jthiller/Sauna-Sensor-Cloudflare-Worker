export async function sendDownlink(red, green, blue) {
	const deviceId = CHIRPSTACK_BUSYLIGHT_DEVICE_ID;
	const authorizationHeader = 'Bearer ' + CHIRPSTACK_API;

	try {
		// Prepare the downlink data (convert RGB values to a 5-byte array)
		const hexData = [
			parseInt(red, 10),
			parseInt(blue, 10),
			parseInt(green, 10),
			255, // On duration (0..255) (value is 1/10 seconds)
			0, // Off duration (0..255) (value is 1/10 seconds). When set to 0 the mode is always steady light.
		];
		console.log('Hex data:', hexData);
		const data = btoa(String.fromCharCode(...hexData));
		console.log('Prepared downlink data:', data);

		// Send the downlink message
		console.log('Sending downlink...');
		const downlinkPayload = {
			queueItem: {
				confirmed: true,
				data: data,
				fPort: 15,
				flushQueue: true,
			},
		};
		console.log('Downlink payload:', JSON.stringify(downlinkPayload, null, 2));

		// Retrieve the last sent payload from KV
		const lastPayloadResponse = await CHIRPSTACK_KV.get(deviceId);
		const lastPayload = lastPayloadResponse ? JSON.parse(lastPayloadResponse) : null;
		const currentTime = new Date().getTime();
		const lastSentTime = lastPayload ? lastPayload.timestamp : 0;
		const timeDifference = currentTime - lastSentTime;

		if (lastPayload && JSON.stringify(lastPayload.data) === JSON.stringify(downlinkPayload) && timeDifference < 24 * 60 * 60 * 1000) {
			console.log('Downlink payload is the same as the last sent payload and sent within 24 hours. No need to send again.');
			return new Response(
				JSON.stringify({
					message: 'Downlink not sent. Payload identical to last sent within 24 hours.',
					red: parseInt(red),
					green: parseInt(green),
					blue: parseInt(blue),
					encodedPayload: data,
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}

		const downlinkResponse = await fetch(`https://console.meteoscientific.com/api/devices/${deviceId}/queue`, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'Grpc-Metadata-Authorization': authorizationHeader,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(downlinkPayload),
		});

		if (!downlinkResponse.ok) {
			throw new Error('Failed to send downlink');
		}

		console.log('Downlink sent successfully');

		// Store the new payload in KV with timestamp
		await CHIRPSTACK_KV.put(deviceId, JSON.stringify({ data: downlinkPayload, timestamp: currentTime }));

		// Return the RGB values and the encoded payload in the response
		return new Response(
			JSON.stringify({
				message: 'Downlink sent successfully',
				red: parseInt(red),
				green: parseInt(green),
				blue: parseInt(blue),
				encodedPayload: data,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		console.error('Error sending downlink:', error);
		return new Response(
			JSON.stringify({
				message: 'Failed to send downlink',
				error: error.message,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
}
