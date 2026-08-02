// 프렌치 불독 '테리' 3D — 두 발로 선 다부진 프렌치
// 눈 위까지 까만 머리 + 아래는 하얀색, 쫑긋 선 박쥐 귀, 납작 얼굴,
// 넓적한 코, 주걱턱 아랫니, 매끈한 짧은 털, 꽁지 스텁
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

  const white = new THREE.MeshStandardMaterial({ color: 0xfdfaf3, roughness: 0.95 });
  const black = new THREE.MeshStandardMaterial({ color: 0x2b2624, roughness: 0.9 });
  const darkNose = new THREE.MeshStandardMaterial({ color: 0x1d1815, roughness: 0.4 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xd9958f, roughness: 0.9 });

  function blobOn(ctx, S, cx, cy, rx, ry, rot, fill) {
    ctx.fillStyle = fill;
    for (const off of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.ellipse(S * (cx + off), S * cy, S * rx, S * ry, rot, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 매끈한 짧은 털 — 아주 미세한 요철만
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

  // ---------- 머리 그룹 ----------
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.35, 0);
  pet.add(headGroup);

  // 머리 텍스처: 얼굴 전체 검정 + 가운데 세로 흰 줄(블레이즈) → 코 주변 동그란 흰 영역
  function makeHeadTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#2b2624'; // 얼굴 전체 검정
    ctx.fillRect(0, 0, S, S);
    ctx.filter = 'blur(6px)';
    ctx.fillStyle = 'rgba(253,250,243,0.97)';
    // 이마를 가로지르는 세로 블레이즈 (정면 u=0.25)
    ctx.fillRect(S * 0.225, 0, S * 0.05, S * 0.5);
    // 코 주변 동그란 흰 영역 (블레이즈와 이어짐)
    ctx.beginPath();
    ctx.ellipse(S * 0.25, S * 0.5, S * 0.11, S * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = 'none';
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }
  const headGeo = new THREE.SphereGeometry(0.9, 48, 36);
  fluff(headGeo, 0.008);
  const head = new THREE.Mesh(
    headGeo,
    new THREE.MeshStandardMaterial({ map: makeHeadTexture(), roughness: 0.95 })
  );
  head.scale.set(1.15, 0.92, 0.95); // 넓적하고 낮은 프렌치 두상
  head.position.set(0, 0.45, 0.05);
  headGroup.add(head);

  // ---------- 귀: 쫑긋 선 큰 박쥐 귀 (까만색 + 분홍 속) ----------
  const ears = [];
  for (const sign of [-1, 1]) {
    const ear = new THREE.Group();
    const outerGeo = new THREE.SphereGeometry(0.34, 22, 16);
    {
      // 박쥐귀: 밑동이 넓고 위는 둥글게 모임
      const pos = outerGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ny = pos.getY(i) / 0.34;
        const widen = 1 + 0.35 * Math.max(0, -ny);
        pos.setX(i, pos.getX(i) * widen);
        pos.setZ(i, pos.getZ(i) * widen);
      }
      outerGeo.computeVertexNormals();
    }
    fluff(outerGeo, 0.01);
    const outer = new THREE.Mesh(outerGeo, black);
    outer.scale.set(0.85, 1.25, 0.45); // 밑동 넓고 위로 선 박쥐귀
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0x1c1815, roughness: 0.95 }) // 귀 안쪽도 블랙
    );
    inner.scale.set(0.75, 0.85, 0.32);
    inner.position.set(0, -0.02, 0.1);
    ear.add(outer, inner);
    ear.position.set(0.6 * sign, 1.2, 0.0); // 밑동이 머리 옆선에 이어지며 위로 섬
    ear.rotation.z = -0.22 * sign; // 살짝 V자
    headGroup.add(ear);
    ears.push(ear);
  }

  // ---------- 눈: 벌어진 동그란 눈 (까만 캡 경계 바로 아래) ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0x201612, roughness: 0.25 })
    );
    const shine1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine1.position.set(-0.04 * sign, 0.05, 0.11);
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine2.position.set(0.045 * sign, -0.035, 0.115);
    eye.add(ball, shine1, shine2);
    eye.position.set(0.44 * sign, 0.5, 0.8); // 넓게 벌어진 눈
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  headGroup.add(eyeL, eyeR);

  // ---------- 납작 주둥이 + 넓적한 코 + 주걱턱 아랫니 ----------
  const muzzleGeo = new THREE.SphereGeometry(0.28, 24, 18);
  fluff(muzzleGeo, 0.01);
  const muzzle = new THREE.Mesh(muzzleGeo, white);
  muzzle.scale.set(1.2, 0.75, 0.38);
  muzzle.position.set(0, 0.24, 0.88);
  headGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), darkNose);
  nose.scale.set(1.5, 0.8, 0.7); // 넓적한 들창코
  nose.position.set(0, 0.42, 0.98);
  headGroup.add(nose);

  // ω 입
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x6b5a50 });
  for (const sign of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.013, 8, 18, Math.PI), mouthMat);
    arc.rotation.z = Math.PI;
    arc.position.set(0.055 * sign, 0.2, 1.0);
    headGroup.add(arc);
  }
  // 주걱턱 아랫니 두 개 (프렌치 시그니처)
  for (const sign of [-1, 1]) {
    const tooth = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.06, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tooth.position.set(0.06 * sign, 0.14, 1.0);
    headGroup.add(tooth);
  }

  // ---------- 몸통: 다부진 가슴, 흰 몸 + 검은 얼룩 ----------
  function makeBodyTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fdfaf3';
    ctx.fillRect(0, 0, S, S);
    ctx.filter = 'blur(6px)';
    const spot = 'rgba(43,38,36,0.95)';
    blobOn(ctx, S, 0.62, 0.28, 0.1, 0.09, 0.3, spot); // 등 얼룩
    blobOn(ctx, S, 0.87, 0.5, 0.08, 0.09, -0.2, spot); // 옆구리 얼룩
    blobOn(ctx, S, 0.38, 0.62, 0.055, 0.05, 0.2, spot); // 앞쪽 작은 얼룩
    blobOn(ctx, S, 0.08, 0.35, 0.06, 0.07, 0, spot); // 어깨 얼룩
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
      x *= 0.98;
      z *= 0.82;
      y *= 1.0; // 짧고 다부지게
      // 근육질: 어깨·가슴은 넓고 허리로 갈수록 조여지는 역삼각 실루엣
      const shoulder = Math.exp(-Math.pow((ny - 0.35) / 0.38, 2));
      x *= 1 + 0.16 * shoulder;
      const waist = Math.exp(-Math.pow((ny + 0.3) / 0.35, 2));
      x *= 1 - 0.06 * waist;
      const chest = Math.exp(-Math.pow((ny - 0.25) / 0.4, 2));
      if (z > 0) z += 0.14 * chest * (z / 0.85); // 가슴 근육 봉긋
      pos.setXYZ(i, x, y, z);
    }
  }
  fluff(bodyGeo, 0.008);
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({ map: makeBodyTexture(), roughness: 0.95 })
  );
  body.position.set(0, -0.55, 0);
  pet.add(body);

  // ---------- 팔 (집중 땐 앞으로 뻗어 직접 타이핑) ----------
  const armParts = [];
  for (const sign of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.36, 6, 12), white);
    pet.add(arm);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), white);
    pet.add(paw);
    armParts.push({ arm, paw, sign });
  }

  // ---------- 다리 + 발 (짧고 튼튼) ----------
  const legParts = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.2, 6, 12), white);
    leg.position.set(0.32 * sign, -1.3, 0.02);
    pet.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), white);
    foot.scale.set(1, 0.55, 1.4);
    foot.rotation.y = 0.15 * sign;
    pet.add(foot);
    legParts.push({ leg, foot, sign });
  }

  let shirtOn = false; // 티셔츠 착용 여부 — 입으면 팔을 소매 밖으로 뺀다
  let accessoriesRef = null;
  function applyPose(focus) {
    accessoriesRef?.setFocus(focus);
    for (const { arm, paw, sign } of armParts) {
      if (focus) {
        arm.position.set(0.52 * sign, -0.38, 0.38);
        arm.rotation.set(-1.0, 0, -0.15 * sign);
        paw.position.set(0.3 * sign, -0.56, 0.76);
      } else if (shirtOn) {
        // 티셔츠 어깨선에 붙어 자연스럽게 늘어진 팔 (소매 밖)
        arm.position.set(0.85 * sign, -0.45, 0.28);
        arm.rotation.set(-0.3, 0, 0.18 * sign);
        paw.position.set(0.93 * sign, -0.83, 0.42);
      } else {
        arm.position.set(0.6 * sign, -0.42, 0.28);
        arm.rotation.set(-0.4, 0, -0.3 * sign);
        paw.position.set(0.34 * sign, -0.72, 0.56);
      }
    }
    for (const { leg, foot, sign } of legParts) {
      leg.visible = !focus;
      if (focus) foot.position.set(0.55 * sign, -1.5, 1.05);
      else foot.position.set(0.34 * sign, -1.5, 0.16);
    }
  }
  applyPose(false);

  // ---------- 꼬리: 꽁지 스텁 ----------
  const tail = new THREE.Group();
  const stub = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), white);
  stub.position.set(0, -0.85, -0.85);
  tail.add(stub);
  pet.add(tail);

  // ---------- 집중 머리띠 ----------
  const headband = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.08, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0xe05a4e, roughness: 0.7 })
  );
  headband.rotation.x = 1.35;
  headband.position.set(0, 0.85, 0.05);
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

  // ---------- 애니메이션 상태 (다부진 템포) ----------
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
    let bobSpeed = 2.4; // 씩씩한 템포
    let spin = 0;
    let tilt = 0;
    let excite = 0;
    if (anim === 'focus') { bobAmp = 0.02; bobSpeed = 1.5; tilt = 0.1; }
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

    headGroup.rotation.z = Math.sin(t * 0.8) * 0.04 + (excite ? Math.sin(t * 10) * 0.03 : 0);

    const bob = Math.sin(t * bobSpeed * 2) * bobAmp;
    let jump = 0;
    if (anim === 'cheer') {
      jump = Math.abs(Math.sin((t - jumpStart) * 6)) * 0.35;
    } else if (jumpStart >= 0) {
      const e = t - jumpStart;
      if (e < 0.5) jump = Math.sin((e / 0.5) * Math.PI) * 0.45;
      else jumpStart = -1;
    }
    pet.position.y = bob + jump + (anim === 'focus' ? -0.12 : 0);
    pet.scale.y = 1 + bob * 0.2;
    const sq = 1 - bob * 0.08;
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

    // 박쥐 귀 쫑긋 (신나면 파닥)
    const ew = excite ? Math.sin(t * 13) * 0.08 : 0;
    ears[0].rotation.z = 0.18 + ew;
    ears[1].rotation.z = -0.18 - ew;
    // 꽁지 실룩
    tail.rotation.x = Math.sin(t * (excite ? 10 : 2)) * (excite ? 0.3 : 0.08);

    if (returning) {
      userYaw *= Math.max(0, 1 - dt * 5);
      userPitch *= Math.max(0, 1 - dt * 5);
      if (Math.abs(userYaw) < 0.01 && Math.abs(userPitch) < 0.01) {
        userYaw = 0;
        userPitch = 0;
        returning = false;
      }
    }

    if (anim === 'focus') {
      armParts[0].paw.position.y = -0.56 + Math.max(0, Math.sin(t * 10)) * 0.06;
      armParts[1].paw.position.y = -0.56 + Math.max(0, Math.sin(t * 10 + Math.PI)) * 0.06;
    }

    pivot.rotation.y = userYaw;
    pivot.rotation.x = userPitch;

    renderer.render(scene, camera);
  }
  frame();

  // ---------- 액세서리 (설정에서 착탈) ----------
  const accessories = initAccessories(headGroup, {
    eyeX: 0.44, eyeY: 0.5, eyeZ: 0.82,
    topY: 1.0, topZ: 0.05, topR: 0.8,
    bandR: 1.02, bandY: 0.44, bandZ: 0.05, cupX: 1.06,
    body: { cy: -0.55, rx: 0.88, ry: 0.92, rz: 0.8 },
    sleeve: { x: 0.76, y: -0.3, z: 0.26, r: 0.26, rotZ: 0.55, len: 0.75 },
    legX: 0.32, legY: -1.3, legR: 0.25,
  }, pet);
  accessoriesRef = accessories;
  function setAccessories(list) {
    const worn = accessories.setAccessories(list);
    shirtOn = worn.has('tshirt') || worn.has('hoodie');
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
