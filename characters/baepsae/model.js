// 흰머리오목눈이(뱁새) 3D — 실물 사진 기반 부드러운 스타일
// 핵심: 무늬는 몸 표면 텍스처에 붓으로 그리듯 그려 입히고,
// 실루엣은 미세한 요철 + 역광 조명으로 보송한 솜털 느낌을 낸다
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

    // 머리는 무늬 없이 새하얗게
    ctx.filter = 'blur(12px)';
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
      y *= 1.15; // 세로로 살짝 길게
      // 정수리는 동그란 돔 그대로 두고, 눈 아래(ny 0.25)부터 몸이 불어난다
      const below = Math.max(0, 0.25 - ny);
      const w = 1 + 0.34 * Math.pow(below / 1.25, 0.8); // 눈 밑에서 빠르게 넓어져 배가 통통
      x *= w;
      z *= w;
      if (z > 0) z += 0.1 * Math.pow(Math.max(0, -ny), 1.3) * (z / 1.25); // 가슴 봉긋
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
  // 4각뿔 부리 — 정면에선 마름모, 옆에선 뾰족한 삼각형
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.28, 4),
    new THREE.MeshStandardMaterial({ color: 0x1d1815, roughness: 0.5, flatShading: true })
  );
  beak.rotation.x = Math.PI / 2 - 0.25;
  beak.scale.set(1.15, 1, 0.7); // 좌우로 넓고 위아래로 납작하게
  beak.position.set(0, 0.38, 1.24);
  bird.add(beak);

  // ---------- 날개: 몸에 접은 검은 날개 (새라는 게 보이게) ----------
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x2e2a26, roughness: 0.95 });
  const wingGeo = new THREE.SphereGeometry(0.62, 24, 18);
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingL.scale.set(0.24, 0.95, 0.62);
  wingR.scale.set(0.24, 0.95, 0.62);
  wingL.position.set(-1.34, -0.5, -0.25);
  wingR.position.set(1.34, -0.5, -0.25);
  wingL.rotation.z = 0.28;
  wingR.rotation.z = -0.28;
  wingL.rotation.y = 0.35;
  wingR.rotation.y = -0.35;
  bird.add(wingL, wingR);

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

  // ---------- 노트북 + 타이핑 손 (집중 모드에서만) ----------
  const laptop = new THREE.Group();
  let tapL, tapR;
  {
    const alu = new THREE.MeshStandardMaterial({ color: 0xd7d3ce, roughness: 0.55 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), alu);
    const keys = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.015, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x8f8b86, roughness: 0.9 })
    );
    keys.position.set(0, 0.033, -0.02);
    // 화면은 카메라 쪽에 서서 펫을 향해 열려 있음 (우리는 노트북 뒷면을 봄)
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.04), alu);
    screen.position.set(0, 0.2, 0.32);
    screen.rotation.x = 0.5;
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xcfe8ff })
    );
    glow.position.set(0, 0.19, 0.29);
    glow.rotation.x = 0.5;
    glow.rotation.y = Math.PI;
    // 뒷면 로고 스티커
    const logo = new THREE.Mesh(
      new THREE.CircleGeometry(0.105, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    logo.position.set(0, 0.22, 0.36);
    logo.rotation.x = 0.5;
    laptop.add(logo);
    // 키보드 위 타이핑 손 (하얀 날개 끝)
    const pawMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
    tapL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), pawMat);
    tapR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), pawMat);
    tapL.position.set(-0.22, 0.12, -0.05);
    tapR.position.set(0.22, 0.12, -0.05);
    laptop.add(base, keys, screen, glow, tapL, tapR);
  }
  laptop.position.set(0, -1.3, 1.05);
  laptop.scale.setScalar(1.05);
  laptop.visible = false;
  bird.add(laptop);

  // (기본 헤드셋은 제거 — 설정의 헤드셋 액세서리로 착용 가능)

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
  let returning = false; // 더블클릭 정면 복귀 중
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
    // 돌려둔 각도는 그대로 고정. 복귀가 최단 경로가 되도록 각도만 정리
    userYaw = userYaw % (Math.PI * 2);
    if (userYaw > Math.PI) userYaw -= Math.PI * 2;
    if (userYaw < -Math.PI) userYaw += Math.PI * 2;
  }

  function isRotated() {
    return Math.abs(userYaw) > 0.15 || Math.abs(userPitch) > 0.1;
  }

  function resetRotation() {
    returning = true; // 천천히 정면으로
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
    else if (anim === 'cheer') { bobAmp = 0.08; bobSpeed = 6.5; spin = 3.6; wobble = 0.1; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 9; wobble = 0.09; }
    else if (anim === 'drink') { bobAmp = 0.012; bobSpeed = 1.6; tilt = -0.2 + Math.sin(t * 4.2) * 0.09; }
    else if (anim === 'stretch') { bobAmp = 0.015; bobSpeed = 1.2; }

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
    bird.rotation.z =
      anim === 'stretch' ? Math.sin(t * 1.7) * 0.15 : wobble ? Math.sin(t * 16) * wobble : 0;

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
    if (anim === 'stretch') bird.scale.y = 1 + 0.12 * Math.abs(Math.sin(t * 1.7));

    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.12;
        blinkAt = t + 2 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.1 : 1;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

    // 타이핑: 두 손이 번갈아 타닥타닥
    if (laptop.visible) {
      tapL.position.y = 0.1 + Math.max(0, Math.sin(t * 11)) * 0.08;
      tapR.position.y = 0.1 + Math.max(0, Math.sin(t * 11 + Math.PI)) * 0.08;
    }

    // 날개 파닥임 (휴식·환호·드래그)
    const flutter =
      anim === 'drag' || anim === 'rest' || anim === 'cheer' || anim === 'idleFun'
        ? Math.sin(t * 18) * 0.35
        : 0;
    wingL.rotation.z = 0.28 + flutter;
    wingR.rotation.z = -0.28 - flutter;

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
  const accessories = initAccessories(bird, {
    eyeX: 0.35, eyeY: 0.56, eyeZ: 1.12,
    topY: 1.1, topZ: 0.1, topR: 0.8,
    // 헤드셋: 예전 기본 헤드셋과 같은 치수
    bandR: 1.28, bandY: 0.5, bandZ: 0.1, cupX: 1.24,
    // 달걀 몸(아래로 갈수록 통통)에 맞춘 옷 밴드 — 배 최대 폭 ~1.45
    body: { cy: -0.3, rx: 1.42, ry: 1.32, rz: 1.45, shirtTheta: [1.25, 0.88], pantsTheta: [2.05, 0.58], patchY: -0.28 },
  });
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
