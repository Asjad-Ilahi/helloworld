/* =========================================================
   سالگرہ مبارک — ماہ نور 🌸
   Names live here, so they are easy to change.
   ========================================================= */
const CONFIG = {
  her: "ماہ نور",   // her name
  me: "اسجد",       // your name
  autoScrollSpeed: 42 // pixels per second
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isMobile = () => window.innerWidth < 760;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const URDU_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toUrdu = (n) => Number(n).toLocaleString("en-US").replace(/\d/g, (d) => URDU_DIGITS[d]).replace(/,/g, "٬");

$$(".her-name").forEach((el) => (el.textContent = CONFIG.her));
$$(".my-name").forEach((el) => (el.textContent = CONFIG.me));
document.title = `سالگرہ مبارک ${CONFIG.her} 🌸`;

/* ---------------- emoji next to Nastaliq text: give them their own box ---------------- */
const EMOJI_RE = /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*)/gu;
function emojify(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.parentElement.closest(".em, script, style, svg, i")) continue;
    if (EMOJI_RE.test(n.nodeValue)) nodes.push(n);
    EMOJI_RE.lastIndex = 0;
  }
  nodes.forEach((n) => {
    const span = document.createElement("span");
    span.innerHTML = n.nodeValue.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))
      .replace(EMOJI_RE, '<span class="em">$1</span>');
    n.replaceWith(...span.childNodes);
  });
}
function setText(el, text) { el.textContent = text; emojify(el); }

/* ---------------- toast ---------------- */
const toastEl = $("#toast");
let toastTimer;
function toast(msg, ms = 2600) {
  setText(toastEl, msg);
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
}

/* =========================================================
   PETALS + HEARTS (one canvas over everything)
   ========================================================= */
const Petals = (() => {
  const cv = $("#petals");
  const ctx = cv.getContext("2d");
  const COLORS = ["#f9c3d5", "#f7b6cc", "#f4a3c0", "#fbd3e0", "#ffe1ea", "#f28fb2"];
  let W, H, dpr;
  let parts = [];
  let ambientTarget = 28;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function make(opts = {}) {
    return Object.assign({
      x: rnd(0, W), y: rnd(-60, -10),
      vx: rnd(-.3, .5), vy: rnd(.5, 1.3),
      g: 0, drag: 1,
      rot: rnd(0, Math.PI * 2), vr: rnd(-.03, .03),
      flip: rnd(0, Math.PI * 2), vf: rnd(.02, .06),
      size: rnd(6, 12),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      type: "petal",
      life: Infinity, age: 0, ambient: true,
      sway: rnd(.4, 1.2), phase: rnd(0, 6)
    }, opts);
  }

  function burst(x, y, n = 24, mix = "both") {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(2, 7);
      const heart = mix === "hearts" || (mix === "both" && Math.random() < .45);
      parts.push(make({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
        g: .12, drag: .975,
        size: heart ? rnd(7, 13) : rnd(6, 11),
        color: heart ? ["#e0457b", "#f28fb2", "#ff6f9f", "#d6457a"][(Math.random() * 4) | 0] : COLORS[(Math.random() * COLORS.length) | 0],
        type: heart ? "heart" : "petal",
        life: rnd(90, 160), ambient: false
      }));
    }
  }

  function dropFrom(x, y) {
    parts.push(make({ x, y, vx: rnd(-.2, .6), vy: rnd(.3, .8), life: 900, ambient: false, size: rnd(5, 9) }));
  }

  function drawPetal(p) {
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * .95, -s * .55, s * .7, s * .85, 0, s);
    ctx.bezierCurveTo(-s * .7, s * .85, -s * .95, -s * .55, 0, -s);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath();
    ctx.ellipse(-s * .2, -s * .2, s * .18, s * .45, -.3, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawHeart(p) {
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, s * .35);
    ctx.bezierCurveTo(-s * 1.1, -s * .35, -s * .45, -s * 1.1, 0, -s * .45);
    ctx.bezierCurveTo(s * .45, -s * 1.1, s * 1.1, -s * .35, 0, s * .35);
    ctx.fill();
  }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(3, (now - last) / 16.67); last = now;
    ctx.clearRect(0, 0, W, H);

    const ambientCount = parts.reduce((c, p) => c + (p.ambient ? 1 : 0), 0);
    if (ambientCount < ambientTarget && Math.random() < .25) parts.push(make());

    const wind = Math.sin(now * .0004) * .6;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      p.vx *= Math.pow(p.drag, dt); p.vy *= Math.pow(p.drag, dt);
      p.vy += p.g * dt;
      if (p.g && p.vy > 2.2) { p.g = 0; p.drag = 1; }
      p.x += (p.vx + (p.ambient || !p.g ? Math.sin(p.age * .03 + p.phase) * p.sway + wind : 0)) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt; p.flip += p.vf * dt;

      const fade = p.life === Infinity ? 1 : clamp((p.life - p.age) / 40, 0, 1);
      if (p.y > H + 30 || p.x < -60 || p.x > W + 60 || fade <= 0) { parts.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = fade * (p.type === "heart" ? .95 : .85);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(Math.cos(p.flip) * .8 + .2 * Math.sign(Math.cos(p.flip) || 1), 1);
      ctx.fillStyle = p.color;
      p.type === "heart" ? drawHeart(p) : drawPetal(p);
      ctx.restore();
    }
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);
  if (isMobile()) ambientTarget = 16;
  if (reduceMotion) ambientTarget = 6;
  requestAnimationFrame(tick);

  return { burst, dropFrom, setAmbient: (n) => (ambientTarget = isMobile() ? Math.round(n * .6) : n) };
})();

/* =========================================================
   CHERRY BLOSSOM TREE (procedural, grows + sways)
   ========================================================= */
const Tree = (() => {
  const cv = $("#tree");
  const ctx = cv.getContext("2d");
  const MAXD = 8;
  const FLOWER_COLORS = ["#fbd3e0", "#f7b6cc", "#f4a3c0", "#ffe6ee", "#f28fb2"];
  let W, H, dpr, root, scale = 1;
  let start = 0, running = false, visible = true, raf = 0;
  let flowerSpots = [];
  let lastDrop = 0;

  function gen(len, angle, w, d) {
    const n = { len, angle, w, d, kids: [], fl: [], phase: rnd(0, 6) };
    if (d < MAXD) {
      const k = d >= 2 && Math.random() < .22 ? 3 : 2;
      for (let i = 0; i < k; i++) {
        let spread;
        if (k === 2) spread = (i ? 1 : -1) * rnd(.28, .52);
        else spread = (i - 1) * rnd(.4, .6);
        n.kids.push(gen(len * rnd(.7, .8), spread + rnd(-.12, .12), w * .68, d + 1));
      }
    }
    if (d >= MAXD - 2) {
      const count = d === MAXD ? 6 : d === MAXD - 1 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        n.fl.push({
          t: rnd(.35, 1.05), off: rnd(-1, 1) * rnd(3, 16), r: rnd(3.2, 7.5),
          c: (Math.random() * FLOWER_COLORS.length) | 0,
          delay: Math.random(), five: Math.random() < .12, rot: rnd(0, 6)
        });
      }
    }
    return n;
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = isMobile() ? Math.min(W / 640, H / 1250) : Math.min(W / 1300, H / 820);
    scale = clamp(scale, .45, 1.35);
  }

  function build() {
    root = gen(150, 0, 22, 0);
  }

  const easeOut = (x) => 1 - Math.pow(1 - x, 3);

  function drawFive(x, y, r, rot, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      ctx.rotate(Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.ellipse(0, -r * .9, r * .62, r * .95, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#e0457b";
    ctx.beginPath(); ctx.arc(0, 0, r * .35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    raf = 0;
    if (!running || !visible) return;
    const t = now - start;
    const growth = reduceMotion ? 1 : clamp(t / 3400, 0, 1);
    const bloom = reduceMotion ? 1 : clamp((t - 2600) / 2200, 0, 1);
    const prog = growth * (MAXD + 1);

    ctx.clearRect(0, 0, W, H);
    const rootX = isMobile() ? W * .5 : W * .27;
    const rootY = H * (isMobile() ? .87 : .86);
    const paths = FLOWER_COLORS.map(() => new Path2D());
    const fives = [];
    flowerSpots.length = 0;

    ctx.lineCap = "round";

    (function draw(n, x, y, ang) {
      const local = clamp(prog - n.d, 0, 1);
      if (local <= 0) return;
      const sway = Math.sin(now * .0011 + n.phase + n.d * .55) * .022 * (n.d / MAXD) + Math.sin(now * .0006) * .006 * n.d;
      const a = ang + n.angle + sway;
      const L = n.len * scale * easeOut(local);
      const x2 = x + Math.sin(a) * L;
      const y2 = y - Math.cos(a) * L;

      const shade = 66 + n.d * 10;
      ctx.strokeStyle = `rgb(${shade + 40},${shade - 10},${shade - 6})`;
      ctx.lineWidth = Math.max(1, n.w * scale);
      ctx.beginPath(); ctx.moveTo(x, y);
      // slight curve for organic feel
      const mx = (x + x2) / 2 + Math.cos(a) * L * .06, my = (y + y2) / 2 + Math.sin(a) * L * .06;
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.stroke();

      if (bloom > 0 && local >= 1) {
        for (const f of n.fl) {
          const s = easeOut(clamp((bloom - f.delay * .6) / .4, 0, 1));
          if (s <= 0) continue;
          const fx = x + Math.sin(a) * L * f.t + Math.cos(a) * f.off * scale;
          const fy = y - Math.cos(a) * L * f.t + Math.sin(a) * f.off * scale;
          const r = f.r * scale * s * 1.25;
          if (f.five) fives.push([fx, fy, r * 1.15, f.rot + now * .0002, FLOWER_COLORS[f.c]]);
          else paths[f.c].arc(fx, fy, r, 0, Math.PI * 2), paths[f.c].moveTo(fx, fy);
          flowerSpots.push(fx, fy);
        }
      }
      if (local >= 1) for (const k of n.kids) draw(k, x2, y2, a);
    })(root, rootX, rootY, 0);

    ctx.globalAlpha = .92;
    paths.forEach((p, i) => { ctx.fillStyle = FLOWER_COLORS[i]; ctx.fill(p); });
    ctx.globalAlpha = 1;
    fives.forEach((f) => drawFive(...f));

    // let a petal drop from the tree now and then
    if (bloom >= 1 && flowerSpots.length && now - lastDrop > (isMobile() ? 700 : 380)) {
      lastDrop = now;
      const i = ((Math.random() * flowerSpots.length / 2) | 0) * 2;
      const rect = cv.getBoundingClientRect();
      Petals.dropFrom(rect.left + flowerSpots[i], rect.top + flowerSpots[i + 1]);
    }

    raf = requestAnimationFrame(frame);
  }

  function kick() { if (!raf && running && visible) raf = requestAnimationFrame(frame); }

  new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); }).observe(cv);
  window.addEventListener("resize", () => { layout(); kick(); });

  return {
    start() { layout(); build(); start = performance.now(); running = true; kick(); }
  };
})();

/* =========================================================
   MUSIC
   ========================================================= */
const song = $("#song");
const musicBtn = $("#musicBtn");
function fadeVolume(to, ms = 2500) {
  const from = song.volume, t0 = performance.now();
  (function step(now) {
    const k = clamp((now - t0) / ms, 0, 1);
    song.volume = from + (to - from) * k;
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
function playSong() {
  song.volume = 0;
  const p = song.play();
  if (p && p.catch) p.catch(() => musicBtn.classList.add("paused"));
  fadeVolume(.85, 3000);
  musicBtn.classList.remove("paused");
}
musicBtn.addEventListener("click", () => {
  if (song.paused) { playSong(); toast("🎵 دلربا دلنشیں"); }
  else { song.pause(); musicBtn.classList.add("paused"); }
});

/* =========================================================
   AUTO SCROLL (gentle, stops when she scrolls herself)
   ========================================================= */
const autoBtn = $("#autoBtn");
let auto = false, autoPos = 0, autoLast = 0;
function autoLoop(now) {
  if (!auto) return;
  const dt = Math.min(64, now - autoLast) / 1000; autoLast = now;
  autoPos += CONFIG.autoScrollSpeed * dt;
  const max = document.documentElement.scrollHeight - innerHeight;
  if (autoPos >= max) { window.scrollTo({ top: max, behavior: "instant" }); stopAuto(); return; }
  window.scrollTo({ top: autoPos, behavior: "instant" });
  requestAnimationFrame(autoLoop);
}
function startAuto() {
  if (auto) return;
  auto = true; autoPos = scrollY; autoLast = performance.now();
  autoBtn.textContent = "⏸"; autoBtn.title = "خودکار اسکرول روکو";
  requestAnimationFrame(autoLoop);
}
function stopAuto() {
  auto = false;
  autoBtn.textContent = "▶"; autoBtn.title = "خودکار اسکرول چلاؤ";
}
autoBtn.addEventListener("click", () => (auto ? stopAuto() : (startAuto(), toast("آرام سے نیچے چلتے ہیں… 🌸"))));
["wheel", "touchstart"].forEach((ev) => window.addEventListener(ev, () => auto && stopAuto(), { passive: true }));
window.addEventListener("keydown", (e) => {
  if (auto && ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(e.key)) stopAuto();
});

/* =========================================================
   OPEN THE LETTER
   ========================================================= */
const intro = $("#intro");
const envelope = $("#envelope");
const site = $("#site");
let opened = false;

envelope.addEventListener("click", () => {
  if (opened) return;
  opened = true;
  envelope.classList.add("open");
  playSong();

  const r = envelope.getBoundingClientRect();
  Petals.burst(r.left + r.width / 2, r.top + r.height / 2, 46, "both");

  setTimeout(() => {
    window.scrollTo(0, 0);
    document.body.classList.remove("locked");
    intro.classList.add("leaving");
    site.classList.add("show");
    site.setAttribute("aria-hidden", "false");
    $("#controls").hidden = false;
    Petals.setAmbient(34);
    Tree.start();
    startReveals();
    setTimeout(() => intro.classList.add("gone"), 1300);
    setTimeout(() => { if (scrollY < 20 && !reduceMotion) startAuto(); }, 6500);
  }, 2700);
});

/* =========================================================
   SCROLL REVEALS, COUNTERS, LETTER WORDS
   ========================================================= */
function startReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countUp(e.target);
      cio.unobserve(e.target);
    });
  }, { threshold: .6 });
  $$("[data-count]").forEach((el) => cio.observe(el));

  const lio = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    revealWords();
    lio.disconnect();
  }, { threshold: .2 });
  lio.observe($("#paper"));
}

function countUp(el) {
  const target = +el.dataset.count, t0 = performance.now(), dur = 2000;
  (function step(now) {
    const k = clamp((now - t0) / dur, 0, 1);
    el.textContent = toUrdu(Math.round(target * (1 - Math.pow(1 - k, 4))));
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

// split the letter into words so they fade in one by one
$$("#paper .words").forEach((p) => {
  p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
});
emojify(document.body);

function revealWords() {
  const words = $$("#paper .w");
  words.forEach((w, i) => setTimeout(() => w.classList.add("on"), reduceMotion ? 0 : i * 60));
}

/* progress bar */
const bar = $(".progress span");
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
}, { passive: true });

/* =========================================================
   FLIP CARDS
   ========================================================= */
$$(".card").forEach((c) => c.addEventListener("click", (e) => {
  c.classList.toggle("flipped");
  if (c.classList.contains("flipped")) Petals.burst(e.clientX, e.clientY, 12, "hearts");
}));

/* =========================================================
   LIGHTBOX
   ========================================================= */
const lb = $("#lightbox");
$$(".polaroid").forEach((p) => p.addEventListener("click", () => {
  const img = $("img", p);
  $("img", lb).src = img.src;
  $("img", lb).alt = img.alt;
  $("p", lb).textContent = $("figcaption", p).textContent;
  lb.hidden = false;
  stopAuto();
}));
lb.addEventListener("click", () => (lb.hidden = true));
window.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.hidden = true; });

/* =========================================================
   CAKE
   ========================================================= */
const candles = $$(".candle");
let wished = false;
function blow(c) {
  if (c.classList.contains("out")) return;
  c.classList.add("out");
  if (!wished && candles.every((x) => x.classList.contains("out"))) {
    wished = true;
    const r = $("#cakeEl").getBoundingClientRect();
    setTimeout(() => {
      Petals.burst(r.left + r.width / 2, r.top + r.height / 3, 70, "both");
      $("#wish").classList.add("show");
      toast("🎉 سالگرہ مبارک ہو " + CONFIG.her + "!");
    }, 400);
  }
}
candles.forEach((c) => c.addEventListener("click", () => blow(c)));
$("#blowAll").addEventListener("click", () => candles.forEach((c, i) => setTimeout(() => blow(c), i * 180)));

/* =========================================================
   REASONS I LOVE YOU
   ========================================================= */
const REASONS = [
  "تمہاری ہنسی — جو دنیا کی سب سے پیاری آواز ہے",
  "تم میری ہر بات بغیر کہے سمجھ جاتی ہو",
  "تمہاری آنکھیں، جن میں میرا سارا جہاں بستا ہے",
  "تم ناراض ہو کر بھی بہت پیاری لگتی ہو",
  "تم نے مجھے ایک بہتر انسان بنایا",
  "تمہارا میرا خیال رکھنے کا انداز",
  "تمہارے ساتھ خاموشی بھی باتیں کرتی ہے",
  "تمہاری دعائیں، جو ہر قدم پر میرے ساتھ ہیں",
  "تم میری سب سے اچھی دوست ہو",
  "ہر مشکل وقت میں تم نے میرا ساتھ دیا",
  "تمہارا دل — اتنا صاف، اتنا نرم",
  "تمہارے ساتھ ہر دن عید جیسا لگتا ہے",
  "تمہارے ساتھ مستقبل کے خواب دیکھنا سب سے خوبصورت لگتا ہے",
  "کیونکہ تم، تم ہو — اور تم جیسا کوئی نہیں",
  "کیونکہ اللہ نے تمہیں میرے نصیب میں لکھا ہے، ان شاء اللہ"
];
let order = [], ri = 0;
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
const reasonEl = $("#reason"), reasonCount = $("#reasonCount");
$("#nextReason").addEventListener("click", (e) => {
  if (ri >= order.length) { order = shuffle(REASONS); ri = 0; }
  reasonEl.classList.add("swap");
  setTimeout(() => {
    const line = document.createElement("span");
    setText(line, order[ri] + " 💗");
    reasonEl.replaceChildren(line);
    reasonCount.textContent = `${toUrdu(ri + 1)} / ${toUrdu(REASONS.length)}${ri + 1 === REASONS.length ? " — اور ہزاروں ایسی وجوہات جو لفظوں میں نہیں آ سکتیں" : ""}`;
    ri++;
    reasonEl.classList.remove("swap");
  }, 320);
  Petals.burst(e.clientX, e.clientY, 10, "hearts");
});

/* =========================================================
   HUG + START AGAIN
   ========================================================= */
let hugs = 0;
$("#hug").addEventListener("click", (e) => {
  hugs++;
  Petals.burst(e.clientX, e.clientY, 40, "hearts");
  Petals.burst(innerWidth / 2, innerHeight / 2, 30, "petals");
  const msgs = [
    `${CONFIG.me} کی طرف سے ایک بڑی سی جپھی 🤗💗`,
    "ایک اور… کیونکہ ایک کافی نہیں 🤗",
    `جپھیاں: ${toUrdu(hugs)} — اور ابھی بہت باقی ہیں 💕`
  ];
  toast(msgs[Math.min(hugs - 1, 2)]);
});
$("#again").addEventListener("click", () => { stopAuto(); window.scrollTo({ top: 0, behavior: "smooth" }); });

/* =========================================================
   TAP ANYWHERE → little bloom of petals and hearts
   ========================================================= */
document.addEventListener("pointerdown", (e) => {
  if (!opened) return;
  if (e.target.closest("button, a, .polaroid, .lightbox")) return;
  Petals.burst(e.clientX, e.clientY, 9, "both");
});
