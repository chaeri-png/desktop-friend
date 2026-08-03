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

export const ACCESSORY_KINDS = ['glasses', 'oval', 'headset', 'hat', 'bucket', 'tshirt', 'hoodie', 'pants'];

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

// 반소매: 어깨(몸판 안쪽)에서 시작해 팔로 내려오는 막힌 원뿔형 래글런 소매
// (집중 모드엔 팔이 앞으로 가므로 숨김) — 티셔츠·후드티 공용
function addSleeves(g, fit, mat) {
  if (!fit.sleeve) return;
  const s = fit.sleeve;
  for (const sign of [-1, 1]) {
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(s.r * 0.8, s.r * 1.2, s.len ?? 0.6, 18, 1, false),
      mat
    );
    sleeve.position.set(s.x * sign, s.y, s.z);
    // 앞 기울기를 약하게 — 뒤에서 봐도 팔 뒤쪽이 드러나지 않게
    sleeve.rotation.set(-0.12, 0, (s.rotZ ?? 0.55) * sign);
    sleeve.userData.hideOnFocus = true;
    g.add(sleeve);
  }
}

// 몸판 셸 (티셔츠·후드티 공용)
function addBodyShell(g, fit, mat) {
  const b = fit.body;
  const [t0, tl] = b.shirtTheta ?? [0.5, 1.25];
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, t0, tl), mat);
  shell.scale.set(b.rx * 1.07, b.ry * 1.07, b.rz * 1.07);
  shell.position.set(0, b.cy, 0);
  g.add(shell);
  return t0;
}

function buildHoodie(fit) {
  // 크림 옐로우 후드티: 몸판 + 소매 + 목 뒤 후드 + 앞 주머니 + 끈
  const b = fit.body;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf3d371,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const t0 = addBodyShell(g, fit, mat);
  addSleeves(g, fit, mat);
  // 후드: 목 뒤에 접혀 있는 반구
  const topY = b.cy + Math.cos(t0) * b.ry * 1.07;
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), mat);
  hood.scale.set(b.rx * 1.1, 0.72, 0.62);
  hood.position.set(0, topY - 0.05, -b.rz * 0.78);
  g.add(hood);
  // 앞 주머니 (캥거루 포켓)
  const pocket = new THREE.Mesh(
    new THREE.BoxGeometry(b.rx * 0.66, b.ry * 0.28, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xe0bd57, roughness: 0.95 })
  );
  pocket.position.set(0, b.patchY != null ? b.patchY - 0.22 : b.cy - 0.08, b.rz * 1.07 * 1.02);
  pocket.rotation.x = -0.3;
  g.add(pocket);
  // 끈 두 가닥
  const stringMat = new THREE.MeshStandardMaterial({ color: 0xf3f3f0, roughness: 0.9 });
  for (const sign of [-1, 1]) {
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), stringMat);
    str.position.set(0.14 * sign, (b.patchY ?? b.cy + b.ry * 0.28) - 0.05, b.rz * 1.07 * 1.0);
    str.rotation.x = -0.2;
    g.add(str);
  }
  return g;
}

function buildCap2(fit) {
  // 옆으로 삐딱하게 쓴 민트 스냅백: 민트 돔 + 노란 챙(옆쪽) + 노란 단추 + 크림 스냅 밴드
  const g = new THREE.Group();
  const mint = new THREE.MeshStandardMaterial({ color: 0x8fd6c7, roughness: 0.85 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf5eddc, roughness: 0.9 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.8 });
  const capR = fit.topR * 0.66;
  const capY = fit.topY + fit.topR * 0.17;
  const capZ = fit.topZ + 0.02;
  const cap = new THREE.Group();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(capR, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    mint
  );
  dome.scale.set(1, 0.8, 1);
  dome.position.set(0, capY, capZ);
  // 챙 (일단 정면으로 만들고, 아래에서 그룹째 옆으로 돌린다)
  const visor = new THREE.Mesh(new THREE.SphereGeometry(capR * 0.62, 22, 14), yellow);
  visor.scale.set(1.25, 0.13, 1.05);
  visor.position.set(0, capY + 0.02, capZ + capR * 0.9);
  visor.rotation.x = -0.16;
  const button = new THREE.Mesh(new THREE.SphereGeometry(capR * 0.13, 12, 8), yellow);
  button.position.set(0, capY + capR * 0.68, capZ);
  // 스냅 조절 밴드 (챙 반대쪽)
  const band = new THREE.Mesh(new THREE.BoxGeometry(capR * 0.72, capR * 0.16, 0.04), cream);
  band.position.set(0, capY + 0.03, capZ - capR * 0.97);
  band.rotation.x = 0.2;
  cap.add(dome, visor, button, band);
  // 옆으로 삐딱하게 — 정면에서 챙 옆면이 보이도록
  cap.rotation.y = 1.25;
  g.add(cap);
  return g;
}

function buildTshirt(fit) {
  // MZ st. 오버사이즈 티: 크림 바탕 + 가슴 스마일 와펜 (팔은 소매 아래로 나온다)
  const b = fit.body;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf7f1e1,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  addBodyShell(g, fit, mat);
  addSleeves(g, fit, mat);
  const patch = makeSmilePatch(Math.min(0.26, b.rx * 0.3));
  patch.position.set(0, b.patchY ?? b.cy + b.ry * 0.28, b.patchZ ?? b.rz * 1.07 * 0.97);
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
  const [p0, pl] = b.pantsTheta ?? [1.62, 0.95];
  const hip = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, p0, pl), denim);
  hip.scale.set(b.rx * 1.05, b.ry * 1.05, b.rz * 1.05);
  hip.position.set(0, b.cy, 0);
  g.add(hip);
  // 밑단 바닥판 — 아래에서 올려봐도 뚫려 보이지 않게 막는다
  const endR = Math.sin(p0 + pl) * 1.05;
  const cap = new THREE.Mesh(new THREE.CircleGeometry(1, 32), denim);
  cap.scale.set(b.rx * endR, b.rz * endR, 1);
  cap.rotation.x = Math.PI / 2;
  cap.position.set(0, b.cy + Math.cos(p0 + pl) * b.ry * 1.05, 0);
  g.add(cap);
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
  bucket: buildCap2,
  tshirt: buildTshirt,
  hoodie: buildHoodie,
  pants: buildPants,
};

// ---------- 연기용 소품 (설정과 무관, 애니메이션 중에만 등장) ----------
// 선글라스: 환호 춤 출 때 씀 — 2026 트렌드 스포티 쉴드(랩어라운드 미러 바이저)
function buildSunglasses(fit) {
  const g = new THREE.Group();
  const R = fit.eyeZ + 0.24; // 머리를 감싸는 곡면 반지름 (눈이 뚫고 나오지 않게 여유)
  const cy = fit.eyeY;
  // 미러 그라데이션 렌즈 텍스처 (블루→퍼플→핑크)
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 64;
  const cx = cv.getContext('2d');
  const gr = cx.createLinearGradient(0, 0, 128, 64);
  gr.addColorStop(0, '#7ea6f0');
  gr.addColorStop(0.5, '#a98fe8');
  gr.addColorStop(1, '#f0a6c8');
  cx.fillStyle = gr;
  cx.fillRect(0, 0, 128, 64);
  cx.fillStyle = 'rgba(255,255,255,0.5)';
  cx.beginPath();
  cx.ellipse(34, 18, 22, 8, -0.25, 0, Math.PI * 2);
  cx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  // 흰 테두리 밴드 (렌즈보다 살짝 넓게 뒤에 깔림)
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(R - 0.015, 32, 12, Math.PI / 2 - 1.08, 2.16, Math.PI / 2 - 0.44, 0.88),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, side: THREE.DoubleSide })
  );
  rim.position.set(0, cy, 0);
  // 한 장짜리 랩어라운드 미러 렌즈
  const lens = new THREE.Mesh(
    new THREE.SphereGeometry(R, 32, 12, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.34, 0.68),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.12, metalness: 0.3 })
  );
  lens.position.set(0, cy, 0);
  g.add(rim, lens);
  return g;
}

// 물병: 물 마시기 연기 때 입구가 입에 닿게 기울여 든다
function buildBottle(fit) {
  const g = new THREE.Group();
  const water = new THREE.MeshStandardMaterial({
    color: 0x7ec3ec,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 16), water);
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.135, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.6 })
  );
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.09, 12),
    new THREE.MeshStandardMaterial({ color: 0x4a90c2, roughness: 0.5 })
  );
  cap.position.y = 0.29;
  g.add(body, label, cap);
  // 병 입구(캡)가 입 높이(눈보다 한참 아래)에 오도록 배치
  const [bx, by, bz] = fit.bottle ?? [0.34, fit.eyeY - 0.5, fit.eyeZ + 0.22];
  g.position.set(bx, by, bz);
  g.rotation.z = 0.85; // 입 쪽으로 푹 기울여 꿀꺽
  return g;
}

// 옷(티셔츠·후드티·바지)은 몸통 좌표, 나머지는 머리 좌표에 붙는다
const BODY_KINDS = new Set(['tshirt', 'hoodie', 'pants']);

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
    setFocus(focusHidden);
    return want;
  }

  // 집중 모드에선 hideOnFocus 표시된 부품(반소매 등)을 숨긴다
  let focusHidden = false;
  function setFocus(focus) {
    focusHidden = focus;
    for (const obj of current.values())
      obj.traverse((o) => {
        if (o.userData?.hideOnFocus) o.visible = !focus;
      });
  }

  // 연기 소품 토글: 'dance'(선글라스) | 'bottle'(물병) | null(모두 숨김)
  const actProps = {};
  function setAct(kind) {
    if (kind && !actProps[kind]) {
      actProps[kind] = kind === 'dance' ? buildSunglasses(fit) : buildBottle(fit);
      headAcc.add(actProps[kind]);
    }
    for (const [k, obj] of Object.entries(actProps)) obj.visible = k === kind;
  }

  return { setAccessories, setFocus, setAct };
}
