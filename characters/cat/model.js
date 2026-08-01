// 치즈냥 3D — 두 발로 서 있는 아기 치즈태비
// 큰 동그란 머리 + 머리보다 좁은 몸통 + 늘어뜨린 팔 + 짧은 다리 + 링 무늬 꼬리
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
  camera.position.set(0, 0.3, 7.8);
  camera.lookAt(0, -0.05, 0);

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

  // ---------- 머리: 큰 동그란 머리 (M자 이마 + 볼터치 텍스처) ----------
  function makeHeadTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#eda85c';
    ctx.fillRect(0, 0, S, S);
    const stripe = 'rgba(198,124,52,0.95)';
    ctx.filter = 'blur(3px)';
    blobOn(ctx, S, 0.215, 0.3, 0.014, 0.06, 0.15, stripe);
    blobOn(ctx, S, 0.25, 0.285, 0.015, 0.07, 0, stripe);
    blobOn(ctx, S, 0.285, 0.3, 0.014, 0.06, -0.15, stripe);
    ctx.filter = 'blur(7px)';
    blobOn(ctx, S, 0.155, 0.55, 0.045, 0.03, 0, 'rgba(246,168,148,0.45)');
    blobOn(ctx, S, 0.345, 0.55, 0.045, 0.03, 0, 'rgba(246,168,148,0.45)');
    ctx.filter = 'none';
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.88, 48, 32),
    new THREE.MeshStandardMaterial({ map: makeHeadTexture(), roughness: 1 })
  );
  head.scale.set(1.06, 0.98, 0.95);
  head.position.set(0, 0.82, 0.05);
  pet.add(head);

  // ---------- 몸통: 머리보다 좁은, 세로로 선 몸 (흰 배 + 등 줄무늬) ----------
  function makeBodyTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#eda85c';
    ctx.fillRect(0, 0, S, S);
    ctx.filter = 'blur(14px)';
    blobOn(ctx, S, 0.25, 0.42, 0.14, 0.32, 0, 'rgba(255,251,244,0.97)'); // 흰 배
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
      x *= 0.8;
      z *= 0.72;
      y *= 1.32; // 세로로 선 몸통
      const hip = Math.max(0, -ny);
      x *= 1 + 0.14 * Math.pow(hip, 1.4); // 엉덩이 쪽만 살짝
      z *= 1 + 0.1 * Math.pow(hip, 1.4);
      pos.setXYZ(i, x, y, z);
    }
    bodyGeo.computeVertexNormals();
  }
  const body = new THREE.Mesh(
    bodyGeo,
    new THREE.MeshStandardMaterial({ map: makeBodyTexture(), roughness: 1 })
  );
  body.position.set(0, -0.55, 0);
  pet.add(body);

  // ---------- 귀 ----------
  const ears = [];
  for (const sign of [-1, 1]) {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.46, 12), cheese);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.28, 10), pinkMat);
    inner.position.set(0, -0.04, 0.09);
    ear.add(outer, inner);
    ear.position.set(0.46 * sign, 1.6, 0.05);
    ear.rotation.z = -0.24 * sign;
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
    eye.position.set(0.32 * sign, 0.92, 0.82);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  pet.add(eyeL, eyeR);

  // ---------- 주둥이 + 코 + 수염 ----------
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 18), white);
  muzzle.scale.set(1.2, 0.72, 0.5);
  muzzle.position.set(0, 0.6, 0.84);
  pet.add(muzzle);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.08, 4), pinkMat);
  nose.rotation.x = Math.PI;
  nose.rotation.y = Math.PI / 4;
  nose.position.set(0, 0.73, 0.97);
  pet.add(nose);

  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xfdf8f0, transparent: true, opacity: 0.85 });
  for (const sign of [-1, 1]) {
    for (const [dy, rot] of [
      [0.05, 0.2],
      [0, 0],
      [-0.05, -0.2],
    ]) {
      const wsk = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.44, 6), whiskerMat);
      wsk.rotation.z = Math.PI / 2 + rot * sign;
      wsk.position.set(0.4 * sign, 0.62 + dy, 0.86);
      pet.add(wsk);
    }
  }

  // ---------- 팔: 양옆에 늘어뜨린 팔 + 흰 발 ----------
  for (const sign of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.42, 6, 12), cheese);
    arm.position.set(0.68 * sign, -0.42, 0.12);
    arm.rotation.z = -0.16 * sign;
    pet.add(arm);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), white);
    paw.position.set(0.74 * sign, -0.74, 0.16);
    pet.add(paw);
  }

  // ---------- 다리 + 발 ----------
  for (const sign of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.26, 6, 12), cheese);
    leg.position.set(0.3 * sign, -1.4, 0.02);
    pet.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), white);
    foot.scale.set(1, 0.55, 1.5);
    foot.position.set(0.3 * sign, -1.62, 0.16);
    pet.add(foot);
  }

  // ---------- 꼬리: 링 무늬, 바닥 뒤로 뻗어 올라가는 꼬리 ----------
  const tail = new THREE.Group();
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, -1.45, -0.5),
      new THREE.Vector3(0.55, -1.55, -0.75),
      new THREE.Vector3(0.95, -1.45, -0.85),
      new THREE.Vector3(1.2, -1.15, -0.8),
      new THREE.Vector3(1.28, -0.8, -0.7),
      new THREE.Vector3(1.2, -0.45, -0.6),
    ]);
    const N = 14; // 촘촘하게 이어진 링 무늬 꼬리
    for (let i = 0; i < N; i++) {
      const p = curve.getPoint(i / (N - 1));
      const r = 0.17 - (i / (N - 1)) * 0.06;
      const seg = new THREE.Mesh(
        new THREE.SphereGeometry(r, 14, 10),
        Math.floor(i / 2) % 2 === 0 ? cheese : darkOrange
      );
      seg.position.copy(p);
      tail.add(seg);
    }
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
  laptop.position.set(0, -1.55, 1.0);
  laptop.scale.setScalar(1.05);
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
    laptop.visible = name === 'focus';
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
