import { Client, Account, Databases } from 'node-appwrite';

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

export default async ({ req, res, log, error }) => {
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

     try {
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

                    return res.json({ success: true, beans: newBeans, username: trimmed });
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
