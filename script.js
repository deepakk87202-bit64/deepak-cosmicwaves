/* ============================================================
   COSMIC DESIGN SUITE PRO — script.js
   Sections:
     1. App State
     2. DOM References
     3. Theme Toggle
     4. Tab Switching
     5. Helper Utilities
     6. Range Slider Live Values
     7. Wave Generator
     8. Blob Generator
     9. Shape Drawing (Mouse + Touch)
    10. Copy & Download
    11. Event Bindings
    12. Initialization
   ============================================================ */


/* ─────────────────────────────────────────────
   1. APP STATE
   ───────────────────────────────────────────── */
const state = {
  tab: 'waves',   // current active tab: 'waves' | 'blobs' | 'shapes'
};


/* ─────────────────────────────────────────────
   2. DOM REFERENCES
   ───────────────────────────────────────────── */
const svg          = document.getElementById('preview-svg');
const stage        = document.getElementById('stage');
const dimBadge     = document.getElementById('dimBadge');
const tapIndicator = document.getElementById('tapIndicator');


/* ─────────────────────────────────────────────
   3. THEME TOGGLE
   ───────────────────────────────────────────── */
function toggleTheme() {
  const html  = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeIcon').textContent = isDark ? '🌙' : '☀️';
}


/* ─────────────────────────────────────────────
   4. TAB SWITCHING
   ───────────────────────────────────────────── */
const tips = {
  waves: `<p>Sine waves guide the eye smoothly across the screen. Stack
    <strong>multiple layers</strong> at different opacities for a rich 3D
    ocean effect — widely used in SaaS hero sections.</p>`,

  blobs: `<p>Organic blobs feel friendly and creative. Use a
    <strong>gradient fill</strong> and offset multiple blobs for a modern
    glassmorphism background. Less symmetric = more natural.</p>`,

  shapes: `<p>Draw shapes by <strong>dragging</strong> on the canvas (desktop)
    or use the <strong>Quick Add</strong> buttons (mobile). Combine overlapping
    shapes with varied opacity for layered UI mockups.</p>`,
};

function switchTab(name, btn) {
  state.tab = name;

  /* Highlight correct nav button */
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  /* Show correct control panel */
  document.querySelectorAll('.ctrl-section').forEach(s => s.classList.remove('active'));
  document.getElementById('ctrl-' + name).classList.add('active');

  /* Update tips */
  document.getElementById('tip-content').innerHTML = tips[name];

  /* Update canvas appearance */
  tapIndicator.style.display = name === 'shapes' ? 'block' : 'none';
  stage.style.cursor = name === 'shapes' ? 'crosshair' : 'default';

  /* Clear previous output */
  state.shapes = [];
  clearSVG();
  setCode('');

  /* Trigger correct generator */
  if (name === 'waves') updateWave();
  else if (name === 'blobs') updateBlob();
}


/* ─────────────────────────────────────────────
   5. HELPER UTILITIES
   ───────────────────────────────────────────── */

/** Wipe SVG canvas */
function clearSVG() { svg.innerHTML = ''; }

/** Write text to code output textarea */
function setCode(c) { document.getElementById('code-output').value = c; }

/** Sync a color picker's hex display span */
function syncColorHex(inputId, hexId) {
  const val = document.getElementById(inputId).value;
  document.getElementById(hexId).textContent = val;
}

/**
 * Get pointer position relative to #stage.
 * Works for both mouse events and touch events.
 */
function getPos(e) {
  const r = stage.getBoundingClientRect();

  if (e.touches && e.touches.length) {
    return {
      x: e.touches[0].clientX - r.left,
      y: e.touches[0].clientY - r.top,
    };
  }
  if (e.changedTouches && e.changedTouches.length) {
    return {
      x: e.changedTouches[0].clientX - r.left,
      y: e.changedTouches[0].clientY - r.top,
    };
  }
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}


/* ─────────────────────────────────────────────
   6. RANGE SLIDER LIVE VALUES
   Attach an input listener that updates a display
   badge whenever the user moves the slider.
   ───────────────────────────────────────────── */

/**
 * @param {string} id       - slider element id
 * @param {string} valId    - badge element id (null to skip)
 * @param {string} suffix   - unit string like 's', '%', ''
 * @param {Function|null} cb - callback to run on change
 */
function bindRange(id, valId, suffix, cb) {
  const el = document.getElementById(id);

  const refresh = () => {
    if (valId) document.getElementById(valId).textContent = el.value + (suffix || '');
    if (cb) cb();
  };

  el.addEventListener('input', refresh);
  refresh(); // set initial display value
}


/* ─────────────────────────────────────────────
   7. WAVE GENERATOR
   Builds layered SVG sine-wave paths, optionally
   animated via <animateTransform>.
   ───────────────────────────────────────────── */

/**
 * Build a single wave path that tiles horizontally.
 * @param {number} peaks      - number of wave peaks visible
 * @param {number} amp        - wave height in SVG units
 * @param {number} W          - total SVG width
 * @param {number} H          - total SVG height
 * @param {number} baseline   - Y position of wave midline
 * @param {number} scale      - amplitude scale factor (0–1)
 * @returns {string} SVG path d attribute value
 */
function generatePath(peaks, amp, W, H, baseline, scale) {
  const seg = (W * 2) / (peaks * 2);
  let d = `M0,${H} L0,${baseline} `;

  for (let i = 1; i <= peaks * 2; i++) {
    const x  = i * seg;
    const cx = x - seg / 2;
    const cy = baseline + (i % 2 === 0 ? amp * scale : -amp * scale);
    d += `Q${cx},${cy} ${x},${baseline} `;
  }

  d += `L${W * 2},${H} Z`;
  return d;
}

/** Read wave controls and re-render the SVG */
function updateWave() {
  if (state.tab !== 'waves') return;

  /* Read all control values */
  const peaks    = +document.getElementById('wCount').value;
  const amp      = +document.getElementById('wHeight').value;
  const color    = document.getElementById('wColor').value;
  const animated = document.getElementById('wAnimated').checked;
  const speed    = +document.getElementById('wSpeed').value;
  const layers   = +document.getElementById('wLayers').value;

  /* Dim speed slider when animation is off */
  const speedWrap = document.getElementById('wSpeedWrap');
  speedWrap.style.opacity = animated ? '1' : '0.4';
  document.getElementById('wSpeed').disabled = !animated;

  /* SVG canvas dimensions */
  const W = 1200, H = 400, base = 270;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  clearSVG();

  /* Build each layer with increasing opacity + decreasing amplitude */
  const scales   = [0.4, 0.6, 0.75, 0.88, 1.0].slice(0, layers);
  const opacities= [0.2, 0.35, 0.55, 0.75, 1.0].slice(0, layers);
  let innerSVG   = '';

  scales.forEach((sc, i) => {
    const path = generatePath(peaks, amp, W, H, base, sc);
    const op   = opacities[i];
    const dur  = (speed * (1 + i * 0.2)).toFixed(1);

    if (animated) {
      /* Each layer scrolls at a slightly different speed */
      innerSVG +=
        `<g>\n` +
        `  <animateTransform attributeName="transform" type="translate" ` +
        `from="0,0" to="-${W},0" dur="${dur}s" repeatCount="indefinite"/>\n` +
        `  <path fill="${color}" fill-opacity="${op}" d="${path}"/>\n` +
        `</g>\n`;
    } else {
      innerSVG += `<path fill="${color}" fill-opacity="${op}" d="${path}"/>\n`;
    }
  });

  svg.innerHTML = innerSVG;

  /* Write to code output */
  setCode(
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">\n` +
    innerSVG +
    `</svg>`
  );
}


/* ─────────────────────────────────────────────
   8. BLOB GENERATOR
   Builds an organic closed shape using randomised
   points on a circle, smoothed with quadratic beziers.
   A radial gradient fill adds visual depth.
   ───────────────────────────────────────────── */

/**
 * Return the midpoint string "x,y" between two points.
 * Used to build smooth bezier joins.
 */
function mid(a, b) {
  return `${((a.x + b.x) / 2).toFixed(1)},${((a.y + b.y) / 2).toFixed(1)}`;
}

/** Read blob controls and re-render */
function updateBlob() {
  if (state.tab !== 'blobs') return;

  const pts    = +document.getElementById('bPoints').value;
  const rand   = +document.getElementById('bRand').value;
  const sz     = +document.getElementById('bSize').value;
  const color1 = document.getElementById('bColor').value;
  const color2 = document.getElementById('bColor2').value;

  const size = 400;
  const cx   = size / 2;
  const cy   = size / 2;
  const step = (Math.PI * 2) / pts;

  /* Generate randomised points around a circle */
  const points = [];
  for (let i = 0; i < pts; i++) {
    const angle = i * step - Math.PI / 2;
    const r     = sz + (Math.random() * rand * 2 - rand);
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  /* Build smooth path with quadratic bezier curves */
  let d = `M${mid(points[pts - 1], points[0])} `;
  for (let i = 0; i < pts; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % pts];
    d += `Q${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${mid(p1, p2)} `;
  }
  d += 'Z';

  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

  /* Unique gradient ID avoids conflicts across rerenders */
  const gradId = 'blobGrad' + Date.now();

  const inner =
    `<defs>\n` +
    `  <radialGradient id="${gradId}" cx="40%" cy="40%" r="60%">\n` +
    `    <stop offset="0%"   stop-color="${color1}"/>\n` +
    `    <stop offset="100%" stop-color="${color2}"/>\n` +
    `  </radialGradient>\n` +
    `</defs>\n` +
    `<path fill="url(#${gradId})" d="${d}"/>`;

  svg.innerHTML = inner;

  setCode(
    `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">\n` +
    inner +
    `\n</svg>`
  );
}


/* ─────────────────────────────────────────────
   9. SHAPE DRAWING — MOUSE & TOUCH
   Drag on canvas to draw. Quick-add buttons for
   mobile users. All shapes land in the same SVG.
   ───────────────────────────────────────────── */

/* Fixed SVG viewBox for the drawing canvas */
const VB_W = 400;
const VB_H = 400;

let drawing   = false;          // is a drag currently in progress?
let startPx   = { x: 0, y: 0 };// drag start position in CSS pixels
let activeSel = null;           // the SVG element being drawn right now

/* ── Start drawing on mousedown / touchstart ── */
function shapeStart(e) {
  if (state.tab !== 'shapes') return;
  if (e.type === 'touchstart') e.preventDefault();

  drawing = true;
  startPx = getPos(e);

  /* Create the SVG element */
  const type   = document.getElementById('sType').value;
  const tagMap = { rect: 'rect', circle: 'circle', rounded: 'rect' };
  const ns     = 'http://www.w3.org/2000/svg';

  activeSel = document.createElementNS(ns, tagMap[type]);
  activeSel.dataset.kind = type; // store logical type for move handler

  applyShapeStyle(activeSel);
  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
  svg.appendChild(activeSel);

  dimBadge.classList.add('visible');
}

/* ── Update shape size on mousemove / touchmove ── */
function shapeMove(e) {
  if (!drawing || state.tab !== 'shapes') return;
  if (e.type === 'touchmove') e.preventDefault();

  const pos  = getPos(e);
  const rect = stage.getBoundingClientRect();

  /* Convert CSS pixel coords → SVG viewBox coords */
  const scaleX = VB_W / rect.width;
  const scaleY = VB_H / rect.height;

  const sx = startPx.x * scaleX;
  const sy = startPx.y * scaleY;
  const ex = pos.x     * scaleX;
  const ey = pos.y     * scaleY;

  const w    = Math.abs(ex - sx);
  const h    = Math.abs(ey - sy);
  const minX = Math.min(sx, ex);
  const minY = Math.min(sy, ey);
  const kind = activeSel ? activeSel.dataset.kind : 'rect';

  if (kind === 'circle') {
    /* For circles, radius = diagonal distance / 2 */
    const radius = Math.sqrt(w * w + h * h) / 2;
    activeSel.setAttribute('cx', sx);
    activeSel.setAttribute('cy', sy);
    activeSel.setAttribute('r',  Math.max(1, radius));
    dimBadge.textContent = `R: ${Math.round(radius)}`;

  } else {
    /* rect and rounded-rect */
    activeSel.setAttribute('x',      minX);
    activeSel.setAttribute('y',      minY);
    activeSel.setAttribute('width',  Math.max(1, w));
    activeSel.setAttribute('height', Math.max(1, h));

    if (kind === 'rounded') {
      const rx = +document.getElementById('sRadius').value;
      activeSel.setAttribute('rx', rx);
      activeSel.setAttribute('ry', rx);
    }
    dimBadge.textContent = `W: ${Math.round(w)}  H: ${Math.round(h)}`;
  }

  updateShapeCode();
}

/* ── Finish drawing on mouseup / touchend ── */
function shapeEnd(e) {
  if (!drawing || state.tab !== 'shapes') return;
  drawing   = false;
  activeSel = null;
  dimBadge.classList.remove('visible');
  updateShapeCode();
}

/** Apply current fill color + opacity to an SVG element */
function applyShapeStyle(el) {
  const fill    = document.getElementById('sFill').value;
  const opacity = +document.getElementById('sOpacity').value / 100;
  el.setAttribute('fill',         fill);
  el.setAttribute('fill-opacity', opacity);
}

/** Regenerate code output from current SVG children */
function updateShapeCode() {
  const content = svg.innerHTML.trim();
  if (!content) { setCode(''); return; }
  setCode(
    `<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">\n` +
    `  ${content}\n` +
    `</svg>`
  );
}

/**
 * Quick-add: place a preset-size shape at canvas center.
 * Designed for mobile users who can't drag-draw easily.
 * @param {'rect'|'circle'} type
 * @param {number} w  width (or diameter for circles)
 * @param {number} h  height
 */
function quickAddShape(type, w, h) {
  if (state.tab !== 'shapes') return;

  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);

  const ns   = 'http://www.w3.org/2000/svg';
  const fill = document.getElementById('sFill').value;
  const op   = +document.getElementById('sOpacity').value / 100;
  const cx   = VB_W / 2;
  const cy   = VB_H / 2;

  let el;

  if (type === 'circle') {
    el = document.createElementNS(ns, 'circle');
    el.setAttribute('cx', cx);
    el.setAttribute('cy', cy);
    el.setAttribute('r',  w / 2);
  } else {
    el = document.createElementNS(ns, 'rect');
    el.setAttribute('x',      cx - w / 2);
    el.setAttribute('y',      cy - h / 2);
    el.setAttribute('width',  w);
    el.setAttribute('height', h);

    const rx = +document.getElementById('sRadius').value;
    if (rx) {
      el.setAttribute('rx', rx);
      el.setAttribute('ry', rx);
    }
  }

  el.setAttribute('fill',         fill);
  el.setAttribute('fill-opacity', op);
  svg.appendChild(el);
  updateShapeCode();
}

/** Remove all shapes from canvas and clear code output */
function clearShapes() {
  if (state.tab !== 'shapes') return;
  clearSVG();
  setCode('');
}


/* ─────────────────────────────────────────────
   10. COPY & DOWNLOAD
   ───────────────────────────────────────────── */

/** Copy generated SVG code to clipboard */
function copyCode() {
  const ta = document.getElementById('code-output');
  if (!ta.value.trim()) return;

  navigator.clipboard.writeText(ta.value)
    .then(() => {
      const btn = document.getElementById('copyBtn');
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 Copy';
        btn.classList.remove('copied');
      }, 2000);
    })
    .catch(() => {
      /* Fallback for older browsers */
      ta.select();
      document.execCommand('copy');
    });
}

/** Download generated SVG as a .svg file */
function downloadSVG() {
  const code = document.getElementById('code-output').value.trim();
  if (!code) return;

  const blob = new Blob([code], { type: 'image/svg+xml' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `cosmic-${state.tab}-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
}


/* ─────────────────────────────────────────────
   11. EVENT BINDINGS
   ───────────────────────────────────────────── */

/* ── Drawing: mouse events ── */
stage.addEventListener('mousedown',  shapeStart, { passive: false });
window.addEventListener('mousemove', shapeMove,  { passive: false });
window.addEventListener('mouseup',   shapeEnd,   { passive: false });

/* ── Drawing: touch events ── */
stage.addEventListener('touchstart', shapeStart, { passive: false });
window.addEventListener('touchmove', shapeMove,  { passive: false });
window.addEventListener('touchend',  shapeEnd,   { passive: false });

/* ── Wave sliders / inputs ── */
['wSpeed', 'wCount', 'wHeight', 'wLayers', 'wColor'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateWave);
});
document.getElementById('wAnimated').addEventListener('change', updateWave);

/* ── Blob sliders / inputs ── */
['bPoints', 'bRand', 'bSize', 'bColor', 'bColor2'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateBlob);
});

/* ── Color picker → hex label sync ── */
[
  ['wColor',  'wColorHex'],
  ['bColor',  'bColorHex'],
  ['bColor2', 'bColor2Hex'],
  ['sFill',   'sFillHex'],
].forEach(([inputId, hexId]) => {
  document.getElementById(inputId).addEventListener('input', () => {
    document.getElementById(hexId).textContent =
      document.getElementById(inputId).value;
  });
});

/* ── Range slider value badges ── */
bindRange('wSpeed',   'wSpeedVal',   's', updateWave);
bindRange('wCount',   'wCountVal',   '',  updateWave);
bindRange('wHeight',  'wHeightVal',  '',  updateWave);
bindRange('wLayers',  'wLayersVal',  '',  updateWave);
bindRange('bPoints',  'bPointsVal',  '',  updateBlob);
bindRange('bRand',    'bRandVal',    '',  updateBlob);
bindRange('bSize',    'bSizeVal',    '',  updateBlob);
bindRange('sOpacity', 'sOpacityVal', '%', null);
bindRange('sRadius',  'sRadiusVal',  '',  null);

/* ── Shape style — update all existing shapes live ── */
['sFill', 'sOpacity'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    if (state.tab === 'shapes' && svg.children.length) {
      Array.from(svg.children).forEach(el => applyShapeStyle(el));
      updateShapeCode();
    }
  });
});


/* ─────────────────────────────────────────────
   12. INITIALIZATION
   ───────────────────────────────────────────── */
document.getElementById('tip-content').innerHTML = tips['waves'];
tapIndicator.style.display = 'none';  // hide shapes hint on load
updateWave();                          // render waves immediately