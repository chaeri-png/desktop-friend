// {name}·{emoji}는 현재 캐릭터의 이름·이모지로 치환된다 (main.js)
export const NAG_MESSAGES = [
  '물 한 잔 마시고 가요! 💧',
  '어깨 스트레칭 한 번 어때요?',
  '오늘도 잘하고 있어요! {emoji}',
  '눈이 뻑뻑하죠? 먼 곳 한 번 봐요~',
  '허리 펴기! {name}는 다 보고 있어요 👀',
  '잠깐 일어나서 한 바퀴 돌고 와요!',
];

// 클릭 인사말 (랜덤)
export const GREET_MESSAGES = [
  '안녕! {emoji}',
  '불렀어요? 👀',
  '오늘도 화이팅이에요!',
  '{name}가 응원할게요! 💪',
  '히히, 간지러워요~',
  '무슨 일이에요? 🐾',
  '보고 싶었어요! {emoji}',
  '쓰담쓰담 고마워요~',
  '집중 잘 되고 있어요?',
  '옆에 있을게요, 힘내요!',
  '{emoji} 뿅!',
];

export function shouldNag({ enabled, lastAt, intervalMin, now }) {
  return enabled && now - lastAt >= intervalMin * 60_000;
}

export function pickFrom(list, rand = Math.random) {
  return list[Math.floor(rand() * list.length)];
}

export function pickMessage(rand = Math.random) {
  return pickFrom(NAG_MESSAGES, rand);
}

// 시간대 구분: 아침 5~10시, 점심 11~13시, 오후 14~17시, 저녁 18~21시, 밤 22~4시
export function bucketForHour(hour) {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

// lines가 배열이면 그대로, {any, morning, ...} 형태면 공통 + 현재 시간대 대사를 합친다
export function linesForHour(lines, hour) {
  if (Array.isArray(lines)) return lines;
  if (!lines || typeof lines !== 'object') return [];
  return [...(lines.any ?? []), ...(lines[bucketForHour(hour)] ?? [])];
}
