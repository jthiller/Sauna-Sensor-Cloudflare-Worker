export function isDay(latitude, longitude) {
	console.log(`DT: Calculating day status for latitude: ${latitude}, longitude: ${longitude}`);

	const now = new Date();
	console.log(`DT: Current date and time: ${now}`);

	// Get day of the year
	const dayOfYear = getDayOfYear(now);
	console.log(`DT: Day of the year: ${dayOfYear}`);

	// Calculate solar declination
	const declination = getSolarDeclination(dayOfYear);
	console.log(`DT: Solar declination: ${declination}`);

	// Calculate solar noon in local time
	const solarNoonUTC = getSolarNoon(longitude);
	console.log(`DT: Solar noon (UTC): ${solarNoonUTC}`);

	// Calculate solar hour angle
	const solarHourAngle = getSolarHourAngle(latitude, declination);
	console.log(`DT: Solar hour angle: ${solarHourAngle}`);

	// Calculate sunrise and sunset times in UTC
	const sunriseTimeUTC = solarNoonUTC - solarHourAngle / 15;
	const sunsetTimeUTC = solarNoonUTC + solarHourAngle / 15;
	console.log(`DT: Sunrise time (UTC): ${sunriseTimeUTC}`);
	console.log(`DT: Sunset time (UTC): ${sunsetTimeUTC}`);

	// Convert UTC times to local time
	const sunriseTime = utcToLocalTime(now, sunriseTimeUTC);
	const sunsetTime = utcToLocalTime(now, sunsetTimeUTC);
	console.log(`DT: Sunrise time (local): ${sunriseTime}`);
	console.log(`DT: Sunset time (local): ${sunsetTime}`);

	// Check if the current time is between sunrise and sunset
	const isDaytime = now >= sunriseTime && now <= sunsetTime;
	console.log(`DT: Is it day? ${isDaytime}`);

	return isDaytime;
}

function getDayOfYear(date) {
	const start = new Date(date.getFullYear(), 0, 0);
	const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
	const oneDay = 1000 * 60 * 60 * 24;
	return Math.floor(diff / oneDay);
}

function getSolarDeclination(dayOfYear) {
	// Approximate solar declination angle in degrees
	return 23.45 * Math.sin((360 / 365.25) * (dayOfYear - 81) * (Math.PI / 180));
}

function getSolarNoon(longitude) {
	// Solar noon in UTC, including adjustment for longitude (in hours)
	return 12 - longitude / 15;
}

function getSolarHourAngle(latitude, declination) {
	// Calculate hour angle at sunrise/sunset (in degrees)
	const latitudeRad = latitude * (Math.PI / 180);
	const declinationRad = declination * (Math.PI / 180);
	const cosH = -Math.tan(latitudeRad) * Math.tan(declinationRad);

	// Ensure the value is within valid range to avoid NaN from acos
	if (cosH < -1) {
		return 180; // Polar day - sun never sets
	} else if (cosH > 1) {
		return 0; // Polar night - sun never rises
	} else {
		return Math.acos(cosH) * (180 / Math.PI); // Convert from radians to degrees
	}
}

function utcToLocalTime(date, timeInHours) {
	const localTime = new Date(date);
	localTime.setUTCHours(0, 0, 0, 0); // Start at midnight in UTC
	localTime.setUTCHours(Math.floor(timeInHours));
	localTime.setUTCMinutes(Math.floor((timeInHours % 1) * 60));
	return localTime;
}
