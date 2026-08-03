// 원숭이 3D — 두 발로 선 장난꾸러기 원숭이
// 갈색 털 + 크림색 얼굴·배·귀 안쪽, 옆으로 동글 귀, 정수리 털 뿔, 뒤로 말린 긴 꼬리
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

  const FUR = '#8f6244';
  const brownMat = new THREE.MeshStandardMaterial({ color: 0x8f6244, roughness: 1 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf1ddba, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x33241a, roughness: 0.45 });

  function fur(ctx, S, alpha) {
    ctx.strokeStyle = `rgba(80,52,32,${alpha})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 480; i++) {
      const x = ((i * 379) % S) + ((i * 131) % 7) - 3;
      const y = (i * 613) % S;
      const len = 8 + ((i * 17) % 12);
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

  function makeFurTexture(bellyPatch) {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = FUR;
    ctx.fillRect(0, 0, S, S);
    fur(ctx, S, 0.14);
    if (bellyPatch) {
      // 배 쪽(정면 u≈0.25)에 크림색 둥근 패치
      ctx.filter = 'blur(18px)';
      ctx.fillStyle = 'rgba(241,221,186,0.95)';
      ctx.beginPath();
      ctx.ellipse(S * 0.25, S * 0.52, S * 0.13, S * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  // ---------- 머리 그룹 ----------
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.35, 0);
  pet.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.85, 48, 36);
  fluff(headGeo, 0.025);
  const head = new THREE.Mesh(
    headGeo,
    new THREE.MeshStandardMaterial({ map: makeFurTexture(false), roughness: 1 })
  );
  head.scale.set(1.06, 0.98, 0.95);
  head.position.set(0, 0.45, 0.03);
  headGroup.add(head);

  // 정수리 털 뿔 (장난꾸러기 포인트)
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 10), brownMat);
  tuft.position.set(0, 1.32, 0.02);
  tuft.rotation.z = -0.15;
  headGroup.add(tuft);

  // ---------- 크림색 얼굴판: 눈두덩 + 주둥이 ----------
  const facePlate = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 22), creamMat);
  facePlate.scale.set(1.3, 1.0, 0.55);
  facePlate.position.set(0, 0.48, 0.58);
  headGroup.add(facePlate);

  const muzzleGeo = new THREE.SphereGeometry(0.32, 24, 18);
  fluff(muzzleGeo, 0.015);
  const muzzle = new THREE.Mesh(muzzleGeo, creamMat);
  muzzle.scale.set(1.1, 0.78, 0.6);
  muzzle.position.set(0, 0.24, 0.72);
  headGroup.add(muzzle);

  // ---------- 눈: 동그란 눈 + 반짝 ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 22, 16),
      new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.25 })
    );
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine.position.set(-0.03 * sign, 0.04, 0.1);
    eye.add(ball, shine);
    eye.position.set(0.3 * sign, 0.56, 0.83);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  headGroup.add(eyeL, eyeR);

  // ---------- 콧구멍 + 씩 웃는 입 ----------
  const stitchMat = new THREE.MeshBasicMaterial({ color: 0x4a3423 });
  for (const sign of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), stitchMat);
    nostril.position.set(0.07 * sign, 0.32, 0.98);
    headGroup.add(nostril);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 20, Math.PI), stitchMat);
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.24, 0.99);
  headGroup.add(smile);

  // 볼터치 (은은한 핑크)
  for (const sign of [-1, 1]) {
    const blush = new THREE.Mesh(
      new THREE.CircleGeometry(0.09, 20),
      new THREE.MeshBasicMaterial({ color: 0xe8a184, transparent: true, opacity: 0.4 })
    );
    blush.position.set(0.48 * sign, 0.34, 0.72);
    blush.rotation.y = 0.5 * sign;
    headGroup.add(blush);
  }

  // ---------- 귀: 옆으로 붙은 동글 귀 + 크림 안쪽 ----------
  const ears = [];
  for (const sign of [-1, 1]) {
    const earGroup = new THREE.Group();
    const outerGeo = new THREE.SphereGeometry(0.28, 22, 16);
    fluff(outerGeo, 0.02);
    const outer = new THREE.Mesh(outerGeo, brownMat);
    outer.scale.set(0.55, 1, 0.95);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), creamMat);
    inner.scale.set(0.4, 0.95, 0.9);
    inner.position.set(0.08 * sign, 0, 0.02);
    earGroup.add(outer, inner);
    earGroup.position.set(0.9 * sign, 0.5, 0.02);
    earGroup.rotation.y = -0.25 * sign;
    headGroup.add(earGroup);
    ears.push(earGroup);
  }

  // ---------- 몸통: 통통한 몸 + 크림 배 ----------
  const bodyGeo = new THREE.SphereGeometry(0.86, 48, 32);
  {
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const ny = y / 0.86;
      x *= 0.9;
      z *= 0.82;
      y *= 1.05;
      const hip = Math.max(0, -ny);
      x *= 1 + 0.13 * Math.pow(hip, 1.3);
      z *= 1 + 0.11 * Math.pow(hip, 1.3);
      if (z > 0) z *= 1 + 0.09 * Math.max(0, 1 - Math.abs(ny + 0.15) * 2);
      pos.setXYZ(i, x, y, z);
    }
  }
  fluff(bodyGeo, 0.022);
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({ map: makeFurTexture(true), roughness: 1 })
  );
  body.position.set(0, -0.55, 0);
  pet.add(body);

  // ---------- 팔: 어깨→손이 한 덩어리 팔 그룹 (손은 크림색) ----------
  const armParts = [];
  for (const sign of [-1, 1]) {
    const armGroup = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.36, 6, 14), brownMat);
    arm.position.set(0, -0.21, 0);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), creamMat);
    paw.scale.set(1, 0.9, 1);
    paw.position.set(0, -0.44, 0.02);
    armGroup.add(arm, paw);
    pet.add(armGroup);
    armParts.push({ armGroup, paw, sign });
  }

  // ---------- 다리 + 발 (발은 크림색) ----------
  const legParts = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.22, 6, 12), brownMat);
    leg.position.set(0.32 * sign, -1.32, 0.02);
    pet.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), creamMat);
    foot.scale.set(1, 0.55, 1.5);
    foot.rotation.y = 0.12 * sign;
    pet.add(foot);
    legParts.push({ leg, foot, sign });
  }

  let shirtOn = false; // 티셔츠 착용 여부 — 입으면 팔을 소매 밖으로 뺀다
  let accessoriesRef = null;
  function applyPose(focus) {
    accessoriesRef?.setFocus(focus);
    for (const { armGroup, sign } of armParts) {
      if (focus) {
        armGroup.position.set(0.5 * sign, -0.3, 0.18);
        armGroup.rotation.set(-1.2, 0, -0.12 * sign);
      } else if (shirtOn) {
        armGroup.position.set(0.78 * sign, -0.3, 0.2);
        armGroup.rotation.set(-0.22, 0, 0.28 * sign);
      } else {
        armGroup.position.set(0.64 * sign, -0.32, 0.16);
        armGroup.rotation.set(-0.28, 0, 0.28 * sign);
      }
    }
    for (const { leg, foot, sign } of legParts) {
      leg.visible = !focus;
      if (focus) foot.position.set(0.55 * sign, -1.5, 1.05);
      else foot.position.set(0.34 * sign, -1.54, 0.16);
    }
  }
  applyPose(false);

  // ---------- 꼬리: 뒤로 말려 올라간 긴 꼬리 ----------
  const tail = new THREE.Group();
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.95, -0.7),
      new THREE.Vector3(0.25, -0.75, -1.0),
      new THREE.Vector3(0.4, -0.3, -1.1),
      new THREE.Vector3(0.25, 0.1, -0.95),
      new THREE.Vector3(0.0, 0.22, -0.75),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.07, 8, false), brownMat);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), creamMat);
    tip.position.set(0.0, 0.22, -0.75);
    tail.add(tube, tip);
  }
  pet.add(tail);

  // ---------- 집중 머리띠 ----------
  const headband = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.08, 12, 40),
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

  // ---------- 애니메이션 상태 (촐랑촐랑 템포) ----------
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

    let bobAmp = 0.045; // 원숭이는 촐랑촐랑
    let bobSpeed = 2.2;
    let spin = 0;
    let tilt = 0;
    let excite = 0;
    if (anim === 'focus') { bobAmp = 0.018; bobSpeed = 1.3; tilt = 0.1; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.07; bobSpeed = 4.2; spin = 2.4; excite = 1; }
    else if (anim === 'cheer') { bobAmp = 0.08; bobSpeed = 6.5; spin = 3.6; excite = 1; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 8; excite = 1; }
    else if (anim === 'drink') { bobAmp = 0.012; bobSpeed = 1.6; tilt = -0.2 + Math.sin(t * 4.2) * 0.09; }
    else if (anim === 'stretch') { bobAmp = 0.015; bobSpeed = 1.2; }

    if (spin) {
      petYaw += spin * dt;
    } else {
      petYaw = petYaw % (Math.PI * 2);
      if (petYaw > Math.PI) petYaw -= Math.PI * 2;
      if (petYaw < -Math.PI) petYaw += Math.PI * 2;
      if (anim === 'idle') {
        if (t > wiggleAt) {
          wiggleTarget = (Math.random() - 0.5) * 0.5;
          wiggleAt = t + 2.5 + Math.random() * 4;
        }
        petYaw += (wiggleTarget - petYaw) * Math.min(1, dt * 2.5);
      } else {
        petYaw *= Math.max(0, 1 - dt * 5);
      }
    }
    pet.rotation.y = petYaw;
    pet.rotation.x = tilt;

    // 고개 갸웃 (장난스럽게 자주)
    headGroup.rotation.z = Math.sin(t * 0.9) * 0.06 + (excite ? Math.sin(t * 9) * 0.04 : 0);

    const bob = Math.sin(t * bobSpeed * 2) * bobAmp;
    let jump = 0;
    if (anim === 'cheer') {
      jump = Math.abs(Math.sin((t - jumpStart) * 5)) * 0.32;
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
    if (anim === 'stretch') {
      pet.scale.y = 1 + 0.12 * Math.abs(Math.sin(t * 1.7));
      pet.rotation.z = Math.sin(t * 1.7) * 0.15;
    } else {
      pet.rotation.z = 0;
    }

    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.15;
        blinkAt = t + 2.2 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.12 : 1;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

    // 꼬리 살랑 (기분 좋으면 크게)
    tail.rotation.y = Math.sin(t * (excite ? 8 : 2)) * (excite ? 0.3 : 0.12);
    // 귀 쫑긋
    const ew = excite ? Math.sin(t * 10) * 0.08 : Math.sin(t * 1.2) * 0.03;
    ears[0].rotation.z = ew;
    ears[1].rotation.z = -ew;

    if (returning) {
      userYaw *= Math.max(0, 1 - dt * 5);
      userPitch *= Math.max(0, 1 - dt * 5);
      if (Math.abs(userYaw) < 0.01 && Math.abs(userPitch) < 0.01) {
        userYaw = 0;
        userPitch = 0;
        returning = false;
      }
    }

    // 타이핑 (재빠르게 도닥도닥)
    if (anim === 'focus') {
      armParts[0].armGroup.rotation.x = -1.2 + Math.max(0, Math.sin(t * 8.5)) * 0.1;
      armParts[1].armGroup.rotation.x = -1.2 + Math.max(0, Math.sin(t * 8.5 + Math.PI)) * 0.1;
    }

    pivot.rotation.y = userYaw;
    pivot.rotation.x = userPitch;

    renderer.render(scene, camera);
  }
  frame();

  // ---------- 액세서리 (설정에서 착탈) ----------
  const accessories = initAccessories(headGroup, {
    eyeX: 0.3, eyeY: 0.56, eyeZ: 0.86,
    topY: 1.02, topZ: 0.03, topR: 0.75,
    bandR: 0.97, bandY: 0.48, bandZ: 0.05, cupX: 1.0,
    body: { cy: -0.55, rx: 0.84, ry: 0.94, rz: 0.83 },
    sleeve: { x: 0.72, y: -0.32, z: 0.22, r: 0.21, rotZ: 0.55, len: 0.75 },
    legX: 0.32, legY: -1.3, legR: 0.23,
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
