export class TextTexture {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.status = '';
        this.temp = '';
        this.width = 0;
        this.height = 0;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        // Redraw immediately after resize
        this.draw();
    }

    update(status, temp, layout) {
        this.status = status;
        this.temp = temp;
        this.layout = layout;
        this.draw();
    }

    draw() {
        if (!this.width || !this.height) return;

        const { ctx, width, height } = this;
        // Use devicePixelRatio for drawing calculations if needed, though canvas is already scaled
        const dpr = window.devicePixelRatio || 1;

        // Clear background
        ctx.clearRect(0, 0, width, height);

        // Default fonts if layout not provided (fallback)
        let statusSize = Math.max(24, Math.floor(width * 0.12) + 16);
        let dataSize = Math.max(16, Math.floor(width * 0.06) + 8);
        let statusY = height * 0.35;
        let dataY = statusY + statusSize * 1.5;

        // Use precise layout from DOM if available
        if (this.layout) {
            // Convert client coordinates to canvas coordinates (which are scaled by DPR)
            // Canvas 0,0 is at top-left of viewport because it is fixed/absolute full size
            statusSize = parseFloat(this.layout.status.fontSize) * dpr;
            dataSize = parseFloat(this.layout.data.fontSize) * dpr;

            // Client rect top/left are relative to viewport. Canvas is also viewport relative.
            // We need center points.
            const sRect = this.layout.status.rect;
            const dRect = this.layout.data.rect;

            // Center Y of text
            statusY = (sRect.top + sRect.height / 2) * dpr;

            // For temperature, it's the center of the #data-container? 
            // Actually #data is inside #data-container. We measured #data.
            dataY = (dRect.top + dRect.height / 2) * dpr;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw Status ("Yes!", "Nope", etc.)
        ctx.font = `500 ${statusSize}px "Plus Jakarta Sans", sans-serif`;
        // Use the CSS variable set by colors.js
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        ctx.fillStyle = textColor || '#283f43';

        ctx.fillText(this.status, width / 2, statusY);

        // Draw Temperature ("51°F")
        if (this.temp) {
            ctx.font = `300 ${dataSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText(this.temp, width / 2, dataY);
        }
    }

    getCanvas() {
        return this.canvas;
    }
}
