// 흰머리오목눈이(뱁새) 3D — 복셀(픽셀 블록) 스타일
// 참고 사진 기준: 머리·몸이 하나로 이어진 새하얀 계란형 눈덩이,
// 까만 콩알 눈 + 아주 작은 부리, 머리 옆 검은 줄무늬, 접은 검은 날개, 긴 꼬리
import * as THREE from '../vendor/three.module.js';

const COLORS = {
  white: 0xffffff,
  dark: 0x35302c,
  blush: 0xf4c8bc,
  shoulder: 0xdfc3b8,
  band: 0xe05a4e,
};

const V = 0.26; // 복셀 한 칸 크기

// 계란형 실루엣: 아래로 갈수록 통통
function radiusAt(gy) {
  const t = gy / 7.4;
  const base = 4.5 * Math.sqrt(Math.max(0, 1 - t * t));
  return base * (1 + 0.13 * (0.5 - gy / 14.8));
}

export function createBird3D(container) {
  const W = container.clientWidth || 150;
  const H = container.clientHeight || 170;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true, // 스냅샷 저장용
  });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 50);
  camera.position.set(0, 0.25, 7.2);
  camera.lookAt(0, -0.1, 0);

  // three r155+ 물리 조명 기준: 흰 몸이 하얗게 보이되 면 구분은 남게
  scene.add(new THREE.AmbientLight(0xffffff, 2.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 4, 5);
  scene.add(sun);

  const pivot = new THREE.Group(); // 사용자 드래그 회전
  const bird = new THREE.Group(); // 상태 애니메이션
  pivot.add(bird);
  scene.add(pivot);

  // ---------- 몸통: 복셀 계란 ----------
  const voxels = [];
  for (let gy = -7; gy <= 7; gy++) {
    const r = radiusAt(gy);
    if (r <= 0.4) continue;
    for (let gx = -6; gx <= 6; gx++) {
      for (let gz = -6; gz <= 6; gz++) {
        const rr = Math.hypot(gx, gz);
        if (rr > r) continue;
        let color = COLORS.white;
        const surface = rr >= r - 1.5;
        if (surface) {
          if (gy >= 3 && gy <= 5 && Math.abs(gx) >= r * 0.68) {
            color = COLORS.dark; // 정수리 옆 얇은 검은 줄무늬
          } else if (gy >= -3 && gy <= -1 && gz <= -1.5 && Math.abs(gx) >= r * 0.55) {
            color = COLORS.dark; // 등쪽에 접은 날개
          } else if (gy >= 0 && gy <= 1 && gz <= -2.5 && Math.abs(gx) >= r * 0.65) {
            color = COLORS.shoulder; // 어깨 살구빛
          }
        }
        voxels.push({ x: gx, y: gy, z: gz, color });
      }
    }
  }
  const boxGeo = new THREE.BoxGeometry(V * 0.98, V * 0.98, V * 0.98);
  const bodyMesh = new THREE.InstancedMesh(
    boxGeo,
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    voxels.length
  );
  {
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    voxels.forEach((v, i) => {
      m.setPosition(v.x * V, v.y * V, v.z * V);
      bodyMesh.setMatrixAt(i, m);
      c.set(v.color);
      if (v.color === COLORS.white) {
        // 복셀마다 미세한 밝기 차이 → 보송한 털 느낌 (좌표 기반이라 항상 동일)
        const n = 0.955 + ((Math.abs(v.x * 7 + v.y * 13 + v.z * 17) % 5) / 5) * 0.045;
        c.multiplyScalar(n);
      }
      bodyMesh.setColorAt(i, c);
    });
  }
  bird.add(bodyMesh);

  const lambert = (color) => new THREE.MeshLambertMaterial({ color });

  // ---------- 눈: 까만 콩알 + 반짝 (블록) ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.BoxGeometry(V * 1.5, V * 1.5, V * 0.9), lambert(COLORS.dark));
    const shine = new THREE.Mesh(
      new THREE.BoxGeometry(V * 0.55, V * 0.55, V * 0.3),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine.position.set(-V * 0.35 * sign, V * 0.35, V * 0.4);
    eye.add(ball, shine);
    eye.position.set(0.4 * sign, 0.5, 1.14);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  bird.add(eyeL, eyeR);

  // ---------- 부리: 아주 작은 까만 블록 ----------
  const beak = new THREE.Mesh(new THREE.BoxGeometry(V * 0.7, V * 0.55, V * 1.0), lambert(COLORS.dark));
  beak.position.set(0, 0.24, 1.24);
  bird.add(beak);

  // ---------- 볼터치 (연분홍 블록) ----------
  const cheekMat = new THREE.MeshBasicMaterial({ color: COLORS.blush, transparent: true, opacity: 0.85 });
  const cheekGeo = new THREE.BoxGeometry(V * 1.3, V * 0.8, V * 0.4);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  const cheekR = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.78, 0.22, 1.0);
  cheekR.position.set(0.78, 0.22, 1.0);
  bird.add(cheekL, cheekR);

  // ---------- 꼬리: 길고 검은 복셀 막대 (가장자리 흰 줄) ----------
  const tail = new THREE.Group();
  for (const col of [-1, 0, 1]) {
    for (let i = 0; i < 6; i++) {
      // 몸쪽은 검게, 바깥 깃 끝만 희게 (실물처럼)
      const color = col !== 0 && i >= 4 ? COLORS.white : COLORS.dark;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(V * 0.95, V * 0.55, V * 1.3), lambert(color));
      seg.position.set(col * V, -i * V * 0.22, -i * V * 0.6);
      tail.add(seg);
    }
  }
  tail.position.set(0, -0.7, -1.0);
  bird.add(tail);

  // ---------- 발: 앙증맞은 까만 블록 ----------
  const footGeo = new THREE.BoxGeometry(V * 1.1, V * 0.5, V * 1.5);
  const footL = new THREE.Mesh(footGeo, lambert(COLORS.dark));
  const footR = new THREE.Mesh(footGeo, lambert(COLORS.dark));
  footL.position.set(-0.34, -1.95, 0.3);
  footR.position.set(0.34, -1.95, 0.3);
  bird.add(footL, footR);

  // ---------- 집중 머리띠: 빨간 복셀 링 (focus에서만) ----------
  const headband = new THREE.Group();
  {
    const ringY = 3.2;
    const ringR = radiusAt(ringY) * V + V * 0.2;
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(V * 0.9, V * 0.7, V * 0.9), lambert(COLORS.band));
      seg.position.set(Math.cos(a) * ringR, ringY * V, Math.sin(a) * ringR);
      headband.add(seg);
    }
  }
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

    // 통통(bob) + 점프 — 젤리 스쿼시
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

    // 눈 깜빡 (드래그 중엔 놀란 눈 유지)
    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.12;
        blinkAt = t + 2 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.12 : 1;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

    // 사용자 회전: 놓고 잠시 후 천천히 정면 복귀
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
