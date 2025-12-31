export const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
    }
`;

export const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_intensity;
    varying vec2 v_texCoord;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vec2 uv = v_texCoord;
        
        // Organic heat haze effect
        // Use noise to create non-repeating, flowing distortion
        float noiseScale = 4.0;
        float timeScale = 0.75;
        
        // Primary wave
        float n1 = snoise(vec2(uv.x * noiseScale, uv.y * noiseScale * 0.5 - u_time * timeScale));
        
        // Secondary detail wave
        float n2 = snoise(vec2(uv.x * noiseScale * 2.0, uv.y * noiseScale * 2.0 - u_time * timeScale * 1.5));
        
        // Combine for distortion
        float distortionMulti = 0.005; // Global scaler
        float xStrength = 0.25;         // Lateral multiplier
        float yStrength = 1.0;         // Vertical multiplier

        float offsetX = (n1 + n2 * 0.5) * distortionMulti * xStrength * u_intensity;
        float offsetY = (n1 * 0.5 + n2) * distortionMulti * yStrength * u_intensity;
        
        // Apply distortion
        vec2 distortedUV = uv + vec2(offsetX, offsetY);
        
        // Sample texture with bilinear filtering (automatic in WebGL for TEXTURE_2D)
        gl_FragColor = texture2D(u_image, distortedUV);
    }
`;
