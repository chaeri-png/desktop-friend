// 치즈냥 3D — 시크한 치즈태비 고양이
// 둥근 치즈색 몸 + 흰 배/주둥이, 삼각 귀(분홍 속), 이마 M자 줄무늬,
// 링 무늬 긴 꼬리(살랑살랑), 흰 앞발, 분홍 코, 수염
import * as THREE from '../../src/renderer/vendor/three.module.js';

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
  camera.position.set(0, 0.3, 7.0);
  camera.lookAt(0, -0.1, 0);

  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd8c8b8, 2.6));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.6);
  key.position.set(2, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(-1.5, 3, -4);
  scene.add(rim);

  const pivot = new THREE.Group();
  const pet = new THREE.Group();
  pivot.add(pet);
  scene.add(pivot);

  // ---------- 몸 텍스처: 치즈색 + 흰 배 + 태비 줄무늬 ----------
  function makeBodyTexture() {
    const S = 1024;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');

    ctx.fillStyle = '#eda85c'; // 치즈 오렌지
    ctx.fillRect(0, 0, S, S);

    function blob(cx, cy, rx, ry, rot, fill) {
      ctx.fillStyle = fill;
      for (const off of [-1, 0, 1]) {
        ctx.beginPath();
        ctx.ellipse(S * (cx + off), S * cy, S * rx, S * ry, rot, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 배·가슴은 하얗게 (정면 u=0.25 아래쪽)
    ctx.filter = 'blur(20px)';
    blob(0.25, 0.66, 0.15, 0.24, 0, 'rgba(255,251,244,0.97)');
    const grad = ctx.createLinearGradient(0, S * 0.72, 0, S);
    grad.addColorStop(0, 'rgba(255,251,244,0)');
    grad.addColorStop(1, 'rgba(255,251,244,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    // 이마 M자 줄무늬 (진한 오렌지, 눈 위 이마에)
    ctx.filter = 'blur(5px)';
    const stripe = 'rgba(198,124,52,0.95)';
    blob(0.215, 0.28, 0.013, 0.055, 0.15, stripe);
    blob(0.25, 0.265, 0.014, 0.065, 0, stripe);
    blob(0.285, 0.28, 0.013, 0.055, -0.15, stripe);
    // 등줄기 + 옆구리 줄무늬 (등 = u 0.75)
    ctx.filter = 'blur(6px)';
    blob(0.75, 0.2, 0.014, 0.13, 0, stripe);
    blob(0.68, 0.33, 0.1, 0.02, 0.35, stripe);
    blob(0.82, 0.33, 0.1, 0.02, -0.35, stripe);
    blob(0.66, 0.46, 0.09, 0.02, 0.3, stripe);
    blob(0.84, 0.46, 0.09, 0.02, -0.3, stripe);
    blob(0.68, 0.58, 0.08, 0.018, 0.25, stripe);
    blob(0.82, 0.58, 0.08, 0.018, -0.25, stripe);
    // 볼터치
    ctx.filter = 'blur(12px)';
    blob(0.16, 0.36, 0.04, 0.028, 0, 'rgba(246,168,148,0.4)');
    blob(0.34, 0.36, 0.04, 0.028, 0, 'rgba(246,168,148,0.4)');
    ctx.filter = 'none';

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  // ---------- 몸: 둥글고 아래가 통통한 앉은 고양이 실루엣 ----------
  const bodyGeo = new THREE.SphereGeometry(1.25, 64, 48);
  {
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const ny = y / 1.25;
      y *= 1.08;
      const below = Math.max(0, 0.2 - ny);
      const w = 1 + 0.24 * Math.pow(below / 1.2, 0.9); // 아래로 갈수록 통통
      x *= w;
      z *= w;
      const cheekBand = Math.exp(-Math.pow((ny - 0.1) / 0.32, 2));
      x *= 1 + 0.08 * cheekBand; // 볼 살짝
      if (z > 0) z += 0.07 * Math.pow(Math.max(0, -ny), 1.3) * (z / 1.25);
      const h = Math.sin(x * 38.3 + y * 24.7) * Math.cos(z * 29.9 - y * 17.3);
      const amp = 0.014 * h;
      const len = Math.hypot(x, y, z) || 1;
      pos.setXYZ(i, x + (x / len) * amp, y + (y / len) * amp, z + (z / len) * amp);
    }
    bodyGeo.computeVertexNormals();
  }
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({ map: makeBodyTexture(), roughness: 1 })
  );
  pet.add(body);

  const cheese = new THREE.MeshStandardMaterial({ color: 0xeda85c, roughness: 1 });
  const darkOrange = new THREE.MeshStandardMaterial({ color: 0xc67c34, roughness: 1 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfffbf4, roughness: 1 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf2a8a0, roughness: 0.9 });

  // ---------- 귀: 삼각 귀 + 분홍 속 ----------
  const ears = [];
  for (const sign of [-1, 1]) {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.52, 12), cheese);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.32, 10), pinkMat);
    inner.position.set(0, -0.04, 0.1);
    ear.add(outer, inner);
    ear.position.set(0.55 * sign, 1.38, 0.05);
    ear.rotation.z = -0.22 * sign;
    pet.add(ear);
    ears.push(ear);
  }

  // ---------- 눈 ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0x1b1512, roughness: 0.25 })
    );
    const shine1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine1.position.set(-0.04 * sign, 0.045, 0.11);
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine2.position.set(0.045 * sign, -0.035, 0.115);
    eye.add(ball, shine1, shine2);
    eye.position.set(0.38 * sign, 0.42, 1.05);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  pet.add(eyeL, eyeR);

  // ---------- 주둥이: 흰 뭉툭 + 분홍 코 + 수염 ----------
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 18), white);
  muzzle.scale.set(1.2, 0.75, 0.55);
  muzzle.position.set(0, 0.12, 1.1);
  pet.add(muzzle);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.09, 4), pinkMat);
  nose.rotation.x = Math.PI; // 아래로 향한 세모코
  nose.rotation.y = Math.PI / 4;
  nose.position.set(0, 0.28, 1.26);
  pet.add(nose);

  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xfdf8f0, transparent: true, opacity: 0.85 });
  for (const sign of [-1, 1]) {
    for (const [dy, rot] of [
      [0.05, 0.2],
      [0, 0],
      [-0.05, -0.2],
    ]) {
      const wsk = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.46, 6), whiskerMat);
      wsk.rotation.z = Math.PI / 2 + rot * sign;
      wsk.position.set(0.4 * sign, 0.14 + dy, 1.12);
      pet.add(wsk);
    }
  }

  // ---------- 앞발: 흰 발 ----------
  const paws = [];
  for (const sign of [-1, 1]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), white);
    paw.scale.set(1, 0.6, 1.3);
    paw.position.set(0.3 * sign, -1.28, 0.62);
    pet.add(paw);
    paws.push(paw);
  }

  // ---------- 꼬리: 링 무늬, 옆으로 감아올린 긴 꼬리 (살랑살랑) ----------
  const tail = new THREE.Group();
  {
    const pts = [
      [0.15, -1.0, -1.0],
      [0.55, -0.85, -1.2],
      [0.9, -0.5, -1.25],
      [1.05, -0.1, -1.15],
      [1.05, 0.3, -1.0],
      [0.95, 0.62, -0.9],
    ];
    pts.forEach(([x, y, z], i) => {
      const r = 0.17 - i * 0.012;
      const seg = new THREE.Mesh(
        new THREE.SphereGeometry(r, 14, 10),
        i % 2 === 0 ? cheese : darkOrange
      );
      seg.position.set(x, y, z);
      tail.add(seg);
    });
  }
  pet.add(tail);

  // ---------- 노트북 + 타이핑 손 (집중 모드에서만) ----------
  const laptop = new THREE.Group();
  let tapL, tapR;
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
    tapL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), white);
    tapR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), white);
    tapL.position.set(-0.24, 0.12, -0.05);
    tapR.position.set(0.24, 0.12, -0.05);
    laptop.add(base, keys, screen, glow, logo, tapL, tapR);
  }
  laptop.position.set(0, -1.2, 1.12);
  laptop.scale.setScalar(1.05);
  laptop.visible = false;
  pet.add(laptop);

  // ---------- 애니메이션 상태 (귀 쫑긋 + 꼬리 살랑) ----------
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
    laptop.visible = name === 'focus';
    paws.forEach((p) => { p.visible = name !== 'focus'; });
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
    let excite = 0; // 귀 쫑긋 + 꼬리 빠르게
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

    const bob = Math.sin(t * bobSpeed * 2) * bobAmp;
    let jump = 0;
    if (anim === 'cheer') {
      jump = Math.abs(Math.sin((t - jumpStart) * 6)) * 0.35;
    } else if (jumpStart >= 0) {
      const e = t - jumpStart;
      if (e < 0.5) jump = Math.sin((e / 0.5) * Math.PI) * 0.5;
      else jumpStart = -1;
    }
    pet.position.y = bob + jump;
    pet.scale.y = 1 + bob * 0.3;
    const sq = 1 - bob * 0.12;
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

    // 꼬리 살랑살랑 (기본 느긋, 신나면 빠르게)
    tail.rotation.y = Math.sin(t * (excite ? 6 : 1.6)) * (excite ? 0.22 : 0.1);
    // 귀 쫑긋
    const ew = excite ? Math.sin(t * 14) * 0.12 : 0;
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

    // 타이핑
    if (laptop.visible) {
      tapL.position.y = 0.1 + Math.max(0, Math.sin(t * 11)) * 0.08;
      tapR.position.y = 0.1 + Math.max(0, Math.sin(t * 11 + Math.PI)) * 0.08;
    }

    pivot.rotation.y = userYaw;
    pivot.rotation.x = userPitch;

    renderer.render(scene, camera);
  }
  frame();

  return {
    setAnimation,
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
