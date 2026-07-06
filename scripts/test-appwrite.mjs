import { Client, Databases, Query } from 'appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6a4be56a00369cf49a31');

const databases = new Databases(client);

async function checkCollection(name) {
  try {
    const res = await databases.listDocuments('main', name, [Query.limit(1)]);
    console.log(`OK ${name}: total=${res.total}`);
    return true;
  } catch (e) {
    console.log(`FAIL ${name}: ${e.code} ${e.message}`);
    return false;
  }
}

const collections = ['profiles', 'posts', 'romance_interactions', 'chat_rooms', 'chat_participants', 'guestbook_entries'];
let ok = 0;
for (const c of collections) {
  if (await checkCollection(c)) ok++;
}
console.log(`\n${ok}/${collections.length} collections accessible`);
process.exit(ok === collections.length ? 0 : 1);
