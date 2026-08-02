// 곰돌이 3D — 두 발로 선 포근한 테디베어
// 카라멜 브라운 털 + 크림색 주둥이·배·귀 안쪽, 동글 귀, 작은 눈, 타원 갈색 코
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

  const FUR = '#c08a55';
  const brownMat = new THREE.MeshStandardMaterial({ color: 0xc08a55, roughness: 1 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf3e2c3, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.45 });

  function fur(ctx, S, alpha) {
    ctx.strokeStyle = `rgba(120,80,45,${alpha})`;
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
      // 배 쪽(정면 u≈0.25)에 크림색 하트 아닌 둥근 패치
      ctx.filter = 'blur(18px)';
      ctx.fillStyle = 'rgba(243,226,195,0.95)';
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
  head.scale.set(1.08, 0.98, 0.95);
  head.position.set(0, 0.45, 0.03);
  headGroup.add(head);

  // ---------- 귀: 머리 위 동글 귀 + 크림 안쪽 ----------
  const ears = [];
  for (const sign of [-1, 1]) {
    const earGroup = new THREE.Group();
    const outerGeo = new THREE.SphereGeometry(0.3, 22, 16);
    fluff(outerGeo, 0.02);
    const outer = new THREE.Mesh(outerGeo, brownMat);
    outer.scale.set(1, 0.95, 0.5);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), creamMat);
    inner.scale.set(1, 0.95, 0.35);
    inner.position.set(0, -0.02, 0.1);
    earGroup.add(outer, inner);
    earGroup.position.set(0.58 * sign, 1.12, -0.02);
    earGroup.rotation.z = -0.22 * sign;
    headGroup.add(earGroup);
    ears.push(earGroup);
  }

  // ---------- 눈: 작고 동그란 단추 눈 ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.115, 22, 16),
      new THREE.MeshStandardMaterial({ color: 0x241812, roughness: 0.25 })
    );
    const shine = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine.position.set(-0.03 * sign, 0.035, 0.09);
    eye.add(ball, shine);
    eye.position.set(0.32 * sign, 0.56, 0.75);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  headGroup.add(eyeL, eyeR);

  // ---------- 주둥이: 크림색 볼록 + 갈색 타원 코 + 스티치 입 ----------
  const muzzleGeo = new THREE.SphereGeometry(0.34, 26, 20);
  fluff(muzzleGeo, 0.02);
  const muzzle = new THREE.Mesh(muzzleGeo, creamMat);
  muzzle.scale.set(1.05, 0.8, 0.62);
  muzzle.position.set(0, 0.3, 0.78);
  headGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14), dark);
  nose.scale.set(1.3, 0.8, 0.6);
  nose.position.set(0, 0.42, 1.03);
  headGroup.add(nose);

  // 스티치 입: 코 아래 세로선 + 양쪽 미소 아치
  const stitchMat = new THREE.MeshBasicMaterial({ color: 0x5a4030 });
  const stitch = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 8), stitchMat);
  stitch.position.set(0, 0.31, 1.06);
  headGroup.add(stitch);
  for (const sign of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 8, 18, Math.PI), stitchMat);
    arc.rotation.z = Math.PI;
    arc.position.set(0.07 * sign, 0.27, 1.05);
    headGroup.add(arc);
  }

  // 볼터치 (은은한 핑크)
  for (const sign of [-1, 1]) {
    const blush = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 20),
      new THREE.MeshBasicMaterial({ color: 0xe8a184, transparent: true, opacity: 0.45 })
    );
    blush.position.set(0.5 * sign, 0.33, 0.72);
    blush.rotation.y = 0.5 * sign;
    headGroup.add(blush);
  }

  // ---------- 몸통: 통통한 곰 몸 + 크림 배 ----------
  const bodyGeo = new THREE.SphereGeometry(0.88, 48, 32);
  {
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const ny = y / 0.88;
      x *= 0.92;
      z *= 0.84;
      y *= 1.05;
      const hip = Math.max(0, -ny);
      x *= 1 + 0.14 * Math.pow(hip, 1.3);
      z *= 1 + 0.12 * Math.pow(hip, 1.3);
      // 배 볼록
      if (z > 0) z *= 1 + 0.1 * Math.max(0, 1 - Math.abs(ny + 0.15) * 2);
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

  // ---------- 팔: 어깨→손이 한 덩어리로 이어진 팔 그룹 ----------
  const armParts = [];
  for (const sign of [-1, 1]) {
    const armGroup = new THREE.Group();
    // 팔뚝: 그룹 원점(어깨)에서 아래로 뻗는 캡슐
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.34, 6, 14), brownMat);
    arm.position.set(0, -0.2, 0);
    // 손: 팔뚝 끝에 겹치게 붙여 이음새 없이 연결
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), brownMat);
    paw.scale.set(1, 0.92, 1);
    paw.position.set(0, -0.42, 0.02);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), creamMat);
    pad.position.set(0, -0.03, 0.15);
    pad.rotation.x = -0.25;
    paw.add(pad);
    armGroup.add(arm, paw);
    pet.add(armGroup);
    armParts.push({ armGroup, paw, pad, sign });
  }

  // ---------- 다리 + 발 (발바닥 크림 패드) ----------
  const legParts = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.22, 6, 12), brownMat);
    leg.position.set(0.32 * sign, -1.32, 0.02);
    pet.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), brownMat);
    foot.scale.set(1, 0.55, 1.45);
    foot.rotation.y = 0.12 * sign;
    pet.add(foot);
    legParts.push({ leg, foot, sign });
  }

  let shirtOn = false; // 티셔츠 착용 여부 — 입으면 팔을 소매 밖으로 뺀다
  let accessoriesRef = null;
  function applyPose(focus) {
    accessoriesRef?.setFocus(focus);
    for (const { armGroup, pad, sign } of armParts) {
      if (focus) {
        // 어깨에서 앞으로 뻗어 노트북 위에 손이 닿는 자세
        armGroup.position.set(0.5 * sign, -0.3, 0.18);
        armGroup.rotation.set(-1.2, 0, -0.12 * sign);
        pad.visible = false;
      } else if (shirtOn) {
        // 티셔츠 어깨선에 붙어 자연스럽게 늘어진 팔 (소매 밖)
        armGroup.position.set(0.78 * sign, -0.3, 0.2);
        armGroup.rotation.set(-0.22, 0, 0.28 * sign);
        pad.visible = true;
      } else {
        // 몸 옆에 자연스럽게 늘어뜨린 자세 (살짝 바깥·앞쪽으로)
        armGroup.position.set(0.66 * sign, -0.32, 0.16);
        armGroup.rotation.set(-0.28, 0, 0.28 * sign);
        pad.visible = true;
      }
    }
    for (const { leg, foot, sign } of legParts) {
      leg.visible = !focus;
      if (focus) foot.position.set(0.55 * sign, -1.5, 1.05);
      else foot.position.set(0.34 * sign, -1.54, 0.16);
    }
  }
  applyPose(false);

  // ---------- 꼬리: 짧고 동그란 곰 꼬리 ----------
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), brownMat);
  tail.position.set(0, -0.85, -0.72);
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

  // ---------- 애니메이션 상태 (묵직하고 느긋한 곰 템포) ----------
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

    let bobAmp = 0.03; // 곰은 묵직하게
    let bobSpeed = 1.4;
    let spin = 0;
    let tilt = 0;
    let excite = 0;
    if (anim === 'focus') { bobAmp = 0.016; bobSpeed = 1.1; tilt = 0.1; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.06; bobSpeed = 3.6; spin = 2.0; excite = 1; }
    else if (anim === 'cheer') { bobAmp = 0.05; bobSpeed = 4.6; spin = 2.6; excite = 1; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 8; excite = 1; }

    if (spin) {
      petYaw += spin * dt;
    } else {
      petYaw = petYaw % (Math.PI * 2);
      if (petYaw > Math.PI) petYaw -= Math.PI * 2;
      if (petYaw < -Math.PI) petYaw += Math.PI * 2;
      if (anim === 'idle') {
        if (t > wiggleAt) {
          wiggleTarget = (Math.random() - 0.5) * 0.35;
          wiggleAt = t + 3 + Math.random() * 5;
        }
        petYaw += (wiggleTarget - petYaw) * Math.min(1, dt * 2);
      } else {
        petYaw *= Math.max(0, 1 - dt * 5);
      }
    }
    pet.rotation.y = petYaw;
    pet.rotation.x = tilt;

    // 고개 갸웃 (천천히, 포근하게)
    headGroup.rotation.z = Math.sin(t * 0.5) * 0.045 + (excite ? Math.sin(t * 8) * 0.03 : 0);

    const bob = Math.sin(t * bobSpeed * 2) * bobAmp;
    let jump = 0;
    if (anim === 'cheer') {
      jump = Math.abs(Math.sin((t - jumpStart) * 4.6)) * 0.28;
    } else if (jumpStart >= 0) {
      const e = t - jumpStart;
      if (e < 0.5) jump = Math.sin((e / 0.5) * Math.PI) * 0.35;
      else jumpStart = -1;
    }
    pet.position.y = bob + jump + (anim === 'focus' ? -0.12 : 0);
    pet.scale.y = 1 + bob * 0.25;
    const sq = 1 - bob * 0.1;
    pet.scale.x = sq;
    pet.scale.z = sq;

    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.16;
        blinkAt = t + 2.5 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.12 : 1;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

    // 귀 쫑긋 (신나면 팔랑)
    const ew = excite ? Math.sin(t * 10) * 0.07 : Math.sin(t * 0.9) * 0.02;
    ears[0].rotation.z = 0.22 + ew;
    ears[1].rotation.z = -0.22 - ew;

    if (returning) {
      userYaw *= Math.max(0, 1 - dt * 5);
      userPitch *= Math.max(0, 1 - dt * 5);
      if (Math.abs(userYaw) < 0.01 && Math.abs(userPitch) < 0.01) {
        userYaw = 0;
        userPitch = 0;
        returning = false;
      }
    }

    // 타이핑 (팔 전체가 어깨에서 도닥도닥 — 좌우 번갈아)
    if (anim === 'focus') {
      armParts[0].armGroup.rotation.x = -1.2 + Math.max(0, Math.sin(t * 7.5)) * 0.1;
      armParts[1].armGroup.rotation.x = -1.2 + Math.max(0, Math.sin(t * 7.5 + Math.PI)) * 0.1;
    }

    pivot.rotation.y = userYaw;
    pivot.rotation.x = userPitch;

    renderer.render(scene, camera);
  }
  frame();

  // ---------- 액세서리 (설정에서 착탈) ----------
  const accessories = initAccessories(headGroup, {
    eyeX: 0.32, eyeY: 0.56, eyeZ: 0.78,
    topY: 1.02, topZ: 0.03, topR: 0.75,
    bandR: 0.95, bandY: 0.45, bandZ: 0.05, cupX: 0.95,
    body: { cy: -0.55, rx: 0.85, ry: 0.95, rz: 0.85 },
    sleeve: { x: 0.72, y: -0.32, z: 0.22, r: 0.22, rotZ: 0.55, len: 0.75 },
    legX: 0.32, legY: -1.3, legR: 0.24,
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
