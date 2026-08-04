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

  // ---------- 몸: 원화 외곽선을 그대로 딴 실루엣을 도톰하게 부풀린 형태 ----------
  // 정면 모습 = 원화와 동일. 진초록 테두리도 뒤판으로 재현한다.
  // 정수리에서 양옆 봉우리로 y가 계속 내려오도록 잡은 좌표
  // (예전엔 어깨 구간 y가 평평해 옆이 위로 솟아 보였음)
  const OUTLINE = [
    [0, -1.32], [0.85, -1.18], [1.42, -0.68], [1.6, -0.05], [1.3, 0.5],
    [0.9, 0.72], [0.72, 1.06], [0.02, 1.42], [-0.72, 1.06], [-0.9, 0.72],
    [-1.3, 0.5], [-1.6, -0.05], [-1.42, -0.68], [-0.85, -1.18],
  ];
  // 시작점과 끝점이 매끈하게 이어지도록 닫힌 스플라인으로 외곽선을 만든다
  // (Shape.closePath는 직선으로 닫혀 아랫부분에 꺾인 돌출이 생겼음)
  const outlineCurve = new THREE.CatmullRomCurve3(
    OUTLINE.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    true,
    'catmullrom',
    0.5
  );
  // 원화 실루엣을 그대로 유지한 채 앞뒤로 둥글게 부풀린 3D 볼륨:
  // 방위각별 외곽 반지름 R(θ)를 스플라인에서 뽑아, 구의 xy를 R(θ)로 늘리고 z는 쿠션처럼 둥글린다
  const DEPTH = 0.95;
  const R_BINS = 720;
  const rTable = new Float32Array(R_BINS).fill(0);
  {
    const pts = outlineCurve.getPoints(1024);
    for (const p of pts) {
      const a = Math.atan2(p.y, p.x);
      const bin = ((Math.round((a / (Math.PI * 2)) * R_BINS) % R_BINS) + R_BINS) % R_BINS;
      const r = Math.hypot(p.x, p.y);
      if (r > rTable[bin]) rTable[bin] = r;
    }
    // 빈 구간은 이웃 값으로 채움
    for (let k = 0; k < 3; k++)
      for (let i = 0; i < R_BINS; i++)
        if (!rTable[i]) rTable[i] = rTable[(i + R_BINS - 1) % R_BINS] || rTable[(i + 1) % R_BINS];
    // 각도 샘플링 계단·이음새 갈라짐을 이동 평균으로 매끈하게 (여러 번 부드럽게)
    for (let pass = 0; pass < 4; pass++) {
      const tmp = Float32Array.from(rTable);
      for (let i = 0; i < R_BINS; i++) {
        let s = 0;
        for (let o = -7; o <= 7; o++) s += tmp[(i + o + R_BINS) % R_BINS];
        rTable[i] = s / 15;
      }
    }
  }
  function outlineR(theta) {
    const f = (((theta / (Math.PI * 2)) * R_BINS % R_BINS) + R_BINS) % R_BINS;
    const i0 = Math.floor(f) % R_BINS;
    const i1 = (i0 + 1) % R_BINS;
    return rTable[i0] + (rTable[i1] - rTable[i0]) * (f - Math.floor(f));
  }
  const bodyGeo = new THREE.SphereGeometry(1, 96, 64);
  {
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const nx = pos.getX(i);
      const ny = pos.getY(i);
      const nz = pos.getZ(i);
      const R = outlineR(Math.atan2(ny, nx));
      // 위아래로 살짝 눌러 더 넓적하고 귀엽게
      pos.setXYZ(i, nx * R, ny * R * 0.92, nz * DEPTH);
    }
    bodyGeo.computeVertexNormals();
  }
  pet.add(new THREE.Mesh(bodyGeo, creamMat));

  // ---------- 얼굴 ----------
  // 점 눈 (초록, 오른쪽 눈이 살짝 큼 — 원화의 장난기)
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), green);
  eyeL.scale.set(0.85, 1.15, 0.5);
  eyeL.position.set(-0.3, 0.31, 0.86);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14), green);
  eyeR.scale.set(0.85, 1.15, 0.5);
  eyeR.position.set(0.3, 0.31, 0.86);
  pet.add(eyeL, eyeR);

  // 눈썹 (양쪽, 위로 솟은 아치 — 발랄한 인상). 왼쪽은 그룹 반전으로 완전 대칭
  for (const sign of [-1, 1]) {
    const holder = new THREE.Group();
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.038, 8, 24, 1.45), green);
    brow.rotation.z = 0.62; // 아치 꼭대기가 위·바깥쪽을 향하게
    brow.position.set(0.33, 0.63, 0.8);
    holder.add(brow);
    if (sign < 0) holder.scale.x = -1;
    pet.add(holder);
  }

  // 크게 웃는 입: 초록 테두리 + 분홍 속
  // 반달(D자) 모양 — 윗선은 반듯하고 아래는 둥근 활짝 웃는 입
  function halfDisc(w) {
    const s = new THREE.Shape();
    s.moveTo(w, 0);
    s.absarc(0, 0, w, 0, Math.PI, true); // 아래쪽 반원
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 40,
    });
  }
  const mouthOuter = new THREE.Mesh(halfDisc(0.6), green);
  mouthOuter.scale.set(1, 0.78, 1);
  mouthOuter.position.set(0.02, 0.02, 0.82);
  pet.add(mouthOuter);
  // 입 안쪽: 위는 어두운 입안, 아래는 도톰한 분홍 혀
  const mouthCavity = new THREE.Mesh(
    halfDisc(0.5),
    new THREE.MeshStandardMaterial({ color: 0x24401f, roughness: 0.9 })
  );
  mouthCavity.scale.set(1, 0.74, 1);
  mouthCavity.position.set(0.02, -0.02, 0.88);
  const tongue = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 26, 18),
    new THREE.MeshStandardMaterial({ color: 0xd49a92, roughness: 0.85 })
  );
  tongue.scale.set(0.85, 0.45, 0.28);
  tongue.position.set(0.02, -0.19, 1.04); // 입 안쪽 면보다 앞으로
  pet.add(mouthCavity, tongue);

  // 볼터치
  for (const sign of [-1, 1]) {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.27, 26), blushMat);
    blush.scale.set(1, 0.92, 1);
    blush.position.set(0.78 * sign, 0.06, 0.86); // 몸 표면 앞으로 빼서 또렷하게
    blush.rotation.y = 0.3 * sign;
    pet.add(blush);
  }

  // ---------- 발: 초록 짧은 다리 (바깥으로 살짝 벌림) ----------
  for (const sign of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.3, 6, 12), green);
    foot.rotation.z = 0.45 * sign;
    foot.position.set(0.58 * sign, -1.32, 0.08);
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
    eyeX: 0.3, eyeY: 0.31, eyeZ: 0.88,
    topY: 1.2, topZ: 0, topR: 0.85,
    bandR: 1.62, bandY: 0.2, bandZ: 0, cupX: 1.64,
    // 쿠션형 몸에 맞춘 옷 밴드
    body: { cy: -0.55, rx: 1.55, ry: 1.15, rz: 0.92, shirtTheta: [1.1, 0.95], pantsTheta: [2.0, 0.6], patchY: -0.5, patchZ: 0.95 },
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
