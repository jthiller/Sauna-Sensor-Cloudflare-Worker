import './style.css';
import { fetchDataForDate, hasEnoughHoursOfData, extractRecentData } from './api.js';
import { setColors, getSaunaStatus } from './colors.js';
import { drawSparkline } from './sparkline.js';

// Application state
let isShowingTemperature = true;
let temperatureData = [];
let humidityData = [];
let mostRecentTemp = 0;
let mostRecentHumidity = 0;

// DOM elements
const statusElement = document.getElementById('status');
const dataElement = document.getElementById('data');
const loadingIndicator = document.getElementById('loading-indicator');

/**
 * Process raw sensor data and update the display
 * @param {Array} data - Array of sensor readings
 * @param {number} hours - Hours of data to display
 */
function processData(data, hours) {
    if (data.length === 0) return;

    const recentData = extractRecentData(data, hours);

    temperatureData = recentData
        .filter((entry) => entry.data?.TempC_SHT !== undefined)
        .map((entry) => entry.data.TempC_SHT);

    humidityData = recentData
        .filter((entry) => entry.data?.Hum_SHT !== undefined)
        .map((entry) => entry.data.Hum_SHT);

    if (temperatureData.length === 0) return;

    // Convert Celsius to Fahrenheit
    mostRecentTemp = Math.round(
        (temperatureData[temperatureData.length - 1] * 9) / 5 + 32
    );
    mostRecentHumidity = Math.round(humidityData[humidityData.length - 1]);

    // Update display
    dataElement.textContent = `${mostRecentTemp}°F`;
    statusElement.textContent = getSaunaStatus(mostRecentTemp);
    statusElement.style.visibility = 'visible';

    // Update colors based on temperature
    const colorTemp = Math.max(80, Math.min(135, mostRecentTemp));
    setColors(colorTemp);

    // Draw sparkline
    drawSparkline(temperatureData);
}

/**
 * Fetch sensor data from the API
 */
async function fetchData() {
    loadingIndicator.style.display = 'block';

    try {
        const currentDate = new Date().toISOString().slice(0, 10);
        let data = await fetchDataForDate(currentDate);

        // If less than 3 hours of data, fetch previous day too
        if (!data || !hasEnoughHoursOfData(data, 3)) {
            const previousDate = new Date();
            previousDate.setDate(previousDate.getDate() - 1);
            const previousDateString = previousDate.toISOString().slice(0, 10);
            const previousData = await fetchDataForDate(previousDateString);
            data = [...previousData, ...data];
        }

        processData(data, 3);
        loadingIndicator.style.display = 'none';
        dataElement.classList.remove('error');
    } catch (error) {
        console.error('Error fetching data:', error);
        dataElement.textContent = 'Error fetching data';
        dataElement.classList.add('error');
        loadingIndicator.style.display = 'none';
    }
}

/**
 * Toggle between temperature and humidity display
 */
function toggleData() {
    isShowingTemperature = !isShowingTemperature;

    if (isShowingTemperature) {
        statusElement.classList.remove('isNotShowingTemp');
        dataElement.textContent = `${mostRecentTemp}°F`;
        drawSparkline(temperatureData);
    } else {
        statusElement.classList.add('isNotShowingTemp');
        dataElement.textContent = `${mostRecentHumidity}%`;
        drawSparkline(humidityData);
    }
}

/**
 * Start the data fetching loop
 */
function startFetching() {
    fetchData();
    setInterval(fetchData, 300000); // Fetch every 5 minutes
}

// Event listeners
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        fetchData();
    }
});

dataElement.addEventListener('click', toggleData);

// Start the app
startFetching();
