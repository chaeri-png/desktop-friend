// 치즈냥 3D — 두 발로 선 보들보들 아기 치즈태비
// 큰 동그란 머리(살짝 갸웃) + 배 앞에 모은 손 + ω 입 + 링 무늬 꼬리(끝은 흰색)
import * as THREE from '../../src/renderer/vendor/three.module.js';
import { initAccessories } from '../../src/renderer/pet/accessories.js';

export function createModel(container) {
  const W = container.clientWidth || 150;
  const H = container.clientHeight || 170;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 50);
  camera.position.set(0, 0.3, 7.8);
  camera.lookAt(0, -0.05, 0);

  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd8c8b8, 2.6));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.6);
  key.position.set(2, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.8);
  rim.position.set(-1.5, 3, -4);
  scene.add(rim);

  const pivot = new THREE.Group();
  const pet = new THREE.Group();
  pivot.add(pet);
  scene.add(pivot);

  const cheese = new THREE.MeshStandardMaterial({ color: 0xeda85c, roughness: 1 });
  const darkOrange = new THREE.MeshStandardMaterial({ color: 0xc67c34, roughness: 1 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfffbf4, roughness: 1 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf2a8a0, roughness: 0.9 });

  function blobOn(ctx, S, cx, cy, rx, ry, rot, fill) {
    ctx.fillStyle = fill;
    for (const off of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.ellipse(S * (cx + off), S * cy, S * rx, S * ry, rot, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 옅은 털 결 스트로크 (보들보들)
  function fur(ctx, S, alpha) {
    ctx.strokeStyle = `rgba(200,140,70,${alpha})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 420; i++) {
      const x = ((i * 379) % S) + ((i * 131) % 7) - 3;
      const y = (i * 613) % S;
      const len = 10 + ((i * 17) % 16);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ((i % 5) - 2) * 2, y + len);
      ctx.stroke();
    }
  }

  // 표면에 미세 솜털 요철 (좌표 기반이라 항상 동일)
  function fluff(geo, amp) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const h = Math.sin(x * 43.1 + y * 26.9) * Math.cos(z * 31.7 - y * 18.3);
      const a = amp * h;
      const len = Math.hypot(x, y, z) || 1;
      pos.setXYZ(i, x + (x / len) * a, y + (y / len) * a, z + (z / len) * a);
    }
    geo.computeVertexNormals();
  }

  // ---------- 머리 그룹 (목 부근을 축으로 살짝 갸웃) ----------
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.35, 0);
  pet.add(headGroup);

  function makeHeadTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#eda85c';
    ctx.fillRect(0, 0, S, S);
    fur(ctx, S, 0.1);
    const stripe = 'rgba(198,124,52,0.95)';
    ctx.filter = 'blur(3px)';
    blobOn(ctx, S, 0.215, 0.3, 0.014, 0.06, 0.15, stripe);
    blobOn(ctx, S, 0.25, 0.285, 0.015, 0.07, 0, stripe);
    blobOn(ctx, S, 0.285, 0.3, 0.014, 0.06, -0.15, stripe);
    ctx.filter = 'blur(7px)';
    blobOn(ctx, S, 0.15, 0.55, 0.05, 0.033, 0, 'rgba(246,158,138,0.55)');
    blobOn(ctx, S, 0.35, 0.55, 0.05, 0.033, 0, 'rgba(246,158,138,0.55)');
    ctx.filter = 'none';
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }
  const headGeo = new THREE.SphereGeometry(0.88, 48, 36);
  fluff(headGeo, 0.02);
  const head = new THREE.Mesh(
    headGeo,
    new THREE.MeshStandardMaterial({ map: makeHeadTexture(), roughness: 1 })
  );
  head.scale.set(1.08, 0.98, 0.95);
  head.position.set(0, 0.47, 0.05);
  headGroup.add(head);

  // ---------- 귀 ----------
  const ears = [];
  for (const sign of [-1, 1]) {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.46, 12), cheese);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.28, 10), pinkMat);
    inner.position.set(0, -0.04, 0.09);
    ear.add(outer, inner);
    ear.position.set(0.46 * sign, 1.25, 0.05);
    ear.rotation.z = -0.24 * sign;
    headGroup.add(ear);
    ears.push(ear);
  }

  // ---------- 눈 ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0x1b1512, roughness: 0.25 })
    );
    const shine1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine1.position.set(-0.04 * sign, 0.05, 0.11);
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine2.position.set(0.05 * sign, -0.035, 0.115);
    eye.add(ball, shine1, shine2);
    eye.position.set(0.32 * sign, 0.57, 0.82);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  headGroup.add(eyeL, eyeR);

  // ---------- 주둥이 + 코 + ω 입 + 수염 ----------
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), white);
  muzzle.scale.set(1.25, 0.75, 0.5);
  muzzle.position.set(0, 0.25, 0.84);
  headGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.075, 4), pinkMat);
  nose.rotation.x = Math.PI;
  nose.rotation.y = Math.PI / 4;
  nose.position.set(0, 0.39, 0.99);
  headGroup.add(nose);

  // ω 입 (아래로 열린 반원 두 개)
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0xb87a4a });
  for (const sign of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.013, 8, 18, Math.PI), mouthMat);
    arc.rotation.z = Math.PI; // ∪ 모양
    arc.position.set(0.055 * sign, 0.31, 0.97);
    headGroup.add(arc);
  }

  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xfdf8f0, transparent: true, opacity: 0.85 });
  for (const sign of [-1, 1]) {
    for (const [dy, rot] of [
      [0.05, 0.2],
      [0, 0],
      [-0.05, -0.2],
    ]) {
      const wsk = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.44, 6), whiskerMat);
      wsk.rotation.z = Math.PI / 2 + rot * sign;
      wsk.position.set(0.42 * sign, 0.28 + dy, 0.85);
      headGroup.add(wsk);
    }
  }

  // ---------- 몸통: 머리보다 좁고 통통, 크림빛 배 ----------
  function makeBodyTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#eda85c';
    ctx.fillRect(0, 0, S, S);
    fur(ctx, S, 0.1);
    ctx.filter = 'blur(14px)';
    blobOn(ctx, S, 0.25, 0.42, 0.15, 0.33, 0, 'rgba(255,249,240,0.97)'); // 크림빛 배
    const stripe = 'rgba(198,124,52,0.9)';
    ctx.filter = 'blur(5px)';
    blobOn(ctx, S, 0.68, 0.22, 0.09, 0.018, 0.3, stripe);
    blobOn(ctx, S, 0.82, 0.22, 0.09, 0.018, -0.3, stripe);
    blobOn(ctx, S, 0.66, 0.36, 0.08, 0.017, 0.25, stripe);
    blobOn(ctx, S, 0.84, 0.36, 0.08, 0.017, -0.25, stripe);
    blobOn(ctx, S, 0.68, 0.5, 0.07, 0.016, 0.2, stripe);
    blobOn(ctx, S, 0.82, 0.5, 0.07, 0.016, -0.2, stripe);
    ctx.filter = 'none';
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }
  const bodyGeo = new THREE.SphereGeometry(0.85, 48, 32);
  {
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const ny = y / 0.85;
      x *= 0.84;
      z *= 0.75;
      y *= 1.18; // 살짝 짧고 통통한 몸통
      const hip = Math.max(0, -ny);
      x *= 1 + 0.16 * Math.pow(hip, 1.4);
      z *= 1 + 0.12 * Math.pow(hip, 1.4);
      pos.setXYZ(i, x, y, z);
    }
  }
  fluff(bodyGeo, 0.018);
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({ map: makeBodyTexture(), roughness: 1 })
  );
  body.position.set(0, -0.55, 0);
  pet.add(body);

  // ---------- 팔: 배 앞에 모은 손 (집중 땐 앞으로 뻗어 직접 타이핑) ----------
  const armParts = [];
  for (const sign of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.4, 6, 12), cheese);
    pet.add(arm);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), white);
    pet.add(paw);
    armParts.push({ arm, paw, sign });
  }

  // ---------- 다리 + 발 (집중 땐 철퍼덕 — 다리 접고 발이 앞으로) ----------
  const legParts = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.24, 6, 12), cheese);
    leg.position.set(0.3 * sign, -1.32, 0.02);
    pet.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), white);
    foot.scale.set(1, 0.55, 1.5);
    foot.rotation.y = 0.15 * sign;
    pet.add(foot);
    legParts.push({ leg, foot, sign });
  }

  // 평상시/집중 자세 적용
  let shirtOn = false; // 티셔츠 착용 여부 — 입으면 팔을 소매 밖으로 뺀다
  let accessoriesRef = null;
  function applyPose(focus) {
    accessoriesRef?.setFocus(focus);
    for (const { arm, paw, sign } of armParts) {
      if (focus) {
        arm.position.set(0.5 * sign, -0.38, 0.38);
        arm.rotation.set(-1.0, 0, -0.15 * sign); // 팔을 책상 위로 뻗음
        paw.position.set(0.3 * sign, -0.56, 0.76);
      } else if (shirtOn) {
        // 티셔츠 어깨선에 붙어 자연스럽게 늘어진 팔 (소매 밖)
        arm.position.set(0.8 * sign, -0.45, 0.3);
        arm.rotation.set(-0.3, 0, 0.18 * sign);
        paw.position.set(0.87 * sign, -0.82, 0.45);
      } else {
        arm.position.set(0.56 * sign, -0.42, 0.3);
        arm.rotation.set(-0.5, 0, -0.28 * sign);
        paw.position.set(0.3 * sign, -0.68, 0.62);
      }
    }
    for (const { leg, foot, sign } of legParts) {
      leg.visible = !focus;
      if (focus) foot.position.set(0.55 * sign, -1.5, 1.05); // 책상 아래로 발 빼꼼
      else foot.position.set(0.32 * sign, -1.54, 0.16);
    }
  }
  applyPose(false);

  // ---------- 꼬리: 링 무늬, 끝은 흰색 ----------
  const tail = new THREE.Group();
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, -1.38, -0.5),
      new THREE.Vector3(0.55, -1.48, -0.75),
      new THREE.Vector3(0.95, -1.38, -0.85),
      new THREE.Vector3(1.2, -1.08, -0.8),
      new THREE.Vector3(1.28, -0.75, -0.7),
      new THREE.Vector3(1.2, -0.4, -0.6),
    ]);
    const N = 14;
    for (let i = 0; i < N; i++) {
      const p = curve.getPoint(i / (N - 1));
      const r = 0.17 - (i / (N - 1)) * 0.055;
      const mat = i >= N - 3 ? white : Math.floor(i / 2) % 2 === 0 ? cheese : darkOrange;
      const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
      seg.position.copy(p);
      tail.add(seg);
    }
  }
  pet.add(tail);

  // ---------- 집중 머리띠 ----------
  const headband = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.08, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0xe05a4e, roughness: 0.7 })
  );
  headband.rotation.x = 1.35;
  headband.position.set(0, 0.82, 0.05);
  headband.visible = false;
  headGroup.add(headband);

  // ---------- 책상 (집중 모드에서만) ----------
  const desk = new THREE.Group();
  {
    const wood = new THREE.MeshStandardMaterial({ color: 0xdbb98f, roughness: 0.9 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.85), wood);
    top.position.set(0, -0.72, 0.78);
    const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.78, 0.7), wood);
    const panelR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.78, 0.7), wood);
    panelL.position.set(-0.84, -1.14, 0.78);
    panelR.position.set(0.84, -1.14, 0.78);
    // 앞 가림판
    const front = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 0.06), wood);
    front.position.set(0, -1.13, 1.16);
    desk.add(top, panelL, panelR, front);
  }
  desk.visible = false;
  pet.add(desk);

  // ---------- 노트북 (책상 위, 집중 모드에서만 — 타이핑은 고양이가 직접) ----------
  const laptop = new THREE.Group();
  {
    const alu = new THREE.MeshStandardMaterial({ color: 0xd7d3ce, roughness: 0.55 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.6), alu);
    const keys = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.015, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x8f8b86, roughness: 0.9 })
    );
    keys.position.set(0, 0.033, -0.02);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.52, 0.04), alu);
    screen.position.set(0, 0.21, 0.32);
    screen.rotation.x = 0.5;
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.42),
      new THREE.MeshBasicMaterial({ color: 0xcfe8ff })
    );
    glow.position.set(0, 0.2, 0.29);
    glow.rotation.x = 0.5;
    glow.rotation.y = Math.PI;
    const logo = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    logo.position.set(0, 0.23, 0.36);
    logo.rotation.x = 0.5;
    laptop.add(base, keys, screen, glow, logo);
  }
  laptop.position.set(0, -0.65, 0.82);
  laptop.scale.setScalar(0.9);
  laptop.visible = false;
  pet.add(laptop);

  // ---------- 애니메이션 상태 ----------
  let anim = 'idle';
  let t = 0;
  let petYaw = 0;
  let jumpStart = -1;
  let blinkAt = 2;
  let blinkUntil = 0;
  let wiggleTarget = 0;
  let wiggleAt = 3;
  let userYaw = 0;
  let userPitch = 0;
  let rotating = false;
  let returning = false;
  const clock = new THREE.Clock();
  let disposed = false;

  function setAnimation(name) {
    if (name === anim) return;
    anim = name;
    const focus = name === 'focus';
    laptop.visible = focus;
    desk.visible = focus;
    headband.visible = focus;
    applyPose(focus);
    if (name === 'react' || name === 'cheer') jumpStart = t;
    const s = name === 'drag' ? 1.3 : 1;
    eyeL.scale.setScalar(s);
    eyeR.scale.setScalar(s);
  }

  function rotateBy(dx, dy) {
    rotating = true;
    returning = false;
    userYaw += dx * 0.02;
    userPitch = Math.max(-0.7, Math.min(0.7, userPitch + dy * 0.012));
  }

  function endRotate() {
    rotating = false;
    userYaw = userYaw % (Math.PI * 2);
    if (userYaw > Math.PI) userYaw -= Math.PI * 2;
    if (userYaw < -Math.PI) userYaw += Math.PI * 2;
  }

  function isRotated() {
    return Math.abs(userYaw) > 0.15 || Math.abs(userPitch) > 0.1;
  }

  function resetRotation() {
    returning = true;
  }

  function frame() {
    if (disposed) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    let bobAmp = 0.04;
    let bobSpeed = 2.0;
    let spin = 0;
    let tilt = 0;
    let excite = 0;
    if (anim === 'focus') { bobAmp = 0.02; bobSpeed = 1.4; tilt = 0.1; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.08; bobSpeed = 5; spin = 2.6; excite = 1; }
    else if (anim === 'cheer') { bobAmp = 0.06; bobSpeed = 6; spin = 3.2; excite = 1; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 9; excite = 1; }

    if (spin) {
      petYaw += spin * dt;
    } else {
      petYaw = petYaw % (Math.PI * 2);
      if (petYaw > Math.PI) petYaw -= Math.PI * 2;
      if (petYaw < -Math.PI) petYaw += Math.PI * 2;
      if (anim === 'idle') {
        if (t > wiggleAt) {
          wiggleTarget = (Math.random() - 0.5) * 0.5;
          wiggleAt = t + 2 + Math.random() * 4;
        }
        petYaw += (wiggleTarget - petYaw) * Math.min(1, dt * 2.5);
      } else {
        petYaw *= Math.max(0, 1 - dt * 5);
      }
    }
    pet.rotation.y = petYaw;
    pet.rotation.x = tilt;

    // 고개 갸웃 (천천히 좌우로)
    headGroup.rotation.z = Math.sin(t * 0.9) * 0.06 + (excite ? Math.sin(t * 10) * 0.03 : 0);

    const bob = Math.sin(t * bobSpeed * 2) * bobAmp;
    let jump = 0;
    if (anim === 'cheer') {
      jump = Math.abs(Math.sin((t - jumpStart) * 6)) * 0.35;
    } else if (jumpStart >= 0) {
      const e = t - jumpStart;
      if (e < 0.5) jump = Math.sin((e / 0.5) * Math.PI) * 0.5;
      else jumpStart = -1;
    }
    pet.position.y = bob + jump + (anim === 'focus' ? -0.12 : 0); // 집중 땐 철퍼덕 낮게
    pet.scale.y = 1 + bob * 0.25;
    const sq = 1 - bob * 0.1;
    pet.scale.x = sq;
    pet.scale.z = sq;

    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.12;
        blinkAt = t + 2 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.1 : 1;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

    tail.rotation.y = Math.sin(t * (excite ? 6 : 1.6)) * (excite ? 0.22 : 0.1);
    const ew = excite ? Math.sin(t * 14) * 0.12 : 0;
    ears[0].rotation.z = 0.24 + ew;
    ears[1].rotation.z = -0.24 - ew;

    if (returning) {
      userYaw *= Math.max(0, 1 - dt * 5);
      userPitch *= Math.max(0, 1 - dt * 5);
      if (Math.abs(userYaw) < 0.01 && Math.abs(userPitch) < 0.01) {
        userYaw = 0;
        userPitch = 0;
        returning = false;
      }
    }

    // 타이핑: 자기 손으로 타닥타닥
    if (anim === 'focus') {
      armParts[0].paw.position.y = -0.56 + Math.max(0, Math.sin(t * 11)) * 0.05;
      armParts[1].paw.position.y = -0.56 + Math.max(0, Math.sin(t * 11 + Math.PI)) * 0.05;
    }

    pivot.rotation.y = userYaw;
    pivot.rotation.x = userPitch;

    renderer.render(scene, camera);
  }
  frame();

  // ---------- 액세서리 (설정에서 착탈) ----------
  const accessories = initAccessories(headGroup, {
    eyeX: 0.32, eyeY: 0.57, eyeZ: 0.84,
    topY: 1.05, topZ: 0.05, topR: 0.72,
    bandR: 0.97, bandY: 0.47, bandZ: 0.05, cupX: 0.99,
    body: { cy: -0.55, rx: 0.82, ry: 0.92, rz: 0.76 },
    sleeve: { x: 0.72, y: -0.42, z: 0.28, r: 0.2, rotZ: 0.55, len: 0.6 },
    legX: 0.3, legY: -1.3, legR: 0.21,
  }, pet);
  accessoriesRef = accessories;
  function setAccessories(list) {
    const worn = accessories.setAccessories(list);
    shirtOn = worn.has('tshirt');
    applyPose(anim === 'focus');
  }

  return {
    setAnimation,
    setAccessories,
    rotateBy,
    endRotate,
    isRotated,
    resetRotation,
    dispose() {
      disposed = true;
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    },
  };
}
