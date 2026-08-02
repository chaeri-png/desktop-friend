// 시츄 3D — 두 발로 선 유유자적 시츄
// 흰 바탕 + 골드브라운 패치, 얼굴 가운데 흰 세로줄, 납작 주둥이 + 들창코,
// 벌어진 동그란 눈, 혀 삐죽, 갈색 늘어진 귀, 등 위 플룸 꼬리
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

  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd8cfc4, 2.6));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.6);
  key.position.set(2, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.9);
  rim.position.set(-1.5, 3, -4);
  scene.add(rim);

  const pivot = new THREE.Group();
  const pet = new THREE.Group();
  pivot.add(pet);
  scene.add(pivot);

  const furWhite = new THREE.MeshStandardMaterial({ color: 0xfdfaf3, roughness: 1 });
  const brown = new THREE.MeshStandardMaterial({ color: 0x96683f, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x26201c, roughness: 0.4 });

  function blobOn(ctx, S, cx, cy, rx, ry, rot, fill) {
    ctx.fillStyle = fill;
    for (const off of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.ellipse(S * (cx + off), S * cy, S * rx, S * ry, rot, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function fur(ctx, S, alpha) {
    ctx.strokeStyle = `rgba(200,180,150,${alpha})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 480; i++) {
      const x = ((i * 379) % S) + ((i * 131) % 7) - 3;
      const y = (i * 613) % S;
      const len = 10 + ((i * 17) % 16);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ((i % 5) - 2) * 2, y + len);
      ctx.stroke();
    }
  }

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

  // ---------- 머리 그룹 (살짝 갸웃) ----------
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.35, 0);
  pet.add(headGroup);

  // 머리 텍스처: 흰 바탕 + 정수리·눈가 골드브라운 패치, 가운데 흰 세로줄(블레이즈)
  function makeHeadTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fdfaf3';
    ctx.fillRect(0, 0, S, S);
    fur(ctx, S, 0.12);
    const patch = 'rgba(148,100,58,0.95)';
    ctx.filter = 'blur(10px)';
    // 정수리 양옆 패치 (가운데 블레이즈는 흰색으로 남김)
    blobOn(ctx, S, 0.13, 0.16, 0.085, 0.1, 0.2, patch);
    blobOn(ctx, S, 0.37, 0.16, 0.085, 0.1, -0.2, patch);
    // 눈가 패치
    blobOn(ctx, S, 0.13, 0.34, 0.075, 0.09, 0, patch);
    blobOn(ctx, S, 0.37, 0.34, 0.075, 0.09, 0, patch);
    // 뒤통수 패치
    blobOn(ctx, S, 0.75, 0.22, 0.16, 0.14, 0, patch);
    ctx.filter = 'none';
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }
  const headGeo = new THREE.SphereGeometry(0.88, 48, 36);
  fluff(headGeo, 0.03);
  const head = new THREE.Mesh(
    headGeo,
    new THREE.MeshStandardMaterial({ map: makeHeadTexture(), roughness: 1 })
  );
  head.scale.set(1.13, 0.94, 0.95);
  head.position.set(0, 0.47, 0.05);
  headGroup.add(head);

  // ---------- 귀: 갈색 늘어진 귀 (위 좁고 아래 넓게) ----------
  const ears = [];
  for (const sign of [-1, 1]) {
    const earGeo = new THREE.SphereGeometry(0.3, 20, 16);
    {
      const pos = earGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ny = pos.getY(i) / 0.3;
        const widen = 1 + 0.45 * Math.max(0, -ny);
        const taper = 1 - 0.5 * Math.max(0, ny);
        pos.setX(i, pos.getX(i) * widen * taper);
        pos.setZ(i, pos.getZ(i) * widen * taper);
      }
      earGeo.computeVertexNormals();
    }
    fluff(earGeo, 0.04);
    const ear = new THREE.Mesh(earGeo, brown);
    ear.scale.set(0.9, 1.7, 0.55);
    ear.position.set(0.92 * sign, 0.42, 0.1);
    ear.rotation.set(Math.PI, 0, -0.3 * sign);
    headGroup.add(ear);
    ears.push(ear);
  }

  // ---------- 눈: 벌어진 동그란 눈 (시츄 특유) ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0x201612, roughness: 0.25 })
    );
    const shine1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine1.position.set(-0.04 * sign, 0.05, 0.12);
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine2.position.set(0.05 * sign, -0.035, 0.125);
    eye.add(ball, shine1, shine2);
    eye.position.set(0.42 * sign, 0.55, 0.78); // 넓게 벌어진 눈
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  headGroup.add(eyeL, eyeR);

  // ---------- 납작 주둥이 + 들창코 + 혀 ----------
  const muzzleGeo = new THREE.SphereGeometry(0.26, 24, 18);
  fluff(muzzleGeo, 0.03);
  const muzzle = new THREE.Mesh(muzzleGeo, furWhite);
  muzzle.scale.set(1.15, 0.75, 0.38); // 시츄답게 납작
  muzzle.position.set(0, 0.32, 0.88);
  headGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), dark);
  nose.scale.set(1.25, 0.85, 0.7);
  nose.position.set(0, 0.47, 0.97); // 들창코 — 눈 사이 가깝게 위로
  headGroup.add(nose);

  // 혀 삐죽 (시츄 시그니처)
  const tongue = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xef9aa2, roughness: 0.8 })
  );
  tongue.scale.set(0.9, 0.5, 0.5);
  tongue.position.set(0, 0.18, 0.97);
  headGroup.add(tongue);

  // ω 입
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x7a6552 });
  for (const sign of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 18, Math.PI), mouthMat);
    arc.rotation.z = Math.PI;
    arc.position.set(0.05 * sign, 0.26, 1.0);
    headGroup.add(arc);
  }

  // ---------- 몸통: 흰 바탕 + 등 골드브라운 패치 ----------
  function makeBodyTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fdfaf3';
    ctx.fillRect(0, 0, S, S);
    fur(ctx, S, 0.12);
    const patch = 'rgba(148,100,58,0.85)';
    ctx.filter = 'blur(14px)';
    blobOn(ctx, S, 0.68, 0.28, 0.1, 0.09, 0.3, patch);
    blobOn(ctx, S, 0.84, 0.4, 0.09, 0.1, -0.2, patch);
    blobOn(ctx, S, 0.7, 0.52, 0.08, 0.08, 0.2, patch);
    // 배는 밝게
    ctx.filter = 'blur(16px)';
    blobOn(ctx, S, 0.25, 0.42, 0.15, 0.32, 0, 'rgba(255,255,250,0.8)');
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
      x *= 0.9;
      z *= 0.8;
      y *= 1.05;
      const hip = Math.max(0, -ny);
      x *= 1 + 0.12 * Math.pow(hip, 1.4);
      z *= 1 + 0.09 * Math.pow(hip, 1.4);
      pos.setXYZ(i, x, y, z);
    }
  }
  fluff(bodyGeo, 0.028);
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({ map: makeBodyTexture(), roughness: 1 })
  );
  body.position.set(0, -0.55, 0);
  pet.add(body);

  // ---------- 팔 (집중 땐 앞으로 뻗어 직접 타이핑) ----------
  const armParts = [];
  for (const sign of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.4, 6, 12), furWhite);
    pet.add(arm);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), furWhite);
    pet.add(paw);
    armParts.push({ arm, paw, sign });
  }

  // ---------- 다리 + 발 ----------
  const legParts = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.24, 6, 12), furWhite);
    leg.position.set(0.3 * sign, -1.32, 0.02);
    pet.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), furWhite);
    foot.scale.set(1, 0.55, 1.5);
    foot.rotation.y = 0.15 * sign;
    pet.add(foot);
    legParts.push({ leg, foot, sign });
  }

  let shirtOn = false; // 티셔츠 착용 여부 — 입으면 팔을 소매 밖으로 뺀다
  function applyPose(focus) {
    for (const { arm, paw, sign } of armParts) {
      if (focus) {
        arm.position.set(0.5 * sign, -0.38, 0.38);
        arm.rotation.set(-1.0, 0, -0.15 * sign);
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
      if (focus) foot.position.set(0.55 * sign, -1.5, 1.05);
      else foot.position.set(0.32 * sign, -1.54, 0.16);
    }
  }
  applyPose(false);

  // ---------- 꼬리: 등 위로 말린 플룸 (갈색 섞임) ----------
  const tail = new THREE.Group();
  {
    const plumeGeo = new THREE.SphereGeometry(0.3, 22, 16);
    fluff(plumeGeo, 0.05);
    const plume = new THREE.Mesh(plumeGeo, brown);
    plume.scale.set(0.6, 1.25, 0.55);
    plume.position.set(0.24, -0.45, -0.75);
    plume.rotation.x = -0.3;
    plume.rotation.z = -0.15;
    const plumeTip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), furWhite);
    plumeTip.position.set(0.28, -0.05, -0.62);
    const plumeBase = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), brown);
    plumeBase.position.set(0.12, -0.95, -0.68);
    tail.add(plume, plumeTip, plumeBase);
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

  // ---------- 책상 (집중 모드) ----------
  const desk = new THREE.Group();
  {
    const wood = new THREE.MeshStandardMaterial({ color: 0xdbb98f, roughness: 0.9 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.85), wood);
    top.position.set(0, -0.72, 0.78);
    const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.78, 0.7), wood);
    const panelR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.78, 0.7), wood);
    panelL.position.set(-0.84, -1.14, 0.78);
    panelR.position.set(0.84, -1.14, 0.78);
    const front = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 0.06), wood);
    front.position.set(0, -1.13, 1.16);
    desk.add(top, panelL, panelR, front);
  }
  desk.visible = false;
  pet.add(desk);

  // ---------- 노트북 (책상 위) ----------
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

  // ---------- 애니메이션 상태 (느긋한 기본 템포) ----------
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

    let bobAmp = 0.035; // 시츄는 평소에도 느긋하게
    let bobSpeed = 1.6;
    let spin = 0;
    let tilt = 0;
    let excite = 0;
    if (anim === 'focus') { bobAmp = 0.018; bobSpeed = 1.2; tilt = 0.1; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.07; bobSpeed = 4; spin = 2.2; excite = 1; }
    else if (anim === 'cheer') { bobAmp = 0.05; bobSpeed = 5; spin = 2.8; excite = 1; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 8; excite = 1; }

    if (spin) {
      petYaw += spin * dt;
    } else {
      petYaw = petYaw % (Math.PI * 2);
      if (petYaw > Math.PI) petYaw -= Math.PI * 2;
      if (petYaw < -Math.PI) petYaw += Math.PI * 2;
      if (anim === 'idle') {
        if (t > wiggleAt) {
          wiggleTarget = (Math.random() - 0.5) * 0.4;
          wiggleAt = t + 3 + Math.random() * 5;
        }
        petYaw += (wiggleTarget - petYaw) * Math.min(1, dt * 2);
      } else {
        petYaw *= Math.max(0, 1 - dt * 5);
      }
    }
    pet.rotation.y = petYaw;
    pet.rotation.x = tilt;

    // 고개 갸웃 (아주 느리게)
    headGroup.rotation.z = Math.sin(t * 0.6) * 0.05 + (excite ? Math.sin(t * 9) * 0.03 : 0);

    const bob = Math.sin(t * bobSpeed * 2) * bobAmp;
    let jump = 0;
    if (anim === 'cheer') {
      jump = Math.abs(Math.sin((t - jumpStart) * 5)) * 0.3;
    } else if (jumpStart >= 0) {
      const e = t - jumpStart;
      if (e < 0.5) jump = Math.sin((e / 0.5) * Math.PI) * 0.4;
      else jumpStart = -1;
    }
    pet.position.y = bob + jump + (anim === 'focus' ? -0.12 : 0);
    pet.scale.y = 1 + bob * 0.25;
    const sq = 1 - bob * 0.1;
    pet.scale.x = sq;
    pet.scale.z = sq;

    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.18; // 느릿한 깜빡임
        blinkAt = t + 2.5 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.12 : 1;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

    // 꼬리 살랑 (느긋하게)
    tail.rotation.y = Math.sin(t * (excite ? 7 : 1.4)) * (excite ? 0.25 : 0.1);
    // 귀 살짝 팔랑
    const ew = excite ? Math.sin(t * 11) * 0.08 : Math.sin(t * 1.1) * 0.02;
    ears[0].rotation.z = 0.3 + ew;
    ears[1].rotation.z = -0.3 - ew;

    if (returning) {
      userYaw *= Math.max(0, 1 - dt * 5);
      userPitch *= Math.max(0, 1 - dt * 5);
      if (Math.abs(userYaw) < 0.01 && Math.abs(userPitch) < 0.01) {
        userYaw = 0;
        userPitch = 0;
        returning = false;
      }
    }

    // 타이핑 (시츄는 타이핑도 느긋하게)
    if (anim === 'focus') {
      armParts[0].paw.position.y = -0.56 + Math.max(0, Math.sin(t * 7)) * 0.05;
      armParts[1].paw.position.y = -0.56 + Math.max(0, Math.sin(t * 7 + Math.PI)) * 0.05;
    }

    pivot.rotation.y = userYaw;
    pivot.rotation.x = userPitch;

    renderer.render(scene, camera);
  }
  frame();

  // ---------- 액세서리 (설정에서 착탈) ----------
  const accessories = initAccessories(headGroup, {
    eyeX: 0.42, eyeY: 0.55, eyeZ: 0.8,
    topY: 1.05, topZ: 0.05, topR: 0.78,
    // 늘어진 귀에 파묻히지 않게 이어컵을 귀 바깥으로
    bandR: 1.32, bandY: 0.52, bandZ: 0.08, cupX: 1.34,
    body: { cy: -0.55, rx: 0.82, ry: 0.92, rz: 0.76 },
    legX: 0.3, legY: -1.3, legR: 0.22,
  }, pet);
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
