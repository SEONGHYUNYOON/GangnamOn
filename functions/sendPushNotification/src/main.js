import { Client, Databases, Query } from 'node-appwrite';
import webpush from 'web-push';

// ────────────────────────────────────────────────────────────────
// sendPushNotification — 1:1 채팅 새 메시지 오프라인 푸시 알림
//
// chat_messages 컬렉션에 새 문서(메시지)가 생성될 때마다 Appwrite 이벤트로
// 자동 트리거됩니다 (appwrite.json의 "events" 설정 참고). 사이트 브라우저 탭이
// 꺼져 있는 상대방에게도 OS 알림을 띄우기 위해 Web Push(VAPID)를 사용합니다.
//
// 필요한 환경변수 (Appwrite Function 설정 > 환경변수):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (예: mailto:you@example.com)
//   → `npx web-push generate-vapid-keys` 로 생성
// ────────────────────────────────────────────────────────────────

const DATABASE_ID = 'main';
const COLLECTIONS = {
     chatParticipants: 'chat_participants',
     pushSubscriptions: 'push_subscriptions',
     profiles: 'profiles',
};

export default async ({ req, res, log, error }) => {
     try {
          const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
          const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
          const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@gangnamon.app';

          if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
               error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY 환경변수가 설정되지 않았습니다.');
               return res.json({ success: false, reason: 'missing_vapid_keys' });
          }
          webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

          let payload = {};
          try {
               payload = req.body ? JSON.parse(req.body) : {};
          } catch (e) {
               payload = {};
          }

          const roomId = payload.roomId;
          const senderId = payload.senderId;
          const content = payload.content || '새 메시지가 도착했어요';

          if (!roomId || !senderId) {
               log('roomId/senderId 없음 — 이벤트 페이로드가 아니거나 잘못된 요청입니다.');
               return res.json({ success: false, reason: 'invalid_payload' });
          }

          const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_FUNCTION_API_KEY;
          const client = new Client()
               .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
               .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
               .setKey(apiKey);
          const databases = new Databases(client);

          const participants = await databases.listDocuments(DATABASE_ID, COLLECTIONS.chatParticipants, [
               Query.equal('roomId', roomId),
               Query.limit(10),
          ]);
          const recipientIds = [...new Set(participants.documents.map(doc => doc.userId).filter(id => id && id !== senderId))];

          if (recipientIds.length === 0) {
               return res.json({ success: true, sent: 0 });
          }

          let senderName = '강남 이웃';
          try {
               const senderProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.profiles, senderId);
               senderName = senderProfile.username || senderProfile.fullName || senderName;
          } catch (profileErr) {
               // 프로필 조회 실패해도 알림은 보냄 (기본 이름 사용)
          }

          const notificationBody = content.length > 80 ? `${content.slice(0, 80)}...` : content;
          const notificationPayload = JSON.stringify({
               title: `${senderName}님의 메시지`,
               body: notificationBody,
               url: '/',
               tag: `chat-${roomId}`,
          });

          let sentCount = 0;
          let removedCount = 0;

          for (const recipientId of recipientIds) {
               const subsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.pushSubscriptions, [
                    Query.equal('userId', recipientId),
                    Query.limit(10),
               ]);

               for (const sub of subsRes.documents) {
                    try {
                         const keys = JSON.parse(sub.keys);
                         const pushSubscription = { endpoint: sub.endpoint, keys };
                         await webpush.sendNotification(pushSubscription, notificationPayload);
                         sentCount += 1;
                    } catch (pushError) {
                         log(`푸시 전송 실패 (user=${recipientId}): ${pushError.message}`);
                         // 구독이 만료/취소된 경우(404, 410) 정리
                         if (pushError.statusCode === 404 || pushError.statusCode === 410) {
                              await databases.deleteDocument(DATABASE_ID, COLLECTIONS.pushSubscriptions, sub.$id).catch(() => null);
                              removedCount += 1;
                         }
                    }
               }
          }

          return res.json({ success: true, sent: sentCount, removedExpired: removedCount });
     } catch (err) {
          error(`sendPushNotification 오류: ${err.message || String(err)}`);
          return res.json({ success: false, error: err.message || String(err) });
     }
};
