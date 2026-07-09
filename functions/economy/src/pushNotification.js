import { Client, Databases, Query } from 'node-appwrite';
import webpush from 'web-push';

const DATABASE_ID = 'main';
const COLLECTIONS = {
     chatParticipants: 'chat_participants',
     pushSubscriptions: 'push_subscriptions',
     profiles: 'profiles',
};

export async function handlePushNotification({ req, res, log, error, payload }) {
     try {
          const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
          const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
          const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:a23642514@gmail.com';

          if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
               error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY 환경변수가 설정되지 않았습니다.');
               return res.json({ success: false, reason: 'missing_vapid_keys' });
          }
          webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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
          const recipientIds = [...new Set(participants.documents.map((doc) => doc.userId).filter((id) => id && id !== senderId))];

          if (recipientIds.length === 0) {
               return res.json({ success: true, sent: 0 });
          }

          let senderName = '강남 이웃';
          try {
               const senderProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.profiles, senderId);
               senderName = senderProfile.username || senderProfile.fullName || senderName;
          } catch {
               // 프로필 조회 실패해도 알림은 보냄
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
                         await webpush.sendNotification({ endpoint: sub.endpoint, keys }, notificationPayload);
                         sentCount += 1;
                    } catch (pushError) {
                         log(`푸시 전송 실패 (user=${recipientId}): ${pushError.message}`);
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
}
