/**
 * Calculate tangent vectors for smooth curve interpolation
 * @param {number[][]} points - Array of [x, y] coordinate pairs
 * @returns {number[][]} Array of tangent vectors
 */
function calculateTangents(points) {
    const tangents = [];
    for (let i = 0; i < points.length; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i + 1] || points[i];
        const tangent = [(p1[0] - p0[0]) / 2, (p1[1] - p0[1]) / 2];
        tangents.push(tangent);
    }
    return tangents;
}

/**
 * Draw a smooth sparkline chart
 * @param {number[]} data - Array of values to plot
 */
export function drawSparkline(data) {
    const svg = document.getElementById('sparkline');
    if (!svg || data.length === 0) return;

    const width = 600;
    const height = 40;
    const maxValue = 100;
    const minValue = 0;
    const padding = 0;
    const step = (width - 2 * padding) / (data.length - 1);

    svg.innerHTML = '';

    const points = data.map((value, index) => {
        const x = padding + index * step;
        const y =
            height -
            padding -
            ((value - minValue) * (height - 2 * padding)) / (maxValue - minValue);
        return [x, y];
    });

    const tangents = calculateTangents(points);
    let lineD = `M ${points[0][0]},${points[0][1]}`;
    let polygonD = `M ${points[0][0]},${points[0][1]}`;

    for (let i = 0; i < points.length - 1; i++) {
        const [p1, p2] = [points[i], points[i + 1]];
        const [t1, t2] = [tangents[i], tangents[i + 1]];
        const cp1 = [p1[0] + t1[0] / 3, p1[1] + t1[1] / 3];
        const cp2 = [p2[0] - t2[0] / 3, p2[1] - t2[1] / 3];
        lineD += ` C ${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${p2[0]},${p2[1]}`;
        polygonD += ` C ${cp1[0]},${cp1[1]} ${cp2[0]},${cp2[1]} ${p2[0]},${p2[1]}`;
    }

    polygonD += ` L ${points[points.length - 1][0]},${height} L ${points[0][0]},${height} Z`;

    // Draw filled area
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    polygon.setAttribute('fill', 'var(--stroke-color)');
    polygon.setAttribute('stroke', 'none');
    polygon.setAttribute('d', polygonD);
    svg.appendChild(polygon);

    // Draw line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'var(--text-color)');
    path.setAttribute('stroke-width', '6');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('d', lineD);
    svg.appendChild(path);
}
