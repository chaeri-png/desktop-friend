// 맥 앱에 약식(ad-hoc) 서명을 강제로 넣는다.
// 애플 실리콘 맥은 서명이 아예 없는 앱을 "악성 코드"로 판정해 휴지통으로 보내기 때문에,
// 개발자 인증서가 없어도 최소한의 self-sign(codesign --sign -)은 반드시 필요하다.
const { execFileSync } = require('node:child_process');
const path = require('node:path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);

  console.log(`[adhoc-sign] 약식 서명 시작: ${appPath}`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], {
    stdio: 'inherit',
  });
  // 서명이 실제로 붙었는지 확인 (실패하면 빌드를 중단시킨다)
  execFileSync('codesign', ['--verify', '--verbose=2', appPath], { stdio: 'inherit' });
  console.log('[adhoc-sign] 약식 서명 완료');
};
