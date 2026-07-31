# 뱁새 데스크펫 프로젝트

픽사 팀 데스크펫 앱. 화면 구석에 사는 뱁새가 뽀모도로 타이머와 하루 일과를 함께해 주는 Electron 앱이다.
(ENA의 Phindoll — joelgc.com "Totally not a virus. Trust me...im a dolphin" 데스크펫에서 영감)

## 현재 상태 (2026-07-31 기준)

- ✅ 브레인스토밍 완료 → 디자인 문서 승인됨
- ✅ 구현 계획 작성 완료 (13개 작업, TDD 기반)
- ⏸️ **구현은 아직 시작 안 함** — 여기서 일시 중지된 상태
- 코드·node_modules 없음. 문서 2개와 이 파일만 존재

## 핵심 문서 (반드시 이 순서로 읽을 것)

1. `docs/superpowers/specs/2026-07-31-desk-pet-design.md` — 승인된 디자인 (무엇을 만드는지)
2. `docs/superpowers/plans/2026-07-31-desk-pet.md` — 구현 계획 (어떻게 만드는지, Task 1~13, 체크박스로 진행 추적)

## 이어서 작업하는 방법

1. 위 두 문서를 읽는다
2. superpowers의 **subagent-driven-development** 또는 **executing-plans** 스킬로 계획을 Task 1부터 순서대로 실행한다 (superpowers 플러그인이 없는 환경이면 계획 문서만 따라가도 됨 — 모든 코드가 계획에 들어 있다)
3. 각 Task의 체크박스(`- [ ]`)를 완료할 때마다 체크하고 커밋한다
4. 완료된 Task는 계획 문서에서 체크 상태로 확인 가능

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
