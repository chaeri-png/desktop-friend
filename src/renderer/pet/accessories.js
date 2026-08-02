// 공용 액세서리 모듈 — 안경·헤드셋·모자(비니)·리본
// 각 캐릭터 model.js가 initAccessories(부모그룹, fit)을 호출하면
// setAccessories(['glasses', ...]) 로 착탈할 수 있는 3D 소품을 만들어 준다.
// fit: 캐릭터별 머리 치수 {
//   eyeX, eyeY, eyeZ,          — 안경 기준(눈 위치)
//   topY, topZ, topR,          — 모자 기준(정수리 중심·반지름)
//   bandR, bandY, bandZ, cupX, — 헤드셋 기준(밴드 반지름·중심, 이어컵 x)
//   bow: [x, y, z],            — 리본 위치
//   exclude: ['headset']       — 이 캐릭터가 착용 불가한 종류 (선택)
// }
import * as THREE from '../vendor/three.module.js';

export const ACCESSORY_KINDS = ['glasses', 'oval', 'headset', 'hat', 'ribbon'];

// 안경 공통 골격 — color·렌즈 비율만 바꿔 동그란/타원 안경을 만든다
function makeGlasses(fit, { color, sx, sy }) {
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  const r = Math.min(0.3, fit.eyeX * 0.85);
  for (const sign of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.032, 10, 32), frame);
    ring.scale.set(sx, sy, 1);
    ring.position.set(fit.eyeX * sign, fit.eyeY, fit.eyeZ + 0.08);
    g.add(ring);
    // 다리(관자놀이 쪽으로 짧게)
    const temple = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.5, 8), frame);
    temple.rotation.x = Math.PI / 2;
    temple.position.set((fit.eyeX + r * sx) * sign, fit.eyeY + 0.03, fit.eyeZ - 0.17);
    g.add(temple);
  }
  // 브릿지
  const bw = Math.max(0.06, (fit.eyeX - r * sx) * 2);
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, bw, 8), frame);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, fit.eyeY + r * sy * 0.55, fit.eyeZ + 0.06);
  g.add(bridge);
  return g;
}

function buildGlasses(fit) {
  return makeGlasses(fit, { color: 0x4a3b2e, sx: 1, sy: 1 });
}

function buildOvalGlasses(fit) {
  // 빨간색, 옆으로 긴 타원 렌즈
  return makeGlasses(fit, { color: 0xd6453c, sx: 1.25, sy: 0.72 });
}

function buildHeadset(fit) {
  // 뱁새 것과 세트인 애플 느낌: 베이지 패브릭 밴드 + 알루미늄 이어컵
  const g = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color: 0xd8cfc0, roughness: 0.95 });
  const alu = new THREE.MeshStandardMaterial({ color: 0xd7d3ce, roughness: 0.5 });
  const pad = new THREE.MeshStandardMaterial({ color: 0xa89f93, roughness: 0.9 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(fit.bandR, 0.07, 12, 40, Math.PI), fabric);
  band.scale.y = 0.78;
  band.position.set(0, fit.bandY, fit.bandZ);
  g.add(band);
  for (const sign of [-1, 1]) {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(fit.bandR * 0.21, fit.bandR * 0.21, 0.14, 24),
      alu
    );
    cup.rotation.z = Math.PI / 2;
    cup.position.set(fit.cupX * sign, fit.bandY, fit.bandZ);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(fit.bandR * 0.13, fit.bandR * 0.13, 0.03, 20),
      pad
    );
    cap.rotation.z = Math.PI / 2;
    cap.position.set((fit.cupX + 0.08) * sign, fit.bandY, fit.bandZ);
    g.add(cup, cap);
  }
  return g;
}

function buildHat(fit) {
  // 파란 볼캡: 돔 + 앞챙 + 꼭지 단추
  const g = new THREE.Group();
  const blue = new THREE.MeshStandardMaterial({ color: 0x3f6fd1, roughness: 0.85 });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(fit.topR, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    blue
  );
  dome.scale.set(1, 0.78, 1);
  dome.position.set(0, fit.topY, fit.topZ);
  // 앞챙: 납작하게 누른 구를 앞으로 내밀고 살짝 아래로 기울임
  const visor = new THREE.Mesh(new THREE.SphereGeometry(fit.topR * 0.62, 22, 14), blue);
  visor.scale.set(1.25, 0.13, 1.05);
  visor.position.set(0, fit.topY + 0.03, fit.topZ + fit.topR * 0.88);
  visor.rotation.x = -0.16;
  const button = new THREE.Mesh(new THREE.SphereGeometry(fit.topR * 0.12, 12, 8), blue);
  button.position.set(0, fit.topY + fit.topR * 0.8, fit.topZ);
  g.add(dome, visor, button);
  return g;
}

function buildRibbon(fit) {
  // 머리에 얹는 핑크 리본 (양쪽 고리 + 가운데 매듭)
  const g = new THREE.Group();
  const pink = new THREE.MeshStandardMaterial({ color: 0xf28bb1, roughness: 0.85 });
  for (const sign of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), pink);
    loop.scale.set(1.35, 0.75, 0.45);
    loop.position.set(0.16 * sign, 0.01, 0);
    loop.rotation.z = 0.45 * sign;
    g.add(loop);
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), pink);
  knot.scale.set(0.9, 0.8, 0.6);
  g.add(knot);
  const [x, y, z] = fit.bow;
  g.position.set(x, y, z);
  g.rotation.set(-0.45, 0, -0.12);
  g.scale.setScalar(fit.bowScale ?? 1);
  return g;
}

const BUILDERS = {
  glasses: buildGlasses,
  oval: buildOvalGlasses,
  headset: buildHeadset,
  hat: buildHat,
  ribbon: buildRibbon,
};

export function initAccessories(parent, fit) {
  const group = new THREE.Group();
  parent.add(group);
  const current = new Map();

  // list의 소품을 착용/해제하고, 실제 착용된 종류 Set을 돌려준다
  function setAccessories(list) {
    const exclude = fit.exclude ?? [];
    const want = new Set(
      (Array.isArray(list) ? list : []).filter((k) => BUILDERS[k] && !exclude.includes(k))
    );
    for (const [kind, obj] of current) {
      if (!want.has(kind)) {
        group.remove(obj);
        current.delete(kind);
      }
    }
    for (const kind of want) {
      if (!current.has(kind)) {
        const obj = BUILDERS[kind](fit);
        group.add(obj);
        current.set(kind, obj);
      }
    }
    return want;
  }

  return { setAccessories };
}
