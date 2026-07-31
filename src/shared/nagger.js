// {name}·{emoji}는 현재 캐릭터의 이름·이모지로 치환된다 (main.js)
export const NAG_MESSAGES = [
  '물 한 잔 마시고 가요! 💧',
  '어깨 스트레칭 한 번 어때요?',
  '오늘도 잘하고 있어요! {emoji}',
  '눈이 뻑뻑하죠? 먼 곳 한 번 봐요~',
  '허리 펴기! {name}는 다 보고 있어요 👀',
  '잠깐 일어나서 한 바퀴 돌고 와요!',
];

export function shouldNag({ enabled, lastAt, intervalMin, now }) {
  return enabled && now - lastAt >= intervalMin * 60_000;
}

export function pickMessage(rand = Math.random) {
  return NAG_MESSAGES[Math.floor(rand() * NAG_MESSAGES.length)];
}
