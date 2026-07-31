// 흰머리오목눈이(뱁새) 3D 모델 + 애니메이션 플레이어 — 굿즈 캐릭터 스타일
// 귀여움 포인트: 크고 촉촉한 눈(하이라이트), 아래가 통통한 서양배 실루엣,
// 토온(만화) 셰이딩 + 부드러운 외곽선, 몸에 폭 안긴 날개, 앙증맞은 발
import * as THREE from '../vendor/three.module.js';

const COLORS = {
  body: 0xffffff,
  dark: 0x3a332f,
  pink: 0xf2b8a8,
  band: 0xe05a4e,
  outline: 0x6b5a50,
};

export function createBird3D(container) {
  const W = container.clientWidth || 150;
  const H = container.clientHeight || 170;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 50);
  camera.position.set(0, 0.4, 6.8);
  camera.lookAt(0, -0.15, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(2, 4, 3);
  scene.add(sun);

  const pivot = new THREE.Group(); // 사용자 드래그 회전
  const bird = new THREE.Group(); // 상태 애니메이션
  pivot.add(bird);
  scene.add(pivot);

  // 토온(만화) 셰이딩: 3단계 음영
  const gradient = new THREE.DataTexture(new Uint8Array([110, 200, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  const mat = (color) => new THREE.MeshToonMaterial({ color, gradientMap: gradient });
  const outlineMat = new THREE.MeshBasicMaterial({ color: COLORS.outline, side: THREE.BackSide });

  const outlines = [];
  function addOutline(mesh, thickness = 1.05) {
    const o = new THREE.Mesh(mesh.geometry, outlineMat);
    o.position.copy(mesh.position);
    o.rotation.copy(mesh.rotation);
    o.scale.copy(mesh.scale).multiplyScalar(thickness);
    bird.add(o);
    outlines.push(o);
  }

  // ---------- 몸: 아래가 통통한 서양배 실루엣 (몸통 + 머리 두 덩어리) ----------
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 48, 32), mat(COLORS.body));
  body.scale.set(1.1, 0.95, 1.02);
  body.position.set(0, -0.42, -0.05);
  bird.add(body);
  addOutline(body, 1.04);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.92, 48, 32), mat(COLORS.body));
  head.position.set(0, 0.5, 0.12);
  bird.add(head);
  addOutline(head, 1.045);

  // ---------- 눈: 크고 촉촉하게 + 반짝 하이라이트 ----------
  function makeEye(sign) {
    const eye = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.155, 24, 16), mat(COLORS.dark));
    const shine1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    const shine2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    shine1.position.set(0.05 * sign, 0.06, 0.11);
    shine2.position.set(-0.05 * sign, -0.05, 0.12);
    eye.add(ball, shine1, shine2);
    eye.position.set(0.36 * sign, 0.62, 0.92);
    return eye;
  }
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);
  bird.add(eyeL, eyeR);

  // ---------- 부리: 아주 작고 뭉툭하게 ----------
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.13, 16), mat(COLORS.dark));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.44, 1.02);
  bird.add(beak);

  // ---------- 볼터치 ----------
  const cheekMat = new THREE.MeshBasicMaterial({
    color: COLORS.pink,
    transparent: true,
    opacity: 0.7,
  });
  const cheekGeo = new THREE.SphereGeometry(0.15, 16, 12);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  const cheekR = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.56, 0.36, 0.76);
  cheekR.position.set(0.56, 0.36, 0.76);
  cheekL.scale.set(1, 0.62, 0.35);
  cheekR.scale.set(1, 0.62, 0.35);
  bird.add(cheekL, cheekR);

  // ---------- 날개: 몸에 폭 안긴 작은 물방울 모양 ----------
  const wingGeo = new THREE.SphereGeometry(0.55, 24, 16);
  const wingL = new THREE.Mesh(wingGeo, mat(COLORS.dark));
  const wingR = new THREE.Mesh(wingGeo, mat(COLORS.dark));
  wingL.scale.set(0.26, 0.72, 0.85);
  wingR.scale.set(0.26, 0.72, 0.85);
  wingL.position.set(-1.02, -0.35, -0.2);
  wingR.position.set(1.02, -0.35, -0.2);
  wingL.rotation.z = 0.32;
  wingR.rotation.z = -0.32;
  bird.add(wingL, wingR);
  addOutline(wingL, 1.08);
  addOutline(wingR, 1.08);

  // 어깨 분홍 패치
  const patchGeo = new THREE.SphereGeometry(0.3, 16, 12);
  const patchL = new THREE.Mesh(patchGeo, mat(COLORS.pink));
  const patchR = new THREE.Mesh(patchGeo, mat(COLORS.pink));
  patchL.scale.set(0.5, 0.45, 0.7);
  patchR.scale.set(0.5, 0.45, 0.7);
  patchL.position.set(-0.82, 0.02, -0.45);
  patchR.position.set(0.82, 0.02, -0.45);
  bird.add(patchL, patchR);

  // ---------- 꼬리: 부채꼴 3장 ----------
  const tail = new THREE.Group();
  for (const [angle, len, color] of [
    [-0.16, 1.25, COLORS.body],
    [0, 1.45, COLORS.dark],
    [0.16, 1.25, COLORS.body],
  ]) {
    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, len), mat(color));
    feather.rotation.y = angle;
    feather.position.z = -len / 2 + 0.2;
    tail.add(feather);
    const o = new THREE.Mesh(feather.geometry, outlineMat);
    o.rotation.copy(feather.rotation);
    o.position.copy(feather.position);
    o.scale.setScalar(1.12);
    tail.add(o);
  }
  tail.position.set(0, -0.85, -1.05);
  tail.rotation.x = -0.55;
  bird.add(tail);

  // ---------- 발: 앙증맞게 ----------
  const footGeo = new THREE.SphereGeometry(0.13, 14, 10);
  const footL = new THREE.Mesh(footGeo, mat(COLORS.dark));
  const footR = new THREE.Mesh(footGeo, mat(COLORS.dark));
  footL.scale.set(1, 0.5, 1.4);
  footR.scale.set(1, 0.5, 1.4);
  footL.position.set(-0.32, -1.52, 0.3);
  footR.position.set(0.32, -1.52, 0.3);
  bird.add(footL, footR);

  // ---------- 집중 머리띠 (focus에서만) ----------
  const headband = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.09, 12, 40), mat(COLORS.band));
  headband.rotation.x = 1.25;
  headband.position.set(0, 0.88, 0.1);
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
    const s = name === 'drag' ? 1.35 : 1;
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
    if (anim === 'focus') { bobAmp = 0.025; bobSpeed = 1.4; tilt = 0.1; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.09; bobSpeed = 5; spin = 2.6; }
    else if (anim === 'cheer') { bobAmp = 0.06; bobSpeed = 6; spin = 3.2; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 9; }

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
    bird.rotation.x = tilt + (anim === 'drag' ? Math.sin(t * 22) * 0.05 : 0);

    // 통통(bob) + 점프 — 젤리처럼 찌그러지는 스쿼시
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

    // 날개 파닥임
    const flutter =
      anim === 'drag' || anim === 'rest' || anim === 'cheer' || anim === 'idleFun'
        ? Math.sin(t * 18) * 0.5
        : 0;
    wingL.rotation.z = 0.32 + flutter * 0.5;
    wingR.rotation.z = -0.32 - flutter * 0.5;

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
