// 강남On 오프라인 푸시 알림 — 구독/해제 헬퍼
//
// 브라우저 탭이 꺼져 있어도(사이트를 안 보고 있어도) 새 1:1 메시지가
// 오면 OS 알림으로 띄워주기 위한 Web Push 구독 로직입니다.
//
// 동작 방식:
// 1. 사용자가 "알림 켜기" 버튼을 누르면 브라우저 알림 권한을 요청합니다.
// 2. 권한이 허용되면, VAPID 공개키로 푸시 구독(subscription)을 생성합니다.
// 3. 구독 정보(endpoint + keys)를 Appwrite push_subscriptions 컬렉션에 저장합니다.
// 4. 이후 chat_messages에 새 문서가 생성될 때마다 sendPushNotification
//    Function이 이벤트로 트리거되어, 저장된 구독 정보로 실제 푸시를 보냅니다.

import { databases, DATABASE_ID, COLLECTIONS, Permission, Role } from './appwrite';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
     const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
     const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
     const rawData = window.atob(base64);
     const outputArray = new Uint8Array(rawData.length);
     for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
     return outputArray;
}

const safeDocId = (userId, endpoint) => {
     let hash = 0;
     for (let i = 0; i < endpoint.length; i++) {
          hash = (hash * 31 + endpoint.charCodeAt(i)) >>> 0;
     }
     return `push_${userId}_${hash}`.slice(0, 36);
};

export const isPushSupported = () =>
     typeof window !== 'undefined' &&
     'serviceWorker' in navigator &&
     'PushManager' in window &&
     'Notification' in window &&
     Boolean(VAPID_PUBLIC_KEY);

export const getPushPermission = () => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

export async function subscribeToPush(userId) {
     if (!isPushSupported() || !userId) return { success: false, reason: 'unsupported' };

     try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return { success: false, reason: 'denied' };

          const registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;

          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
               subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
               });
          }

          const json = subscription.toJSON();
          const docId = safeDocId(userId, subscription.endpoint);
          const data = {
               userId,
               endpoint: subscription.endpoint,
               keys: JSON.stringify(json.keys || {}),
          };

          try {
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.pushSubscriptions,
                    documentId: docId,
                    data,
                    permissions: [
                         Permission.read(Role.user(userId)),
                         Permission.update(Role.user(userId)),
                         Permission.delete(Role.user(userId)),
                    ],
               });
          } catch (createError) {
               // 이미 같은 기기로 구독한 적이 있으면 문서가 존재 → 갱신만 함
               await databases.updateDocument({ databaseId: DATABASE_ID, collectionId: COLLECTIONS.pushSubscriptions, documentId: docId, data }).catch(() => null);
          }

          return { success: true };
     } catch (error) {
          console.warn('푸시 알림 구독 실패:', error);
          return { success: false, reason: 'error', error };
     }
}

export async function unsubscribeFromPush() {
     try {
          if (!('serviceWorker' in navigator)) return;
          const registration = await navigator.serviceWorker.getRegistration('/sw.js');
          const subscription = await registration?.pushManager.getSubscription();
          if (subscription) await subscription.unsubscribe();
     } catch (error) {
          console.warn('푸시 알림 구독 해제 실패:', error);
     }
}
