// 공용 액세서리 모듈 — 안경·빨간 타원 안경·헤드셋·볼캡·티셔츠·바지
// 각 캐릭터 model.js가 initAccessories(부모그룹, fit)을 호출하면
// setAccessories(['glasses', ...]) 로 착탈할 수 있는 3D 소품을 만들어 준다.
// fit: 캐릭터별 머리·몸 치수 {
//   eyeX, eyeY, eyeZ,             — 안경 기준(눈 위치)
//   topY, topZ, topR,             — 모자 기준(정수리 중심·머리 반지름)
//   bandR, bandY, bandZ, cupX,    — 헤드셋 기준(밴드 반지름·중심, 이어컵 x)
//   body: {cy, rx, ry, rz},       — 옷 기준(몸통 중심 y·세 방향 반지름)
//   legX, legY, legR,             — 바지 밑단 기준(두 발로 선 캐릭터만, 선택)
//   exclude: ['headset']          — 이 캐릭터가 착용 불가한 종류 (선택)
// }
import * as THREE from '../vendor/three.module.js';

export const ACCESSORY_KINDS = ['glasses', 'oval', 'headset', 'hat', 'tshirt', 'pants'];

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
  // 힙한 투톤 볼캡: 네이비 돔 + 크림 앞판 + 노란 스마일 와펜 + 꼭지 단추
  const g = new THREE.Group();
  const navy = new THREE.MeshStandardMaterial({ color: 0x33549c, roughness: 0.85 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf5eddc, roughness: 0.9 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.8 });
  const capR = fit.topR * 0.66;
  const capY = fit.topY + fit.topR * 0.17;
  const capZ = fit.topZ + 0.06;
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(capR, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    navy
  );
  dome.scale.set(1, 0.8, 1);
  dome.position.set(0, capY, capZ);
  // 크림색 앞판 (정면 쪽 반쪽 패널)
  const panel = new THREE.Mesh(
    new THREE.SphereGeometry(capR * 1.02, 20, 14, Math.PI / 2 - 0.8, 1.6, 0.14, Math.PI / 2 - 0.16),
    cream
  );
  panel.scale.set(1, 0.8, 1);
  panel.position.set(0, capY, capZ);
  // 앞챙: 납작하게 누른 구를 앞으로 내밀고 살짝 아래로 기울임
  const visor = new THREE.Mesh(new THREE.SphereGeometry(capR * 0.62, 22, 14), navy);
  visor.scale.set(1.25, 0.13, 1.05);
  visor.position.set(0, capY + 0.02, capZ + capR * 0.9);
  visor.rotation.x = -0.16;
  const button = new THREE.Mesh(new THREE.SphereGeometry(capR * 0.13, 12, 8), yellow);
  button.position.set(0, capY + capR * 0.68, capZ);
  // 노란 스마일 와펜 (앞판 위)
  const patch = makeSmilePatch(capR * 0.3);
  patch.position.set(0, capY + capR * 0.24, capZ + capR * 0.98);
  patch.rotation.x = -0.3;
  g.add(dome, panel, visor, button, patch);
  return g;
}

// 노란 스마일 와펜 (모자·티셔츠 공용)
function makeSmilePatch(r) {
  const patch = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.8 });
  const dark = new THREE.MeshBasicMaterial({ color: 0x2b241d });
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 22), yellow);
  patch.add(face);
  for (const sign of [-1, 1]) {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(r * 0.14, 10), dark);
    dot.position.set(r * 0.34 * sign, r * 0.26, 0.004);
    patch.add(dot);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(r * 0.4, r * 0.07, 6, 18, Math.PI), dark);
  smile.rotation.z = Math.PI;
  smile.position.set(0, r * 0.05, 0.004);
  patch.add(smile);
  return patch;
}

function buildTshirt(fit) {
  // MZ st. 오버사이즈 티: 크림 바탕 + 가슴 스마일 와펜
  // 양옆(팔 방향 ±x)에 암홀 틈을 남긴 앞판+뒤판 구조라 팔이 셔츠에 묻히지 않는다
  const b = fit.body;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf7f1e1,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const gap = fit.armGap ?? 0.28; // 암홀 반각(라디안) — 팔 없는 캐릭터는 0으로
  for (const phiStart of [gap, Math.PI + gap]) {
    const panel = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 24, phiStart, Math.PI - gap * 2, 0.5, 1.25),
      mat
    );
    panel.scale.set(b.rx * 1.07, b.ry * 1.07, b.rz * 1.07);
    panel.position.set(0, b.cy, 0);
    g.add(panel);
  }
  const patch = makeSmilePatch(Math.min(0.26, b.rx * 0.3));
  patch.position.set(0, b.cy + b.ry * 0.28, b.rz * 1.07 * 0.97);
  patch.rotation.x = -0.28;
  g.add(patch);
  return g;
}

function buildPants(fit) {
  // 와이드 데님 팬츠 (엉덩이 덮개 + 두 다리 통)
  const b = fit.body;
  const denim = new THREE.MeshStandardMaterial({
    color: 0x5577c2,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const g = new THREE.Group();
  const hip = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 1.62, 0.95), denim);
  hip.scale.set(b.rx * 1.05, b.ry * 1.05, b.rz * 1.05);
  hip.position.set(0, b.cy, 0);
  g.add(hip);
  // 두 발로 선 캐릭터는 발목까지 내려오는 와이드 통
  if (fit.legX != null) {
    for (const sign of [-1, 1]) {
      const cuff = new THREE.Mesh(
        new THREE.CylinderGeometry(fit.legR, fit.legR * 1.18, 0.36, 18, 1, true),
        denim
      );
      cuff.position.set(fit.legX * sign, fit.legY, 0.03);
      g.add(cuff);
    }
  }
  return g;
}

const BUILDERS = {
  glasses: buildGlasses,
  oval: buildOvalGlasses,
  headset: buildHeadset,
  hat: buildHat,
  tshirt: buildTshirt,
  pants: buildPants,
};

// 옷(티셔츠·바지)은 몸통 좌표, 나머지는 머리 좌표에 붙는다
const BODY_KINDS = new Set(['tshirt', 'pants']);

// headParent: 머리 그룹(갸웃 기울기를 따라감), bodyParent: 몸통 그룹(옷용, 생략 시 머리와 동일)
export function initAccessories(headParent, fit, bodyParent = headParent) {
  const headAcc = new THREE.Group();
  headParent.add(headAcc);
  const bodyAcc = new THREE.Group();
  bodyParent.add(bodyAcc);
  const current = new Map();

  // list의 소품을 착용/해제하고, 실제 착용된 종류 Set을 돌려준다
  function setAccessories(list) {
    const exclude = fit.exclude ?? [];
    const want = new Set(
      (Array.isArray(list) ? list : []).filter((k) => {
        if (!BUILDERS[k] || exclude.includes(k)) return false;
        if (BODY_KINDS.has(k) && !fit.body) return false;
        return true;
      })
    );
    for (const [kind, obj] of current) {
      if (!want.has(kind)) {
        obj.parent?.remove(obj);
        current.delete(kind);
      }
    }
    for (const kind of want) {
      if (!current.has(kind)) {
        const obj = BUILDERS[kind](fit);
        (BODY_KINDS.has(kind) ? bodyAcc : headAcc).add(obj);
        current.set(kind, obj);
      }
    }
    return want;
  }

  return { setAccessories };
}
