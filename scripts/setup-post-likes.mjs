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

async function waitForAttribute(databases, collectionId, key) {
  for (let i = 0; i < 30; i++) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, collectionId, key);
      if (attr.status === 'available') return;
    } catch {
      // keep waiting
    }
    await sleep(2000);
  }
  throw new Error(`Attribute ${collectionId}.${key} not available`);
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('APPWRITE_API_KEY 또는 ~/.appwrite/prefs.json 필요');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const databases = new Databases(client);

  try {
    await databases.getCollection(DATABASE_ID, 'post_likes');
    console.log('✔ post_likes collection already exists');
  } catch {
    console.log('→ Creating post_likes collection …');
    await databases.createCollection(
      DATABASE_ID,
      'post_likes',
      'post_likes',
      [Permission.read(Role.users())],
      false,
    );
    console.log('✔ post_likes collection created');
  }

  for (const [key, size] of [
    ['userId', 64],
    ['postId', 64],
  ]) {
    try {
      await databases.getAttribute(DATABASE_ID, 'post_likes', key);
      console.log(`✔ post_likes.${key} already exists`);
    } catch {
      console.log(`→ Creating post_likes.${key} …`);
      await databases.createStringAttribute(DATABASE_ID, 'post_likes', key, size, true);
      await waitForAttribute(databases, 'post_likes', key);
      console.log(`✔ post_likes.${key} created`);
    }
  }

  try {
    await databases.getIndex(DATABASE_ID, 'post_likes', 'user_idx');
    console.log('✔ post_likes.user_idx already exists');
  } catch {
    console.log('→ Creating post_likes.user_idx …');
    await databases.createIndex(DATABASE_ID, 'post_likes', 'user_idx', 'key', ['userId']);
    console.log('✔ post_likes.user_idx created');
  }

  console.log('\npost_likes 스키마 설정 완료.');
}

main().catch((err) => {
  console.error('스키마 설정 오류:', err.message || err);
  process.exit(1);
});
