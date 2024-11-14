import { sendDownlink } from './downlinkHandler';
import { isDay } from './dayNightHandler';

let daytime = false;

function interpolateColor(minColor, maxColor, temperature, minTemp, maxTemp) {
	const result = minColor.slice();
	for (let i = 0; i < 3; i++) {
		result[i] = Math.round(minColor[i] + ((temperature - minTemp) * (maxColor[i] - minColor[i])) / (maxTemp - minTemp));
	}
	return result;
}

function setColors(temperature) {
	const minTemp = 26; // ~78.8F
	const maxTemp = 57; // ~134.6F

	const minColor = daytime ? [0, 3, 30] : [0, 1, 5]; //if night make darker
	const maxColor = [255, 70, 0]; // Orange

	if (temperature <= minTemp) {
		return minColor;
	} else if (temperature >= maxTemp) {
		return maxColor;
	} else {
		return interpolateColor(minColor, maxColor, temperature, minTemp, maxTemp);
	}
}

export async function handleTemperaturePayload(request) {
	try {
		const gatewayInfo = request.rxInfo[0];
		const lat = parseFloat(gatewayInfo.metadata.gateway_lat);
		const lon = parseFloat(gatewayInfo.metadata.gateway_long);

		daytime = isDay(lat, lon);

		const payloadObject = request.object;

		if (!payloadObject) {
			return new Response('Object property not found in the request for light update', { status: 400 });
		}

		const temperature = payloadObject.TempC_SHT;

		if (typeof temperature === 'number') {
			const rgbColor = setColors(temperature);

			const [red, green, blue] = rgbColor;
			const downlinkResponse = await sendDownlink(red, green, blue);

			return downlinkResponse;
		} else {
			return new Response('TempC_SHT not found or not a number in the payload for light update', { status: 400 });
		}
	} catch (error) {
		return new Response('Failed to process temperature payload for light update', { status: 500 });
	}
}
