import { useEffect, useRef } from "react";

const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FS = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_ptr;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for(int i = 0; i < 5; i++){
    v += a * noise(p);
    p *= 2.07;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = uv;
  p.x *= aspect;

  float t = u_time * 0.08;

  // pointer drift
  vec2 ptr = u_ptr * 0.5;
  ptr.x *= aspect;
  p += ptr * 0.03;

  // color palette
  vec3 deep    = vec3(0.020, 0.078, 0.043);
  vec3 forest  = vec3(0.040, 0.157, 0.075);
  vec3 mid     = vec3(0.071, 0.282, 0.137);
  vec3 lime    = vec3(0.784, 0.961, 0.259);
  vec3 cyan    = vec3(0.486, 0.969, 0.831);
  vec3 glow    = vec3(0.580, 0.870, 0.220);

  // base vertical gradient
  float gy = smoothstep(0.0, 1.0, p.y);
  vec3 col = mix(deep, forest, gy);
  col = mix(col, mid, smoothstep(0.15, 0.85, p.y) * 0.55);

  // breathing factor
  float breathe = 0.85 + 0.15 * sin(u_time * 0.3);

  // animated noise field
  vec2 q = p * 1.6 + vec2(t, -t * 0.6);
  float n = fbm(q);
  n = smoothstep(0.25, 0.85, n);

  // slow-moving light bloom
  float bloom = exp(-length(p - vec2(0.6 + sin(t) * 0.08, 0.42 + cos(t * 0.8) * 0.06)) * 1.6);
  col += glow * bloom * 0.55 * breathe;

  // lime rays
  float ray1 = smoothstep(0.55, 1.0, sin(p.x * 3.5 + p.y * 2.0 + t * 1.6) * 0.5 + 0.5);
  col += lime * ray1 * 0.10;

  // subtle cyan aurora glow top-right
  float aurora = exp(-length(p - vec2(0.95 * aspect, 0.85)) * 2.2);
  col += cyan * aurora * 0.20 * breathe;

  // apply FBM mesh glow
  col += lime * n * 0.18;
  col += cyan * pow(n, 3.0) * 0.08;

  // vignette
  float vig = 1.0 - length(p - vec2(0.5 * aspect, 0.5)) * 0.35;
  col *= clamp(vig, 0.4, 1.0);

  // subtle scanline
  float scan = 0.97 + 0.03 * sin(gl_FragCoord.y * 1.2);
  col *= scan;

  gl_FragColor = vec4(col, 0.95);
}
`;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function GlBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced.current) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      canvas.style.display = "none";
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const locP = gl.getAttribLocation(prog, "p");
    const locRes = gl.getUniformLocation(prog, "u_res")!;
    const locTime = gl.getUniformLocation(prog, "u_time")!;
    const locPtr = gl.getUniformLocation(prog, "u_ptr")!;

    let raf = 0;
    let start = performance.now();
    const ptr = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      target.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };

    const draw = (now: number) => {
      ptr.x += (target.x - ptr.x) * 0.025;
      ptr.y += (target.y - ptr.y) * 0.025;

      gl.useProgram(prog);
      gl.uniform2f(locRes, canvas.width, canvas.height);
      gl.uniform1f(locTime, (now - start) / 1000);
      gl.uniform2f(locPtr, ptr.x, ptr.y);

      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(locP);
      gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  if (reduced.current) {
    return <div className="backdrop__fallback" aria-hidden="true" />;
  }

  return (
    <canvas
      ref={canvasRef}
      id="glCanvas"
      className="backdrop__canvas"
      aria-hidden="true"
    />
  );
}

export function GradientOverlay() {
  return <div className="backdrop__orbs" aria-hidden="true">
    <div className="backdrop__orb backdrop__orb--a" />
    <div className="backdrop__orb backdrop__orb--b" />
    <div className="backdrop__orb backdrop__orb--c" />
  </div>;
}

export function AmbientOverlay() {
  return <div className="backdrop__grid" aria-hidden="true" />;
}

export function HatchOverlay() {
  return <div className="backdrop__hatch backdrop__hatch--animated" aria-hidden="true" />;
}

export function PageBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <GlBackdrop />
      <GradientOverlay />
      <AmbientOverlay />
      <HatchOverlay />
    </div>
  );
}
