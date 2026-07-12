import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client, Databases } from 'node-appwrite';

const DATABASE_ID = 'main';
const PROFILES = 'profiles';

function getApiKey() {
     if (process.env.APPWRITE_API_KEY) return process.env.APPWRITE_API_KEY;
     try {
          const prefs = JSON.parse(readFileSync(join(homedir(), '.appwrite', 'prefs.json'), 'utf8'));
          return prefs?.apiKey || prefs?.key || '';
     } catch {
          return '';
     }
}

async function ensureStringAttribute(databases, key, size, required = false, defaultValue = undefined) {
     try {
          const collection = await databases.getCollection(DATABASE_ID, PROFILES);
          if (collection.attributes?.some((attr) => attr.key === key)) {
               console.log(`skip attribute: ${key}`);
               return;
          }
     } catch (error) {
          console.warn(`collection check failed for ${key}:`, error.message || error);
     }

     await databases.createStringAttribute(DATABASE_ID, PROFILES, key, size, required, defaultValue);
     console.log(`created attribute: ${key}`);
}

async function ensureIndex(databases) {
     const collection = await databases.getCollection(DATABASE_ID, PROFILES);
     if (collection.indexes?.some((index) => index.key === 'phone_site_unique')) {
          console.log('skip index: phone_site_unique');
          return;
     }

     await databases.createIndex(DATABASE_ID, PROFILES, 'phone_site_unique', 'unique', ['phoneHash', 'siteId']);
     console.log('created index: phone_site_unique');
}

async function main() {
     const endpoint = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
     const projectId = process.env.APPWRITE_PROJECT_ID || '6a4be56a00369cf49a31';
     const apiKey = getApiKey();

     if (!apiKey) {
          throw new Error('APPWRITE_API_KEY 또는 ~/.appwrite/prefs.json API 키가 필요합니다.');
     }

     const client = new Client()
          .setEndpoint(endpoint)
          .setProject(projectId)
          .setKey(apiKey);

     const databases = new Databases(client);

     await ensureStringAttribute(databases, 'phoneHash', 128, false);
     await ensureStringAttribute(databases, 'siteId', 32, false, 'gangnam');
     await ensureStringAttribute(databases, 'phoneVerifiedAt', 64, false);

     console.log('Appwrite가 새 속성을 반영할 시간을 8초 기다립니다...');
     await new Promise((resolve) => setTimeout(resolve, 8000));
     await ensureIndex(databases);
}

main().catch((error) => {
     console.error(error.message || error);
     process.exitCode = 1;
});
