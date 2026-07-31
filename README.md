# 🐦 뱁새 데스크펫

화면 구석에 사는 뱁새가 뽀모도로 타이머와 하루 일과를 함께해 주는 픽사 팀 데스크펫.

## 사용법
- **우클릭** → 설정 열기 / 타이머 시작·정지 / 종료
- **클릭** → 인사 리액션 · **더블클릭** → 현재 일과 완료
- **드래그** → 원하는 위치로 이동
- 휴식 시간이 되면 뱁새가 화면을 떠다니며 춤춥니다
- 트레이 아이콘으로 잠깐 숨길 수 있어요 (발표할 때!)

## 개발
- 실행: `npm start` / 테스트: `npm test`
- 새 캐릭터 추가: `characters/<이름>/` 폴더에 `character.json`과 이미지(svg/png/gif)를 넣으면 끝.
  필수 애니메이션 키: `idle, idleFun, focus, rest, drag, react, cheer`

## 빌드·배포
1. `npm run icons` (아이콘 생성)
2. Windows: `npm run dist:win` → `release/*.exe`
3. Mac: **Mac에서** `npm run dist:mac` → `release/*.dmg`
   (Windows에서는 Mac용 빌드 불가)

### Mac 팀원 안내
서명 없는 앱이라 처음 열 때 경고가 떠요:
앱을 **우클릭 → 열기 → "열기" 버튼** 한 번만 눌러주면 그다음부터는 그냥 실행됩니다.
