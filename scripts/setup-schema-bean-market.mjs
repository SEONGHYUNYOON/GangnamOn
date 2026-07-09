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

  // ── bean_transactions 컬렉션 ──
  try {
    await databases.getCollection(DATABASE_ID, 'bean_transactions');
    console.log('✔ bean_transactions collection already exists');
  } catch {
    console.log('→ Creating bean_transactions collection …');
    await databases.createCollection(
      DATABASE_ID,
      'bean_transactions',
      'bean_transactions',
      [Permission.read(Role.any()), Permission.create(Role.users())],
      true,
    );
    console.log('✔ bean_transactions collection created');
  }

  for (const spec of [
    ['bean_transactions', 'userId', 'string', 64, true, null],
    ['bean_transactions', 'type', 'string', 32, true, null],
    ['bean_transactions', 'note', 'string', 128, false, null],
  ]) {
    const [, key, , size, required] = spec;
    try {
      await databases.getAttribute(DATABASE_ID, 'bean_transactions', key);
      console.log(`✔ bean_transactions.${key} already exists`);
    } catch {
      console.log(`→ Creating bean_transactions.${key} …`);
      await databases.createStringAttribute(DATABASE_ID, 'bean_transactions', key, size, required);
      await waitForAttribute(databases, 'bean_transactions', key);
      console.log(`✔ bean_transactions.${key} created`);
    }
  }

  try {
    await databases.getAttribute(DATABASE_ID, 'bean_transactions', 'amount');
    console.log('✔ bean_transactions.amount already exists');
  } catch {
    console.log('→ Creating bean_transactions.amount …');
    await databases.createIntegerAttribute(DATABASE_ID, 'bean_transactions', 'amount', true);
    await waitForAttribute(databases, 'bean_transactions', 'amount');
    console.log('✔ bean_transactions.amount created');
  }

  for (const [idx, attrs] of [
    ['userId_idx', ['userId']],
    ['type_idx', ['type']],
  ]) {
    try {
      await databases.getIndex(DATABASE_ID, 'bean_transactions', idx);
      console.log(`✔ bean_transactions.${idx} already exists`);
    } catch {
      console.log(`→ Creating bean_transactions.${idx} …`);
      await databases.createIndex(DATABASE_ID, 'bean_transactions', idx, 'key', attrs);
      console.log(`✔ bean_transactions.${idx} created`);
    }
  }

  // ── posts.productCategory ──
  try {
    await databases.getAttribute(DATABASE_ID, 'posts', 'productCategory');
    console.log('✔ posts.productCategory already exists');
  } catch {
    console.log('→ Creating posts.productCategory …');
    await databases.createStringAttribute(DATABASE_ID, 'posts', 'productCategory', 32, false, '기타');
    await waitForAttribute(databases, 'posts', 'productCategory');
    console.log('✔ posts.productCategory created');
  }

  try {
    await databases.getIndex(DATABASE_ID, 'posts', 'product_category_idx');
    console.log('✔ posts.product_category_idx already exists');
  } catch {
    console.log('→ Creating posts.product_category_idx …');
    await databases.createIndex(DATABASE_ID, 'posts', 'product_category_idx', 'key', ['productCategory']);
    console.log('✔ posts.product_category_idx created');
  }

  console.log('\nbean_transactions + posts.productCategory 스키마 설정 완료.');
}

main().catch((err) => {
  console.error('스키마 설정 오류:', err.message || err);
  process.exit(1);
});
