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

export function extractRecentData(data, hours = 3, isHistorical = false) {
    if (!data || data.length === 0) return [];

    // Sort by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    // For historical dates, show all data for the day
    if (isHistorical) {
        return sortedData;
    }

    // For live viewing, use a time window ending at the most recent data point
    const referenceTime = sortedData[sortedData.length - 1].timestamp;
    const hoursInMillis = hours * 60 * 60 * 1000;
    const cutoff = referenceTime - hoursInMillis;

    return sortedData.filter(d => d.timestamp > cutoff && d.timestamp <= referenceTime);
}
