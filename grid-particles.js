// 方眼の罫線に沿って、光の粒（データの流れ）が中心から外へ伸びていくアニメーション
//
// 使い方：方眼の背景と同じ位置・大きさに canvas を重ねて、属性で設定する
//   <canvas data-grid-particles
//           data-cell="64"                    方眼の間隔（px）
//           data-center="[data-hero-visual]"  中心にする要素（セレクタ）
//           data-center-x="80%" data-center-y="50%"  要素がない場合の中心（canvas 内の位置）
//           data-count="16"                   粒の数
//           data-radius="0.95"                消えるまでの距離（中心要素の幅に対する倍率。要素がない場合は canvas の幅に対する倍率）
//   ></canvas>
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const BRAND = "67, 156, 228";
  const TRAIL = 90; // 光の尾の長さ（px）
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const rand = (min, max) => min + Math.random() * (max - min);

  function init(canvas) {
    const ctx = canvas.getContext("2d");
    const CELL = Number(canvas.dataset.cell) || 64;
    const COUNT = Number(canvas.dataset.count) || 12;
    const RADIUS_RATE = Number(canvas.dataset.radius) || 0.95;
    const visual = canvas.dataset.center ? canvas.parentElement.querySelector(canvas.dataset.center) : null;

    let width = 0;
    let height = 0;
    let center = { x: 0, y: 0, gx: 0, gy: 0 };
    let radius = 400; // ここまで伸びたら消える
    let packets = [];
    let pulses = [];
    let running = false;
    let last = 0;

    const line = (n) => n * CELL + 0.5; // 罫線は各マスの先頭1pxに引かれている
    const distance = (x, y) => Math.hypot(x - center.x, y - center.y);
    // 中心からの距離に応じた濃さ（中心付近は濃く、radius で 0）
    const fade = (x, y) => {
      const t = Math.min(distance(x, y) / radius, 1);
      return 1 - t * t * (3 - 2 * t);
    };

    // 中心から遠ざかる向きだけを選ぶ（戻ってこない）
    function outward(x, y, exclude) {
      return DIRS.filter(
        ([dx, dy]) => dx * (x - center.x) >= 0 && dy * (y - center.y) >= 0 && !(exclude && dx === -exclude[0] && dy === -exclude[1]),
      );
    }

    function spawn(delay) {
      const gx = center.gx + Math.round(rand(-1, 1));
      const gy = center.gy + Math.round(rand(-1, 1));
      const x = line(gx);
      const y = line(gy);
      const options = outward(x, y);
      return {
        gx,
        gy,
        x,
        y,
        dir: options[Math.floor(rand(0, options.length))],
        speed: rand(30, 60),
        wait: delay,
        corners: [{ x, y }], // 尾の根元（出発点）
      };
    }

    function turn(p) {
      // 曲がるのは4割ほど。外向きの道がなければそのまま進む
      if (Math.random() < 0.6) return p.dir;
      const options = outward(p.x, p.y, p.dir).filter(([dx, dy]) => !(dx === p.dir[0] && dy === p.dir[1]));
      return options.length ? options[Math.floor(rand(0, options.length))] : p.dir;
    }

    function step(p, dt) {
      if (p.wait > 0) {
        p.wait -= dt;
        return true;
      }
      let move = p.speed * dt;
      while (move > 0) {
        const tx = line(p.gx + p.dir[0]);
        const ty = line(p.gy + p.dir[1]);
        const dist = Math.abs(tx - p.x) + Math.abs(ty - p.y);
        if (move < dist) {
          p.x += p.dir[0] * move;
          p.y += p.dir[1] * move;
          break;
        }
        // 交差点に到着
        move -= dist;
        p.x = tx;
        p.y = ty;
        p.gx += p.dir[0];
        p.gy += p.dir[1];
        const next = turn(p);
        if (next !== p.dir) p.corners.unshift({ x: p.x, y: p.y });
        p.dir = next;
        if (Math.random() < 0.1 && fade(p.x, p.y) > 0.3) pulses.push({ x: p.x, y: p.y, t: 0 });
      }
      return distance(p.x, p.y) < radius + TRAIL;
    }

    function measure() {
      const c = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = c.width;
      height = c.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      let cx;
      let cy;
      if (visual) {
        const v = visual.getBoundingClientRect();
        cx = v.left - c.left + v.width / 2;
        cy = v.top - c.top + v.height / 2;
        radius = Math.max(160, Math.min(v.width * RADIUS_RATE, 520));
      } else {
        cx = (parseFloat(canvas.dataset.centerX ?? "50") / 100) * width;
        cy = (parseFloat(canvas.dataset.centerY ?? "50") / 100) * height;
        radius = Math.max(160, Math.min(width * RADIUS_RATE, 520));
      }
      const gx = Math.round(cx / CELL);
      const gy = Math.round(cy / CELL);
      center = { x: line(gx), y: line(gy), gx, gy };

      // 最初から粒が広がった状態で見えるよう、それぞれ少し先まで早送りしておく
      packets = Array.from({ length: COUNT }, () => {
        const p = spawn(0);
        return step(p, rand(0, radius / p.speed)) ? p : spawn(rand(0, 1));
      });
      pulses = [];
    }

    function drawPacket(p) {
      if (p.wait > 0) return;
      // 先頭から角を順にたどり、TRAIL の長さだけ尾を描く
      const points = [{ x: p.x, y: p.y }, ...p.corners];
      let traveled = 0;
      for (let i = 0; i < points.length - 1 && traveled < TRAIL; i++) {
        const a = points[i];
        let b = points[i + 1];
        const seg = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
        if (traveled + seg > TRAIL) {
          const k = (TRAIL - traveled) / seg;
          b = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
        }
        const end = Math.min(traveled + seg, TRAIL);
        const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        gradient.addColorStop(0, `rgba(${BRAND}, ${0.85 * (1 - traveled / TRAIL) * fade(a.x, a.y)})`);
        gradient.addColorStop(1, `rgba(${BRAND}, ${0.85 * (1 - end / TRAIL) * fade(b.x, b.y)})`);
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        traveled = end;
        if (traveled >= TRAIL) p.corners.length = i + 1; // 尾より後ろの角は捨てる
      }
      // 先頭の光
      const f = fade(p.x, p.y);
      ctx.fillStyle = `rgba(${BRAND}, ${0.3 * f})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${BRAND}, ${f})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawPulse(pulse) {
      ctx.strokeStyle = `rgba(${BRAND}, ${0.5 * (1 - pulse.t) * fade(pulse.x, pulse.y)})`;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, 2 + pulse.t * 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";

      packets = packets.map((p) => (step(p, dt) ? p : spawn(rand(0, 1.5))));
      packets.forEach(drawPacket);

      pulses = pulses.filter((pulse) => (pulse.t += dt / 1.2) < 1);
      pulses.forEach(drawPulse);

      requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
    }

    measure();
    new ResizeObserver(measure).observe(canvas);
    // 登場アニメーションで中心の要素が動き終わってから位置を測り直す
    window.addEventListener("load", () => setTimeout(measure, 1200));

    // 画面外やタブが裏にあるときは止める
    let visible = true;
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible && !document.hidden ? start() : stop();
    }).observe(canvas);
    document.addEventListener("visibilitychange", () => (visible && !document.hidden ? start() : stop()));
  }

  document.querySelectorAll("canvas[data-grid-particles]").forEach(init);
})();
