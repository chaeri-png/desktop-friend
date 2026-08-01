// 말티즈 3D — 두 발로 선 보송보송 하얀 강아지
// 온몸 풍성한 흰 털, 늘어진 귀, 정수리 털 뭉치, 까만 단추코, 분홍 혀,
// 집중 시 책상에 앉아 자기 손으로 타이핑
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
  const cream = new THREE.MeshStandardMaterial({ color: 0xf2ecdf, roughness: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x26201c, roughness: 0.4 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf0a0a0, roughness: 0.8 });

  function blobOn(ctx, S, cx, cy, rx, ry, rot, fill) {
    ctx.fillStyle = fill;
    for (const off of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.ellipse(S * (cx + off), S * cy, S * rx, S * ry, rot, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 옅은 털 결 (하얀 털의 미세 그림자)
  function fur(ctx, S, alpha) {
    ctx.strokeStyle = `rgba(205,195,180,${alpha})`;
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

  // 표면 솜털 요철 (말티즈는 특히 풍성하게)
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

  function makeHeadTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fdfaf3';
    ctx.fillRect(0, 0, S, S);
    fur(ctx, S, 0.12);
    ctx.filter = 'blur(8px)';
    blobOn(ctx, S, 0.15, 0.55, 0.045, 0.03, 0, 'rgba(244,178,168,0.3)');
    blobOn(ctx, S, 0.35, 0.55, 0.045, 0.03, 0, 'rgba(244,178,168,0.3)');
    ctx.filter = 'none';
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }
  const headGeo = new THREE.SphereGeometry(0.88, 48, 36);
  fluff(headGeo, 0.032); // 가장자리 부스스한 퍼피컷
  const head = new THREE.Mesh(
    headGeo,
    new THREE.MeshStandardMaterial({ map: makeHeadTexture(), roughness: 1 })
  );
  head.scale.set(1.13, 0.94, 0.95); // 사진처럼 옆으로 넓고 살짝 낮은 돔
  head.position.set(0, 0.47, 0.05);
  headGroup.add(head);

  // ---------- 귀: 머리 위에서 코 높이까지, 아래로 갈수록 넓어지는 물방울 귀 ----------
  const ears = [];
  for (const sign of [-1, 1]) {
    const earGeo = new THREE.SphereGeometry(0.3, 20, 16);
    {
      const pos = earGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ny = pos.getY(i) / 0.3;
        const widen = 1 + 0.45 * Math.max(0, -ny); // 아래로 갈수록 넓게 (비글 귀처럼)
        const taper = 1 - 0.5 * Math.max(0, ny); // 위(붙는 곳)는 좁게
        pos.setX(i, pos.getX(i) * widen * taper);
        pos.setZ(i, pos.getZ(i) * widen * taper);
      }
      earGeo.computeVertexNormals();
    }
    fluff(earGeo, 0.04);
    const ear = new THREE.Mesh(earGeo, cream);
    ear.scale.set(0.95, 1.55, 0.55); // 짧고 넓고 도톰하게
    ear.position.set(0.98 * sign, 0.5, 0.14); // 옆으로 발랄하게 벌어지게
    ear.rotation.set(Math.PI, 0, -0.42 * sign);
    headGroup.add(ear);
    ears.push(ear);
  }

  // ---------- 눈: 크고 까만 눈 ----------
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
    shine1.position.set(-0.04 * sign, 0.05, 0.115);
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine2.position.set(0.05 * sign, -0.035, 0.12);
    eye.add(ball, shine1, shine2);
    eye.position.set(0.32 * sign, 0.57, 0.82);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  headGroup.add(eyeL, eyeR);

  // ---------- 주둥이 + 단추코 + 혀 ----------
  const muzzleGeo = new THREE.SphereGeometry(0.24, 24, 18);
  fluff(muzzleGeo, 0.035);
  const muzzle = new THREE.Mesh(muzzleGeo, furWhite);
  muzzle.scale.set(1.1, 0.76, 0.55);
  muzzle.position.set(0, 0.26, 0.87);
  headGroup.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), dark);
  nose.scale.set(1.2, 0.9, 0.8);
  nose.position.set(0, 0.37, 1.0);
  headGroup.add(nose);

  // 분홍 혀 살짝 (참고 사진 2)
  const tongue = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xef9aa2, roughness: 0.8 })
  );
  tongue.scale.set(0.9, 0.45, 0.5);
  tongue.position.set(0, 0.2, 0.99);
  headGroup.add(tongue);

  // ω 입 (앙 다문 입)
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x7a6552 });
  for (const sign of [-1, 1]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 18, Math.PI), mouthMat);
    arc.rotation.z = Math.PI;
    arc.position.set(0.05 * sign, 0.26, 1.03);
    headGroup.add(arc);
  }

  // ---------- 몸통: 온몸 흰 털 (참고 사진과 달리 배에도 털 풍성) ----------
  function makeBodyTexture() {
    const S = 512;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fdfaf3';
    ctx.fillRect(0, 0, S, S);
    fur(ctx, S, 0.12);
    // 배는 살짝 더 밝게 (털 풍성한 느낌)
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
      y *= 1.05; // 아기 강아지 — 짧고 컴팩트한 솜뭉치
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
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), cream);
    pet.add(paw);
    armParts.push({ arm, paw, sign });
  }

  // ---------- 다리 + 발 (집중 땐 철퍼덕) ----------
  const legParts = [];
  for (const sign of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.24, 6, 12), furWhite);
    leg.position.set(0.3 * sign, -1.32, 0.02);
    pet.add(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), cream);
    foot.scale.set(1, 0.55, 1.5);
    foot.rotation.y = 0.15 * sign;
    pet.add(foot);
    legParts.push({ leg, foot, sign });
  }

  function applyPose(focus) {
    for (const { arm, paw, sign } of armParts) {
      if (focus) {
        arm.position.set(0.5 * sign, -0.38, 0.38);
        arm.rotation.set(-1.0, 0, -0.15 * sign);
        paw.position.set(0.3 * sign, -0.56, 0.76);
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

  // ---------- 꼬리: 등 위로 말려 올라간 복슬 꼬리 ----------
  const tail = new THREE.Group();
  {
    // 등에 붙어 위로 말려 올라간 깃털 플룸 한 덩어리
    const plumeGeo = new THREE.SphereGeometry(0.3, 22, 16);
    fluff(plumeGeo, 0.05);
    const plume = new THREE.Mesh(plumeGeo, furWhite);
    plume.scale.set(0.6, 1.25, 0.55);
    plume.position.set(0.24, -0.45, -0.75);
    plume.rotation.x = -0.3; // 위쪽이 등에 기대게
    plume.rotation.z = -0.15;
    const plumeBase = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), furWhite);
    plumeBase.position.set(0.12, -0.95, -0.68);
    tail.add(plume, plumeBase);
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

    let bobAmp = 0.045;
    let bobSpeed = 2.2;
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

    // 고개 갸웃
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
    pet.position.y = bob + jump + (anim === 'focus' ? -0.12 : 0);
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

    // 꼬리 붕붕 (강아지는 평소에도 살랑, 신나면 프로펠러)
    tail.rotation.y = Math.sin(t * (excite ? 10 : 2.5)) * (excite ? 0.3 : 0.13);
    // 귀 팔랑
    const ew = excite ? Math.sin(t * 12) * 0.1 : Math.sin(t * 1.5) * 0.03;
    ears[0].rotation.z = 0.35 + ew;
    ears[1].rotation.z = -0.35 - ew;

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
