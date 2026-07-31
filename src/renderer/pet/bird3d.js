// 흰머리오목눈이(뱁새) 3D 모델 + 애니메이션 플레이어
// 위키미디어 커먼즈 실물 사진 기반: 눈덩이처럼 하얀 둥근 몸, 까만 점눈,
// 아주 작은 부리, 검정 날개 + 분홍 어깨 패치, 길고 검은 꼬리(흰 가장자리)
import * as THREE from '../vendor/three.module.js';

const COLORS = {
  body: 0xffffff,
  dark: 0x2e2a28,
  pink: 0xeab0a0,
  band: 0xe05a4e,
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
  camera.position.set(0, 0.7, 7.4);
  camera.lookAt(0, -0.1, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc5, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(2, 4, 3);
  scene.add(sun);

  const pivot = new THREE.Group(); // 사용자 드래그 회전
  const bird = new THREE.Group(); // 상태 애니메이션
  pivot.add(bird);
  scene.add(pivot);

  const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });

  // 몸통 — 머리·몸 구분 없는 눈덩이
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.3, 48, 32), mat(COLORS.body));
  body.scale.set(1, 0.96, 1.02);
  bird.add(body);

  // 눈 — 까만 점
  const eyeGeo = new THREE.SphereGeometry(0.1, 16, 12);
  const eyeL = new THREE.Mesh(eyeGeo, mat(COLORS.dark));
  const eyeR = new THREE.Mesh(eyeGeo, mat(COLORS.dark));
  eyeL.position.set(-0.42, 0.34, 1.13);
  eyeR.position.set(0.42, 0.34, 1.13);
  bird.add(eyeL, eyeR);

  // 부리 — 아주 짧고 작게
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 16), mat(COLORS.dark));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.1, 1.32);
  bird.add(beak);

  // 볼터치 — 은은한 분홍
  const cheekMat = new THREE.MeshStandardMaterial({
    color: COLORS.pink,
    roughness: 1,
    transparent: true,
    opacity: 0.55,
  });
  const cheekGeo = new THREE.SphereGeometry(0.16, 16, 12);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  const cheekR = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.62, 0.02, 1.02);
  cheekR.position.set(0.62, 0.02, 1.02);
  cheekL.scale.set(1, 0.7, 0.4);
  cheekR.scale.set(1, 0.7, 0.4);
  bird.add(cheekL, cheekR);

  // 날개 — 검정, 어깨에 분홍 패치
  const wingGeo = new THREE.SphereGeometry(0.62, 24, 16);
  const wingL = new THREE.Mesh(wingGeo, mat(COLORS.dark));
  const wingR = new THREE.Mesh(wingGeo, mat(COLORS.dark));
  wingL.scale.set(0.3, 0.75, 0.95);
  wingR.scale.set(0.3, 0.75, 0.95);
  wingL.position.set(-1.12, -0.05, -0.15);
  wingR.position.set(1.12, -0.05, -0.15);
  wingL.rotation.z = 0.15;
  wingR.rotation.z = -0.15;
  bird.add(wingL, wingR);

  const patchGeo = new THREE.SphereGeometry(0.34, 16, 12);
  const patchL = new THREE.Mesh(patchGeo, mat(COLORS.pink));
  const patchR = new THREE.Mesh(patchGeo, mat(COLORS.pink));
  patchL.scale.set(0.5, 0.5, 0.8);
  patchR.scale.set(0.5, 0.5, 0.8);
  patchL.position.set(-0.88, 0.5, -0.55);
  patchR.position.set(0.88, 0.5, -0.55);
  bird.add(patchL, patchR);

  // 꼬리 — 길고 검게, 가장자리 흰 줄
  const tail = new THREE.Group();
  const tailDark = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 1.6), mat(COLORS.dark));
  const tailEdgeL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 1.35), mat(COLORS.body));
  const tailEdgeR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 1.35), mat(COLORS.body));
  tailEdgeL.position.set(-0.13, 0, -0.05);
  tailEdgeR.position.set(0.13, 0, -0.05);
  tail.add(tailDark, tailEdgeL, tailEdgeR);
  tail.position.set(0, -0.42, -1.35);
  tail.rotation.x = -0.55; // 뒤로 갈수록 아래로 처짐
  bird.add(tail);

  // 다리 — 아주 짧게
  const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 10);
  const legL = new THREE.Mesh(legGeo, mat(COLORS.dark));
  const legR = new THREE.Mesh(legGeo, mat(COLORS.dark));
  legL.position.set(-0.28, -1.3, 0.18);
  legR.position.set(0.28, -1.3, 0.18);
  bird.add(legL, legR);

  // 집중 머리띠 (focus에서만)
  const headband = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.09, 12, 40), mat(COLORS.band));
  headband.rotation.x = 1.25;
  headband.position.set(0, 0.72, 0.05);
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
    const eyeScale = name === 'drag' ? 1.55 : 1;
    eyeL.scale.setScalar(eyeScale);
    eyeR.scale.setScalar(eyeScale);
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

    // 상태별 모션 파라미터
    let bobAmp = 0.05;
    let bobSpeed = 2.2;
    let spin = 0;
    let tilt = 0;
    if (anim === 'focus') { bobAmp = 0.025; bobSpeed = 1.4; tilt = 0.1; }
    else if (anim === 'rest' || anim === 'idleFun') { bobAmp = 0.09; bobSpeed = 5; spin = 2.6; }
    else if (anim === 'cheer') { bobAmp = 0.06; bobSpeed = 6; spin = 3.2; }
    else if (anim === 'drag') { bobAmp = 0.02; bobSpeed = 9; }

    // 회전(빙글빙글) 또는 정면 복귀 + 유휴 두리번
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

    // 통통(bob) + 점프
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
    body.scale.y = 0.96 + bob * 0.35;

    // 눈 깜빡 (드래그 중엔 놀란 눈 유지)
    if (anim !== 'drag') {
      if (t > blinkAt) {
        blinkUntil = t + 0.12;
        blinkAt = t + 2 + Math.random() * 3;
      }
      const eyeY = t < blinkUntil ? 0.15 : 1;
      eyeL.scale.y = eyeY;
      eyeR.scale.y = eyeY;
    }

    // 날개 파닥임 (드래그·휴식·환호)
    const flutter =
      anim === 'drag' || anim === 'rest' || anim === 'cheer' || anim === 'idleFun'
        ? Math.sin(t * 18) * 0.5
        : 0;
    wingL.rotation.z = 0.15 + flutter * 0.5;
    wingR.rotation.z = -0.15 - flutter * 0.5;

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
