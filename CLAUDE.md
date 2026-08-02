# 뱁새 데스크펫 프로젝트 (제품명: 🧸 Desktop friend by chaeri)

픽사 팀 데스크펫 앱. 화면 구석에 사는 친구들이 뽀모도로 타이머와 하루 일과를 함께해 주는 Electron 앱이다.
제품명은 Desktop friend by chaeri (package.json productName). 데이터 폴더도 이 이름을 따르며, 예전 "뱁새 데스크펫" 폴더 설정은 최초 실행 시 자동 이전된다.
(ENA의 Phindoll — joelgc.com "Totally not a virus. Trust me...im a dolphin" 데스크펫에서 영감)

## 현재 상태 (2026-07-31 기준)

- ✅ 브레인스토밍 완료 → 디자인 문서 승인됨
- ✅ 구현 계획 작성 완료 (13개 작업, TDD 기반)
- ✅ **Task 1~13 구현 완료** — 단위 테스트 전부 통과, Windows 설치 파일 빌드 성공
- ✅ **3D 리디자인 완료** — 뱁새를 실물(흰머리오목눈이) 기반 Three.js 3D로 교체. 스펙: `docs/superpowers/specs/2026-07-31-baepsae-3d-design.md`
  - 조작: 드래그=회전(돌려둔 각도 고정), 길게 누르기(400ms) 후 드래그=창 이동, 클릭=인사, 우클릭=메뉴
  - 더블클릭: ①돌려둔 상태면 정면 복귀 ②휴식 로밍 중이면 제자리 복귀 ③그 외엔 현재 일과 완료
  - 집중 중엔 노트북 타이핑, 휴식 시작·사이클 완료 때 "야호" 환호(3초) 후 춤
  - `character.json`의 `"type": "3d"`로 3D/2D 분기 (2D 캐릭터 팩은 기존 방식 그대로 동작)
  - 3D 캐릭터 팩 = `characters/<이름>/character.json` + `model.js` (`createModel(container)` export). 현재 6종: 뱁새(과묵·다정·헤드셋), 햄스터(발랄·응원), 치즈냥(예의바른데 할 말은 함), 말티즈 '비누'(퍼피컷 뽀글이, 사나움+심드렁+먹보, '주인' 단어 금지), 시츄 '탱이'(진한 브라운 투톤, 유유자적+간식 사랑, 물결 말투), 프렌치 불독 '테리'(눈 위 검정+아래 흰색, 박쥐 귀, 헬스 트레이너 톤). 강아지·고양이류는 두 발로 서고 집중 시 책상에서 직접 타이핑
  - 대사는 character.json의 `lines` — `{any, morning, lunch, afternoon, evening, night}` 시간대별 구조, `{name}`·`{emoji}` 치환 지원
  - 모델 확인용 스냅샷: `BAEPSAE_SNAP=1`로 실행하면 정면/옆/뒷모습 PNG가 프로젝트 루트에 저장됨
  - three.js는 `src/renderer/vendor/three.module.js`로 벤더링(번들러 없음)
- 남은 확인: Windows에서 눈으로 직접 동작 확인, 설치 파일 재빌드(`npm run icons` 후 `npm run dist:win` — 현재 exe는 2D 시절 빌드), Mac 팀원 기기에서 `npm run dist:mac` 빌드

## 핵심 문서

1. `docs/superpowers/specs/2026-07-31-desk-pet-design.md` — 승인된 디자인 (무엇을 만드는지)
2. `docs/superpowers/plans/2026-07-31-desk-pet.md` — 구현 계획 (Task 1~13 전부 체크 완료)
3. `README.md` — 사용법·빌드·배포 안내

## 알아두면 좋은 것

- 실행: `npm start` / 테스트: `npm test` / 빌드: `npm run icons` 후 `npm run dist:win`
- Windows에서 빌드 시 winCodeSign 심볼릭 링크 오류가 나면: 캐시(`%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0`)에 7z를 수동으로 풀어두면 해결됨 (darwin 심볼릭 링크 2건 오류는 무시해도 됨). 이 기기에는 이미 적용됨.
- 설정·일과 데이터는 `%APPDATA%\baepsae-deskpet\config.json`에 저장됨

## 확정된 주요 결정 (재논의 불필요)

- 기술: **Electron ^31** (Tauri·PWA 검토 후 확정 — PWA는 화면 떠다니기 불가로 탈락)
- 캐릭터: v1은 **임시 뱁새**(SVG, 계획에 코드 포함). 캐릭터는 `characters/<이름>/` 폴더 팩 구조로 코드 수정 없이 추가 가능
- 화면 행동: 평소 구석 고정, **휴식 시간·요청 시에만 떠다님**
- 일과: 시간 지정 항목(정시 알림)과 순서 항목(더블클릭 완료) **혼용**
- 클릭 = 리액션, 더블클릭 = 현재 일과 완료
- 대상: 팀 내부 공유(Windows+Mac) → 추후 외부 배포 가능성
- 데이터: 로컬 저장만, 서버 없음

## 환경 요구사항

- Node.js 20 이상 + npm (다른 기기에서 시작할 때 먼저 확인)
- 이 폴더는 git 저장소임 (OneDrive 동기화 폴더이므로 다른 기기에서도 그대로 보임)
- 의존성은 계획 Task 1에서 설치함: `npm install --save-dev electron@31 vitest@2 electron-builder@24 sharp@0.33`

## 사용자(팀) 컨텍스트

- 사용자는 비개발자(마케팅 팀) — 설명은 쉬운 한국어로, 전문용어는 풀어서
- UI 문구는 전부 한국어
- 커밋 메시지 끝에 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` 추가
