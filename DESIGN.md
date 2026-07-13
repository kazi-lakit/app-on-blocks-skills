---
version: "alpha"
name: "CoinCompass — Your Ultimate Guide to the Cryptocurrency World"
description: "Coincompass Ultimate Testimonial Section is designed for showcasing social proof and customer credibility. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for component libraries and responsive product interfaces."
colors:
  primary: "#C8F542"
  secondary: "#12300F"
  tertiary: "#0D3617"
  neutral: "#FFFFFF"
  background: "#FFFFFF"
  surface: "#C8F542"
  text-primary: "#FFFFFF"
  text-secondary: "#12300F"
  border: "#FFFFFF"
  accent: "#C8F542"
typography:
  display-lg:
    fontFamily: "Geist"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: "53.76px"
    letterSpacing: "-0.05em"
  body-md:
    fontFamily: "Geist"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22.75px"
  label-md:
    fontFamily: "Geist"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  md: "0px"
  full: "9999px"
spacing:
  base: "4px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  gap: "4px"
  card-padding: "10px"
  section-padding: "24px"
components:
  button-primary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "6px"
  button-secondary:
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "6px"
  button-link:
    textColor: "#000000"
    rounded: "{rounded.md}"
    padding: "0px"
  card:
    rounded: "16px"
    padding: "16px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses dark mode with #C8F542 as the main accent and #FFFFFF as the neutral foundation.

- **Primary (#C8F542):** Main accent and emphasis color.
- **Secondary (#12300F):** Supporting accent for secondary emphasis.
- **Tertiary (#0D3617):** Reserved accent for supporting contrast moments.
- **Neutral (#FFFFFF):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #FFFFFF; Surface: #C8F542; Text Primary: #FFFFFF; Text Secondary: #12300F; Border: #FFFFFF; Accent: #C8F542

## Typography

Typography relies on Geist across display, body, and utility text.

- **Display (`display-lg`):** Geist, 48px, weight 400, line-height 53.76px, letter-spacing -0.05em.
- **Body (`body-md`):** Geist, 14px, weight 400, line-height 22.75px.
- **Labels (`label-md`):** Geist, 12px, weight 500, line-height 16px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 4px, 6px, 8px, 10px, 12px, 14px, 16px, 20px
- **Section padding:** 24px, 40px
- **Card padding:** 10px, 14px, 16px, 17px
- **Gaps:** 4px, 6px, 8px, 10px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 1px #FFFFFF; 1px #C8F542; 3px #C8F542
- **Shadows:** rgba(0, 0, 0, 0.3) 0px 20px 40px -12px; rgba(10, 42, 18, 0.45) 0px 40px 80px -20px; rgba(200, 245, 66, 0.4) 0px 8px 24px -6px
- **Blur:** 12px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 0px padding and a 28px radius. Drive the shell with linear-gradient(160deg, rgb(10, 42, 18) 0%, rgb(13, 54, 23) 45%, rgb(10, 42, 18) 100%) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 2px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 2px, 8px, 12px, 16px, 28px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Primary:** background #FFFFFF, text #0D3617, radius 9999px, padding 6px, border 0px solid rgb(229, 231, 235).
- **Secondary:** text #FFFFFF, radius 9999px, padding 6px, border 1px solid rgba(255, 255, 255, 0.18).
- **Links:** text #000000, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background rgba(255, 255, 255, 0.09), border 1px solid rgba(255, 255, 255, 0.14), radius 16px, padding 16px, shadow rgba(0, 0, 0, 0.3) 0px 20px 40px -12px, blur 12px.
- **Card surface:** background rgba(255, 255, 255, 0.09), border 1px solid rgba(255, 255, 255, 0.14), radius 16px, padding 14px, shadow rgba(0, 0, 0, 0.3) 0px 20px 40px -12px, blur 12px.
- **Card surface:** background rgba(255, 255, 255, 0.09), border 1px solid rgba(255, 255, 255, 0.14), radius 16px, padding 20px, shadow rgba(0, 0, 0, 0.3) 0px 20px 40px -12px, blur 12px.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 2px, 8px, 12px, 16px, 28px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected minimal motion intensity without a deliberate reason.

## Motion

Motion stays restrained and interface-led across text, layout, and scroll transitions. Timing clusters around 150ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on text and brightness changes.

**Motion Level:** minimal

**Durations:** 150ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** text, brightness

## WebGL

Reconstruct the graphics as a full-bleed background field using webgl, dpr clamp, custom shaders. The effect should read as technical, meditative, and atmospheric: soft bloom haze with soft lime and sparse spacing. Build it from shader field so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Soft bloom haze
  - **Primitives:**
    - **Value:** Shader field
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, DPR clamp, custom shaders

**Techniques:** Breathing pulse, Pointer parallax, Shader gradients, DOM fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL animated backdrop -->
      <canvas id="glCanvas" class="absolute inset-0 w-full h-full" style="opacity:0.9;" aria-hidden="true"></canvas>
      <!-- Diagonal hatch overlay -->
      <div class="absolute inset-0 pointer-events-none" style="background-image:repeating-linear-gradient(115deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 56px);" aria-hidden="true"></div>
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      // ---------- WebGL aurora light rays ----------
      (function(){
        const canvas = document.getElementById('glCanvas');
        const gl = canvas.getContext('webgl');
        if(!gl){ canvas.style.display='none'; return; }

        const vsSrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
        const fsSrc = `
      …
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      // ---------- WebGL aurora light rays ----------
      (function(){
        const canvas = document.getElementById('glCanvas');
        const gl = canvas.getContext('webgl');
        if(!gl){ canvas.style.display='none'; return; }

        const vsSrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
        const fsSrc = `
      ```
  - **Draw call:**
    - **Language:** js
    - **Snippet:**
      ```
      const vsSrc = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      const fsSrc = `
      precision mediump float;
      uniform vec2 u_res;
      uniform float u_time;
      float band(float x,float c,float w){float d=(x-c)/w;return exp(-d*d);}
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
      ```
