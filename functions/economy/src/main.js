import crypto from 'node:crypto';
import { Client, Account, Databases, Users, ID, Permission, Role, Query } from 'node-appwrite';
import { handlePushNotification } from './pushNotification.js';

// ────────────────────────────────────────────────────────────────
// 강남온 "온"(재화) 서버 검증 Function
//
// 지금까지는 아바타 스타일 구매, 이벤트 부스트, 닉네임 변경, 온 지급/차감이
// 전부 클라이언트(브라우저)에서 databases.updateDocument를 직접 호출해서
// 처리됐습니다. 즉 브라우저 개발자도구를 열고 Appwrite SDK를 직접 호출하면
// 누구나 온을 무한정 늘리거나 모든 스타일을 공짜로 잠금 해제할 수 있었습니다.
//
// 이 Function은 그 구멍을 막기 위해, "가격표"와 "차감/지급 로직"을 전부
// 서버(여기)로 옮겨서 실행합니다. 클라이언트는 이제 "무엇을 하고 싶다"는
// 요청만 보내고, 실제 가격 계산과 잔액 확인은 항상 여기서만 이뤄집니다.
// ────────────────────────────────────────────────────────────────

const DATABASE_ID = 'main';
const PROFILES = 'profiles';
const POSTS = 'posts';
const CHAT_ROOMS = 'chat_rooms';
const CHAT_PARTICIPANTS = 'chat_participants';
const CHAT_MESSAGES = 'chat_messages';
const POST_LIKES = 'post_likes';
const BEAN_TRANSACTIONS = 'bean_transactions';
const DEFAULT_SITE_ID = 'gangnam';

// 재화가 오갈 때마다 bean_transactions에 한 줄 남깁니다. amount는 양수면 발급(적립),
// 음수면 소모(사용)입니다. 관리자 대시보드의 "발급된 재화/소모된 재화" 통계가 이 내역을
// 그대로 합산해서 보여줍니다. 기록 실패는 본 동작(구매/차감 등)을 막지 않도록 조용히 무시합니다.
async function logBeanTx(databases, userId, type, amount, note) {
     if (!amount) return;
     try {
          await databases.createDocument(
               DATABASE_ID,
               BEAN_TRANSACTIONS,
               ID.unique(),
               { userId, type, amount, note: note || '' },
               [Permission.read(Role.any())]
          );
     } catch {
          // 통계용 부가 기록이므로 실패해도 본 로직에는 영향을 주지 않습니다.
     }
}

// Appwrite 문서 ID는 36자 제한이 있어서, userId+postId를 그대로 이어붙이면
// 넘칠 수 있습니다. 두 값을 해시해서 짧고 충돌 가능성이 낮은 고정 ID를 만듭니다.
function hashString(str) {
     let hash = 0;
     for (let i = 0; i < str.length; i++) {
          hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
     }
     return hash.toString(36);
}
const safeLikeDocId = (userId, postId) => `like_${hashString(userId)}_${hashString(postId)}`.slice(0, 36);

const safeRoomId = (idA, idB) => [idA, idB].sort().join('_dm_').replace(/[^a-zA-Z0-9._-]/g, '_');

// 아바타 스타일 가격표 (AvatarCustomizer.jsx와 동일하게 유지)
const STYLE_PRICES = {
     lorelei: 0,
     avataaars: 0,
     micah: 300,
     miniavs: 150,
     'open-peeps': 200,
     adventurer: 100,
     'big-smile': 150,
     personas: 250,
};

// 고정 비용 항목 (배너 등록, 강남 썸&쌈 좋아요/슈퍼라이크 등)
const SPEND_COSTS = {
     banner: 500,
     romance_like: 5,
     romance_superlike: 10,
};

// 고정 보상 항목 (지금은 "글 작성 보상"만 존재)
// ⚠️ 참고: 이 보상은 여전히 "글을 실제로 작성했는지"를 서버가 검증하지는
// 않습니다 (누가 몇 번을 호출했는지 확인하는 절차가 없음). 저희 커뮤니티
// 앱 규모에서는 위험도가 낮다고 판단해 우선순위에서 제외했지만, 완전한
// 악용 방지가 필요하다면 posts 컬렉션에 실제 글이 생성됐는지 조회해서
// 확인하는 절차를 추가해야 합니다.
const EARN_REWARDS = {
     post_created: { beans: 20, score: 12 },
     notice_created: { beans: 30, score: 18 },
};

const NICKNAME_COST = 1000;
const BOOST_COST = 300;
const BOOST_HOURS = 24;

// profiles.username은 required입니다. 스키마 push 이전에 생성된 문서는 username이
// 비어 있어 beans만 updateDocument 하면 Appwrite가 500을 반환합니다.
function profileUpdateData(profile, userId, fields) {
     const data = { ...fields };
     if (!profile.username) {
          const fallback = `user_${userId.slice(-8)}`;
          data.username = fallback;
          if (!profile.fullName) data.fullName = fallback;
     }
     return data;
}

function normalizeKoreanPhone(value = '') {
     const trimmed = String(value).trim();
     if (!trimmed) return '';
     if (trimmed.startsWith('+')) return trimmed.replace(/[^\d+]/g, '');

     const digits = trimmed.replace(/\D/g, '');
     if (digits.startsWith('82')) return `+${digits}`;
     if (digits.startsWith('0')) return `+82${digits.slice(1)}`;
     return `+82${digits}`;
}

function hashPhone(phone) {
     const secret = process.env.PHONE_HASH_SECRET
          || process.env.APPWRITE_FUNCTION_PROJECT_ID
          || 'gangnam-on-phone-hash';
     return crypto.createHmac('sha256', secret).update(phone).digest('hex');
}

function isValidEmail(email = '') {
     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

async function completePhoneSignup({ payload, userId, users, databases, res }) {
     const duplicateEmailMessage = '이미 가입된 이메일 주소 입니다.';
     const email = String(payload.email || '').trim().toLowerCase();
     const password = String(payload.password || '');
     const username = String(payload.username || '').trim();
     const location = String(payload.location || '').trim();
     const gender = String(payload.gender || '').trim();
     const avatarUrl = String(payload.avatarUrl || '').trim();
     const siteId = String(payload.siteId || DEFAULT_SITE_ID).trim().toLowerCase();
     const normalizedPhone = normalizeKoreanPhone(payload.phone);

     if (!isValidEmail(email)) {
          return res.json({ success: false, message: '이메일 주소를 정확히 입력해주세요.' }, 400);
     }
     if (password.length < 8) {
          return res.json({ success: false, message: '비밀번호는 8자 이상이어야 합니다.' }, 400);
     }
     if (!username || username.length > 64) {
          return res.json({ success: false, message: '닉네임을 1~64자로 입력해주세요.' }, 400);
     }
     if (!location) {
          return res.json({ success: false, message: '지역을 선택해주세요.' }, 400);
     }
     if (!['male', 'female'].includes(gender)) {
          return res.json({ success: false, message: '성별을 선택해주세요.' }, 400);
     }
     if (!normalizedPhone) {
          return res.json({ success: false, message: '휴대폰 번호가 필요합니다.' }, 400);
     }

     const authUser = await users.get(userId);
     const authPhone = normalizeKoreanPhone(authUser.phone || '');

     if (!authUser.phoneVerification) {
          return res.json({ success: false, message: '휴대폰 인증을 먼저 완료해주세요.' }, 403);
     }
     if (authPhone && authPhone !== normalizedPhone) {
          return res.json({ success: false, message: '인증한 휴대폰 번호와 가입 번호가 다릅니다.' }, 400);
     }

     const emailUsers = await users.list({
          queries: [
               Query.equal('email', email),
               Query.limit(1),
          ],
          total: false,
     });
     const existingEmailUser = emailUsers.users?.find((user) => user.$id !== userId);
     if (existingEmailUser) {
          return res.json({ success: false, message: duplicateEmailMessage }, 409);
     }

     try {
          await databases.getDocument(DATABASE_ID, PROFILES, userId);
          return res.json({ success: false, message: '이미 가입이 완료된 계정입니다.' }, 409);
     } catch (err) {
          if (err.code !== 404) throw err;
     }

     const phoneHash = hashPhone(normalizedPhone);
     const existing = await databases.listDocuments(DATABASE_ID, PROFILES, [
          Query.equal('siteId', siteId),
          Query.equal('phoneHash', phoneHash),
          Query.limit(1),
     ]);

     if ((existing.total || 0) > 0) {
          return res.json({
               success: false,
               message: '이미 이 휴대폰 번호로 강남ON 계정이 생성되어 있습니다. 같은 지역에서는 휴대폰 번호당 1개 계정만 만들 수 있습니다.',
          }, 409);
     }

     try {
          await users.updateEmail(userId, email);
     } catch (err) {
          if (err.code === 409) {
               return res.json({ success: false, message: duplicateEmailMessage }, 409);
          }
          throw err;
     }
     await users.updatePassword(userId, password);
     await users.updateName(userId, username);

     await databases.createDocument(
          DATABASE_ID,
          PROFILES,
          userId,
          {
               username,
               fullName: username,
               avatarUrl,
               location,
               gender,
               beans: 1250,
               unlockedStyles: ['lorelei', 'avataaars'],
               phoneHash,
               siteId,
               phoneVerifiedAt: new Date().toISOString(),
          },
          [
               Permission.read(Role.any()),
               Permission.update(Role.user(userId)),
               Permission.delete(Role.user(userId)),
          ],
     );

     return res.json({ success: true, userId, username, siteId });
}

export default async ({ req, res, log, error }) => {
     let eventPayload = {};
     try {
          eventPayload = req.body ? JSON.parse(req.body) : {};
     } catch {
          eventPayload = {};
     }

     // chat_messages 생성 이벤트 → 오프라인 푸시 (Appwrite 플랜 함수 2개 제한으로 economy에서 처리)
     if (!req.headers['x-appwrite-user-id'] && eventPayload.roomId && eventPayload.senderId) {
          return handlePushNotification({ req, res, log, error, payload: eventPayload });
     }

     let userId = req.headers['x-appwrite-user-id'];

     if (!userId && req.headers['x-appwrite-user-jwt']) {
          try {
               const accountClient = new Client()
                    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
                    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
                    .setJWT(req.headers['x-appwrite-user-jwt']);
               const account = new Account(accountClient);
               const user = await account.get();
               userId = user.$id;
          } catch (jwtErr) {
               error(jwtErr.message || String(jwtErr));
          }
     }

     if (!userId) {
          return res.json({ success: false, message: '로그인이 필요합니다.' }, 401);
     }

     let payload = {};
     try {
          payload = req.body ? JSON.parse(req.body) : {};
     } catch (e) {
          return res.json({ success: false, message: '요청 형식이 올바르지 않습니다.' }, 400);
     }

     const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_FUNCTION_API_KEY || '';
     const client = new Client()
          .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
          .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
          .setKey(apiKey);

     const databases = new Databases(client);
     const users = new Users(client);

     try {
          if (payload.action === 'complete_phone_signup') {
               return completePhoneSignup({ payload, userId, users, databases, res });
          }

          const profile = await databases.getDocument(DATABASE_ID, PROFILES, userId);
          const currentBeans = profile.beans ?? 0;

          switch (payload.action) {
               case 'purchase_style': {
                    const { styleId } = payload;
                    if (!styleId || !(styleId in STYLE_PRICES)) {
                         return res.json({ success: false, message: '존재하지 않는 스타일입니다.' }, 400);
                    }

                    const price = STYLE_PRICES[styleId];
                    const unlockedStyles = profile.unlockedStyles || [];

                    if (unlockedStyles.includes(styleId)) {
                         return res.json({ success: false, message: '이미 보유한 스타일입니다.' }, 400);
                    }
                    if (currentBeans < price) {
                         return res.json({ success: false, message: '온이 부족해요! 열심히 활동해서 모아보세요 ⚡' }, 400);
                    }

                    const newBeans = currentBeans - price;
                    const newStyles = [...unlockedStyles, styleId];

                    await databases.updateDocument(DATABASE_ID, PROFILES, userId, profileUpdateData(profile, userId, {
                         beans: newBeans,
                         unlockedStyles: newStyles,
                    }));
                    await logBeanTx(databases, userId, 'purchase_style', -price, `아바타 스타일 구매 (${styleId})`);

                    return res.json({ success: true, beans: newBeans, unlockedStyles: newStyles });
               }

               case 'spend': {
                    const { type } = payload;
                    const cost = SPEND_COSTS[type];

                    if (cost === undefined) {
                         return res.json({ success: false, message: '알 수 없는 사용 유형입니다.' }, 400);
                    }
                    if (currentBeans < cost) {
                         return res.json({ success: false, message: '온이 부족합니다.' }, 400);
                    }

                    const newBeans = currentBeans - cost;
                    await databases.updateDocument(DATABASE_ID, PROFILES, userId, profileUpdateData(profile, userId, { beans: newBeans }));
                    await logBeanTx(databases, userId, `spend_${type}`, -cost, `사용: ${type}`);

                    return res.json({ success: true, beans: newBeans, spent: cost });
               }

               case 'boost_event': {
                    const { postId } = payload;
                    if (!postId) {
                         return res.json({ success: false, message: 'postId가 필요합니다.' }, 400);
                    }

                    const post = await databases.getDocument(DATABASE_ID, POSTS, postId);
                    if (post.authorId !== userId) {
                         return res.json({ success: false, message: '본인이 등록한 이벤트만 부스트할 수 있습니다.' }, 403);
                    }
                    if (currentBeans < BOOST_COST) {
                         return res.json({ success: false, message: `부스트에는 ${BOOST_COST}온이 필요합니다.` }, 400);
                    }

                    const featuredUntil = new Date(Date.now() + BOOST_HOURS * 60 * 60 * 1000).toISOString();
                    const newBeans = currentBeans - BOOST_COST;

                    await databases.updateDocument(DATABASE_ID, POSTS, postId, { featuredUntil });
                    await databases.updateDocument(DATABASE_ID, PROFILES, userId, profileUpdateData(profile, userId, { beans: newBeans }));
                    await logBeanTx(databases, userId, 'boost_event', -BOOST_COST, `이벤트 부스트 (${postId})`);

                    return res.json({ success: true, beans: newBeans, featuredUntil });
               }

               case 'change_nickname': {
                    const { newName } = payload;
                    const trimmed = (newName || '').trim();

                    if (!trimmed) {
                         return res.json({ success: false, message: '닉네임을 입력해주세요.' }, 400);
                    }
                    if (trimmed.length > 64) {
                         return res.json({ success: false, message: '닉네임이 너무 깁니다.' }, 400);
                    }
                    if (currentBeans < NICKNAME_COST) {
                         return res.json({ success: false, message: `닉네임 변경에는 ${NICKNAME_COST}온이 필요합니다.` }, 400);
                    }

                    const newBeans = currentBeans - NICKNAME_COST;

                    try {
                         await databases.updateDocument(DATABASE_ID, PROFILES, userId, {
                              username: trimmed,
                              fullName: trimmed,
                              beans: newBeans,
                         });
                    } catch (err) {
                         if (err.code === 409) {
                              return res.json({ success: false, message: '이미 사용 중인 닉네임입니다.' }, 409);
                         }
                         throw err;
                    }
                    await logBeanTx(databases, userId, 'change_nickname', -NICKNAME_COST, `닉네임 변경 → ${trimmed}`);

                    return res.json({ success: true, beans: newBeans, username: trimmed });
               }

               case 'update_avatar': {
                    const { avatarUrl } = payload;
                    if (!avatarUrl || typeof avatarUrl !== 'string') {
                         return res.json({ success: false, message: '잘못된 이미지 주소입니다.' }, 400);
                    }

                    await databases.updateDocument(DATABASE_ID, PROFILES, userId, profileUpdateData(profile, userId, { avatarUrl }));

                    return res.json({ success: true, avatarUrl });
               }

               case 'toggle_pick_like': {
                    const { postId } = payload;
                    if (!postId) {
                         return res.json({ success: false, message: 'postId가 필요합니다.' }, 400);
                    }

                    const post = await databases.getDocument(DATABASE_ID, POSTS, postId);
                    const likeDocId = safeLikeDocId(userId, postId);

                    let liked;
                    let nextLikes;
                    try {
                         await databases.getDocument(DATABASE_ID, POST_LIKES, likeDocId);
                         // 이미 좋아요를 눌렀던 기록이 있으면 취소(삭제)합니다.
                         await databases.deleteDocument(DATABASE_ID, POST_LIKES, likeDocId);
                         liked = false;
                         nextLikes = Math.max(0, (post.likesCount || 0) - 1);
                    } catch {
                         // 기록이 없으면(404) 새로 좋아요를 등록합니다.
                         await databases.createDocument(DATABASE_ID, POST_LIKES, likeDocId, { userId, postId }, [
                              Permission.read(Role.user(userId)),
                         ]);
                         liked = true;
                         nextLikes = (post.likesCount || 0) + 1;
                    }

                    await databases.updateDocument(DATABASE_ID, POSTS, postId, { likesCount: nextLikes });

                    return res.json({ success: true, liked, likesCount: nextLikes });
               }

               case 'record_pick_view': {
                    const { postId } = payload;
                    if (!postId) {
                         return res.json({ success: false, message: 'postId가 필요합니다.' }, 400);
                    }

                    const post = await databases.getDocument(DATABASE_ID, POSTS, postId);
                    const nextViews = (post.views || 0) + 1;
                    await databases.updateDocument(DATABASE_ID, POSTS, postId, { views: nextViews });

                    return res.json({ success: true, views: nextViews });
               }

               case 'admin_broadcast': {
                    if (!profile.isAdmin) {
                         return res.json({ success: false, message: '관리자만 사용할 수 있는 기능입니다.' }, 403);
                    }

                    const content = (payload.content || '').trim();
                    if (!content) {
                         return res.json({ success: false, message: '메시지 내용을 입력해주세요.' }, 400);
                    }
                    if (content.length > 1000) {
                         return res.json({ success: false, message: '메시지가 너무 깁니다 (최대 1000자).' }, 400);
                    }

                    // 전체 회원 목록을 페이지 단위로 가져와, 관리자 본인을 제외한 모두에게 발송합니다.
                    const recipients = [];
                    let offset = 0;
                    const pageSize = 100;
                    for (;;) {
                         const page = await databases.listDocuments(DATABASE_ID, PROFILES, [Query.limit(pageSize), Query.offset(offset)]);
                         recipients.push(...page.documents.map((doc) => doc.$id).filter((id) => id !== userId));
                         if (page.documents.length < pageSize) break;
                         offset += pageSize;
                    }

                    let sentCount = 0;
                    for (const recipientId of recipients) {
                         try {
                              const roomId = safeRoomId(userId, recipientId);

                              await databases.createDocument(DATABASE_ID, CHAT_ROOMS, roomId, { type: 'dm' }, [
                                   Permission.read(Role.user(userId)),
                                   Permission.read(Role.user(recipientId)),
                              ]).catch(() => null);

                              await Promise.all([userId, recipientId].map((memberId) =>
                                   databases.createDocument(
                                        DATABASE_ID,
                                        CHAT_PARTICIPANTS,
                                        `${roomId}_${memberId}`.replace(/[^a-zA-Z0-9._-]/g, '_'),
                                        { roomId, userId: memberId },
                                        [Permission.read(Role.user(memberId)), Permission.read(Role.user(userId)), Permission.read(Role.user(recipientId))]
                                   ).catch(() => null)
                              ));

                              await databases.createDocument(
                                   DATABASE_ID,
                                   CHAT_MESSAGES,
                                   ID.unique(),
                                   { roomId, senderId: userId, content, isNotice: true },
                                   [
                                        Permission.read(Role.user(userId)),
                                        Permission.read(Role.user(recipientId)),
                                        Permission.update(Role.user(userId)),
                                        Permission.delete(Role.user(userId)),
                                   ]
                              );

                              sentCount += 1;
                         } catch (sendErr) {
                              log(`공지 발송 실패 (recipient=${recipientId}): ${sendErr.message || String(sendErr)}`);
                         }
                    }

                    return res.json({ success: true, sentCount, totalRecipients: recipients.length });
               }

               case 'earn': {
                    const { type } = payload;
                    const reward = EARN_REWARDS[type];

                    if (reward === undefined) {
                         return res.json({ success: false, message: '알 수 없는 보상 유형입니다.' }, 400);
                    }

                    const newBeans = currentBeans + reward.beans;
                    const newActivityScore = (profile.activityScore || 0) + reward.score;
                    await databases.updateDocument(DATABASE_ID, PROFILES, userId, profileUpdateData(profile, userId, {
                         beans: newBeans,
                         activityScore: newActivityScore,
                    }));
                    await logBeanTx(databases, userId, `earn_${type}`, reward.beans, `적립: ${type}`);

                    return res.json({ success: true, beans: newBeans, activityScore: newActivityScore, earned: reward.beans, scoreEarned: reward.score });
               }

               default:
                    return res.json({ success: false, message: '알 수 없는 요청입니다.' }, 400);
          }
     } catch (err) {
          error(err.message || String(err));
          return res.json({ success: false, message: '서버 처리 중 오류가 발생했습니다.' }, 500);
     }
};
