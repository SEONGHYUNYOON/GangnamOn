/**
 * posts.pickGroup + push_subscriptions 컬렉션을 안전하게 추가합니다.
 * APPWRITE_API_KEY 환경변수 또는 ~/.appwrite/prefs.json 사용.
 */
import { Client, Databases, Permission, Role } from 'node-appwrite';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = process.env.APPWRITE_PROJECT_ID || '6a4be56a00369cf49a31';
const DATABASE_ID = 'main';

function getApiKey() {
  if (process.env.APPWRITE_API_KEY) return process.env.APPWRITE_API_KEY;
  try {
    const prefs = JSON.parse(readFileSync(join(homedir(), '.appwrite', 'prefs.json'), 'utf8'));
    const current = prefs.current;
    if (current && prefs[current]?.key) return prefs[current].key;
    for (const value of Object.values(prefs)) {
      if (value && typeof value === 'object' && value.key) return value.key;
    }
  } catch {
    return null;
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForAttribute(databases, collectionId, key, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, collectionId, key);
      if (attr.status === 'available') return;
      console.log(`  … ${collectionId}.${key} status=${attr.status}, waiting`);
    } catch {
      console.log(`  … ${collectionId}.${key} not ready yet`);
    }
    await sleep(2000);
  }
  throw new Error(`Attribute ${collectionId}.${key} did not become available`);
}

async function ensurePickGroup(databases) {
  try {
    await databases.getAttribute(DATABASE_ID, 'posts', 'pickGroup');
    console.log('✔ posts.pickGroup already exists');
  } catch {
    console.log('→ Creating posts.pickGroup …');
    await databases.createStringAttribute(DATABASE_ID, 'posts', 'pickGroup', 20, false, 'restaurant');
    await waitForAttribute(databases, 'posts', 'pickGroup');
    console.log('✔ posts.pickGroup created');
  }

  try {
    await databases.getIndex(DATABASE_ID, 'posts', 'pick_group_idx');
    console.log('✔ posts.pick_group_idx already exists');
  } catch {
    console.log('→ Creating posts.pick_group_idx …');
    await databases.createIndex(DATABASE_ID, 'posts', 'pick_group_idx', 'key', ['pickGroup']);
    console.log('✔ posts.pick_group_idx created');
  }
}

async function ensurePushSubscriptions(databases) {
  try {
    await databases.getCollection(DATABASE_ID, 'push_subscriptions');
    console.log('✔ push_subscriptions collection already exists');
  } catch {
    console.log('→ Creating push_subscriptions collection …');
    await databases.createCollection(
      DATABASE_ID,
      'push_subscriptions',
      'push_subscriptions',
      [Permission.read(Role.users()), Permission.create(Role.users())],
      true,
    );
    console.log('✔ push_subscriptions collection created');
  }

  try {
    await databases.updateCollection(
      DATABASE_ID,
      'push_subscriptions',
      'push_subscriptions',
      [Permission.read(Role.users()), Permission.create(Role.users())],
      true,
      true,
    );
    console.log('✔ push_subscriptions permissions set');
  } catch (err) {
    console.log(`  permissions update: ${err.message}`);
  }

  for (const [key, size, required] of [
    ['userId', 64, true],
    ['endpoint', 512, true],
    ['keys', 512, true],
  ]) {
    try {
      await databases.getAttribute(DATABASE_ID, 'push_subscriptions', key);
      console.log(`✔ push_subscriptions.${key} already exists`);
    } catch {
      console.log(`→ Creating push_subscriptions.${key} …`);
      await databases.createStringAttribute(DATABASE_ID, 'push_subscriptions', key, size, required);
      await waitForAttribute(databases, 'push_subscriptions', key);
      console.log(`✔ push_subscriptions.${key} created`);
    }
  }

  try {
    await databases.getIndex(DATABASE_ID, 'push_subscriptions', 'user_idx');
    console.log('✔ push_subscriptions.user_idx already exists');
  } catch {
    console.log('→ Creating push_subscriptions.user_idx …');
    await databases.createIndex(DATABASE_ID, 'push_subscriptions', 'user_idx', 'key', ['userId']);
    console.log('✔ push_subscriptions.user_idx created');
  }
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('APPWRITE_API_KEY 또는 ~/.appwrite/prefs.json 필요');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  await ensurePickGroup(databases);
  await ensurePushSubscriptions(databases);
  console.log('\n스키마 설정 완료.');
}

main().catch((err) => {
  console.error('스키마 설정 오류:', err.message || err);
  process.exit(1);
});
