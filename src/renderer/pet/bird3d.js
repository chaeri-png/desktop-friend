// 흰머리오목눈이(뱁새) 3D — 실물 사진 기반 부드러운 스타일
// 핵심: 무늬는 몸 표면 텍스처에 붓으로 그리듯 그려 입히고,
// 실루엣은 미세한 요철 + 역광 조명으로 보송한 솜털 느낌을 낸다
import * as THREE from '../vendor/three.module.js';

export function createBird3D(container) {
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

  // 조명: 부드러운 주광 + 뒤에서 비추는 역광(솜털 테두리)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cec6, 2.6));
  const key = new THREE.DirectionalLight(0xfff8f0, 1.6);
  key.position.set(2, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.8);
  rim.position.set(-1.5, 3, -4);
  scene.add(rim);

  const pivot = new THREE.Group(); // 사용자 드래그 회전
  const bird = new THREE.Group(); // 상태 애니메이션
  pivot.add(bird);
  scene.add(pivot);

  // ---------- 몸 텍스처: 캔버스에 그려서 입히기 ----------
  // 좌표계: 캔버스 x = 몸 둘레(u), 캔버스 y 위쪽 = 머리 꼭대기
  // (u는 스냅샷 보정 결과: 정면이 u=0.5 부근)
  function makeBodyTexture() {
    const S = 1024;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');

    // 바탕: 새하얀 몸 + 아래쪽 은은한 따뜻한 그늘
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, S, S);
    const grad = ctx.createLinearGradient(0, S * 0.55, 0, S);
    grad.addColorStop(0, 'rgba(238,228,218,0)');
    grad.addColorStop(1, 'rgba(238,228,218,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    // 미세한 털 결 (아주 옅은 세로 스트로크)
    ctx.strokeStyle = 'rgba(214,205,196,0.09)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 500; i++) {
      const x = ((i * 379) % S) + ((i * 131) % 7) - 3;
      const y = (i * 613) % S;
      const len = 14 + ((i * 17) % 22);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ((i % 5) - 2) * 2, y + len);
      ctx.stroke();
    }

    // 이음새(u=0/1)에 걸쳐도 끊기지 않게 좌우 반복해 그리는 타원 헬퍼
    // 정면 = u 0.25, 등 = u 0.75
    function blob(cx, cy, rx, ry, rot, fill) {
      ctx.fillStyle = fill;
      for (const off of [-1, 0, 1]) {
        ctx.beginPath();
        ctx.ellipse(S * (cx + off), S * cy, S * rx, S * ry, rot, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.filter = 'blur(12px)';
    // 정수리 옆 굵은 검은 줄무늬 (눈 위 → 뒤통수로 갈수록 살짝 처짐)
    blob(0.11, 0.15, 0.115, 0.058, 0.35, 'rgba(36,30,26,0.95)');
    blob(0.39, 0.15, 0.115, 0.058, -0.35, 'rgba(36,30,26,0.95)');
    // 볼터치 (정면 양옆, 은은하게)
    blob(0.175, 0.3, 0.042, 0.028, 0, 'rgba(242,178,164,0.42)');
    blob(0.325, 0.3, 0.042, 0.028, 0, 'rgba(242,178,164,0.42)');
    ctx.filter = 'blur(8px)';
    // 등쪽 접은 날개 (등 가운데로 모이는 V자, 아래로 갈수록 뒤로)
    blob(0.65, 0.56, 0.06, 0.13, -0.35, 'rgba(42,35,30,0.95)');
    blob(0.85, 0.56, 0.06, 0.13, 0.35, 'rgba(42,35,30,0.95)');
    // 어깨의 은은한 살구빛 (날개 위)
    blob(0.66, 0.37, 0.05, 0.055, 0, 'rgba(206,158,140,0.36)');
    blob(0.84, 0.37, 0.05, 0.055, 0, 'rgba(206,158,140,0.36)');
    ctx.filter = 'none';
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }

  // ---------- 몸: 사진 실루엣 기반 조형 ----------
  // 구에서 시작해 아래는 넓고 둥글게(배), 가슴은 앞으로 봉긋, 정수리는 살짝 좁게
  const eggGeo = new THREE.SphereGeometry(1.25, 64, 48);
  {
    const pos = eggGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const ny = y / 1.25; // -1(아래) .. 1(위)
      y *= 1.16; // 세로로 살짝 길게
      const belly = Math.max(0, -ny);
      const w = 1 + 0.17 * Math.pow(belly, 1.3); // 아래로 갈수록 넉넉하게 (바닥은 둥글게 유지)
      x *= w;
      z *= w;
      if (z > 0) z += 0.11 * Math.pow(belly, 1.4) * (z / 1.25); // 가슴 봉긋
      const crown = Math.max(0, ny - 0.55);
      x *= 1 - 0.07 * crown; // 정수리 살짝 좁게
      z *= 1 - 0.05 * crown;
      // 미세 요철 (솜털 실루엣) — 좌표 기반이라 항상 동일
      const h = Math.sin(x * 41.7 + y * 27.3) * Math.cos(z * 33.1 - y * 19.7);
      const amp = 0.015 * h;
      const len = Math.hypot(x, y, z) || 1;
      pos.setXYZ(i, x + (x / len) * amp, y + (y / len) * amp, z + (z / len) * amp);
    }
    eggGeo.computeVertexNormals();
  }
  const body = new THREE.Mesh(
    eggGeo,
    new THREE.MeshStandardMaterial({ map: makeBodyTexture(), roughness: 1 })
  );
  bird.add(body);

  // ---------- 눈: 크고 촉촉한 까만 구슬 + 반짝 ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0x191410, roughness: 0.25 })
    );
    const shine1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine1.position.set(-0.045 * sign, 0.05, 0.115);
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine2.position.set(0.05 * sign, -0.04, 0.12);
    eye.add(ball, shine1, shine2);
    eye.position.set(0.35 * sign, 0.56, 1.1);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  bird.add(eyeL, eyeR);

  // ---------- 부리: 아주 작고 뭉툭한 세모 ----------
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.085, 0.16, 16),
    new THREE.MeshStandardMaterial({ color: 0x241f1b, roughness: 0.6 })
  );
  beak.rotation.x = Math.PI / 2 - 0.15;
  beak.position.set(0, 0.38, 1.24);
  bird.add(beak);

  // ---------- 꼬리: 길고 검은 깃 + 흰 가장자리 ----------
  const tail = new THREE.Group();
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.9 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe9e4dd, roughness: 0.95 });
  for (const [x, mat, len, w] of [
    [-0.115, whiteMat, 1.45, 0.08],
    [0, darkMat, 1.7, 0.15],
    [0.115, whiteMat, 1.45, 0.08],
  ]) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, len), mat);
    seg.position.set(x, 0, -len / 2 + 0.15);
    tail.add(seg);
  }
  tail.position.set(0, -0.85, -1.0);
  tail.rotation.x = -0.45;
  bird.add(tail);

  // ---------- 발: 앙증맞은 짧은 다리 ----------
  const footMat = new THREE.MeshStandardMaterial({ color: 0x35302c, roughness: 0.8 });
  for (const sign of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.12, 6, 10), footMat);
    foot.rotation.x = Math.PI / 2;
    foot.position.set(0.3 * sign, -1.52, 0.25);
    bird.add(foot);
  }

  // ---------- 집중 머리띠 (focus에서만) ----------
  const headband = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.08, 12, 40),
    new THREE.MeshStandardMaterial({ color: 0xe05a4e, roughness: 0.7 })
  );
  headband.rotation.x = 1.25;
  headband.position.set(0, 0.95, 0.05);
  headband.visible = false;
  bird.add(headband);

  // ---------- 애니메이션 상태 ----------
  let anim = 'idle';
  let t = 0;
  let birdYaw = 0;
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
    let wobble = 0;
    if (anim === 'focus') { bobAmp = 0.025; bobSpeed = 1.4; tilt = 0.1; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.09; bobSpeed = 5; spin = 2.6; wobble = 0.08; }
    else if (anim === 'cheer') { bobAmp = 0.06; bobSpeed = 6; spin = 3.2; wobble = 0.1; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 9; wobble = 0.09; }

    if (spin) {
      birdYaw += spin * dt;
    } else {
      birdYaw = birdYaw % (Math.PI * 2);
      if (birdYaw > Math.PI) birdYaw -= Math.PI * 2;
      if (birdYaw < -Math.PI) birdYaw += Math.PI * 2;
      if (anim === 'idle') {
        if (t > wiggleAt) {
          wiggleTarget = (Math.random() - 0.5) * 0.6;
          wiggleAt = t + 2 + Math.random() * 4;
        }
        birdYaw += (wiggleTarget - birdYaw) * Math.min(1, dt * 2.5);
      } else {
        birdYaw *= Math.max(0, 1 - dt * 5);
      }
    }
    bird.rotation.y = birdYaw;
    bird.rotation.x = tilt;
    bird.rotation.z = wobble ? Math.sin(t * 16) * wobble : 0;

    const bob = Math.sin(t * bobSpeed * 2) * bobAmp;
    let jump = 0;
    if (anim === 'cheer') {
      jump = Math.abs(Math.sin((t - jumpStart) * 6)) * 0.35;
    } else if (jumpStart >= 0) {
      const e = t - jumpStart;
      if (e < 0.5) jump = Math.sin((e / 0.5) * Math.PI) * 0.5;
      else jumpStart = -1;
    }
    bird.position.y = bob + jump;
    bird.scale.y = 1 + bob * 0.3;
    const sq = 1 - bob * 0.12;
    bird.scale.x = sq;
    bird.scale.z = sq;

    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.12;
        blinkAt = t + 2 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.1 : 1;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

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
