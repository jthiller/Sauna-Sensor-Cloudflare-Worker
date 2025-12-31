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

export function extractRecentData(data, hours = 3, usePeak = false) {
    if (!data || data.length === 0) return [];

    // Sort by timestamp
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    let referenceTime;

    if (usePeak) {
        // Find the index of the max temp to center the view around the interesting part
        // We look for max TempC_SHT (which is in Celsius)
        let maxTemp = -Infinity;
        let maxIndex = sortedData.length - 1;

        for (let i = 0; i < sortedData.length; i++) {
            const val = sortedData[i].data?.TempC_SHT;
            // Check for valid number
            if (val !== undefined && typeof val === 'number' && val > maxTemp) {
                maxTemp = val;
                maxIndex = i;
            }
        }

        referenceTime = sortedData[maxIndex].timestamp;
    } else {
        // Default: end of dataset
        referenceTime = sortedData[sortedData.length - 1].timestamp;
    }

    const hoursInMillis = hours * 60 * 60 * 1000;

    // We want the window to END at the reference time (peak or latest)
    // so we see the climb UP to the peak.
    const cutoff = referenceTime - hoursInMillis;

    return sortedData.filter(d => d.timestamp > cutoff && d.timestamp <= referenceTime);
}
