import { vertexShaderSource, fragmentShaderSource } from './shaders.js';
import { TextTexture } from './text-texture.js';

export class WebGLRenderer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'mirage-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Click-through
        this.canvas.style.zIndex = '2'; // Above content, below or same level as interaction

        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false
        });

        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        this.textTexture = new TextTexture();
        this.program = null;
        this.positionAttributeLocation = null;
        this.texCoordAttributeLocation = null;
        this.timeUniformLocation = null;
        this.textureLocation = null;
        this.startTime = Date.now();

        this.init();

        // Defer append and resize to ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.mount());
        } else {
            this.mount();
        }
    }

    mount() {
        const content = document.getElementById('content');
        if (content) {
            content.appendChild(this.canvas);

            // Use ResizeObserver for robust sizing
            const resizeObserver = new ResizeObserver(() => this.resize());
            resizeObserver.observe(this.canvas);
            resizeObserver.observe(content);

            // Initial resize and start animation
            this.resize();
            this.animate();
        }
    }

    init() {
        const gl = this.gl;

        // Create shaders
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create program
        this.program = this.createProgram(gl, vertexShader, fragmentShader);

        // Look up locations
        this.positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        this.texCoordAttributeLocation = gl.getAttribLocation(this.program, "a_texCoord");
        this.timeUniformLocation = gl.getUniformLocation(this.program, "u_time");
        this.intensityUniformLocation = gl.getUniformLocation(this.program, "u_intensity");
        this.textureLocation = gl.getUniformLocation(this.program, "u_image");

        // Buffer setup
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        // Fullscreen quad clip space
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]), gl.STATIC_DRAW);

        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        // Texture coords 0.0 to 1.0
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            1.0, 0.0,
        ]), gl.STATIC_DRAW);

        // Create texture
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    resize() {
        // Use devicePixelRatio for high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(this.canvas.clientWidth * dpr);
        const displayHeight = Math.floor(this.canvas.clientHeight * dpr);

        // Check if the canvas is not the same size.
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            // Make the canvas the same size
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;

            // Adjust WebGL viewport to match canvas buffer size
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

            // Re-render text texture at new resolution
            // TextTexture will now be initialized with larger dimensions on retina screens
            this.textTexture.resize(displayWidth, displayHeight);
        }
    }

    setText(status, temp) {
        this.textTexture.update(status, temp);
    }

    animate() {
        const gl = this.gl;
        const time = (Date.now() - this.startTime) * 0.001; // Seconds

        // Clear
        gl.clearColor(0, 0, 0, 0); // Transparent
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);

        // Bind position
        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        // Bind texcoord
        gl.enableVertexAttribArray(this.texCoordAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        // Upload current text canvas to texture
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // texImage2D can take a canvas directly
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textTexture.getCanvas());

        // Set uniforms
        gl.uniform1f(this.timeUniformLocation, time);
        gl.uniform1i(this.textureLocation, 0);

        // Determine intensity based on status text
        // Only distort when status is "Yes!"
        const isYes = this.textTexture.status === "Yes!";
        const intensity = isYes ? 1.0 : 0.0;
        gl.uniform1f(this.intensityUniformLocation, intensity);

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(() => this.animate());
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }
}
