// 햄스터 3D — 통통한 황금 햄스터
// 볼록한 볼주머니, 동그란 귀, 가슴에 모은 앞발, 콩알 눈, 분홍 코, 꽁지 같은 꼬리
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

  // ---------- 몸 텍스처: 황금빛 등 + 새하얀 배/얼굴 ----------
  function makeBodyTexture() {
    const S = 1024;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');

    // 바탕: 따뜻한 황금빛
    ctx.fillStyle = '#eba95e';
    ctx.fillRect(0, 0, S, S);

    // 등 가운데 살짝 진한 줄
    ctx.filter = 'blur(30px)';
    ctx.fillStyle = 'rgba(203,131,64,0.55)';
    ctx.fillRect(S * 0.65, 0, S * 0.2, S * 0.75);

    // 배·아랫면은 새하얗게 (아래로 갈수록)
    ctx.filter = 'blur(26px)';
    const grad = ctx.createLinearGradient(0, S * 0.45, 0, S * 0.8);
    grad.addColorStop(0, 'rgba(255,252,247,0)');
    grad.addColorStop(1, 'rgba(255,252,247,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    // 얼굴 앞면 흰 무늬 (이마에서 볼까지, 정면 u=0.25)
    function blob(cx, cy, rx, ry, rot, fill) {
      ctx.fillStyle = fill;
      for (const off of [-1, 0, 1]) {
        ctx.beginPath();
        ctx.ellipse(S * (cx + off), S * cy, S * rx, S * ry, rot, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.filter = 'blur(18px)';
    blob(0.25, 0.42, 0.13, 0.17, 0, 'rgba(255,252,247,0.95)'); // 얼굴~가슴 흰 부분
    ctx.filter = 'blur(12px)';
    blob(0.15, 0.38, 0.045, 0.03, 0, 'rgba(244,170,150,0.4)'); // 볼터치
    blob(0.35, 0.38, 0.045, 0.03, 0, 'rgba(244,170,150,0.4)');
    ctx.filter = 'none';

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  // ---------- 몸: 아래·볼이 넉넉한 찐빵 실루엣 ----------
  const bodyGeo = new THREE.SphereGeometry(1.25, 64, 48);
  {
    const pos = bodyGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const ny = y / 1.25;
      y *= 1.02; // 새보다 납작하고 둥글게
      const belly = Math.max(0, -ny);
      const w = 1 + 0.15 * Math.pow(belly, 1.2);
      x *= w;
      z *= w;
      // 볼주머니: 얼굴 아래쪽이 옆으로 빵빵하게
      const cheekBand = Math.exp(-Math.pow((ny - 0.05) / 0.35, 2));
      const front = Math.max(0, z / 1.25);
      x *= 1 + 0.13 * cheekBand * (0.4 + 0.6 * front);
      if (z > 0) z += 0.08 * cheekBand * (z / 1.25);
      // 미세 요철 (복슬복슬)
      const h = Math.sin(x * 38.3 + y * 24.7) * Math.cos(z * 29.9 - y * 17.3);
      const amp = 0.018 * h;
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

  // ---------- 귀: 동그란 귀 + 분홍 안쪽 ----------
  const earMat = new THREE.MeshStandardMaterial({ color: 0xdd9a52, roughness: 1 });
  const earInnerMat = new THREE.MeshStandardMaterial({ color: 0xf2b3a8, roughness: 1 });
  const ears = [];
  for (const sign of [-1, 1]) {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), earMat);
    outer.scale.set(1, 1, 0.5);
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 14), earInnerMat);
    inner.scale.set(1, 1, 0.4);
    inner.position.z = 0.1;
    ear.add(outer, inner);
    ear.position.set(0.52 * sign, 1.13, 0.1);
    ear.rotation.z = -0.25 * sign;
    pet.add(ear);
    ears.push(ear);
  }

  // ---------- 눈: 까만 콩알 + 반짝 ----------
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
    eye.position.set(0.38 * sign, 0.45, 1.06);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  pet.add(eyeL, eyeR);

  // ---------- 주둥이: 흰 뭉툭한 입가 + 분홍 코 ----------
  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xfffcf7, roughness: 1 })
  );
  muzzle.scale.set(1.15, 0.8, 0.55);
  muzzle.position.set(0, 0.16, 1.13);
  pet.add(muzzle);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xe58ba0, roughness: 0.6 })
  );
  nose.scale.set(1.1, 0.85, 0.8);
  nose.position.set(0, 0.27, 1.3);
  pet.add(nose);

  // 수염 (양쪽 3가닥)
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xf6efe6, transparent: true, opacity: 0.8 });
  for (const sign of [-1, 1]) {
    for (const [dy, rot] of [
      [0.05, 0.22],
      [0, 0],
      [-0.05, -0.22],
    ]) {
      const wsk = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.42, 6), whiskerMat);
      wsk.rotation.z = Math.PI / 2 + rot * sign;
      wsk.position.set(0.36 * sign, 0.16 + dy, 1.18);
      pet.add(wsk);
    }
  }

  // ---------- 앞발: 가슴에 모은 작은 손 ----------
  const pawMat = new THREE.MeshStandardMaterial({ color: 0xfff6ec, roughness: 1 });
  for (const sign of [-1, 1]) {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), pawMat);
    paw.scale.set(1, 0.85, 0.7);
    paw.position.set(0.22 * sign, -0.42, 1.13);
    pet.add(paw);
  }

  // ---------- 뒷발: 바닥에 살짝 ----------
  const footMat = new THREE.MeshStandardMaterial({ color: 0xf2c8a8, roughness: 1 });
  for (const sign of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), footMat);
    foot.scale.set(1, 0.5, 1.4);
    foot.position.set(0.4 * sign, -1.24, 0.5);
    pet.add(foot);
  }

  // ---------- 꼬리: 꽁지 ----------
  const tailNub = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xf0be8e, roughness: 1 })
  );
  tailNub.position.set(0, -0.75, -1.18);
  pet.add(tailNub);

  // ---------- 집중 머리띠 ----------
  const headband = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.08, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0xe05a4e, roughness: 0.7 })
  );
  headband.rotation.x = 1.3;
  headband.position.set(0, 0.85, 0.05);
  headband.visible = false;
  pet.add(headband);

  // ---------- 애니메이션 상태 (뱁새와 동일한 뼈대, 날개 대신 귀가 쫑긋) ----------
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
  let releasedAt = 0;
  const clock = new THREE.Clock();
  let disposed = false;

  function setAnimation(name) {
    if (name === anim) return;
    anim = name;
    headband.visible = name === 'focus';
    if (name === 'react' || name === 'cheer') jumpStart = t;
    const s = name === 'drag' ? 1.3 : 1;
    eyeL.scale.setScalar(s);
    eyeR.scale.setScalar(s);
  }

  function rotateBy(dx, dy) {
    rotating = true;
    userYaw += dx * 0.02;
    userPitch = Math.max(-0.7, Math.min(0.7, userPitch + dy * 0.012));
  }

  function endRotate() {
    rotating = false;
    releasedAt = t;
  }

  function frame() {
    if (disposed) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    let bobAmp = 0.05;
    let bobSpeed = 2.2;
    let spin = 0;
    let tilt = 0;
    let earWiggle = 0;
    if (anim === 'focus') { bobAmp = 0.025; bobSpeed = 1.4; tilt = 0.1; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.09; bobSpeed = 5; spin = 2.6; earWiggle = 0.15; }
    else if (anim === 'cheer') { bobAmp = 0.06; bobSpeed = 6; spin = 3.2; earWiggle = 0.2; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 9; earWiggle = 0.18; }

    if (spin) {
      petYaw += spin * dt;
    } else {
      petYaw = petYaw % (Math.PI * 2);
      if (petYaw > Math.PI) petYaw -= Math.PI * 2;
      if (petYaw < -Math.PI) petYaw += Math.PI * 2;
      if (anim === 'idle') {
        if (t > wiggleAt) {
          wiggleTarget = (Math.random() - 0.5) * 0.6;
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

    // 귀 쫑긋
    const ew = earWiggle ? Math.sin(t * 14) * earWiggle : 0;
    ears[0].rotation.z = 0.25 + ew;
    ears[1].rotation.z = -0.25 - ew;

    if (!rotating && t - releasedAt > 0.8) {
      userYaw *= Math.max(0, 1 - dt * 3);
      userPitch *= Math.max(0, 1 - dt * 3);
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
    dispose() {
      disposed = true;
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    },
  };
}
