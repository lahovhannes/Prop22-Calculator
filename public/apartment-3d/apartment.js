/* Diagonal-Bedroom Apartment — furnished, walkable Three.js model.
 *
 * All architecture is entered in the pixel coordinates of the source floor plan
 * (1206 x 1185 px) and converted to metres with one scale factor, so the model can
 * be laid over the drawing to check it. Scale comes from the labelled room sizes:
 * LIVING 11'10" x 10'9" and BEDROOM 15'6" x 10' both give ~40.3 px per foot.
 */
(function () {
  'use strict';
  var THREE = window.THREE;
  var S = 0.3048 / 40.3;          // metres per plan pixel
  var CX = 606, CY = 588;         // plan pixel that maps to the world origin
  var H = 2.7;                    // ceiling height (m)
  var EYE = 1.6, RADIUS = 0.2;
  var LIGHT = 0.12;               // global trim for lamp output (candela)
  function wx(x) { return (x - CX) * S; }
  function wz(y) { return (y - CY) * S; }

  // Seeded random numbers: the apartment is identical on every load.
  var seed = 2207;
  function rnd() {
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function rr(a, b) { return a + (b - a) * rnd(); }

  var canvas = document.getElementById('scene');
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.getElementById('loading').textContent = 'This browser could not start WebGL, so the 3D apartment cannot be shown here.';
    return;
  }
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var ANISO = renderer.capabilities.getMaxAnisotropy();

  var scene = new THREE.Scene();
  var high = new THREE.Group();   // ceiling, wall cabinets, pendants: hidden in plan view
  scene.add(high);

  /* ───────────────────────── procedural textures ───────────────────────── */
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, srgb) {
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = ANISO;
    if (srgb !== false) t.encoding = THREE.sRGBEncoding;
    return t;
  }
  function oakCanvas(W, Hh, rows, jointsPerRow) {
    var c = cv(W, Hh), g = c.getContext('2d'), rh = Hh / rows;
    for (var r = 0; r < rows; r++) {
      var js = [];
      for (var j = 0; j < jointsPerRow; j++) js.push(((j + rr(0.15, 0.85)) / jointsPerRow) * W);
      if (!jointsPerRow) js = [0];
      for (var k = 0; k < js.length; k++) {
        var x0 = js[k], x1 = k + 1 < js.length ? js[k + 1] : js[0] + W;
        var l = rr(63, 71), sat = rr(30, 40), hue = rr(31, 36);
        for (var rep = 0; rep < 2; rep++) {            // second pass wraps the plank across the seam
          var ox = rep ? -W : 0;
          g.save(); g.beginPath(); g.rect(x0 + ox, r * rh, x1 - x0, rh); g.clip();
          g.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + l + '%)';
          g.fillRect(x0 + ox, r * rh, x1 - x0, rh);
          var s0 = seed;
          for (var n = 0; n < 46; n++) {
            var y = r * rh + rr(0, rh), amp = rr(0.5, 3), ph = rr(0, 6), fr = rr(0.003, 0.012);
            g.strokeStyle = 'rgba(' + (rnd() < 0.7 ? '120,84,48' : '255,240,214') + ',' + rr(0.03, 0.1) + ')';
            g.lineWidth = rr(0.6, 2.2);
            g.beginPath();
            for (var x = x0; x <= x1 + 16; x += 16) {
              var yy = y + Math.sin(x * fr + ph) * amp;
              if (x === x0) g.moveTo(x + ox, yy); else g.lineTo(x + ox, yy);
            }
            g.stroke();
          }
          if (!rep) seed = s0;                          // same grain on the wrapped copy
          if (jointsPerRow) { g.fillStyle = 'rgba(70,48,28,0.4)'; g.fillRect(x0 + ox, r * rh, 1.5, rh); }
          g.restore();
        }
      }
      if (rows > 1) { g.fillStyle = 'rgba(70,48,28,0.42)'; g.fillRect(0, r * rh, W, 1.5); }
    }
    return c;
  }
  function stoneCanvas(N, grout) {
    var c = cv(N, N), g = c.getContext('2d'), i, a, b;
    g.fillStyle = '#ebe6dd'; g.fillRect(0, 0, N, N);
    function wrap(fn) { for (a = -1; a <= 1; a++) for (b = -1; b <= 1; b++) { g.save(); g.translate(a * N, b * N); fn(); g.restore(); } }
    for (i = 0; i < 150; i++) (function () {
      var x = rr(0, N), y = rr(0, N), r = rr(40, 190), light = rnd() < 0.55;
      wrap(function () {
        var gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, light ? 'rgba(255,253,248,0.10)' : 'rgba(170,158,142,0.07)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      });
    })();
    for (i = 0; i < (grout ? 5 : 9); i++) (function () {
      var pts = [], x = rr(0, N), y = rr(0, N), dir = rr(0, Math.PI * 2);
      for (var k = 0; k < 26; k++) { pts.push([x, y]); dir += rr(-0.35, 0.35); x += Math.cos(dir) * 34; y += Math.sin(dir) * 34; }
      var al = rr(0.10, 0.26), lw = rr(0.6, 1.8);
      wrap(function () {
        [[lw * 7, al * 0.14], [lw, al]].forEach(function (p) {
          g.strokeStyle = 'rgba(140,126,108,' + p[1] + ')'; g.lineWidth = p[0]; g.lineJoin = 'round';
          g.beginPath(); pts.forEach(function (q, k) { if (k) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.stroke();
        });
      });
    })();
    if (grout) {                                         // two 600 x 1200 mm tiles per repeat
      g.fillStyle = '#cdc6ba';
      g.fillRect(0, 0, N, 3); g.fillRect(0, 0, 3, N); g.fillRect(N / 2, 0, 3, N);
    }
    return c;
  }
  function weaveCanvas() {
    var N = 128, c = cv(N, N), g = c.getContext('2d');
    g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, N, N);
    for (var y = 0; y < N; y += 2) for (var x = 0; x < N; x += 2) {
      var v = ((x / 2 + y / 2) % 2 ? 236 : 250) + Math.floor(rr(-10, 5));
      g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x, y, 2, 2);
    }
    return c;
  }
  function artCanvas(kind) {
    var c = cv(640, 420), g = c.getContext('2d');
    g.fillStyle = '#efe9de'; g.fillRect(0, 0, 640, 420);
    var cols = ['#cdbb9f', '#b29a7c', '#e0d5c2', '#8d7c68', '#d8c7ad'];
    for (var i = 0; i < 5; i++) {
      g.fillStyle = cols[(i + kind) % cols.length]; g.globalAlpha = rr(0.55, 0.9);
      g.beginPath();
      if (i % 2) g.ellipse(rr(120, 520), rr(120, 300), rr(60, 150), rr(50, 120), rr(0, 3), 0, Math.PI * 2);
      else { var x = rr(60, 420), w = rr(90, 200), y = rr(120, 250); g.moveTo(x, 420); g.lineTo(x, y); g.arc(x + w / 2, y, w / 2, Math.PI, 0); g.lineTo(x + w, 420); }
      g.fill();
    }
    g.globalAlpha = 0.7; g.strokeStyle = '#4a4138'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(40, rr(250, 330)); g.bezierCurveTo(200, rr(80, 200), 400, rr(260, 380), 600, rr(120, 220)); g.stroke();
    g.globalAlpha = 1;
    return c;
  }
  function skyCanvas() {
    var W = 2048, Hh = 512, c = cv(W, Hh), g = c.getContext('2d'), hz = 330, i;
    var gr = g.createLinearGradient(0, 0, 0, hz);
    gr.addColorStop(0, '#8fb8e2'); gr.addColorStop(0.6, '#c5dbee'); gr.addColorStop(1, '#f1f3f1');
    g.fillStyle = gr; g.fillRect(0, 0, W, hz);
    for (i = 0; i < 26; i++) {                           // soft clouds
      var x = rr(0, W), y = rr(60, 260), r = rr(60, 170);
      for (var k = -1; k <= 1; k++) {
        var cg = g.createRadialGradient(x + k * W, y, 0, x + k * W, y, r);
        cg.addColorStop(0, 'rgba(255,255,255,0.5)'); cg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = cg; g.fillRect(x + k * W - r, y - r * 0.5, 2 * r, r);
      }
    }
    for (var layer = 0; layer < 2; layer++) {            // hazy skyline
      var xx = 0;
      while (xx < W) {
        var bw = rr(10, 34), bh = rr(4, layer ? 14 : 26);
        g.fillStyle = layer ? '#cfd6d8' : '#dde3e5';
        g.fillRect(xx, hz - bh, bw, bh + 4); xx += bw + rr(0, 14);
      }
    }
    var gg = g.createLinearGradient(0, hz, 0, Hh);
    gg.addColorStop(0, '#d2d8d6'); gg.addColorStop(1, '#b3bcb0');
    g.fillStyle = gg; g.fillRect(0, hz, W, Hh - hz);
    return c;
  }

  /* ───────────────────────────── materials ─────────────────────────────── */
  function std(color, rough, extra) {
    var m = new THREE.MeshStandardMaterial({ color: color, roughness: rough, metalness: 0 });
    if (extra) for (var k in extra) m[k] = extra[k];
    return m;
  }
  var tOakFloor = tex(oakCanvas(2048, 1024, 8, 3)); tOakFloor.repeat.set(1 / 3.6, 1 / 1.44);
  var tVeneer = tex(oakCanvas(512, 512, 1, 0));
  var tStone = tex(stoneCanvas(1024, false));
  var tTile = tex(stoneCanvas(1024, true));
  var tWeave = tex(weaveCanvas()), tWeaveB = tex(weaveCanvas(), false);
  function fabric(color, rough) {
    var m = std(color, rough || 0.95, { map: tWeave, bumpMap: tWeaveB, bumpScale: 0.0025 });
    m.userData.uvs = 9; return m;
  }
  var M = {
    wall: std('#f0ebe1', 0.93), ceiling: std('#f7f4ee', 0.95), trim: std('#f4f1ea', 0.6),
    floor: std('#ffffff', 0.5, { map: tOakFloor }),
    oak: std('#f2e6d2', 0.55, { map: tVeneer }), oakDark: std('#b79a78', 0.55, { map: tVeneer }),
    stone: std('#ffffff', 0.26, { map: tStone }), tile: std('#ffffff', 0.32, { map: tTile }),
    cab: std('#cfc6b6', 0.62), cabLight: std('#e9e3d8', 0.62), groove: std('#3b3631', 0.8),
    cream: fabric('#e7dfd0'), beige: fabric('#cdbda4'), taupe: fabric('#a3927a'), linen: fabric('#f3efe7'),
    boucle: fabric('#ebe5d9', 1), rug: fabric('#ddd3c0', 1),
    steel: std('#c6c5c1', 0.32, { metalness: 0.9 }), black: std('#1d1c1b', 0.45, { metalness: 0.3 }),
    frame: std('#34312e', 0.5, { metalness: 0.4 }), brass: std('#b39160', 0.3, { metalness: 1 }),
    ceramic: std('#f5f3ee', 0.14), matte: std('#ddd5c7', 0.85), clay: std('#b9a48a', 0.9),
    appliance: std('#f1f0ec', 0.35), blackGlass: std('#0b0b0c', 0.08, { metalness: 0.2, envMapIntensity: 0.35 }),
    soil: std('#3a3027', 1), leaf: std('#5f7449', 0.6, { side: THREE.DoubleSide }), bark: std('#6b5744', 0.9),
    glass: new THREE.MeshPhysicalMaterial({ color: '#eef4f4', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.6 }),
    frosted: std('#f3f6f5', 0.6, { transparent: true, opacity: 0.82, emissive: new THREE.Color('#cfd8da'), emissiveIntensity: 0.5 }),
    showerGlass: new THREE.MeshPhysicalMaterial({ color: '#dfeae8', roughness: 0.04, transparent: true, opacity: 0.16, envMapIntensity: 1.5 }),
    glow: std('#fff3e0', 1, { emissive: new THREE.Color('#ffd6a0'), emissiveIntensity: 1.7 }),
    shade: std('#f3e9d8', 1, { emissive: new THREE.Color('#ffcf9a'), emissiveIntensity: 0.75, side: THREE.DoubleSide }),
    curtain: std('#f6f2ea', 1, { side: THREE.DoubleSide, transparent: true, opacity: 0.9 }),
    book1: std('#d9cfc0', 0.8), book2: std('#8b7b68', 0.8), book3: std('#f2eee6', 0.8)
  };
  M.oak.userData.uvs = 0.9; M.oakDark.userData.uvs = 0.9; M.stone.userData.uvs = 0.62; M.tile.userData.uvs = 1 / 1.2;

  /* ─────────────────────────── geometry helpers ────────────────────────── */
  function uvw(geo, s) {            // world-scale box mapping, so textures never stretch
    var p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv, ou = rnd(), ov = rnd();
    for (var i = 0; i < p.count; i++) {
      var ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), u, v;
      if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); }
      else if (ax >= az) { u = p.getZ(i); v = p.getY(i); }
      else { u = p.getX(i); v = p.getY(i); }
      uv.setXY(i, u * s + ou, v * s + ov);
    }
    return geo;
  }
  function mesh(parent, geo, mat, x, y, z, noCast) {
    if (mat.userData.uvs && geo.attributes.uv) uvw(geo, mat.userData.uvs);
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = !noCast && !mat.transparent; m.receiveShadow = true;
    parent.add(m); return m;
  }
  // Box with its base at height yb.
  function B(parent, w, h, d, mat, x, yb, z, noCast) {
    var g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
    return mesh(parent, g, mat, x, yb, z, noCast);
  }
  function rrect(w, d, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -d / 2;
    r = Math.max(0.002, Math.min(r, w / 2 - 0.001, d / 2 - 0.001));
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // Soft-edged box (upholstery, mattress, ceramics) with its base at yb.
  function RB(parent, w, h, d, r, mat, x, yb, z) {
    var b = Math.min(0.02, h * 0.3, r);
    var g = new THREE.ExtrudeGeometry(rrect(w - 2 * b, d - 2 * b, r - b), { depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 5 });
    g.rotateX(-Math.PI / 2); g.translate(0, b, 0);
    return mesh(parent, g, mat, x, yb, z);
  }
  function C(parent, rt, rb, h, mat, x, yb, z, seg, noCast) {
    var g = new THREE.CylinderGeometry(rt, rb, h, seg || 24); g.translate(0, h / 2, 0);
    var m = new THREE.Mesh(g, mat); m.position.set(x || 0, yb || 0, z || 0);
    m.castShadow = !noCast; m.receiveShadow = true; parent.add(m); return m;
  }
  function lathe(parent, pts, mat, x, yb, z) {
    var g = new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 28);
    var m = new THREE.Mesh(g, mat); m.position.set(x, yb, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  }
  function GP(px, py, rot, parent) {
    var g = new THREE.Group(); g.position.set(wx(px), 0, wz(py)); g.rotation.y = rot || 0; (parent || scene).add(g); return g;
  }
  // Group standing on a wall face at a plan point; local +z points into the room along (nx, ny).
  function onWall(px, py, nx, ny) { return GP(px, py, Math.atan2(nx, ny)); }
  // Axis-aligned box given as a rectangle in plan pixels.
  function BR(x0, y0, x1, y1, yb, h, mat, parent, noCast) {
    return B(parent || scene, Math.abs(x1 - x0) * S, h, Math.abs(y1 - y0) * S, mat, wx((x0 + x1) / 2), yb, wz((y0 + y1) / 2), noCast);
  }

  /* ───────────────────────────── collision ─────────────────────────────── */
  var obstacles = [];
  function addObs(cx, cz, hw, hd, rot) { obstacles.push({ cx: cx, cz: cz, hw: hw, hd: hd, c: Math.cos(rot || 0), s: Math.sin(rot || 0) }); }
  function OR(x0, y0, x1, y1) { addObs(wx((x0 + x1) / 2), wz((y0 + y1) / 2), Math.abs(x1 - x0) * S / 2, Math.abs(y1 - y0) * S / 2, 0); }
  function obsG(g, w, d, ox, oz) {
    var c = Math.cos(g.rotation.y), s = Math.sin(g.rotation.y); ox = ox || 0; oz = oz || 0;
    addObs(g.position.x + ox * c + oz * s, g.position.z - ox * s + oz * c, w / 2, d / 2, g.rotation.y);
  }
  function resolve(p) {
    for (var it = 0; it < 3; it++) for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i], dx = p.x - o.cx, dz = p.z - o.cz;
      var lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
      var ex = lx - Math.max(-o.hw, Math.min(o.hw, lx)), ez = lz - Math.max(-o.hd, Math.min(o.hd, lz));
      var d2 = ex * ex + ez * ez, nx, nz, pen;
      if (d2 >= RADIUS * RADIUS) continue;
      if (d2 > 1e-10) { var d = Math.sqrt(d2); nx = ex / d; nz = ez / d; pen = RADIUS - d; }
      else {
        var px = o.hw - Math.abs(lx), pz = o.hd - Math.abs(lz);
        if (px < pz) { nx = lx < 0 ? -1 : 1; nz = 0; pen = px + RADIUS; } else { nx = 0; nz = lz < 0 ? -1 : 1; pen = pz + RADIUS; }
      }
      p.x += (nx * o.c + nz * o.s) * pen; p.z += (-nx * o.s + nz * o.c) * pen;
    }
  }
  function blocked(x, z) {
    for (var i = 0; i < obstacles.length; i++) {
      var o = obstacles[i], dx = x - o.cx, dz = z - o.cz, lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
      if (Math.abs(lx) < o.hw + RADIUS && Math.abs(lz) < o.hd + RADIUS) return true;
    }
    return false;
  }

  /* ─────────────────────── walls, doors and windows ────────────────────── */
  function handle(g, x, zSide) {
    C(g, 0.011, 0.011, 0.05, M.black, x, 1.0, zSide * 0.03).rotation.x = Math.PI / 2 * zSide;
    B(g, 0.12, 0.018, 0.018, M.black, x - 0.045, 0.991, zSide * 0.072);
  }
  function casing(g, a, b, head, t) {
    B(g, 0.03, head, t + 0.03, M.trim, a + 0.015, 0, 0); B(g, 0.03, head, t + 0.03, M.trim, b - 0.015, 0, 0);
    B(g, b - a, 0.03, t + 0.03, M.trim, (a + b) / 2, head - 0.03, 0);
  }
  function fillOpening(g, op, a, b, t) {
    var w = b - a, mid = (a + b) / 2, i;
    if (op.kind === 'window' || op.kind === 'frosted') {
      var hh = op.head - op.sill, fw = 0.045, n = Math.max(0, Math.ceil(w / 1.15) - 1);
      B(g, fw, hh, 0.07, M.frame, a + fw / 2, op.sill, 0); B(g, fw, hh, 0.07, M.frame, b - fw / 2, op.sill, 0);
      B(g, w, fw, 0.07, M.frame, mid, op.sill, 0); B(g, w, fw, 0.07, M.frame, mid, op.head - fw, 0);
      for (i = 1; i <= n; i++) B(g, 0.035, hh, 0.06, M.frame, a + w * i / (n + 1), op.sill, 0);
      B(g, w - 2 * fw, hh - 2 * fw, 0.012, op.kind === 'frosted' ? M.frosted : M.glass, mid, op.sill + fw, 0, true);
      B(g, w + 0.04, 0.026, t + 0.05, M.trim, mid, op.sill - 0.02, 0);
    } else if (op.kind === 'entry') {
      casing(g, a, b, op.head, t);
      B(g, w - 0.06, op.head - 0.035, 0.045, M.oak, mid, 0.004, 0);
      handle(g, b - 0.11, 1); handle(g, b - 0.11, -1);
    } else if (op.kind === 'glassdoor') {
      var st = 0.07;
      B(g, st, op.head, 0.06, M.frame, a + st / 2, 0, 0); B(g, st, op.head, 0.06, M.frame, b - st / 2, 0, 0);
      B(g, w, st, 0.06, M.frame, mid, op.head - st, 0); B(g, w, 0.1, 0.06, M.frame, mid, 0, 0);
      B(g, w - 2 * st, op.head - st - 0.1, 0.012, M.glass, mid, 0.1, 0, true);
      handle(g, a + 0.13, 1); handle(g, a + 0.13, -1);
    } else if (op.kind === 'bifold') {
      casing(g, a, b, op.head, t);
      for (i = 0; i < 2; i++) {
        var pw = (w - 0.06) / 2;
        B(g, pw - 0.006, op.head - 0.04, 0.03, M.cabLight, a + 0.03 + pw * (i + 0.5), 0.006, 0);
        B(g, 0.012, 0.16, 0.012, M.black, a + 0.03 + pw * (i ? 1.12 : 0.88), 0.95, (op.side || 1) * 0.02);
      }
    } else if (op.kind === 'slide') {
      for (i = 0; i < 2; i++) {
        var sw = w / 2 + 0.03, sx = i ? b - sw / 2 : a + sw / 2, sz = (i ? 1 : -1) * 0.02;
        B(g, sw, op.head - 0.02, 0.028, M.cabLight, sx, 0.008, sz);
        B(g, 0.014, 0.9, 0.006, M.black, i ? b - sw + 0.07 : a + sw - 0.07, 0.65, sz + (op.side || 1) * 0.016);
      }
      B(g, w, 0.02, 0.09, M.frame, mid, op.head - 0.02, 0);
    } else if (op.kind === 'open') casing(g, a, b, op.head, t);
  }
  function wall(x1, y1, x2, y2, tpx, ops, o) {
    o = o || {};
    var ax = wx(x1), az = wz(y1), bx = wx(x2), bz = wz(y2), L = Math.hypot(bx - ax, bz - az);
    var th = Math.atan2(-(bz - az), bx - ax), t = tpx * S, ux = (bx - ax) / L, uz = (bz - az) / L;
    var g = new THREE.Group(); g.position.set(ax, 0, az); g.rotation.y = th; scene.add(g);
    function obs(a, b) { addObs(ax + ux * (a + b) / 2, az + uz * (a + b) / 2, (b - a) / 2, t / 2, th); }
    function piece(a, b, y0, y1) {
      if (b - a < 0.002 || y1 - y0 < 0.002) return;
      B(g, b - a, y1 - y0, t, o.mat || M.wall, (a + b) / 2, y0, 0);
      if (y0 === 0) { if (!o.noBase) B(g, b - a, 0.09, t + 0.024, M.trim, (a + b) / 2, 0, 0); obs(a, b); }
    }
    var cur = 0;
    (ops || []).forEach(function (op) {
      var a = op.a * S, b = op.b * S;
      piece(cur, a, 0, H); if (op.sill) piece(a, b, 0, op.sill); piece(a, b, op.head, H);
      fillOpening(g, op, a, b, t);
      if (op.kind !== 'open' && !op.sill) obs(a, b);
      cur = b;
    });
    piece(cur, L, 0, H);
    return g;
  }
  // Open door leaf: hinge point, direction it lies along, width (all plan px).
  function leaf(hx, hy, dx, dy, wpx) {
    var g = GP(hx, hy, Math.atan2(-dy, dx)), w = wpx * S - 0.05;
    B(g, w, 2.02, 0.04, M.trim, w / 2 + 0.02, 0.008, 0);
    handle(g, w - 0.07, 1); handle(g, w - 0.07, -1);
    obsG(g, w, 0.05, w / 2, 0);
  }

  /* ─────────────────────────── shell: floor, walls ─────────────────────── */
  var FOOT = [[31, 43], [1011, 43], [1011, 412], [1182.5, 583.5], [632.75, 1133.25], [479.5, 980], [31, 980]];
  (function shell() {
    var fs = new THREE.Shape();
    FOOT.forEach(function (p, i) { if (i) fs.lineTo(wx(p[0]), -wz(p[1])); else fs.moveTo(wx(p[0]), -wz(p[1])); });
    var fg = new THREE.ShapeGeometry(fs); fg.rotateX(-Math.PI / 2);
    var floor = new THREE.Mesh(fg, M.floor); floor.receiveShadow = true; scene.add(floor);
    var cs = new THREE.Shape();
    FOOT.forEach(function (p, i) { if (i) cs.lineTo(wx(p[0]), wz(p[1])); else cs.moveTo(wx(p[0]), wz(p[1])); });
    var cg = new THREE.ExtrudeGeometry(cs, { depth: 0.14, bevelEnabled: false }); cg.rotateX(Math.PI / 2); cg.translate(0, H + 0.14, 0);
    var cm = M.ceiling.clone(); cm.side = THREE.DoubleSide;
    var ceil = new THREE.Mesh(cg, cm); ceil.castShadow = true; ceil.receiveShadow = true; high.add(ceil);

    var WIN = 0.5, WHEAD = 2.35, DOOR = 2.06;
    // Exterior
    wall(31, 50.5, 1011, 50.5, 15);                                                              // north
    wall(39, 43, 39, 980, 16, [{ a: 373, b: 493, head: DOOR, kind: 'entry' }]);                  // west, entry door
    wall(1003.5, 43, 1003.5, 420, 15, [{ a: 41, b: 218, sill: WIN, head: WHEAD, kind: 'window' },
      { a: 237, b: 352, head: 2.2, kind: 'glassdoor' }]);                                        // east: living window + glazed door
    wall(997, 409, 1177, 589, 15.5, [{ a: 26, b: 226, sill: WIN, head: WHEAD, kind: 'window' }]);// north-east diagonal, bedroom window
    wall(1177, 578, 627.25, 1127.75, 15.5);                                                      // south-east diagonal
    wall(638.25, 1127.75, 412, 901.5, 15.5);                                                     // south-west diagonal
    wall(31, 973, 491, 973, 14, [{ a: 139, b: 237, sill: 1.45, head: 2.15, kind: 'frosted' }]);  // south, bath window
    // Solid wedge where the south-west diagonal meets the bath wall
    var ws = new THREE.Shape(); ws.moveTo(wx(413), wz(902)); ws.lineTo(wx(491), wz(980)); ws.lineTo(wx(413), wz(980));
    var wg = new THREE.ExtrudeGeometry(ws, { depth: H, bevelEnabled: false }); wg.rotateX(Math.PI / 2); wg.translate(0, H, 0);
    mesh(scene, wg, M.wall);
    // Interior
    wall(411, 496.5, 918, 496.5, 11);                                                            // living | bedroom
    wall(908, 501, 1005, 404, 11.5);                                                             // short diagonal
    wall(417.5, 491, 417.5, 980, 10, [{ a: 22, b: 136, head: DOOR, kind: 'open' }]);             // hall | bedroom, bedroom door
    wall(31, 689, 422, 689, 18, [{ a: 258, b: 372, head: DOOR, kind: 'open' }]);                 // bath north wall, bath door
    wall(169.5, 546, 169.5, 689, 11);                                                            // W/D | hall closet
    wall(156, 557.5, 270, 557.5, 23);                                                            // closet north wall
    wall(47, 549, 158, 549, 8, [{ a: 9, b: 109, head: DOOR, kind: 'bifold', side: 1 }]);         // W/D doors
    wall(264, 566, 264, 689, 12, [{ a: 12, b: 111, head: DOOR, kind: 'bifold', side: -1 }]);     // hall closet doors
    wall(413, 852.5, 558, 852.5, 11);                                                            // bedroom closet north wall
    wall(554, 851, 723.5, 1020.5, 6, [{ a: 6, b: 234, head: 2.3, kind: 'slide', side: -1 }], { noBase: true }); // closet sliding doors
    leaf(425, 508, 1, 0, 114);                                                                   // bedroom door, open against wall
    leaf(399, 700, 0, 1, 112);                                                                   // bath door, open against wall

    // Closet interiors (seen in plan view)
    BR(60, 575, 150, 672, 0, 1.72, M.appliance);                                                  // stacked washer / dryer
    [0.5, 1.33].forEach(function (y) { var d = C(scene, 0.19, 0.19, 0.02, M.blackGlass, wx(105), y, wz(574)); d.rotation.x = Math.PI / 2; });
    BR(176, 570, 258, 600, 1.75, 0.025, M.cabLight); BR(176, 584, 258, 586, 1.62, 0.02, M.steel);
    var cl = GP(600, 1000, Math.atan2(-1, 1)); B(cl, 1.9, 0.025, 0.4, M.cabLight, 0, 1.8, 0.33); B(cl, 1.9, 0.02, 0.02, M.steel, 0, 1.66, 0.33);
  })();

  /* ─────────────────────────────── decor kit ───────────────────────────── */
  var leafGeo = (function () {
    var s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.075, 0.07, 0.05, 0.19); s.quadraticCurveTo(0, 0.27, -0.05, 0.19); s.quadraticCurveTo(-0.075, 0.07, 0, 0);
    return new THREE.ShapeGeometry(s, 5);
  })();
  function plant(px, py, h, scale) {
    var g = GP(px, py, rr(0, 6)); scale = scale || 1;
    lathe(g, [[0, 0], [0.12, 0], [0.17, 0.3], [0.165, 0.32], [0.15, 0.3]], M.matte, 0, 0, 0);
    C(g, 0.15, 0.15, 0.01, M.soil, 0, 0.285, 0, 20, true);
    for (var s = 0; s < 3; s++) {
      var st = C(g, 0.008, 0.014, h, M.bark, rr(-0.03, 0.03), 0.28, rr(-0.03, 0.03), 6);
      st.rotation.set(rr(-0.12, 0.12), 0, rr(-0.12, 0.12));
      for (var i = 0; i < 13; i++) {
        var lf = new THREE.Mesh(leafGeo, M.leaf), f = rr(0.3, 1);
        lf.position.set(0, f * h + h / 2 - h / 2, 0); lf.position.y = f * h;
        lf.rotation.set(rr(0.5, 1.25), rr(0, 6.28), 0, 'YXZ'); lf.scale.setScalar(scale * rr(0.8, 1.35));
        lf.castShadow = true; lf.receiveShadow = true; st.add(lf);
      }
    }
    obsG(g, 0.3, 0.3);
    return g;
  }
  function vase(parent, x, y, z, k, mat, branches) {
    lathe(parent, [[0, 0], [0.05 * k, 0], [0.075 * k, 0.1 * k], [0.06 * k, 0.2 * k], [0.028 * k, 0.26 * k], [0.034 * k, 0.3 * k]], mat || M.matte, x, y, z);
    for (var i = 0; i < (branches || 0); i++) {
      var b = C(parent, 0.003, 0.004, rr(0.35, 0.6), M.bark, x, y + 0.26 * k, z, 5);
      b.rotation.set(rr(-0.35, 0.35), 0, rr(-0.35, 0.35));
    }
  }
  function books(parent, x, y, z, rot) {
    var hh = 0;
    [M.book1, M.book2, M.book3].forEach(function (m, i) {
      var b = B(parent, 0.26 - i * 0.02, 0.03, 0.19 - i * 0.015, m, x, y + hh, z); b.rotation.y = (rot || 0) + rr(-0.15, 0.15); hh += 0.03;
    });
    return y + hh;
  }
  function art(parent, w, h, y, kind) {
    B(parent, w, h, 0.03, M.oak, 0, y, 0.016);
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), std('#ffffff', 0.9, { map: tex(artCanvas(kind)) }));
    m.material.map.wrapS = m.material.map.wrapT = THREE.ClampToEdgeWrapping;
    m.position.set(0, y + h / 2, 0.032); m.receiveShadow = true; parent.add(m);
  }
  function lampShade(parent, r, h, x, y, z, power, range) {
    var sh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r, h, 28, 1, true), M.shade);
    sh.position.set(x, y + h / 2, z); parent.add(sh);
    var l = new THREE.PointLight('#ffc98f', power * LIGHT, range, 2); l.position.set(x, y + h * 0.55, z); parent.add(l);
  }
  function tableLamp(parent, x, y, z) {
    lathe(parent, [[0, 0], [0.055, 0], [0.075, 0.07], [0.05, 0.16], [0.018, 0.2], [0.012, 0.26]], M.clay, x, y, z);
    lampShade(parent, 0.13, 0.17, x, y + 0.25, z, 14, 4.5);
  }
  function curtain(x1, y1, x2, y2, folds) {
    var ax = wx(x1), az = wz(y1), bx = wx(x2), bz = wz(y2), L = Math.hypot(bx - ax, bz - az);
    var g = new THREE.Group(); g.position.set(ax, 0, az); g.rotation.y = Math.atan2(-(bz - az), bx - ax); scene.add(g);
    var geo = new THREE.PlaneGeometry(L, 2.6, folds * 8, 1), p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / L + 0.5) * folds * Math.PI * 2) * 0.03);
    geo.translate(L / 2, 1.33, 0); geo.computeVertexNormals();
    var m = new THREE.Mesh(geo, M.curtain); m.receiveShadow = true; g.add(m);
    B(g, L + 0.1, 0.02, 0.03, M.trim, L / 2, 2.63, 0, true);
  }
  function downlight(px, py) {
    var d = new THREE.Mesh(new THREE.CircleGeometry(0.038, 20), M.glow); d.rotation.x = Math.PI / 2; d.position.set(wx(px), H - 0.004, wz(py)); high.add(d);
    var r = new THREE.Mesh(new THREE.RingGeometry(0.038, 0.055, 24), M.trim); r.rotation.x = Math.PI / 2; r.position.set(wx(px), H - 0.003, wz(py)); high.add(r);
  }
  function pointLight(px, py, y, power, range, shadow, color) {
    var l = new THREE.PointLight(color || '#ffe7c9', power * LIGHT, range, 2);
    l.position.set(wx(px), y, wz(py));
    if (shadow) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.camera.near = 0.08; l.shadow.camera.far = range; l.shadow.bias = -0.004; l.shadow.normalBias = 0.05; l.shadow.radius = 4; }
    scene.add(l); return l;
  }

  /* ─────────────────────────────── kitchen ─────────────────────────────── */
  (function kitchen() {
    var i;
    // Base cabinets: run along the north wall, return along the west wall
    BR(142, 60, 527, 131, 0, 0.1, M.groove); BR(47, 138, 133, 215, 0, 0.1, M.groove);
    BR(140, 58, 527, 138, 0.1, 0.78, M.cab); BR(47, 138, 140, 215, 0.1, 0.78, M.cab);
    BR(140, 138, 527, 138.5, 0.835, 0.03, M.groove); BR(140, 138, 140.5, 215, 0.835, 0.03, M.groove);  // handle-less grip channel
    [196, 258, 320, 388, 467].forEach(function (x) { BR(x - 0.3, 138, x + 0.3, 138.4, 0.1, 0.735, M.groove); });
    BR(140, 176, 140.4, 176.6, 0.1, 0.735, M.groove);
    // Countertop with a cut-out for the under-mounted sink (position from the plan)
    BR(47, 58, 196, 141, 0.88, 0.04, M.stone); BR(258, 58, 529, 141, 0.88, 0.04, M.stone);
    BR(196, 58, 258, 75, 0.88, 0.04, M.stone); BR(196, 125, 258, 141, 0.88, 0.04, M.stone);
    BR(47, 141, 143, 215, 0.88, 0.04, M.stone);
    BR(195, 74, 259, 126, 0.69, 0.008, M.steel);
    BR(195, 74, 196, 126, 0.69, 0.2, M.steel); BR(258, 74, 259, 126, 0.69, 0.2, M.steel);
    BR(195, 74, 259, 75, 0.69, 0.2, M.steel); BR(195, 125, 259, 126, 0.69, 0.2, M.steel);
    var f = GP(227, 67, 0); C(f, 0.012, 0.014, 0.26, M.steel, 0, 0.92, 0, 12);
    var arc = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.011, 8, 20, Math.PI), M.steel); arc.rotation.y = -Math.PI / 2; arc.position.set(0, 1.18, 0.07); arc.castShadow = true; f.add(arc);
    C(f, 0.011, 0.011, 0.05, M.steel, 0, 1.13, 0.14, 10); B(f, 0.012, 0.012, 0.07, M.steel, 0.05, 0.96, 0.02);
    // Cooktop and oven (position from the plan)
    BR(390, 68, 465, 131, 0.92, 0.006, M.blackGlass);
    [[409, 84, 0.07], [446, 84, 0.09], [409, 116, 0.085], [446, 116, 0.07]].forEach(function (p) {
      var r = new THREE.Mesh(new THREE.RingGeometry(p[2] - 0.004, p[2], 32), std('#6d6d70', 0.4)); r.rotation.x = -Math.PI / 2; r.position.set(wx(p[0]), 0.9275, wz(p[1])); scene.add(r);
    });
    BR(389, 138, 466, 139, 0.16, 0.6, M.blackGlass); BR(394, 139, 461, 141, 0.7, 0.018, M.steel);
    // Stone splashback
    BR(47, 58, 529, 59.6, 0.92, 0.53, M.stone); BR(47, 58, 48.6, 215, 0.92, 0.53, M.stone);
    // Wall cabinets with a recessed light strip, and the bulkhead above
    BR(93, 58, 529, 104, 1.45, 0.95, M.cabLight, high); BR(47, 58, 93, 215, 1.45, 0.95, M.cabLight, high);
    for (i = 1; i < 8; i++) BR(93 + i * 54.5 - 0.3, 104, 93 + i * 54.5 + 0.3, 104.4, 1.45, 0.95, M.groove, high);
    [110, 162].forEach(function (y) { BR(93, y - 0.3, 93.4, y + 0.3, 1.45, 0.95, M.groove, high); });
    BR(47, 58, 529, 104, 2.4, 0.3, M.wall, high); BR(47, 104, 93, 215, 2.4, 0.3, M.wall, high);
    BR(100, 92, 522, 95, 1.442, 0.008, M.glow, high, true); BR(82, 110, 85, 210, 1.442, 0.008, M.glow, high, true);
    // Integrated fridge and pantry (tall block where the plan shows them)
    BR(47, 215, 138, 360, 0, 0.1, M.groove); BR(47, 215, 146, 360, 0.1, 2.3, M.cabLight); BR(47, 215, 146, 360, 2.4, 0.3, M.wall, high);
    BR(146, 315, 146.4, 315.6, 0.1, 2.3, M.groove); BR(146, 265, 146.4, 265.6, 0.1, 2.3, M.groove); BR(146, 215, 146.4, 315, 0.82, 0.006, M.groove);
    OR(47, 58, 146, 360); OR(140, 58, 529, 141);
    // Counter styling
    var b1 = BR(60, 150, 64, 190, 0.92, 0.36, M.oakDark); b1.rotation.z = -0.12; var b2 = BR(66, 158, 69, 186, 0.92, 0.28, M.oak); b2.rotation.z = -0.16;
    vase(scene, wx(495), 0.92, wz(80), 0.9, M.matte, 0); vase(scene, wx(508), 0.92, wz(98), 0.6, M.clay, 0);
    C(scene, 0.05, 0.045, 0.14, M.ceramic, wx(330), 0.92, wz(76), 20); C(scene, 0.05, 0.045, 0.11, M.ceramic, wx(350), 0.92, wz(80), 20);

    // Island exactly on the plan rectangle (244,246)–(410,317): oak body, stone waterfall ends
    var g = GP(327, 281.5, 0), w = 166 * S, d = 71 * S;
    B(g, w - 0.08, 0.88, d - 0.19, M.oakDark, 0, 0, -0.095); B(g, w, 0.04, d, M.stone, 0, 0.88, 0);
    B(g, 0.04, 0.88, d, M.stone, -w / 2 + 0.02, 0, 0); B(g, 0.04, 0.88, d, M.stone, w / 2 - 0.02, 0, 0);
    obsG(g, w, d);
    lathe(g, [[0, 0], [0.07, 0], [0.16, 0.05], [0.17, 0.07], [0.15, 0.055], [0.06, 0.012], [0, 0.012]], M.clay, -0.25, 0.92, 0);
    [['#c9b458', 0.04, 0], ['#bca94e', -0.03, 0.04], ['#8a9a5b', 0, -0.045]].forEach(function (p) {
      var s = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), std(p[0], 0.6)); s.position.set(-0.25 + p[1], 0.975, p[2]); s.castShadow = true; g.add(s);
    });
    vase(g, 0.34, 0.92, -0.05, 0.9, M.ceramic, 5);
    [285, 369].forEach(function (x) {
      var s = GP(x, 351, 0);
      RB(s, 0.4, 0.07, 0.38, 0.1, M.boucle, 0, 0.64, 0); RB(s, 0.38, 0.2, 0.05, 0.02, M.boucle, 0, 0.74, 0.175);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { C(s, 0.011, 0.011, 0.65, M.black, q[0] * 0.15, 0, q[1] * 0.14, 8); });
      var ft = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 6, 4), M.black); ft.rotation.set(Math.PI / 2, 0, Math.PI / 4); ft.position.y = 0.24; s.add(ft);
      obsG(s, 0.36, 0.34);
      // Pendant above
      var p = GP(x, 281.5, 0, high); C(p, 0.003, 0.003, H - 1.83, M.black, 0, 1.83, 0, 5, true); C(p, 0.03, 0.03, 0.012, M.brass, 0, H - 0.012, 0, 16, true);
      C(p, 0.02, 0.02, 0.05, M.brass, 0, 1.8, 0, 12, true);
      var gl = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), M.glow); gl.position.y = 1.72; p.add(gl);
    });
    pointLight(327, 281.5, 1.6, 60, 7, true);
    pointLight(300, 122, 1.36, 9, 2.6, false, '#ffdcb0');
    [[200, 190], [330, 190], [460, 190], [200, 400], [330, 420]].forEach(function (p) { downlight(p[0], p[1]); });
  })();

  /* ─────────────────────────────── living ──────────────────────────────── */
  (function living() {
    // Rug
    var rug = BR(606, 185, 896, 400, 0.001, 0.012, M.rug, scene, true);
    // Sofa against the bedroom wall, facing the media wall
    var s = GP(750, 430, Math.PI), i;
    [[-0.98, -0.38], [0.98, -0.38], [-0.98, 0.38], [0.98, 0.38]].forEach(function (q) { C(s, 0.018, 0.014, 0.1, M.oakDark, q[0], 0, q[1], 8); });
    RB(s, 2.1, 0.2, 0.92, 0.05, M.cream, 0, 0.1, 0); RB(s, 2.1, 0.5, 0.2, 0.07, M.cream, 0, 0.3, -0.36);
    RB(s, 0.18, 0.32, 0.92, 0.07, M.cream, -0.96, 0.3, 0); RB(s, 0.18, 0.32, 0.92, 0.07, M.cream, 0.96, 0.3, 0);
    for (i = -1; i <= 1; i++) {
      RB(s, 0.57, 0.15, 0.68, 0.06, M.cream, i * 0.58, 0.3, 0.1);
      RB(s, 0.57, 0.38, 0.16, 0.07, M.cream, i * 0.58, 0.45, -0.2).rotation.x = -0.16;
    }
    var p1 = RB(s, 0.42, 0.42, 0.12, 0.05, M.taupe, -0.68, 0.45, -0.04); p1.rotation.set(-0.3, 0.35, 0);
    var p2 = RB(s, 0.4, 0.4, 0.12, 0.05, M.linen, 0.7, 0.45, -0.04); p2.rotation.set(-0.3, -0.3, 0);
    var p3 = RB(s, 0.5, 0.26, 0.1, 0.05, M.beige, 0.5, 0.45, 0.06); p3.rotation.set(-0.35, -0.12, 0);
    B(s, 0.2, 0.014, 0.5, M.beige, -0.96, 0.62, 0.1); B(s, 0.014, 0.42, 0.5, M.beige, -1.058, 0.21, 0.1); B(s, 0.014, 0.2, 0.5, M.beige, -0.862, 0.43, 0.1);
    obsG(s, 2.1, 0.92);
    // Coffee tables: travertine drum and a smaller oak one
    C(scene, 0.4, 0.4, 0.3, M.stone, wx(735), 0.012, wz(300), 40); addObs(wx(735), wz(300), 0.36, 0.36, 0);
    C(scene, 0.24, 0.24, 0.4, M.oakDark, wx(800), 0.012, wz(322), 32); addObs(wx(800), wz(322), 0.2, 0.2, 0);
    books(scene, wx(725), 0.312, wz(305), 0.4);
    lathe(scene, [[0, 0], [0.05, 0], [0.11, 0.04], [0.115, 0.05], [0.1, 0.04], [0.04, 0.01], [0, 0.01]], M.matte, wx(752), 0.312, wz(285));
    vase(scene, wx(800), 0.412, wz(322), 0.8, M.ceramic, 4);
    // Wall-hung media console and television on the north wall
    var m = onWall(750, 58, 0, 1);
    B(m, 1.6, 0.34, 0.4, M.oak, 0, 0.26, 0.2); [-0.27, 0.27].forEach(function (x) { B(m, 0.004, 0.3, 0.004, M.groove, x, 0.28, 0.401); });
    B(m, 1.5, 0.006, 0.02, M.glow, 0, 0.25, 0.06, true);
    B(m, 1.24, 0.71, 0.028, M.black, 0, 1.0, 0.035); B(m, 1.21, 0.68, 0.004, M.blackGlass, 0, 1.015, 0.05);
    books(m, -0.56, 0.6, 0.2, 0.2); vase(m, 0.6, 0.6, 0.2, 1, M.clay, 0); vase(m, 0.45, 0.6, 0.24, 0.6, M.matte, 0);
    obsG(m, 1.6, 0.4, 0, 0.2);
    // Lounge chair by the window
    var c = GP(915, 240, -Math.PI / 2 - 0.12);
    RB(c, 0.76, 0.26, 0.76, 0.2, M.boucle, 0, 0.1, 0); RB(c, 0.76, 0.36, 0.2, 0.09, M.boucle, 0, 0.36, -0.28);
    RB(c, 0.16, 0.2, 0.56, 0.07, M.boucle, -0.3, 0.36, 0.08); RB(c, 0.16, 0.2, 0.56, 0.07, M.boucle, 0.3, 0.36, 0.08);
    RB(c, 0.46, 0.1, 0.5, 0.1, M.boucle, 0, 0.36, 0.1);
    [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(function (q) { C(c, 0.016, 0.012, 0.1, M.oakDark, q[0], 0, q[1], 8); });
    obsG(c, 0.76, 0.76);
    // Floor lamp tucked beside the sofa
    var fl = GP(912, 448, 0); C(fl, 0.14, 0.14, 0.02, M.black, 0, 0, 0, 24); C(fl, 0.009, 0.009, 1.38, M.black, 0, 0.02, 0, 8);
    lampShade(fl, 0.19, 0.26, 0, 1.36, 0, 26, 5.5); obsG(fl, 0.2, 0.2);
    plant(566, 455, 1.25, 1.15); plant(973, 72, 0.75, 0.9);
    art(onWall(750, 491, 0, -1), 1.45, 0.95, 1.2, 0);
    curtain(984, 62, 984, 96, 4); curtain(984, 250, 984, 276, 3);
    pointLight(755, 265, 2.42, 70, 8, true);
    [[640, 170], [860, 170], [640, 370], [860, 370]].forEach(function (p) { downlight(p[0], p[1]); });
  })();

  /* ──────────────────────────────── hall ───────────────────────────────── */
  (function hall() {
    var g = onWall(213, 546, 0, -1);
    B(g, 0.78, 0.04, 0.26, M.oak, 0, 0.8, 0.13); B(g, 0.02, 0.8, 0.02, M.black, -0.36, 0, 0.24); B(g, 0.02, 0.8, 0.02, M.black, 0.36, 0, 0.24);
    vase(g, 0.2, 0.84, 0.13, 0.9, M.matte, 5); lathe(g, [[0, 0], [0.05, 0], [0.09, 0.03], [0.095, 0.04], [0.08, 0.03], [0, 0.01]], M.clay, -0.2, 0.84, 0.13);
    art(g, 0.5, 0.65, 1.15, 2); obsG(g, 0.78, 0.26, 0, 0.13);
    BR(60, 430, 140, 520, 0.001, 0.01, M.taupe, scene, true);                                    // door mat
    pointLight(335, 590, 2.4, 26, 5, false);
    [[340, 560], [150, 478]].forEach(function (p) { downlight(p[0], p[1]); });
  })();

  /* ─────────────────────────────── bedroom ─────────────────────────────── */
  (function bedroom() {
    var n = Math.SQRT1_2, i;
    // Point on the inner face of the long south-east wall where the bed is centred
    var Px = 867, Py = 877, rot = Math.atan2(-n, -n);
    var bed = GP(Px - n * 1.15 / S, Py - n * 1.15 / S, rot);
    RB(bed, 1.62, 0.26, 2.08, 0.05, M.beige, 0, 0.06, 0);
    RB(bed, 1.52, 0.24, 2.0, 0.08, M.linen, 0, 0.32, 0);
    RB(bed, 1.68, 0.33, 1.5, 0.07, M.cream, 0, 0.29, 0.3);
    RB(bed, 1.68, 0.05, 0.3, 0.025, M.linen, 0, 0.61, -0.42);
    RB(bed, 1.7, 0.03, 0.5, 0.012, M.taupe, 0, 0.62, 0.72); B(bed, 0.012, 0.3, 0.5, M.taupe, -0.85, 0.34, 0.72); B(bed, 0.012, 0.3, 0.5, M.taupe, 0.85, 0.34, 0.72);
    [-0.37, 0.37].forEach(function (x) {
      RB(bed, 0.64, 0.56, 0.15, 0.07, M.cream, x, 0.56, -0.93).rotation.x = 0.2;
      RB(bed, 0.66, 0.4, 0.14, 0.07, M.linen, x, 0.56, -0.74).rotation.x = 0.5;
    });
    RB(bed, 0.6, 0.22, 0.1, 0.05, M.taupe, 0, 0.6, -0.5).rotation.x = 0.55;
    for (i = 0; i < 9; i++) RB(bed, 0.2, 1.15, 0.1, 0.045, M.beige, -0.8 + i * 0.2, 0, -1.09);  // channel-tufted headboard
    obsG(bed, 1.72, 2.24, 0, -0.03);
    [-1.03, 1.03].forEach(function (x, k) {
      B(bed, 0.42, 0.34, 0.38, M.oak, x, 0.14, -0.93); B(bed, 0.34, 0.14, 0.3, M.groove, x, 0, -0.93); B(bed, 0.4, 0.004, 0.004, M.groove, x, 0.31, -0.739);
      tableLamp(bed, x + (k ? 0.05 : -0.05), 0.48, -0.98);
      if (k) books(bed, x - 0.06, 0.48, -0.82, 0.3); else C(bed, 0.035, 0.03, 0.08, M.ceramic, x + 0.1, 0.48, -0.82, 16);
      obsG(bed, 0.42, 0.38, x, -0.93);
    });
    var rug = B(GP(Px - n * 1.9 / S, Py - n * 1.9 / S, rot), 2.3, 0.012, 1.5, M.rug, 0, 0.001, 0, true);
    art(onWall(Px, Py, -n, -n), 1.1, 0.7, 1.42, 1);
    // Dresser on the hall-side wall
    var d = onWall(422, 745, 1, 0);
    B(d, 1.3, 0.66, 0.45, M.oak, 0, 0.1, 0.225); B(d, 1.2, 0.1, 0.36, M.groove, 0, 0, 0.225);
    [0.32, 0.54].forEach(function (y) { B(d, 1.3, 0.004, 0.004, M.groove, 0, y, 0.451); }); B(d, 0.004, 0.66, 0.004, M.groove, 0, 0.1, 0.451);
    vase(d, -0.4, 0.76, 0.22, 1.1, M.matte, 6); books(d, 0.32, 0.76, 0.22, 0.2);
    lathe(d, [[0, 0], [0.05, 0], [0.1, 0.035], [0.105, 0.045], [0.09, 0.035], [0, 0.01]], M.clay, 0.32, 0.85, 0.22);
    art(d, 0.7, 0.9, 1.05, 3); obsG(d, 1.3, 0.45, 0, 0.225);
    plant(938, 536, 1.1, 1.1);
    curtain(1004, 430, 1022, 448, 3); curtain(1140, 566, 1158, 584, 3);
    pointLight(700, 668, 2.42, 62, 8, true);
    [[520, 580], [660, 600], [860, 580], [1010, 640], [560, 790]].forEach(function (p) { downlight(p[0], p[1]); });
  })();

  /* ───────────────────────────────── bath ──────────────────────────────── */
  var mirror = null;
  (function bath() {
    BR(47, 698, 413, 966, 0.001, 0.006, M.tile, scene, true);                                    // porcelain floor
    BR(289, 682, 403, 698, 0.001, 0.008, M.stone, scene, true);                                  // threshold
    // Tub alcove: tiled on three sides, tub where the plan shows it
    BR(47, 698, 49.2, 897, 0, H, M.tile); BR(47, 698, 150, 700.2, 0, H, M.tile);
    wall(47, 897, 150, 897, 6, null, { mat: M.tile, noBase: true });
    var t = GP(98.5, 797, 0), sh = rrect(0.76, 1.48, 0.07), hole = new THREE.Path();
    var hp = rrect(0.62, 1.34, 0.16).getPoints(6); hole.setFromPoints(hp.reverse()); sh.holes.push(hole);
    var tg = new THREE.ExtrudeGeometry(sh, { depth: 0.56, bevelEnabled: false, curveSegments: 6 }); tg.rotateX(-Math.PI / 2);
    mesh(t, tg, M.ceramic); B(t, 0.66, 0.02, 1.38, M.ceramic, 0, 0.1, 0);
    OR(47, 698, 150, 900);
    var fx = onWall(98, 700.2, 0, 1);
    C(fx, 0.05, 0.05, 0.012, M.steel, 0, 1.1, 0.006, 20).rotation.x = Math.PI / 2; B(fx, 0.02, 0.02, 0.07, M.steel, 0, 1.1, 0.04);
    B(fx, 0.03, 0.03, 0.14, M.steel, 0, 0.66, 0.07); C(fx, 0.01, 0.01, 0.36, M.steel, 0, 2.05, 0, 8).rotation.x = Math.PI / 2;
    C(fx, 0.11, 0.11, 0.012, M.steel, 0, 2.03, 0.36, 28);
    BR(149.4, 700, 150.6, 805, 0.56, 1.5, M.showerGlass, scene, true);
    // Linen cupboard
    BR(47, 900, 150, 966, 0, H, M.cabLight); BR(150, 933, 150.4, 933.6, 0, H, M.groove); OR(47, 897, 150, 966);
    [[150.4, 927], [150.4, 939]].forEach(function (p) { BR(p[0], p[1] - 0.6, p[0] + 1.2, p[1] + 0.6, 0.95, 0.2, M.black); });
    // Half-height tiling behind toilet and vanity
    BR(150, 963.8, 413, 966, 0, 1.2, M.tile); BR(150, 962.6, 413, 966, 1.2, 0.02, M.stone);
    // Toilet under the window
    var wc = onWall(219, 963.8, 0, -1);
    var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.4, 28), M.ceramic); bowl.scale.set(1, 1, 1.35); bowl.position.set(0, 0.2, 0.4); bowl.castShadow = bowl.receiveShadow = true; wc.add(bowl);
    var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.035, 28), M.ceramic); lid.scale.set(1, 1, 1.35); lid.position.set(0, 0.418, 0.4); lid.castShadow = true; wc.add(lid);
    RB(wc, 0.38, 0.8, 0.17, 0.03, M.ceramic, 0, 0, 0.085); B(wc, 0.1, 0.008, 0.05, M.steel, 0, 0.8, 0.085);
    obsG(wc, 0.4, 0.68, 0, 0.34);
    // Floating vanity with vessel basin, where the plan shows the sink
    BR(291, 893, 413, 964, 0.47, 0.35, M.oak); BR(289, 891, 413, 964, 0.82, 0.04, M.stone);
    BR(291, 893, 413, 893.4, 0.64, 0.005, M.groove); OR(289, 891, 413, 966);
    lathe(scene, [[0, 0], [0.09, 0], [0.19, 0.11], [0.2, 0.125], [0.185, 0.115], [0.08, 0.02], [0, 0.02]], M.ceramic, wx(345), 0.86, wz(926)).scale.z = 0.8;
    var vf = GP(345, 954, Math.PI); C(vf, 0.013, 0.015, 0.3, M.steel, 0, 0.86, 0, 12); B(vf, 0.02, 0.016, 0.15, M.steel, 0, 1.14, 0.065); B(vf, 0.012, 0.05, 0.012, M.steel, 0.03, 1.16, 0);
    RB(scene, 0.24, 0.05, 0.16, 0.02, M.linen, wx(392), 0.86, wz(915)); RB(scene, 0.23, 0.05, 0.15, 0.02, M.beige, wx(392), 0.91, wz(915));
    C(scene, 0.028, 0.028, 0.13, M.clay, wx(304), 0.86, wz(945), 14); C(scene, 0.006, 0.006, 0.04, M.black, wx(304), 0.99, wz(945), 6);
    // Mirror with a backlit halo
    var mw = onWall(351, 962.6, 0, -1), MW = 0.84, MH = 0.88;
    B(mw, MW + 0.04, MH + 0.04, 0.012, M.glow, 0, 1.3, 0.012, true);
    if (THREE.Reflector) {
      mirror = new THREE.Reflector(new THREE.PlaneGeometry(MW, MH), { textureWidth: 1024, textureHeight: 1024, clipBias: 0.003, color: 0x7f7f7f });
      mirror.position.set(0, 1.32 + MH / 2, 0.034); mw.add(mirror);
    } else B(mw, MW, MH, 0.004, std('#ffffff', 0.03, { metalness: 1 }), 0, 1.32, 0.032, true);
    B(mw, MW, MH, 0.02, M.black, 0, 1.32, 0.022, true);
    BR(156, 760, 208, 862, 0.007, 0.012, M.linen, scene, true);                                  // bath mat
    pointLight(250, 815, 2.42, 44, 6, true, '#fff0dc');
    pointLight(351, 935, 1.9, 7, 2.2, false, '#ffe2bd');
    [[98, 800], [250, 780], [330, 880]].forEach(function (p) { downlight(p[0], p[1]); });
  })();

  /* ───────────────────────── daylight and surroundings ─────────────────── */
  var sky = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 90, 48, 1, true),
    new THREE.MeshBasicMaterial({ map: tex(skyCanvas()), side: THREE.BackSide, toneMapped: false, fog: false }));
  sky.position.y = 13; scene.add(sky);
  var sun = new THREE.DirectionalLight('#fff0d8', 4.2);
  sun.position.set(13, 11.5, -5.5); sun.target.position.set(0, 0, 0); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  var sc = sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 1; sc.far = 40;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5; scene.add(sun);
  scene.add(new THREE.HemisphereLight('#f4f1ea', '#cdb596', 0.12));
  // Image-based fill light standing in for bounce light: a pale room with two bright openings.
  (function env() {
    var es = new THREE.Scene(), bm = function (r, g, b) { var m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); m.color.setRGB(r, g, b); return m; };
    var room = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 10), [bm(0.2, 0.19, 0.175), bm(0.2, 0.19, 0.175), bm(0.25, 0.24, 0.225), bm(0.15, 0.12, 0.09), bm(0.2, 0.19, 0.175), bm(0.2, 0.19, 0.175)]);
    es.add(room);
    var w1 = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), bm(2.6, 2.7, 2.9)); w1.position.set(4.9, 0.1, 0); w1.rotation.y = -Math.PI / 2; es.add(w1);
    var w2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.8), bm(1.5, 1.55, 1.65)); w2.position.set(0, 0.1, -4.9); es.add(w2);
    var pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(es, 0.03).texture; pm.dispose();
  })();
  scene.background = new THREE.Color('#e9edf0');

  /* ───────────────────────────── cameras, input ────────────────────────── */
  var cam = new THREE.PerspectiveCamera(66, 1, 0.05, 300); cam.rotation.order = 'YXZ';
  var ortho = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 60);
  ortho.position.set(0, 30, 0); ortho.up.set(0, 0, -1); ortho.lookAt(0, 0, 0);
  var marker = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 3), new THREE.MeshBasicMaterial({ color: '#c2562f', toneMapped: false }));
  marker.rotation.x = -Math.PI / 2; var markerG = new THREE.Group(); markerG.add(marker); markerG.visible = false; scene.add(markerG);

  var pos = { x: 0, z: 0 }, yaw = 0, pitch = 0, plan = false, dirty = true;
  var VIEWS = {
    entry: [118, 476, 640, 330], kitchen: [480, 400, 250, 110], living: [560, 150, 800, 400],
    bedroom: [468, 572, 880, 760], bath: [350, 722, 215, 930]
  };
  function go(name) {
    var v = VIEWS[name]; if (!v) return;
    pos.x = wx(v[0]); pos.z = wz(v[1]);
    yaw = Math.atan2(-(wx(v[2]) - pos.x), -(wz(v[3]) - pos.z)); pitch = -0.06;
    setPlan(false); dirty = true;
  }
  function roomAt() {
    var x = pos.x / S + CX, y = pos.z / S + CY;
    if (x < 31 || x > 1182 || y < 43 || y > 1133) return 'Outside';
    if (x < 413 && y > 698) return 'Bath';
    if (x > 418 && y > 497 && (x < 912 || x + y > 1409)) return (x - y < -297 && y > 852) ? 'Bedroom closet' : 'Bedroom';
    if (x < 530 && y < 400) return 'Kitchen';
    if (x >= 530 && y < 497) return 'Living';
    return 'Hall';
  }
  var planBtn = document.getElementById('planBtn'), roomLabel = document.getElementById('room'), hint = document.getElementById('hint');
  function setPlan(on) {
    plan = on; high.visible = !on; markerG.visible = on; routeG.visible = on; sky.visible = !on;
    if (on && tour.on) { tour.on = false; tourUI(); }
    planBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    planBtn.textContent = on ? 'Walk through' : 'Plan view';
    hint.textContent = on ? 'Ceiling lifted. Tap any clear floor to stand there.'
      : (coarse ? 'Drag to look around. Use the pad to walk.' : 'Drag to look. W A S D or arrow keys to walk, Shift to move faster.');
    document.body.classList.toggle('plan', on);
    dirty = true;
  }
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.fov = w < h ? 78 : 66; cam.updateProjectionMatrix();
    var hw = 4.7, hh = 4.5, a = w / h;
    if (a > hw / hh) hw = hh * a; else hh = hw / a;
    ortho.left = -hw; ortho.right = hw; ortho.top = hh; ortho.bottom = -hh; ortho.updateProjectionMatrix();
    dirty = true;
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  var keys = {}, drag = null, stick = { x: 0, y: 0 };
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|BUTTON/.test(e.target.tagName) && e.key === ' ') return;
    keys[e.code] = true;
    if (/^Arrow/.test(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; });
  canvas.addEventListener('pointerdown', function (e) {
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag || drag.id !== e.pointerId || plan) return;
    if (tour.on) { if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return; tourPause(); }
    var k = (e.pointerType === 'touch' ? 0.0052 : 0.0034);
    yaw -= (e.clientX - drag.x) * k; pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - drag.y) * k));
    drag.x = e.clientX; drag.y = e.clientY; dirty = true;
  });
  function endDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    if (plan && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 8) {
      var r = canvas.getBoundingClientRect();
      var x = ortho.left + (e.clientX - r.left) / r.width * (ortho.right - ortho.left);
      var z = -(ortho.top - (e.clientY - r.top) / r.height * (ortho.top - ortho.bottom));
      var px = x / S + CX, py = z / S + CY, inside = false;
      for (var i = 0, j = FOOT.length - 1; i < FOOT.length; j = i++) {
        var a = FOOT[i], b = FOOT[j];
        if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      }
      if (inside && !blocked(x, z)) { pos.x = x; pos.z = z; pitch = -0.05; setPlan(false); }
      else hint.textContent = 'That spot is occupied. Tap clear floor inside the apartment.';
    }
    drag = null;
  }
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', function () { drag = null; });

  var pad = document.getElementById('pad'), knob = document.getElementById('knob'), padId = null;
  function padMove(e) {
    var r = pad.getBoundingClientRect(), dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    var l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    stick.x = dx; stick.y = dy; knob.style.transform = 'translate(' + dx * 26 + 'px,' + dy * 26 + 'px)';
  }
  pad.addEventListener('pointerdown', function (e) { padId = e.pointerId; try { pad.setPointerCapture(padId); } catch (err) { /* ignore */ } padMove(e); e.preventDefault(); });
  pad.addEventListener('pointermove', function (e) { if (e.pointerId === padId) padMove(e); });
  function padEnd(e) { if (e.pointerId === padId) { padId = null; stick.x = stick.y = 0; knob.style.transform = ''; } }
  pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);

  Array.prototype.forEach.call(document.querySelectorAll('[data-room]'), function (b) {
    b.addEventListener('click', function () { tourPause(); go(b.getAttribute('data-room')); });
  });
  planBtn.addEventListener('click', function () { setPlan(!plan); });
  var notes = document.getElementById('notes');
  document.getElementById('notesBtn').addEventListener('click', function () { notes.hidden = !notes.hidden; });
  document.getElementById('notesClose').addEventListener('click', function () { notes.hidden = true; });


  /* ───────────────────────── guided camera walkthrough ─────────────────── */
  // Five stops. At each one the camera pans slowly across the room (bearings in plan degrees:
  // 0 = east, 90 = south, 180 = west, 270 = north), then eases on to the next stop.
  var STOPS = [
    { n: 'Entry', p: [115, 476], pan: [-55, 25] },
    { n: 'Living', p: [950, 120], pan: [100, 200] },
    { n: 'Bath', p: [340, 740], pan: [65, 185] },
    { n: 'Bedroom door', p: [470, 570], pan: [-8, 78] },
    { n: 'Bedroom', p: [900, 600], pan: [95, 205] }
  ];
  var VIA = [
    [[200, 445], [330, 435], [480, 415], [565, 345], [625, 235], [700, 180], [800, 165], [885, 145]],
    [[885, 143], [800, 158], [700, 180], [625, 245], [570, 350], [540, 400], [445, 440], [375, 470], [350, 545], [346, 650]],
    [[347, 660], [358, 590], [405, 572]],
    [[560, 572], [650, 550], [735, 545], [830, 560]]
  ];
  var D2R = Math.PI / 180;
  function bearingYaw(deg) { return -(deg * D2R + Math.PI / 2); }
  var LEGS = VIA.map(function (via, i) {
    var pts = [STOPS[i].p].concat(via, [STOPS[i + 1].p]).map(function (q) { return new THREE.Vector3(wx(q[0]), 0, wz(q[1])); });
    var c = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); c.arcLengthDivisions = 600;
    return { curve: c, len: c.getLength() };
  });
  STOPS.forEach(function (st) { st.dur = Math.max(7, Math.abs(st.pan[1] - st.pan[0]) / 11); });   // about 11 degrees per second
  var tour = { on: false, leg: 0, s: 0, t: 0, v: 0, yawVel: 0, phase: 'pan', started: false };
  var routeG = new THREE.Group(); routeG.visible = false; scene.add(routeG);
  (function drawRoute() {
    var red = new THREE.MeshBasicMaterial({ color: '#d0392b', depthTest: false, toneMapped: false });
    var blue = new THREE.MeshBasicMaterial({ color: '#2456d6', depthTest: false, toneMapped: false });
    LEGS.forEach(function (l) {
      var tube = new THREE.Mesh(new THREE.TubeGeometry(l.curve, 120, 0.028, 5, false), red);
      tube.position.y = 2.9; tube.renderOrder = 5; routeG.add(tube);
    });
    STOPS.forEach(function (st, i) {
      var cx = wx(st.p[0]), cz = wz(st.p[1]), pts = [], k, R = 0.62;
      for (k = 0; k <= 24; k++) { var bb = (st.pan[0] + (st.pan[1] - st.pan[0]) * k / 24) * D2R; pts.push(new THREE.Vector3(cx + Math.cos(bb) * R, 2.95, cz + Math.sin(bb) * R)); }
      var arc = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.022, 5, false), blue); arc.renderOrder = 5; routeG.add(arc);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 10), blue), e = pts[24], d = e.clone().sub(pts[22]).normalize();
      tip.position.copy(e); tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); tip.renderOrder = 5; routeG.add(tip);
      var c = cv(96, 96), g = c.getContext('2d');
      g.fillStyle = '#2e8b2e'; g.beginPath(); g.arc(48, 48, 42, 0, 6.3); g.fill(); g.lineWidth = 6; g.strokeStyle = '#fff'; g.stroke();
      g.fillStyle = '#fff'; g.font = '600 54px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), 48, 52);
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, toneMapped: false }));
      sp.scale.set(0.42, 0.42, 1); sp.position.set(cx, 3, cz); sp.renderOrder = 6; routeG.add(sp);
    });
  })();
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); }
  function angDiff(a, b) { var d = b - a; return Math.atan2(Math.sin(d), Math.cos(d)); }
  function angMix(a, b, w) { return a + angDiff(a, b) * w; }
  // Critically damped follow: the camera heading never changes speed abruptly.
  function followYaw(target, dt) {
    var T = 0.75, om = 2 / T, x = om * dt, ex = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    var lim = 38 * D2R * T, ch = Math.max(-lim, Math.min(lim, -angDiff(yaw, target))), tgt = yaw - ch;   // turn rate capped near 38 deg/s
    var tmp = (tour.yawVel + om * ch) * dt;
    tour.yawVel = (tour.yawVel - om * tmp) * ex;
    yaw = tgt + (ch + tmp) * ex;
  }
  var tourBtn = document.getElementById('tourBtn');
  function tourUI() {
    tourBtn.textContent = tour.on ? 'Pause tour' : (tour.started ? 'Resume tour' : 'Play tour');
    tourBtn.setAttribute('aria-pressed', tour.on ? 'true' : 'false');
    if (tour.on) {
      var i = tour.phase === 'pan' ? tour.leg : tour.leg + 1;
      hint.textContent = (tour.phase === 'pan' ? 'Stop ' : 'Moving to stop ') + (i + 1) + ' of ' + STOPS.length + ' · ' + STOPS[i].n + '. Drag or press a key to take over.';
    }
  }
  function panYaw(st, t) { return bearingYaw(st.pan[0] + (st.pan[1] - st.pan[0]) * smooth((t - 0.8) / st.dur)); }
  function tourPlace() {            // put the camera back on the route at the current tour position
    if (tour.phase === 'pan') { var st = STOPS[tour.leg]; pos.x = wx(st.p[0]); pos.z = wz(st.p[1]); yaw = panYaw(st, tour.t); }
    else { var q = LEGS[tour.leg].curve.getPointAt(tour.s / LEGS[tour.leg].len); pos.x = q.x; pos.z = q.z; }
    tour.v = 0; tour.yawVel = 0; tour.want = undefined; dirty = true;
  }
  function tourStop(i, f) {         // jump to a stop; f = 0..1 through its pan
    tour.leg = i; tour.phase = 'pan'; tour.t = 0.8 + (f || 0) * STOPS[i].dur; tourPlace(); pitch = -0.05;
  }
  function tourPlay() {
    if (plan) setPlan(false);
    if (!tour.started) { tour.leg = 0; tour.s = 0; tour.t = 0; tour.phase = 'pan'; tour.started = true; pitch = -0.05; }
    tourPlace(); tour.on = true; tourUI();
  }
  function tourPause() { if (!tour.on) return; tour.on = false; setPlan(plan); tourUI(); }
  function tourStep(dt) {
    pitch += (-0.05 - pitch) * (1 - Math.exp(-dt * 2));
    if (tour.phase === 'pan') {
      var st = STOPS[tour.leg];
      tour.t += dt; followYaw(panYaw(st, tour.t), dt);
      if (tour.t > st.dur + 1.6) {
        if (tour.leg >= LEGS.length) { tour.on = false; tour.started = false; setPlan(false); tourUI(); hint.textContent = 'Tour finished. Walk around freely, or play it again.'; }
        else { tour.phase = 'move'; tour.s = 0; tour.v = 0; tourUI(); }
      }
    } else {
      var L = LEGS[tour.leg], rem = L.len - tour.s, VMAX = 0.8, ACC = 0.32;
      var lag = Math.abs(angDiff(yaw, tour.want === undefined ? yaw : tour.want));
      var vt = Math.min(VMAX * (1 - 0.8 * smooth(lag / 1.2)), Math.sqrt(2 * ACC * Math.max(rem, 0)));   // slow for turns, brake into the stop
      tour.v = vt > tour.v ? Math.min(vt, tour.v + ACC * dt) : Math.max(vt, tour.v - 2 * ACC * dt);
      tour.s = Math.min(L.len, tour.s + tour.v * dt);
      var q = L.curve.getPointAt(tour.s / L.len), a = L.curve.getPointAt(Math.min(1, (tour.s + 0.9) / L.len));
      pos.x = q.x; pos.z = q.z;
      var along = Math.atan2(-(a.x - q.x), -(a.z - q.z));
      var want = angMix(bearingYaw(STOPS[tour.leg].pan[1]), along, smooth(tour.s / 1.5));
      want = angMix(bearingYaw(STOPS[tour.leg + 1].pan[0]), want, smooth((rem - 0.15) / 1.9));
      tour.want = want; followYaw(want, dt);
      if (rem < 0.0006 || (rem < 0.01 && tour.v < 0.01)) { tour.leg++; tour.phase = 'pan'; tour.t = 0; tourUI(); }
    }
    dirty = true;
  }
  tourBtn.addEventListener('click', function () { if (tour.on) tourPause(); else tourPlay(); });

  /* ─────────────────────────────── main loop ───────────────────────────── */
  var last = performance.now(), lastRoom = '';
  function frame(now) {
    requestAnimationFrame(frame);
    var last0 = last, dt = Math.min(0.05, (now - last) / 1000); last = now;
    var f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - stick.y;
    var r = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + stick.x;
    var turn = (keys.ArrowLeft || keys.KeyQ ? 1 : 0) - (keys.ArrowRight || keys.KeyE ? 1 : 0);
    if (tour.on && (f || r || turn)) tourPause();
    if (tour.on) tourStep(Math.min(0.1, (now - last0) / 1000));
    else if (!plan && (f || r || turn)) {
      yaw += turn * 1.7 * dt;
      var l = Math.hypot(f, r); if (l > 1) { f /= l; r /= l; }
      var sp = (keys.ShiftLeft || keys.ShiftRight ? 3 : 1.5) * dt, sy = Math.sin(yaw), cy = Math.cos(yaw);
      var steps = 2;
      for (var i = 0; i < steps; i++) {
        pos.x += (-sy * f + cy * r) * sp / steps; pos.z += (-cy * f - sy * r) * sp / steps;
        resolve(pos);
      }
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    cam.position.set(pos.x, EYE, pos.z); cam.rotation.set(pitch, yaw, 0);
    markerG.position.set(pos.x, 2.6, pos.z); markerG.rotation.y = yaw;
    var rm = roomAt(); if (rm !== lastRoom) { lastRoom = rm; roomLabel.textContent = rm; }
    renderer.render(scene, plan ? ortho : cam);
  }

  resize(); go('entry');
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;   // nothing moves: bake shadows once
  renderer.compile(scene, cam);
  document.getElementById('loading').hidden = true;
  requestAnimationFrame(frame);

  // Small API used for checks (and handy from the console).
  window.apartment = {
    go: go, setPlan: setPlan, S: S, CX: CX, CY: CY, obstacles: obstacles, mirror: mirror, renderer: renderer,
    pose: function (px, py, tx, ty, p) { pos.x = wx(px); pos.z = wz(py); yaw = Math.atan2(-(wx(tx) - pos.x), -(wz(ty) - pos.z)); pitch = p || 0; setPlan(false); },
    planBounds: function () { return { left: ortho.left, right: ortho.right, top: ortho.top, bottom: ortho.bottom }; },
    walk: function (dx, dz) { pos.x += dx; pos.z += dz; resolve(pos); dirty = true; return { x: pos.x / S + CX, y: pos.z / S + CY }; },
    render: function () { dirty = true; },
    tourStop: function (i, f) { setPlan(false); tourStop(i, f); }, tourStep: function (dt) { tourStep(dt); return { x: pos.x, z: pos.z, yaw: yaw, phase: tour.phase, leg: tour.leg, on: tour.on }; }, tourPlay: tourPlay, tour: tour,
    tourClearance: function () {            // samples of the path that come too close to anything solid
      var bad = [];
      LEGS.forEach(function (l, i) { l.curve.getSpacedPoints(200).forEach(function (q) { if (blocked(q.x, q.z)) bad.push([i + 1, Math.round(q.x / S + CX), Math.round(q.z / S + CY)]); }); });
      return bad;
    }
  };
})();
