/* ============================================
   WebGL hero mesh (OGL) — loaded as ES module
   ============================================
   A fullscreen plane in the hero with a fragment shader that renders
   soft, slowly-moving color blobs. Uses OGL (a ~25KB WebGL library)
   instead of full Three.js to keep the page light. Disabled on
   prefers-reduced-motion and on small viewports for performance.

   This file is loaded as a separate ES module so it can import OGL
   from a CDN via the importmap declared in index.html.
*/

import { Renderer, Camera, Transform, Plane, Program, Mesh } from "ogl";

// Shared state with script.js so prefersReducedMotion is consistent.
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function enableHeroWebGLMesh() {
    if (prefersReducedMotion) return;                // Respect user preference

    const host = document.querySelector(".hero__mesh");
    if (!host) return;

    // Skip on small screens or low-power devices for battery / perf reasons.
    const isSmall = window.matchMedia("(max-width: 720px)").matches;
    const isLowPower = navigator.deviceMemory && navigator.deviceMemory < 4;
    if (isSmall || isLowPower) return;

    const renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: true,
        antialias: false,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const canvas = gl.canvas;
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    host.classList.add("has-webgl");

    const camera = new Camera(gl, { fov: 45 });
    camera.position.z = 5;

    const scene = new Transform();
    const geometry = new Plane(gl, { width: 4, height: 4, widthSegments: 1, heightSegments: 1 });

    // Fragment shader: layered smooth blobs that drift slowly over time.
    // Colors match the site palette (magenta + stone + paper highlights).
    const fragment = /* glsl */ `
        precision highp float;

        uniform float uTime;
        uniform vec2  uResolution;
        uniform vec3  uColorA;   // magenta
        uniform vec3  uColorB;   // stone / muted accent
        uniform vec3  uColorC;   // subtle paper highlight

        // Smooth blob: distance from a moving point, softened with smoothstep.
        float blob(vec2 p, vec2 center, float radius) {
            float d = length(p - center);
            return smoothstep(radius, 0.0, d);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution.xy;
            // Center the coordinate space around 0, scaled by aspect.
            vec2 p = uv - 0.5;
            p.x *= uResolution.x / uResolution.y;

            float t = uTime * 0.12;

            // Three drifting blobs in different directions at different speeds.
            vec2 c1 = vec2(sin(t) * 0.55,         cos(t * 0.9) * 0.40);
            vec2 c2 = vec2(cos(t * 0.7 + 1.3) * 0.50, sin(t * 1.1 + 0.5) * 0.55);
            vec2 c3 = vec2(sin(t * 0.5 + 2.4) * 0.60, cos(t * 0.8 + 1.7) * 0.45);

            float b1 = blob(p, c1, 0.85);
            float b2 = blob(p, c2, 0.95);
            float b3 = blob(p, c3, 0.70);

            // Mix the colors by blob intensity.
            vec3 color = uColorC * 0.04;             // very subtle base wash
            color = mix(color, uColorA, b1 * 0.55); // magenta blob
            color = mix(color, uColorB, b2 * 0.40); // stone blob
            color = mix(color, uColorC, b3 * 0.18); // soft highlight

            // Soft vignette so edges fade into the hero's dark background.
            float vignette = smoothstep(1.1, 0.35, length(p));
            color *= mix(0.55, 1.0, vignette);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const vertex = /* glsl */ `
        attribute vec3 position;
        attribute vec2 uv;
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;

    // Site-palette colors (matched to CSS variables)
    const colorA = [0.776, 0.212, 0.443]; // magenta #C63671
    const colorB = [0.776, 0.745, 0.663]; // stone   #C6BEA9
    const colorC = [0.969, 0.953, 0.922]; // paper   #f7f3eb

    const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
            uTime:       { value: 0 },
            uResolution: { value: [window.innerWidth, window.innerHeight] },
            uColorA:     { value: colorA },
            uColorB:     { value: colorB },
            uColorC:     { value: colorC },
        },
        transparent: false,
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    // Resize handling
    function resize() {
        const rect = host.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height);
        program.uniforms.uResolution.value = [
            rect.width * renderer.dpr,
            rect.height * renderer.dpr,
        ];
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    // Animation loop — drive from requestAnimationFrame so it stops when tab hidden
    let rafId = 0;
    let running = true;
    const start = performance.now();

    function tick(now) {
        if (!running) return;
        program.uniforms.uTime.value = (now - start) / 1000;
        renderer.render({ scene, camera });
        rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    // Pause when tab is hidden (battery friendly)
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            running = false;
            cancelAnimationFrame(rafId);
        } else if (!running) {
            running = true;
            rafId = requestAnimationFrame(tick);
        }
    });
}

// Wait for DOM ready then boot
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enableHeroWebGLMesh, { once: true });
} else {
    enableHeroWebGLMesh();
}