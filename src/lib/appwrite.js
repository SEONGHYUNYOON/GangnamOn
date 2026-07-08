import { Client, Account, Databases, Storage, Functions, ID, Query, Permission, Role, ExecutionMethod, OAuthProvider } from 'appwrite';

// ⚠️ 아래 두 값은 Appwrite 콘솔(프로젝트 Settings > General)에서 확인 가능합니다.
// .env.local 파일에 아래처럼 넣어주세요:
//   VITE_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
//   VITE_APPWRITE_PROJECT_ID=여기에_프로젝트_ID
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6a4be56a00369cf49a31';

export const client = new Client();

client.setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);

// Appwrite Web SDK v17은 positional 인자를 사용합니다.
// 컴포넌트 코드는 객체 형태({ databaseId, collectionId, ... })로 통일해 두었으므로
// 여기서 어댑터로 변환합니다.
const rawDatabases = new Databases(client);
const rawStorage = new Storage(client);
const rawFunctions = new Functions(client);

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
     chatMessages: 'chat_messages',
     meetingParticipants: 'meeting_participants',
     userRelations: 'user_relations',
     presence: 'presence',
     pageViews: 'page_views',
     guestbookEntries: 'guestbook_entries',
};
export const BUCKET_ID = 'post-images';
export const ECONOMY_FUNCTION_ID = 'economy';

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

// 온(재화) 관련 서버 검증이 필요한 모든 동작은 이 헬퍼를 통해
// Appwrite Function("economy")을 호출합니다. 클라이언트에서 직접
// databases.updateDocument로 beans/unlockedStyles 등을 바꾸지 않도록
// 이 함수 하나로 창구를 통일합니다.
//
// payload 예시: { action: 'purchase_style', styleId: 'lorelei' }
//              { action: 'spend', type: 'boost', postId: '...' }
//              { action: 'change_nickname', newName: '...' }
//              { action: 'earn', type: 'post_created' }
export async function callEconomy(payload) {
     try {
          // 로그인 세션이 있으면 Appwrite가 x-appwrite-user-id를 자동 주입합니다.
          // x-appwrite-* 커스텀 헤더는 API에서 금지되므로 JWT 헤더는 보내지 않습니다.
          const execution = await rawFunctions.createExecution(
               ECONOMY_FUNCTION_ID,
               JSON.stringify(payload),
               false,
               '/',
               ExecutionMethod.POST
          );

          let result = {};
          try {
               result = JSON.parse(execution.responseBody || '{}');
          } catch (parseErr) {
               result = {};
          }

          if (execution.responseStatusCode >= 400 || result.success === false) {
               return {
                    success: false,
                    message: result.message || '요청 처리 중 오류가 발생했습니다.',
               };
          }

          return { success: true, ...result };
     } catch (error) {
          console.error('economy function 호출 실패:', error);
          return {
               success: false,
               message: error.message || '서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.',
          };
     }
}

export const AVATAR_STYLE_PRICES = {
     lorelei: 0,
     avataaars: 0,
     micah: 300,
     miniavs: 150,
     'open-peeps': 200,
     adventurer: 100,
     'big-smile': 150,
     personas: 250,
};

export { ID, Query, Permission, Role, OAuthProvider };
