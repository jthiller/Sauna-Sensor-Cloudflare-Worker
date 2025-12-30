/**
 * Interpolate between two RGB colors
 * @param {number[]} color1 - RGB array [r, g, b]
 * @param {number[]} color2 - RGB array [r, g, b]
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {string} CSS rgb() string
 */
export function interpolateColor(color1, color2, factor) {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
    }
    return `rgb(${result.join(',')})`;
}

// Color palette definitions
const MIN_COLORS = {
    text: [40, 63, 67],
    stroke: [162, 198, 204],
    background: [239, 249, 250],
};

const MAX_COLORS = {
    text: [70, 39, 19],
    stroke: [253, 221, 193],
    background: [249, 243, 238],
};

const MIN_TEMP = 80;
const MAX_TEMP = 135;

/**
 * Set CSS custom properties based on temperature
 * @param {number} temperature - Temperature in Fahrenheit
 */
export function setColors(temperature) {
    const clampedTemp = Math.max(MIN_TEMP, Math.min(MAX_TEMP, temperature));
    const factor = (clampedTemp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP);

    const textColor = interpolateColor(MIN_COLORS.text, MAX_COLORS.text, factor);
    const strokeColor = interpolateColor(MIN_COLORS.stroke, MAX_COLORS.stroke, factor);
    const backgroundColor = interpolateColor(MIN_COLORS.background, MAX_COLORS.background, factor);

    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--stroke-color', strokeColor);
    document.documentElement.style.setProperty('--background-color', backgroundColor);
}

/**
 * Get the sauna status message based on temperature
 * @param {number} temperature - Temperature in Fahrenheit
 * @returns {string} Status message
 */
export function getSaunaStatus(temperature) {
    if (temperature < 80) {
        return 'Nope';
    } else if (temperature < 135) {
        return 'Getting There';
    } else {
        return 'Yes!';
    }
}
