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

    update(status, temp) {
        this.status = status;
        this.temp = temp;
        this.draw();
    }

    draw() {
        if (!this.width || !this.height) return;

        const { ctx, width, height } = this;

        // Clear background
        ctx.clearRect(0, 0, width, height);

        // We want to match the CSS variables:
        // --text-color: #283f43
        // --subtext-color: rgba(0, 0, 0, 0.5)

        // Get fonts/styles matching the original DOM
        // Since width/height are now potentially scaled by DPR, we should ensure the math scales up too.
        // The original logic relied on CSS-like width which is fine if width is CSS width, but here width is buffer width.
        // So this math actually works automatically because 'width' is larger on retina!

        // However, we need to ensure we don't scale relatively too small or large. 
        // 0.12 * width is relative to BUFFER width.
        const statusSize = Math.max(24, Math.floor(width * 0.12) + 16);
        const dataSize = Math.max(16, Math.floor(width * 0.06) + 8);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw Status ("Yes!", "Nope", etc.)
        ctx.font = `500 ${statusSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = '#283f43';

        // Position similar to original DOM layout
        // Position similar to original DOM layout
        // Original layout had padding-bottom: 30vh on #data-container
        // Effectively shifting the visual center up by ~15% of the viewport height
        const centerY = height * 0.35; // 50% - 15% = 35%
        const statusY = centerY - (statusSize * 0.6);
        ctx.fillText(this.status, width / 2, statusY);

        // Draw Temperature ("51°F")
        if (this.temp) {
            ctx.font = `300 ${dataSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            const tempY = centerY + (dataSize * 0.8);
            ctx.fillText(this.temp, width / 2, tempY);
        }
    }

    getCanvas() {
        return this.canvas;
    }
}
