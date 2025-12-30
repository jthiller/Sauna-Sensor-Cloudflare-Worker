const API_BASE = 'https://jolly-hall-8315.fbkfp5vygk.workers.dev';

/**
 * Fetch sensor data for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of sensor readings
 */
export async function fetchDataForDate(date) {
    const deviceName = 'LHT65 Temperature Sensor';
    const response = await fetch(
        `${API_BASE}/${encodeURIComponent(deviceName)}?date=${date}`
    );
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

/**
 * Check if data spans at least the specified number of hours
 * @param {Array} data - Array of sensor readings
 * @param {number} hours - Minimum hours of data required
 * @returns {boolean}
 */
export function hasEnoughHoursOfData(data, hours) {
    if (data.length === 0) return false;

    const firstTimestamp = new Date(data[0].timestamp).getTime();
    const lastTimestamp = new Date(data[data.length - 1].timestamp).getTime();
    const hoursInMillis = hours * 60 * 60 * 1000;

    return lastTimestamp - firstTimestamp >= hoursInMillis;
}

/**
 * Extract recent data points within the specified time window
 * @param {Array} data - Array of sensor readings
 * @param {number} hours - Hours of data to extract
 * @returns {Array} Filtered array of recent readings
 */
export function extractRecentData(data, hours) {
    if (data.length === 0) return [];

    const recentData = [];
    const hoursInMillis = hours * 60 * 60 * 1000;
    const now = new Date().getTime();

    for (let i = data.length - 1; i >= 0; i--) {
        const timestamp = new Date(data[i].timestamp).getTime();
        if (now - timestamp <= hoursInMillis) {
            recentData.unshift(data[i]);
        } else {
            break;
        }
    }

    return recentData;
}
