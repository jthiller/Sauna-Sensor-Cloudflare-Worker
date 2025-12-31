import './style.css';
import { fetchDataForDate, hasEnoughHoursOfData, extractRecentData } from './api.js';
import { setColors, getSaunaStatus, TEMP_MIN, TEMP_MAX } from './colors.js';
import { drawSparkline } from './sparkline.js';
import { WebGLRenderer } from './renderer.js';

// Initialize WebGL renderer
const renderer = new WebGLRenderer();

// Fetch interval constant (5 minutes in milliseconds)
const FETCH_INTERVAL_MS = 5 * 60 * 1000;

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
 * Calculate if temperature is trending downward
 * Uses average of recent readings vs older readings to smooth out noise
 * @param {number[]} tempData - Array of temperature values (Celsius)
 * @returns {boolean} True if temperature is cooling down
 */
function isCoolingDown(tempData) {
    if (tempData.length < 6) return false; // Need enough data points

    // Compare average of last 3 readings to average of 3 readings before that
    const recentAvg = (tempData[tempData.length - 1] + tempData[tempData.length - 2] + tempData[tempData.length - 3]) / 3;
    const olderAvg = (tempData[tempData.length - 4] + tempData[tempData.length - 5] + tempData[tempData.length - 6]) / 3;

    // Consider cooling if dropped by more than 0.5°C (roughly 1°F)
    return recentAvg < olderAvg - 0.5;
}

/**
 * Process raw sensor data and update the display
 * @param {Array} data - Array of sensor readings
 * @param {number} hours - Hours of data to display
 * @param {boolean} usePeak - Whether to focus on peak temperature
 */
function processData(data, hours, usePeak = false) {
    if (data.length === 0) return;

    const recentData = extractRecentData(data, hours, usePeak);

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

    // Determine if cooling down
    const cooling = isCoolingDown(temperatureData);

    // Update display variables (keep text elements updated but hidden)
    dataElement.textContent = `${mostRecentTemp}°F`;
    const statusText = getSaunaStatus(mostRecentTemp, cooling);
    statusElement.textContent = statusText;

    // Hide original elements, show WebGL
    statusElement.style.visibility = 'hidden';
    dataElement.style.visibility = 'hidden';
    statusElement.style.display = 'none'; // Or just hide completely
    dataElement.style.display = 'none';

    // Update WebGL Renderer
    renderer.setText(statusText, `${mostRecentTemp}°F`);

    // Update colors based on temperature
    const colorTemp = Math.max(TEMP_MIN, Math.min(TEMP_MAX, mostRecentTemp));
    setColors(colorTemp);

    // Draw sparkline
    drawSparkline(temperatureData);
}

/**
 * Fetch sensor data from the API
 */
/**
 * Fetch sensor data from the API
 */
async function fetchData() {
    loadingIndicator.style.display = 'block';

    // Check for ?date=YYYY-MM-DD query param
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    let data = [];

    try {
        if (dateParam) {
            console.log(`Fetching specific date: ${dateParam}`);
            data = await fetchDataForDate(dateParam);
        } else {
            const currentDate = new Date().toISOString().slice(0, 10);
            data = await fetchDataForDate(currentDate);

            // If less than 3 hours of data, fetch previous day too
            if (!data || !hasEnoughHoursOfData(data, 3)) {
                const previousDate = new Date();
                previousDate.setDate(previousDate.getDate() - 1);
                const previousDateString = previousDate.toISOString().slice(0, 10);
                const previousData = await fetchDataForDate(previousDateString);
                data = [...(previousData || []), ...(data || [])];
            }
        }

        const usePeak = !!dateParam;
        processData(data, 3, usePeak);

        loadingIndicator.style.display = 'none';
        dataElement.classList.remove('error');
    } catch (error) {
        console.error('Error fetching data:', error);

        // Error handling in WebGL
        renderer.setText("Error", "No Data");

        loadingIndicator.style.display = 'none';
        return;
    }
}

/**
 * Toggle between temperature and humidity display
 */
function toggleData() {
    isShowingTemperature = !isShowingTemperature;

    if (isShowingTemperature) {
        statusElement.classList.remove('isNotShowingTemp');
        // Update WebGL
        const cooling = isCoolingDown(temperatureData);
        renderer.setText(getSaunaStatus(mostRecentTemp, cooling), `${mostRecentTemp}°F`);

        drawSparkline(temperatureData);
    } else {
        statusElement.classList.add('isNotShowingTemp');
        // Update WebGL for Humidity
        // Keep the sauna status ("Yes!", "Nope", etc) even when showing humidity
        const cooling = isCoolingDown(temperatureData);
        renderer.setText(getSaunaStatus(mostRecentTemp, cooling), `${mostRecentHumidity}%`);

        drawSparkline(humidityData);
    }
}

/**
 * Start the data fetching loop
 */
function startFetching() {
    fetchData();
    setInterval(fetchData, FETCH_INTERVAL_MS); // Fetch every 5 minutes
}

// Event listeners
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        fetchData();
    }
});

// Attach click listener to the entire body to ensure easy toggling
document.body.addEventListener('click', toggleData);

// Start the app
startFetching();
