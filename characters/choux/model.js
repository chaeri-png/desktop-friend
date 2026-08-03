// 슈크림 3D — 몽글몽글 구름빵 친구
// 크림색 세 갈래 구름 몸 + 초록 점 눈·삐딱 눈썹 + 크게 웃는 입(분홍 속) + 초록 짧은 발 + 볼터치
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
  camera.position.set(0, 0.3, 7.4);
  camera.lookAt(0, -0.05, 0);

  scene.add(new THREE.HemisphereLight(0xfffdf5, 0xd8d2c4, 2.6));
  const key = new THREE.DirectionalLight(0xfff8ea, 1.6);
  key.position.set(2, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.9);
  rim.position.set(-1.5, 3, -4);
  scene.add(rim);

  const pivot = new THREE.Group();
  const pet = new THREE.Group();
  pivot.add(pet);
  scene.add(pivot);

  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfbf4da, roughness: 1 });
  const green = new THREE.MeshStandardMaterial({ color: 0x2d5233, roughness: 0.8 });
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf7dede, transparent: true, opacity: 0.85 });

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

  // ---------- 몸: 원화 그대로의 구름 실루엣 (한 장짜리 곡면) ----------
  // 몸통·정수리·양옆 봉우리 타원체 4개를 부드러운 최대값으로 융합해
  // 이음새 없이 자연스럽게 이어지는 구름 곡면 하나를 만든다 (질감 균일)
  const LOBES = [
    { c: new THREE.Vector3(0, -0.35, 0), r: [1.62, 1.12, 1.1] }, // 넓고 둥근 아랫몸통
    { c: new THREE.Vector3(0, 0.62, -0.02), r: [0.95, 0.88, 0.76] }, // 정수리 큰 돔
    { c: new THREE.Vector3(-1.08, 0.22, -0.02), r: [0.68, 0.6, 0.56] }, // 왼쪽 봉우리
    { c: new THREE.Vector3(1.08, 0.22, -0.02), r: [0.68, 0.6, 0.56] }, // 오른쪽 봉우리
  ];
  // 원점에서 방향 n으로 쐈을 때 타원체 표면까지의 거리
  function rayEllipsoid(n, lobe) {
    const [a, b, c2] = lobe.r;
    const dx = n.x / a, dy = n.y / b, dz = n.z / c2;
    const ox = -lobe.c.x / a, oy = -lobe.c.y / b, oz = -lobe.c.z / c2;
    const A = dx * dx + dy * dy + dz * dz;
    const B = 2 * (dx * ox + dy * oy + dz * oz);
    const C = ox * ox + oy * oy + oz * oz - 1;
    const D = B * B - 4 * A * C;
    if (D <= 0) return 0;
    return (-B + Math.sqrt(D)) / (2 * A);
  }
  const bodyGeo = new THREE.SphereGeometry(1, 80, 60);
  {
    const K = 9; // 융합 강도 — 클수록 또렷, 작을수록 뭉툭
    const pos = bodyGeo.attributes.position;
    const n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
      let acc = 0;
      for (const lobe of LOBES) acc += Math.exp(K * rayEllipsoid(n, lobe));
      const dist = Math.log(acc) / K; // smooth max
      pos.setXYZ(i, n.x * dist, n.y * dist, n.z * dist);
    }
    bodyGeo.computeVertexNormals();
  }
  fluff(bodyGeo, 0.03);
  pet.add(new THREE.Mesh(bodyGeo, creamMat));

  // ---------- 얼굴 ----------
  // 점 눈 (초록, 오른쪽 눈이 살짝 큼 — 원화의 장난기)
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14), green);
  eyeL.scale.set(0.85, 1.15, 0.5);
  eyeL.position.set(-0.3, 0.3, 1.02);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.125, 18, 14), green);
  eyeR.scale.set(0.85, 1.15, 0.5);
  eyeR.position.set(0.3, 0.32, 1.02);
  pet.add(eyeL, eyeR);

  // 삐딱 눈썹 (오른쪽 눈 위)
  const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.2, 6, 10), green);
  brow.rotation.z = 1.35; // 살짝 기울인 일자 눈썹
  brow.position.set(0.34, 0.62, 1.0);
  pet.add(brow);

  // 크게 웃는 입: 초록 테두리 + 분홍 속
  const mouthOuter = new THREE.Mesh(new THREE.SphereGeometry(0.42, 26, 20), green);
  mouthOuter.scale.set(1.45, 0.62, 0.3); // 옆으로 넓게 활짝 웃는 입
  mouthOuter.position.set(0.02, -0.1, 1.06);
  const mouthInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 22, 16),
    new THREE.MeshStandardMaterial({ color: 0xc9968f, roughness: 0.9 })
  );
  mouthInner.scale.set(1.42, 0.56, 0.3);
  mouthInner.position.set(0.02, -0.15, 1.14);
  pet.add(mouthOuter, mouthInner);

  // 볼터치
  for (const sign of [-1, 1]) {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.22, 22), blushMat);
    blush.position.set(0.72 * sign, 0.02, 0.92);
    blush.rotation.y = 0.55 * sign;
    pet.add(blush);
  }

  // ---------- 발: 초록 짧은 다리 (바깥으로 살짝 벌림) ----------
  for (const sign of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.3, 6, 12), green);
    foot.rotation.z = 0.45 * sign;
    foot.position.set(0.55 * sign, -1.42, 0.1);
    pet.add(foot);
  }

  // ---------- 집중 모드: 노트북 + 콩콩 두드리는 초록 손 + 머리띠 ----------
  const laptop = new THREE.Group();
  {
    const alu = new THREE.MeshStandardMaterial({ color: 0xd7d3ce, roughness: 0.55 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.7), alu);
    const keys = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.02, 0.46),
      new THREE.MeshStandardMaterial({ color: 0x8f8b86, roughness: 0.9 })
    );
    keys.position.set(0, 0.04, -0.02);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.045), alu);
    screen.position.set(0, 0.25, 0.37);
    screen.rotation.x = 0.5;
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.97, 0.48),
      new THREE.MeshBasicMaterial({ color: 0xcfe8ff })
    );
    glow.position.set(0, 0.24, 0.335);
    glow.rotation.x = 0.5;
    glow.rotation.y = Math.PI;
    laptop.add(base, keys, screen, glow);
  }
  laptop.position.set(0, -1.35, 1.4);
  laptop.visible = false;
  pet.add(laptop);

  let tapL, tapR;
  {
    tapL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), green);
    tapR = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), green);
    tapL.position.set(-0.4, -1.14, 1.4);
    tapR.position.set(0.4, -1.14, 1.4);
    tapL.visible = false;
    tapR.visible = false;
    pet.add(tapL, tapR);
  }

  const headband = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.08, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0xe05a4e, roughness: 0.7 })
  );
  headband.rotation.x = 1.35;
  headband.position.set(0, 1.15, -0.02);
  headband.visible = false;
  pet.add(headband);

  // ---------- 애니메이션 상태 (몽글몽글 통통 튀는 템포) ----------
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
  let accessoriesRef = null;

  function setAnimation(name) {
    if (name === anim) return;
    anim = name;
    accessoriesRef?.setAct?.(name === 'cheer' ? 'dance' : name === 'drink' ? 'bottle' : null);
    accessoriesRef?.setFocus?.(name === 'focus' || name === 'cheer' || name === 'drink' || name === 'stretch');
    const focus = name === 'focus';
    laptop.visible = focus;
    tapL.visible = focus;
    tapR.visible = focus;
    headband.visible = focus;
    if (name === 'react' || name === 'cheer') jumpStart = t;
    const s = name === 'drag' ? 1.3 : 1;
    eyeL.scale.set(0.85 * s, 1.15 * s, 0.5);
    eyeR.scale.set(0.85 * s, 1.15 * s, 0.5);
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

    let bobAmp = 0.05; // 몽글몽글 통통
    let bobSpeed = 2.0;
    let spin = 0;
    let tilt = 0;
    if (anim === 'focus') { bobAmp = 0.02; bobSpeed = 1.3; tilt = 0.08; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.08; bobSpeed = 4; spin = 2.2; }
    else if (anim === 'cheer') { bobAmp = 0.08; bobSpeed = 6.5; spin = 3.6; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 8; }
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

    const bob = Math.sin(t * bobSpeed * 2) * bobAmp;
    let jump = 0;
    if (anim === 'cheer') {
      jump = Math.abs(Math.sin((t - jumpStart) * 5)) * 0.34;
    } else if (jumpStart >= 0) {
      const e = t - jumpStart;
      if (e < 0.5) jump = Math.sin((e / 0.5) * Math.PI) * 0.4;
      else jumpStart = -1;
    }
    pet.position.y = bob + jump + (anim === 'focus' ? -0.1 : 0);
    pet.scale.y = 1 + bob * 0.3; // 찐빵처럼 말랑하게
    const sq = 1 - bob * 0.12;
    pet.scale.x = sq;
    pet.scale.z = sq;
    if (anim === 'stretch') {
      pet.scale.y = 1 + 0.14 * Math.abs(Math.sin(t * 1.7));
      pet.rotation.z = Math.sin(t * 1.7) * 0.15;
    } else {
      pet.rotation.z = 0;
    }

    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.15;
        blinkAt = t + 2.3 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.12 : 1.15;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

    // 타이핑 (집중): 초록 손 콩콩
    if (anim === 'focus') {
      tapL.position.y = -1.14 + Math.max(0, Math.sin(t * 8)) * 0.08;
      tapR.position.y = -1.14 + Math.max(0, Math.sin(t * 8 + Math.PI)) * 0.08;
    }

    if (returning) {
      userYaw *= Math.max(0, 1 - dt * 5);
      userPitch *= Math.max(0, 1 - dt * 5);
      if (Math.abs(userYaw) < 0.01 && Math.abs(userPitch) < 0.01) {
        userYaw = 0;
        userPitch = 0;
        returning = false;
      }
    }

    pivot.rotation.y = userYaw;
    pivot.rotation.x = userPitch;

    renderer.render(scene, camera);
  }
  frame();

  // ---------- 액세서리 (설정에서 착탈) ----------
  const accessories = initAccessories(pet, {
    eyeX: 0.3, eyeY: 0.31, eyeZ: 1.05,
    topY: 1.15, topZ: -0.02, topR: 0.85,
    bandR: 1.62, bandY: 0.15, bandZ: 0, cupX: 1.64,
    // 구름 몸에 맞춘 옷 밴드
    body: { cy: -0.55, rx: 1.5, ry: 1.12, rz: 1.05, shirtTheta: [1.1, 0.95], pantsTheta: [2.0, 0.6], patchY: -0.5, patchZ: 1.15 },
  }, pet);
  accessoriesRef = accessories;
  const setAccessories = accessories.setAccessories;

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
