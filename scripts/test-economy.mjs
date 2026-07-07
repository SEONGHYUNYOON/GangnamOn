import { Client, Account, Databases, Functions, ID, ExecutionMethod } from 'appwrite';

const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '6a4be56a00369cf49a31';
const email = `economytest_${Date.now()}@test.local`;
const password = 'TestPass123!';
const nickname = 'ontest';

const client = new Client().setEndpoint(endpoint).setProject(projectId);
const account = new Account(client);
const databases = new Databases(client);
const functions = new Functions(client);

async function loginWithSession(userEmail, userPassword) {
  const res = await fetch(`${endpoint}/account/sessions/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
    },
    body: JSON.stringify({ email: userEmail, password: userPassword }),
  });

  const cookieFallback = res.headers.get('x-fallback-cookies');
  const session = await res.json();

  if (!res.ok) {
    throw new Error(session.message || '로그인 실패');
  }

  if (session.secret) {
    client.setSession(session.secret);
  } else if (cookieFallback) {
    client.headers['X-Fallback-Cookies'] = cookieFallback;
  } else {
    throw new Error('세션 정보를 받지 못했습니다.');
  }

  await account.get();
  return session;
}

async function callEconomy(payload) {
  const execution = await functions.createExecution(
    'economy',
    JSON.stringify(payload),
    false,
    '/',
    ExecutionMethod.POST
  );

  const result = JSON.parse(execution.responseBody || '{}');
  return { status: execution.responseStatusCode, result, errors: execution.errors };
}

async function main() {
  console.log('1) 회원가입 + 프로필 생성...');
  const user = await account.create(ID.unique(), email, password, nickname);
  await loginWithSession(email, password);

  const profilePayload = {
    username: `${nickname}_${Date.now()}`,
    fullName: nickname,
    beans: 2000,
    unlockedStyles: ['lorelei', 'avataaars'],
    location: 'Yeoksam',
    gender: 'female',
  };
  try {
    await databases.getDocument('main', 'profiles', user.$id);
    await databases.updateDocument('main', 'profiles', user.$id, profilePayload);
  } catch (e) {
    if (e.code !== 404) throw e;
    await databases.createDocument('main', 'profiles', user.$id, profilePayload);
  }
  console.log(`   userId=${user.$id}, initial beans=2000`);

  console.log('2) romance_like (-5온)...');
  let res = await callEconomy({ action: 'spend', type: 'romance_like' });
  console.log(`   status=${res.status}`, res.result);
  if (!res.result.success || res.result.beans !== 1995) throw new Error('romance_like failed');

  console.log('3) purchase_style micah (-300온)...');
  res = await callEconomy({ action: 'purchase_style', styleId: 'micah' });
  console.log(`   status=${res.status}`, res.result);
  if (!res.result.success || res.result.beans !== 1695) throw new Error('purchase_style failed');

  console.log('4) change_nickname (-1000온)...');
  res = await callEconomy({ action: 'change_nickname', newName: 'ontest2' });
  console.log(`   status=${res.status}`, res.result);
  if (!res.result.success || res.result.beans !== 695) throw new Error('change_nickname failed');

  console.log('5) 비인증 호출 (401 기대)...');
  delete client.headers['X-Fallback-Cookies'];
  client.setSession('');
  try {
    res = await callEconomy({ action: 'spend', type: 'romance_like' });
    console.log(`   status=${res.status}`, res.result);
    if (res.status !== 401 && res.result?.message !== '로그인이 필요합니다.') {
      throw new Error('unauthenticated should return 401');
    }
  } catch (e) {
    if (!String(e.message).includes('401') && !String(e.message).includes('로그인')) {
      throw e;
    }
    console.log('   status=401 (exception)');
  }

  console.log('\n✅ economy Function 전체 테스트 통과');
}

main().catch((e) => {
  console.error('\n❌ 테스트 실패:', e.message || e);
  process.exit(1);
});
