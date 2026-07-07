import { Client, Account, Databases, ID } from 'appwrite';

const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '6a4be56a00369cf49a31';
const email = `authfeat_${Date.now()}@test.local`;
const password = 'TestPass123!';
const nickname = `nick_${Date.now()}`;

const client = new Client().setEndpoint(endpoint).setProject(projectId);
const account = new Account(client);
const databases = new Databases(client);

async function loginWithSession(userEmail, userPassword) {
  const res = await fetch(`${endpoint}/account/sessions/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
    },
    body: JSON.stringify({ email: userEmail, password: userPassword }),
  });
  const cookie = res.headers.get('x-fallback-cookies');
  const session = await res.json();
  if (!res.ok) throw new Error(session.message || 'login failed');
  if (session.secret) client.setSession(session.secret);
  else if (cookie) client.headers['X-Fallback-Cookies'] = cookie;
  else throw new Error('no session');
  await account.get();
}

async function main() {
  console.log('1) 회원가입 + 프로필 생성 (권한 포함)...');
  const user = await account.create(ID.unique(), email, password, nickname);
  await loginWithSession(email, password);

  const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Test';
  await databases.createDocument('main', 'profiles', user.$id, {
    username: nickname,
    fullName: nickname,
    avatarUrl: defaultAvatar,
    location: '역삼1동',
    gender: 'female',
    beans: 1250,
    unlockedStyles: ['lorelei', 'avataaars'],
  }, [
    `read("any")`,
    `update("user:${user.$id}")`,
    `delete("user:${user.$id}")`,
  ]);

  console.log('2) 본인 프로필 update 권한 테스트 (아바타 변경 시뮬레이션)...');
  const newAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Changed';
  const updated = await databases.updateDocument('main', 'profiles', user.$id, {
    avatarUrl: newAvatar,
    bio: '테스트 자기소개',
  });
  if (updated.avatarUrl !== newAvatar) throw new Error('profile update failed');
  console.log('   OK - avatarUrl 업데이트 성공');

  console.log('3) 비밀번호 재설정 메일 API (createRecovery)...');
  const recoveryRes = await fetch(`${endpoint}/account/recovery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
    },
    body: JSON.stringify({
      email,
      url: 'http://127.0.0.1:5174/?flow=recovery',
    }),
  });
  const recoveryBody = await recoveryRes.json();
  if (!recoveryRes.ok && recoveryRes.status !== 201) {
    throw new Error(`createRecovery failed: ${recoveryRes.status} ${JSON.stringify(recoveryBody)}`);
  }
  console.log('   OK - createRecovery API 성공 (메일 발송 요청됨)');

  console.log('\n✅ auth 기능 API 테스트 통과');
  console.log(`   테스트 계정: ${email}`);
}

main().catch((e) => {
  console.error('\n❌ 테스트 실패:', e.message || e);
  process.exit(1);
});
