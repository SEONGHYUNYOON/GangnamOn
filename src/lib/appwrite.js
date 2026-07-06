import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'appwrite';

// ⚠️ 아래 두 값은 Appwrite 콘솔(프로젝트 Settings > General)에서 확인 가능합니다.
// .env.local 파일에 아래처럼 넣어주세요:
//   VITE_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
//   VITE_APPWRITE_PROJECT_ID=여기에_프로젝트_ID
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

export const client = new Client();

client.setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);

// Appwrite Web SDK v17은 positional 인자를 사용합니다.
// 컴포넌트 코드는 객체 형태({ databaseId, collectionId, ... })로 통일해 두었으므로
// 여기서 어댑터로 변환합니다.
const rawDatabases = new Databases(client);
const rawStorage = new Storage(client);

export const databases = {
     listDocuments: ({ databaseId, collectionId, queries = [] }) =>
          rawDatabases.listDocuments(databaseId, collectionId, queries),

     createDocument: ({ databaseId, collectionId, documentId, data, permissions = [] }) =>
          rawDatabases.createDocument(databaseId, collectionId, documentId, data, permissions),

     getDocument: ({ databaseId, collectionId, documentId, queries }) =>
          rawDatabases.getDocument(databaseId, collectionId, documentId, queries),

     updateDocument: ({ databaseId, collectionId, documentId, data, permissions }) =>
          rawDatabases.updateDocument(databaseId, collectionId, documentId, data, permissions),

     deleteDocument: ({ databaseId, collectionId, documentId }) =>
          rawDatabases.deleteDocument(databaseId, collectionId, documentId),
};

export const storage = {
     createFile: ({ bucketId, fileId, file, permissions = [], onProgress }) =>
          rawStorage.createFile(bucketId, fileId, file, permissions, onProgress),
};

// appwrite.json과 동일한 값으로 맞춰주세요 (Databases > ID)
export const DATABASE_ID = 'main';
export const COLLECTIONS = {
     profiles: 'profiles',
     posts: 'posts',
     romanceInteractions: 'romance_interactions',
     chatRooms: 'chat_rooms',
     chatParticipants: 'chat_participants',
     guestbookEntries: 'guestbook_entries',
};
export const BUCKET_ID = 'post-images';

// 현재 로그인한 사용자를 가져옵니다. 로그인 안 되어 있으면 null (에러를 던지지 않음)
export async function getCurrentUser() {
     try {
          return await account.get();
     } catch (e) {
          return null;
     }
}

// Storage에 올린 파일의 공개 URL을 직접 조립합니다.
export function getFileUrl(fileId, bucketId = BUCKET_ID) {
     if (!fileId) return null;
     return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
}

export { ID, Query, Permission, Role };
