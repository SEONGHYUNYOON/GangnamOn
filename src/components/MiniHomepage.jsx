import React, { useEffect, useMemo, useRef, useState } from 'react';
import { account, client, databases, DATABASE_ID, COLLECTIONS, ID, Query, Permission, Role, callEconomy, AVATAR_STYLE_PRICES } from '../lib/appwrite';
import { uploadProfileAvatar, uploadPostImage } from '../lib/imageUpload';
import { getActivityRank } from '../lib/activityRank';
import { resolveAvatarUrl } from '../lib/avatar';
import { normalizeGangnamRegion } from '../lib/region';
import { BookOpen, Camera, ChevronRight, Heart, Home, ImagePlus, Link2, Loader2, Mail, Music2, Pause, Play, Plus, Send, Settings, ShoppingBag, Sparkles, UserPlus, UserRound, X, Youtube } from 'lucide-react';

const getMinihomeStorageKey = (user) => `gangnam:on:minihome:${user?.id || user?.user_metadata?.username || 'guest'}`;
const getMinihomeProfileKey = (user) => `gangnam:on:minihome-profile:${user?.id || user?.user_metadata?.username || 'guest'}`;

const extractYoutubeId = (value = '') => {
     const input = value.trim();
     if (!input) return '';

     const patterns = [
          /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
          /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
          /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
          /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
     ];

     for (const pattern of patterns) {
          const match = input.match(pattern);
          if (match?.[1]) return match[1];
     }

     return /^[a-zA-Z0-9_-]{6,}$/.test(input) ? input : '';
};

// BGM은 DB 재조회를 기다리지 않고 첫 렌더에서 바로 재생을 시작해야 한다.
// 1) 파도타기 등으로 전달받은 프로필 문서에 이미 BGM 필드가 있으면 그대로 사용
// 2) 내 미니홈피라면 localStorage 캐시를 동기적으로 읽어 사용
const getInitialBgmSettings = (user) => {
     const fromProfile = {
          bgmUrl: user?.bgmUrl || '',
          bgmTitle: user?.bgmTitle || '',
          bgmVideoId: user?.bgmVideoId || extractYoutubeId(user?.bgmUrl || ''),
          bgmPlaylistUrls: user?.bgmPlaylistUrls || [],
          bgmPlaylistTitles: user?.bgmPlaylistTitles || [],
          bgmPlaylistIds: user?.bgmPlaylistIds || [],
     };
     if (fromProfile.bgmVideoId || fromProfile.bgmPlaylistIds.length) return fromProfile;

     try {
          const saved = JSON.parse(window.localStorage.getItem(getMinihomeStorageKey(user)) || '{}');
          return {
               bgmUrl: saved.bgmUrl || '',
               bgmTitle: saved.bgmTitle || '',
               bgmVideoId: saved.bgmVideoId || extractYoutubeId(saved.bgmUrl || ''),
               bgmPlaylistUrls: saved.bgmPlaylistUrls || [],
               bgmPlaylistTitles: saved.bgmPlaylistTitles || [],
               bgmPlaylistIds: saved.bgmPlaylistIds || [],
          };
     } catch {
          return fromProfile;
     }
};

const sameBgm = (a, b) =>
     a.bgmVideoId === b.bgmVideoId &&
     JSON.stringify(a.bgmPlaylistIds || []) === JSON.stringify(b.bgmPlaylistIds || []);

const MiniHomepage = ({ onClose, user, onOpenAvatarCustomizer, currentUser, onOpenProfile, onProfileUpdate }) => {
     const [guestbookEntries, setGuestbookEntries] = useState([]);
     const [newComment, setNewComment] = useState('');
     const [profileData, setProfileData] = useState(null);
     const [activePane, setActivePane] = useState('home');
     const [isEditing, setIsEditing] = useState(false);
     const [isBgmOpen, setIsBgmOpen] = useState(false);
     const [isBgmPlaying, setIsBgmPlaying] = useState(true);
     const [miniSettings, setMiniSettings] = useState(() => getInitialBgmSettings(user));
     const [bgmDraft, setBgmDraft] = useState({ bgmUrl: '', bgmTitle: '' });
     const [editForm, setEditForm] = useState({ location: '', mbti: '', job: '', bio: '' });
     const [todayCount, setTodayCount] = useState(0);
     const [totalCount, setTotalCount] = useState(0);
     const [avatarUploading, setAvatarUploading] = useState(false);
     const [surfProfiles, setSurfProfiles] = useState([]);
     const [friendIds, setFriendIds] = useState(new Set());
     const [shopLoading, setShopLoading] = useState('');
     const [homePosts, setHomePosts] = useState([]);
     const [homePostsLoading, setHomePostsLoading] = useState(false);
     const [photoUploading, setPhotoUploading] = useState(false);
     const [photoCaption, setPhotoCaption] = useState('');
     const [isPhotoComposerOpen, setIsPhotoComposerOpen] = useState(false);
     const photoInputRef = useRef(null);

     const isOwner = Boolean(currentUser?.id && user?.id && currentUser.id === user.id);
     const displayName = profileData?.fullName || profileData?.username || user?.user_metadata?.username || user?.user_metadata?.name || '강남 이웃';
     const displayLocation = normalizeGangnamRegion(profileData?.location || user?.user_metadata?.location || '강남');
     const avatarUrl = resolveAvatarUrl({
          avatarUrl: profileData?.avatarUrl || user?.user_metadata?.avatar_url,
          gender: profileData?.gender || user?.user_metadata?.gender,
          $id: profileData?.$id || user?.id,
     });
     const statusMessage = profileData?.statusMessage || profileData?.bio || '오늘도 강남에서 좋은 사람을 만나는 중.';
     const rank = getActivityRank((profileData?.activityScore || 0) + totalCount + guestbookEntries.length * 6);
     const bgmIds = miniSettings.bgmPlaylistIds?.length ? miniSettings.bgmPlaylistIds : (miniSettings.bgmVideoId ? [miniSettings.bgmVideoId] : []);
     const bgmTitles = miniSettings.bgmPlaylistTitles?.length ? miniSettings.bgmPlaylistTitles : (miniSettings.bgmTitle ? [miniSettings.bgmTitle] : []);

     const panes = useMemo(() => [
          { id: 'home', label: '홈', icon: Home },
          { id: 'guestbook', label: '방명록', icon: BookOpen },
          { id: 'surf', label: '파도타기', icon: ChevronRight },
          { id: 'shop', label: '매장', icon: ShoppingBag },
     ], []);

     useEffect(() => {
          const previousOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          return () => {
               document.body.style.overflow = previousOverflow;
          };
     }, []);

     useEffect(() => {
          const fetchProfile = async () => {
               if (!user?.id) return;
               const loadSavedProfile = async () => {
                    let localProfile = {};
                    try {
                         localProfile = JSON.parse(window.localStorage.getItem(getMinihomeProfileKey(user)) || '{}');
                    } catch {
                         localProfile = {};
                    }

                    if (!isOwner) return localProfile;

                    try {
                         const prefs = await account.getPrefs();
                         return { ...localProfile, ...(prefs?.minihomeProfile || {}) };
                    } catch {
                         return localProfile;
                    }
               };

               try {
                    const data = await databases.getDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.profiles,
                         documentId: user.id,
                    });
                    const savedProfile = await loadSavedProfile();
                    const mergedProfile = { ...data, ...savedProfile };
                    setProfileData(mergedProfile);
                    setEditForm({
                         location: mergedProfile.location || '',
                         mbti: mergedProfile.mbti || '',
                         job: mergedProfile.job || '',
                         bio: mergedProfile.statusMessage || '',
                    });
                    const profileBgm = {
                         bgmUrl: data.bgmUrl || '',
                         bgmTitle: data.bgmTitle || '',
                         bgmVideoId: data.bgmVideoId || extractYoutubeId(data.bgmUrl || ''),
                         bgmPlaylistUrls: data.bgmPlaylistUrls || [],
                         bgmPlaylistTitles: data.bgmPlaylistTitles || [],
                         bgmPlaylistIds: data.bgmPlaylistIds || [],
                    };
                    // 같은 BGM이면 상태를 갈아끼우지 않는다 — iframe src가 바뀌면 재생 중인 음악이 처음부터 다시 시작되기 때문
                    setMiniSettings(prev => sameBgm(prev, profileBgm) ? prev : profileBgm);
                    setBgmDraft({ bgmUrl: profileBgm.bgmUrl, bgmTitle: profileBgm.bgmTitle });
               } catch (error) {
                    console.error('프로필 로딩 실패:', error);
                    const savedProfile = await loadSavedProfile();
                    if (Object.keys(savedProfile).length) {
                         setProfileData(prev => ({ ...prev, ...savedProfile }));
                         setEditForm({
                              location: savedProfile.location || '',
                              mbti: savedProfile.mbti || '',
                              job: savedProfile.job || '',
                              bio: savedProfile.statusMessage || '',
                         });
                    }
               }
          };
          fetchProfile();
     }, [user, user?.id, isOwner]);

     useEffect(() => {
          const recordVisit = async () => {
               if (!user?.id) return;
               const today = new Date().toISOString().slice(0, 10);
               let guestId = window.localStorage.getItem('gangnam:on:guest-id');
               if (!guestId) {
                    guestId = crypto.randomUUID();
                    window.localStorage.setItem('gangnam:on:guest-id', guestId);
               }
               const visitorId = currentUser?.id || `guest-${guestId}`;
               const documentId = `${user.id}_${visitorId}_${today}`.replace(/[^a-zA-Z0-9._-]/g, '_');

               try {
                    await databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.pageViews,
                         documentId,
                         data: { hostId: user.id, visitorId, visitDate: today },
                         permissions: [Permission.read(Role.any())],
                    });
               } catch {
                    // 이미 오늘 방문한 사용자는 중복 집계하지 않습니다.
               }

               try {
                    const [todayRes, totalRes] = await Promise.all([
                         databases.listDocuments({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.pageViews,
                              queries: [Query.equal('hostId', user.id), Query.equal('visitDate', today), Query.limit(1)],
                         }),
                         databases.listDocuments({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.pageViews,
                              queries: [Query.equal('hostId', user.id), Query.limit(1)],
                         }),
                    ]);
                    setTodayCount(todayRes.total || 0);
                    setTotalCount(totalRes.total || 0);

                    if (isOwner) {
                         await databases.updateDocument({
                              databaseId: DATABASE_ID,
                              collectionId: COLLECTIONS.profiles,
                              documentId: user.id,
                              data: {
                                   visitorsToday: todayRes.total || 0,
                                   visitorsTotal: totalRes.total || 0,
                              },
                         });
                    }
               } catch (error) {
                    console.warn('방문자 수 집계 실패:', error);
                    setTodayCount(profileData?.visitorsToday || 0);
                    setTotalCount(profileData?.visitorsTotal || 0);
               }
          };

          recordVisit();
     }, [user?.id, currentUser?.id, isOwner, profileData?.visitorsToday, profileData?.visitorsTotal]);

     useEffect(() => {
          if (!user) return;
          try {
               const saved = window.localStorage.getItem(getMinihomeStorageKey(user));
               if (!saved) return;

               const parsed = JSON.parse(saved);
               const next = {
                    bgmUrl: parsed.bgmUrl || '',
                    bgmTitle: parsed.bgmTitle || '',
                    bgmVideoId: parsed.bgmVideoId || extractYoutubeId(parsed.bgmUrl || ''),
                    bgmPlaylistUrls: parsed.bgmPlaylistUrls || [],
                    bgmPlaylistTitles: parsed.bgmPlaylistTitles || [],
                    bgmPlaylistIds: parsed.bgmPlaylistIds || [],
               };
               setMiniSettings(prev => prev.bgmVideoId ? prev : next);
               setBgmDraft(prev => prev.bgmUrl ? prev : { bgmUrl: next.bgmUrl, bgmTitle: next.bgmTitle });
          } catch (error) {
               console.warn('미니홈피 설정 로딩 실패:', error);
          }
     }, [user?.id, user?.user_metadata?.username]);

     useEffect(() => {
          const fetchSurfProfiles = async () => {
               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.profiles,
                         queries: [Query.limit(24)],
                    });
                    setSurfProfiles(res.documents.filter(profile => profile.$id !== user?.id));
               } catch (error) {
                    console.warn('파도타기 프로필 로딩 실패:', error);
               }
          };

          const fetchFriends = async () => {
               if (!currentUser?.id) return;
               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.userRelations,
                         queries: [Query.equal('ownerId', currentUser.id), Query.equal('relationType', 'friend'), Query.limit(100)],
                    });
                    setFriendIds(new Set(res.documents.map(doc => doc.targetId)));
               } catch (error) {
                    console.warn('일촌 목록 로딩 실패:', error);
               }
          };

          if (activePane === 'surf') fetchSurfProfiles();
          fetchFriends();
     }, [activePane, user?.id, currentUser?.id]);

     useEffect(() => {
          const fetchGuestbook = async () => {
               if (!user?.id) return;
               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.guestbookEntries,
                         queries: [Query.equal('hostId', user.id), Query.orderDesc('$createdAt')],
                    });
                    setGuestbookEntries(res.documents);
               } catch (error) {
                    console.error('방명록 로딩 실패:', error);
               }
          };

          fetchGuestbook();
          if (!user?.id) return undefined;

          const unsubscribe = client.subscribe(
               [`databases.${DATABASE_ID}.collections.${COLLECTIONS.guestbookEntries}.documents`],
               (response) => {
                    const isCreate = response.events.some(event => event.endsWith('.create'));
                    if (isCreate && response.payload?.hostId === user.id) fetchGuestbook();
               },
          );

          return () => unsubscribe();
     }, [user?.id]);

     useEffect(() => {
          const fetchHomePosts = async () => {
               if (!user?.id) return;
               setHomePostsLoading(true);
               try {
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [
                              Query.equal('authorId', user.id),
                              Query.equal('type', ['minihome_post']),
                              Query.orderDesc('$createdAt'),
                              Query.limit(30),
                         ],
                    });
                    setHomePosts(res.documents);
               } catch (error) {
                    console.warn('미니홈피 피드 로딩 실패:', error);
               } finally {
                    setHomePostsLoading(false);
               }
          };

          if (activePane === 'home') fetchHomePosts();
     }, [user?.id, activePane]);

     const handleSaveProfile = async () => {
          if (!isOwner) return;
          const cleanProfile = {
               location: normalizeGangnamRegion(editForm.location || displayLocation || '강남').slice(0, 64),
               mbti: (editForm.mbti || '').slice(0, 8),
               job: (editForm.job || '').slice(0, 80),
               statusMessage: (editForm.bio || '').slice(0, 500),
          };
          const createProfile = {
               username: (profileData?.username || displayName || '강남 이웃').slice(0, 64),
               avatarUrl: avatarUrl || profileData?.avatarUrl,
               gender: profileData?.gender || user?.user_metadata?.gender || 'female',
               ...cleanProfile,
          };

          try {
               try {
                    window.localStorage.setItem(getMinihomeProfileKey(user), JSON.stringify(cleanProfile));
               } catch {
                    // localStorage may be blocked.
               }

               const savePayload = {
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.profiles,
                    documentId: user.id,
                    data: cleanProfile,
               };

               try {
                    await databases.updateDocument(savePayload);
               } catch (profileDbError) {
                    console.warn('프로필 DB 동기화 실패, 계정 prefs로 저장합니다:', profileDbError);
                    if (profileDbError?.code === 404) {
                         try {
                              await databases.createDocument({
                                   databaseId: DATABASE_ID,
                                   collectionId: COLLECTIONS.profiles,
                                   documentId: user.id,
                                   data: { username: createProfile.username, avatarUrl: createProfile.avatarUrl, gender: createProfile.gender },
                                   permissions: [
                                        Permission.read(Role.any()),
                                        Permission.update(Role.user(user.id)),
                                        Permission.delete(Role.user(user.id)),
                                   ],
                              });
                         } catch (createError) {
                              console.warn('프로필 문서 생성도 건너뜁니다:', createError);
                         }
                    }
               }

               try {
                    const currentPrefs = await account.getPrefs();
                    await account.updatePrefs({
                         ...(currentPrefs || {}),
                         minihomeProfile: cleanProfile,
                    });
               } catch (prefsError) {
                    console.warn('프로필 계정 prefs 저장 실패, 로컬 백업만 유지합니다:', prefsError);
               }

               setProfileData(prev => ({
                    ...prev,
                    ...cleanProfile,
               }));
               setIsEditing(false);
               if (onProfileUpdate) await onProfileUpdate();
          } catch (error) {
               console.error('Profile update failed:', error);
               const detail = error?.message ? `\n(${error.message})` : '';
               alert(`프로필 저장 실패${detail}`);
          }
     };

     const handleAvatarFile = async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file || !isOwner) return;

          if (!file.type.startsWith('image/')) {
               alert('이미지 파일만 등록할 수 있습니다.');
               return;
          }

          setAvatarUploading(true);
          try {
               const avatarUrl = await uploadProfileAvatar(user.id, file);
               setProfileData(prev => ({ ...prev, avatarUrl }));
               if (onProfileUpdate) await onProfileUpdate();
          } catch (error) {
               console.error('프로필 사진 업로드 실패:', error);
               const detail = error?.message ? `\n(${error.message})` : '';
               alert(`프로필 사진 업로드에 실패했습니다.${detail}`);
          } finally {
               setAvatarUploading(false);
          }
     };

     const handlePhotoFile = async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file || !isOwner) return;

          if (!file.type.startsWith('image/')) {
               alert('이미지 파일만 등록할 수 있습니다.');
               return;
          }
          if (file.size > 8 * 1024 * 1024) {
               alert('파일 크기는 8MB 이하여야 합니다.');
               return;
          }

          setPhotoUploading(true);
          try {
               const imageUrl = await uploadPostImage(file);
               const caption = photoCaption.trim() || '사진첩에 새 사진을 올렸어요.';
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.posts,
                    documentId: ID.unique(),
                    data: {
                         authorId: user.id,
                         authorUsername: displayName,
                         authorAvatarUrl: avatarUrl,
                         type: 'minihome_post',
                         title: caption.slice(0, 60),
                         content: caption,
                         locationName: profileData?.location || displayLocation,
                         imageUrls: [imageUrl],
                         likesCount: 0,
                         commentsCount: 0,
                         views: 0,
                    },
                    permissions: [
                         Permission.read(Role.any()),
                         Permission.update(Role.user(user.id)),
                         Permission.delete(Role.user(user.id)),
                    ],
               });
               setPhotoCaption('');
               setIsPhotoComposerOpen(false);
               const res = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.posts,
                    queries: [
                         Query.equal('authorId', user.id),
                         Query.equal('type', ['minihome_post']),
                         Query.orderDesc('$createdAt'),
                         Query.limit(30),
                    ],
               });
               setHomePosts(res.documents);
          } catch (error) {
               console.error('사진첩 업로드 실패:', error);
               alert('사진 업로드에 실패했습니다.');
          } finally {
               setPhotoUploading(false);
          }
     };

     const handleSaveBgm = async () => {
          if (!isOwner) return;
          const videoId = extractYoutubeId(bgmDraft.bgmUrl);
          if (bgmDraft.bgmUrl.trim() && !videoId) {
               alert('유튜브 링크 또는 영상 ID를 확인해주세요.');
               return;
          }

          if ((miniSettings.bgmPlaylistIds || []).includes(videoId)) {
               alert('이미 BGM 목록에 추가된 영상입니다.');
               return;
          }

          let youtubeTitle = '';
          try {
               const response = await fetch(`/api/youtube-title?url=${encodeURIComponent(bgmDraft.bgmUrl.trim())}`);
               if (response.ok) {
                    const payload = await response.json();
                    youtubeTitle = payload.title || '';
               }
          } catch (error) {
               console.warn('YouTube 제목 조회 실패:', error);
          }

          const nextItem = {
               bgmUrl: bgmDraft.bgmUrl.trim(),
               bgmTitle: youtubeTitle || `YouTube BGM ${videoId}`,
               bgmVideoId: videoId,
          };
          const next = {
               ...nextItem,
               bgmPlaylistUrls: videoId ? [...(miniSettings.bgmPlaylistUrls || []), nextItem.bgmUrl] : [],
               bgmPlaylistTitles: videoId ? [...(miniSettings.bgmPlaylistTitles || []), nextItem.bgmTitle] : [],
               bgmPlaylistIds: videoId ? [...(miniSettings.bgmPlaylistIds || []), videoId] : [],
          };

          setMiniSettings(next);
          window.localStorage.setItem(getMinihomeStorageKey(user), JSON.stringify(next));
          try {
               await databases.updateDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.profiles,
                    documentId: user.id,
                    data: next,
               });
               setProfileData(prev => ({ ...prev, ...next }));
          } catch (error) {
               console.error('BGM 저장 실패:', error);
               alert('BGM 저장에 실패했습니다.');
               return;
          }
          setBgmDraft({ bgmUrl: '', bgmTitle: '' });
          setIsBgmOpen(false);
     };

     const removeBgmItem = async (index) => {
          if (!isOwner) return;
          const nextUrls = (miniSettings.bgmPlaylistUrls || []).filter((_, itemIndex) => itemIndex !== index);
          const nextTitles = (miniSettings.bgmPlaylistTitles || []).filter((_, itemIndex) => itemIndex !== index);
          const nextIds = (miniSettings.bgmPlaylistIds || []).filter((_, itemIndex) => itemIndex !== index);
          const next = {
               bgmUrl: nextUrls[0] || '',
               bgmTitle: nextTitles[0] || '',
               bgmVideoId: nextIds[0] || '',
               bgmPlaylistUrls: nextUrls,
               bgmPlaylistTitles: nextTitles,
               bgmPlaylistIds: nextIds,
          };
          setMiniSettings(prev => ({ ...prev, ...next }));
          await databases.updateDocument({
               databaseId: DATABASE_ID,
               collectionId: COLLECTIONS.profiles,
               documentId: user.id,
               data: next,
          }).catch(error => console.warn('BGM 삭제 실패:', error));
     };

     const handlePurchaseStyle = async (styleId) => {
          if (!isOwner || !styleId) return;
          setShopLoading(styleId);
          try {
               const result = await callEconomy({ action: 'purchase_style', styleId });
               if (!result.success) {
                    alert(result.message || '구입에 실패했습니다.');
                    return;
               }
               setProfileData(prev => ({ ...prev, beans: result.beans, unlockedStyles: result.unlockedStyles }));
          } finally {
               setShopLoading('');
          }
     };

     const handleFriend = async (profile) => {
          if (!currentUser?.id) {
               alert('로그인이 필요합니다.');
               return;
          }
          if (!profile?.$id || profile.$id === currentUser.id || friendIds.has(profile.$id)) return;
          if (!window.confirm('일촌을 신청하시겠습니까?')) return;
          const documentId = `${currentUser.id}_${profile.$id}_friend`.replace(/[^a-zA-Z0-9._-]/g, '_');
          try {
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.userRelations,
                    documentId,
                    data: {
                         ownerId: currentUser.id,
                         targetId: profile.$id,
                         relationType: 'friend',
                         targetUsername: displayNameOfProfile(profile),
                         targetAvatarUrl: profile.avatarUrl || '',
                    },
                    permissions: [
                         Permission.read(Role.user(currentUser.id)),
                         Permission.update(Role.user(currentUser.id)),
                         Permission.delete(Role.user(currentUser.id)),
                    ],
               });
               setFriendIds(prev => new Set([...prev, profile.$id]));
               alert('일촌 신청이 완료되었습니다.');
          } catch (error) {
               console.warn('일촌 맺기 실패:', error);
               alert('일촌 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
          }
     };

     const displayNameOfProfile = (profile) => profile?.fullName || profile?.username || '강남 이웃';

     const handlePostComment = async () => {
          if (!newComment.trim()) return;
          if (!currentUser) {
               alert('로그인이 필요합니다.');
               return;
          }
          if (!user?.id) {
               alert('이 미니홈피에는 방명록을 남길 수 없습니다.');
               return;
          }

          try {
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.guestbookEntries,
                    documentId: ID.unique(),
                    data: {
                         hostId: user.id,
                         authorId: currentUser.id,
                         authorUsername: currentUser.user_metadata?.username || currentUser.name || '방문자',
                         authorAvatarUrl: currentUser.user_metadata?.avatar_url || '',
                         content: newComment,
                         isSecret: false,
                    },
                    permissions: [
                         Permission.read(Role.any()),
                         Permission.update(Role.user(currentUser.id)),
                         Permission.delete(Role.user(currentUser.id)),
                    ],
               });
               setNewComment('');
          } catch (error) {
               console.error('Guestbook error:', error);
               alert('방명록 작성 실패');
          }
     };

     if (!user) {
          return (
               <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
                    <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl" onClick={event => event.stopPropagation()}>
                         <UserRound className="mx-auto mb-4 h-12 w-12 text-brand-accent" />
                         <h3 className="text-xl font-black text-brand-ink">로그인이 필요해요</h3>
                         <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">나만의 미니홈피를 만들려면 먼저 로그인해주세요.</p>
                         <button onClick={onClose} className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-sm font-black text-white">확인</button>
                    </div>
               </div>
          );
     }

     return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm" onClick={onClose}>
               <div
                    className="flex h-[min(90vh,860px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                    onWheel={(event) => event.stopPropagation()}
               >
                    <div className="relative flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-2 backdrop-blur">
                         <div className="min-w-0">
                              <p className="truncate text-sm font-black text-brand-ink">{displayName}님의 미니홈피</p>
                              <p className="text-[11px] font-bold text-slate-400">TODAY {todayCount} | TOTAL {totalCount.toLocaleString()}</p>
                         </div>
                         <div className="ml-auto flex min-w-0 max-w-[280px] items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-1 sm:max-w-[360px] sm:gap-2 sm:px-2">
                              <Music2 className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
                              <div className="relative w-24 min-w-0 overflow-hidden sm:w-40">
                                   {bgmIds.length > 0 ? (
                                        <div className="flex w-max animate-marquee whitespace-nowrap [animation-duration:12s]">
                                             <span className="pr-10 text-[11px] font-black text-slate-600">♪ {bgmTitles[0] || 'BGM'}</span>
                                             <span className="pr-10 text-[11px] font-black text-slate-600">♪ {bgmTitles[0] || 'BGM'}</span>
                                        </div>
                                   ) : (
                                        <span className="text-[11px] font-black text-slate-400">BGM 없음</span>
                                   )}
                              </div>
                              {bgmIds.length > 0 && (
                                   <button type="button" onClick={() => setIsBgmPlaying((playing) => !playing)} className="shrink-0 rounded-full p-1.5 text-slate-600 hover:bg-white" title={isBgmPlaying ? 'BGM 일시정지' : 'BGM 재생'}>
                                        {isBgmPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                   </button>
                              )}
                              {isOwner && (
                                   <button type="button" onClick={() => setIsBgmOpen((open) => !open)} className="shrink-0 rounded-full bg-brand p-1.5 text-white" title="BGM 추가">
                                        <Plus className="h-3.5 w-3.5" />
                                   </button>
                              )}
                              {isBgmPlaying && bgmIds.length > 0 && (
                                   <iframe
                                        title="Minihome background music"
                                        className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
                                        src={`https://www.youtube.com/embed/${bgmIds[0]}?autoplay=1&mute=0&loop=1&playlist=${bgmIds.join(',')}&rel=0&modestbranding=1&playsinline=1`}
                                        allow="autoplay; encrypted-media"
                                   />
                              )}
                         </div>
                         <div className="flex shrink-0 items-center gap-2">
                              {!isOwner && currentUser?.id && (
                                   <button type="button" onClick={() => handleFriend(profileData)} className="rounded-full border border-amber-200 bg-amber-50 p-2 text-amber-800 hover:bg-amber-100" title={friendIds.has(user.id) ? '일촌' : '일촌 신청'} disabled={friendIds.has(user.id)}>
                                        <UserPlus className="h-4 w-4" />
                                   </button>
                              )}
                              <button type="button" className="rounded-full border border-sky-200 bg-white p-2 text-sky-700 hover:bg-sky-50" title="쪽지 보내기">
                                   <Mail className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50" title="닫기">
                                   <X className="h-4 w-4" />
                              </button>
                         </div>
                         {isBgmOpen && isOwner && (
                              <div className="absolute right-16 top-[60px] z-30 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                                   <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-xs font-black text-slate-600"><Youtube className="h-4 w-4 text-red-500" /> BGM 추가</div>
                                        <button type="button" onClick={() => setIsBgmOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
                                   </div>
                                   <div className="mt-3 flex gap-2">
                                        <div className="relative min-w-0 flex-1">
                                             <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                                             <input value={bgmDraft.bgmUrl} onChange={(event) => setBgmDraft((prev) => ({ ...prev, bgmUrl: event.target.value }))} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-100" placeholder="YouTube 링크" />
                                        </div>
                                        <button type="button" onClick={handleSaveBgm} className="rounded-lg bg-brand px-3 py-2 text-xs font-black text-white">추가</button>
                                   </div>
                                   {bgmIds.length > 0 && (
                                        <div className="mt-2 max-h-32 space-y-1 overflow-y-auto overscroll-contain">
                                             {bgmIds.map((id, index) => (
                                                  <div key={`${id}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
                                                       <span className="truncate text-[11px] font-bold text-slate-600">{index + 1}. {bgmTitles[index] || `BGM ${index + 1}`}</span>
                                                       <button type="button" onClick={() => removeBgmItem(index)} className="text-[10px] font-black text-slate-400 hover:text-red-500">삭제</button>
                                                  </div>
                                             ))}
                                        </div>
                                   )}
                              </div>
                         )}
                    </div>

                    <div className="grid min-h-0 flex-1 gap-4 bg-slate-50/70 p-4 md:grid-cols-[310px_1fr]">
                         <aside className="min-h-0 overflow-y-auto overscroll-contain rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                              <label className="group relative block w-full overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                                   {isOwner && <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />}
                                   <img src={avatarUrl} alt="프로필" className="aspect-square w-full object-contain transition-transform group-hover:scale-[1.01]" />
                                   {isOwner && (
                                        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                             {avatarUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                                             사진 변경
                                        </span>
                                   )}
                              </label>

                              <div className="mt-4">
                                   <h2 className="text-2xl font-black tracking-tight text-brand-ink">{displayName}</h2>
                                   <dl className="mt-2 grid gap-1 text-sm font-bold text-slate-600">
                                        <div className="flex gap-1.5"><dt className="text-slate-400">사는 곳:</dt><dd>{displayLocation}</dd></div>
                                        <div className="flex gap-1.5"><dt className="text-slate-400">MBTI:</dt><dd>{profileData?.mbti || '모름'}</dd></div>
                                        <div className="flex gap-1.5"><dt className="text-slate-400">직업:</dt><dd>{profileData?.job || '미설정'}</dd></div>
                                   </dl>
                                   <p className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-800">{rank.badge} {rank.title}</p>
                                   <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">{statusMessage}</p>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                   <div className="rounded-2xl bg-sky-50 p-3">
                                        <p className="text-lg font-black text-sky-900">{todayCount}</p>
                                        <p className="text-[10px] font-bold text-sky-500">TODAY</p>
                                   </div>
                                   <div className="rounded-2xl bg-amber-50 p-3">
                                        <p className="text-lg font-black text-amber-800">{guestbookEntries.length}</p>
                                        <p className="text-[10px] font-bold text-amber-600">방명록</p>
                                   </div>
                                   <div className="rounded-2xl bg-rose-50 p-3">
                                        <p className="text-lg font-black text-rose-800">{homePosts.length}</p>
                                        <p className="text-[10px] font-bold text-rose-500">사진첩</p>
                                   </div>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-2">
                                   <button type="button" onClick={() => setActivePane('guestbook')} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-brand-ink hover:bg-brand-light">
                                        방명록 남기기
                                   </button>
                                   <button type="button" onClick={() => setActivePane('surf')} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-brand-ink hover:bg-brand-light">
                                        파도타기
                                   </button>
                              </div>
                         </aside>

                         <main className="min-h-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                                   <div className="flex flex-wrap gap-1">
                                        {panes.map((pane) => {
                                             const Icon = pane.icon;
                                             return (
                                                  <button
                                                       key={pane.id}
                                                       type="button"
                                                       onClick={() => setActivePane(pane.id)}
                                                       className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-colors ${activePane === pane.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                  >
                                                       <Icon className="h-3.5 w-3.5" />
                                                       {pane.label}
                                                  </button>
                                             );
                                        })}
                                   </div>

                                   {isOwner && (
                                        <button
                                             type="button"
                                             onClick={async () => {
                                                  if (isEditing) {
                                                       await handleSaveProfile();
                                                       return;
                                                  }
                                                  setIsEditing(true);
                                             }}
                                             className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"
                                        >
                                             <Settings className="h-3.5 w-3.5" />
                                             {isEditing ? '저장' : '편집'}
                                        </button>
                                   )}
                              </div>

                              <div className="h-full overflow-y-auto overscroll-contain p-4 pb-8">
                                   {activePane === 'home' && (
                                        <div className="space-y-4">
                                             <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />

                                             <section className="animate-in fade-in slide-in-from-bottom-1 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                                                  <div className="mb-4 flex items-center gap-2">
                                                       <Sparkles className="h-4 w-4 text-amber-500" />
                                                       <h3 className="text-base font-black text-brand-ink">나를 어필하는 공간</h3>
                                                  </div>
                                                  {isEditing ? (
                                                       <div className="grid gap-2">
                                                            <input value={editForm.location} onChange={event => setEditForm(prev => ({ ...prev, location: event.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="지역 (예: 역삼동)" />
                                                            <input value={editForm.mbti} onChange={event => setEditForm(prev => ({ ...prev, mbti: event.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="MBTI (예: ENFP)" />
                                                            <input value={editForm.job} onChange={event => setEditForm(prev => ({ ...prev, job: event.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="직업 / 하는 일 (예: 디자이너)" />
                                                            <textarea value={editForm.bio} onChange={event => setEditForm(prev => ({ ...prev, bio: event.target.value }))} className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="나를 소개하는 한마디" />
                                                       </div>
                                                  ) : (
                                                       <>
                                                            <div className="flex flex-wrap gap-2">
                                                                 <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-sky-700">사는 곳: {displayLocation}</span>
                                                                 <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-violet-700">MBTI: {profileData?.mbti || '모름'}</span>
                                                                 <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-amber-700">직업: {profileData?.job || '미설정'}</span>
                                                                 <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700">{rank.badge} {rank.title}</span>
                                                            </div>
                                                            <p className="mt-4 text-base font-semibold leading-8 text-slate-700">{statusMessage}</p>
                                                       </>
                                                  )}
                                             </section>

                                             <section className="animate-in fade-in slide-in-from-bottom-1 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                                  <div className="mb-3 flex items-center justify-between gap-3">
                                                       <div>
                                                            <p className="text-xs font-black text-rose-600">Photo Album</p>
                                                            <h3 className="text-lg font-black text-brand-ink">사진첩</h3>
                                                       </div>
                                                       {isOwner && (
                                                            <button
                                                                 type="button"
                                                                 disabled={photoUploading}
                                                                 onClick={() => {
                                                                      setIsPhotoComposerOpen(!isPhotoComposerOpen);
                                                                      if (!isPhotoComposerOpen) setPhotoCaption('');
                                                                 }}
                                                                 className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-2 text-xs font-black text-white hover:bg-rose-600 disabled:opacity-50"
                                                            >
                                                                 {photoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                                                                 사진 올리기
                                                            </button>
                                                       )}
                                                  </div>

                                                  {isOwner && isPhotoComposerOpen && (
                                                       <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                                                            <textarea
                                                                 value={photoCaption}
                                                                 onChange={(event) => setPhotoCaption(event.target.value)}
                                                                 placeholder="사진에 대한 이야기를 남겨보세요 (선택)"
                                                                 className="mb-2 min-h-16 w-full resize-none rounded-lg border border-rose-100 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-100"
                                                                 maxLength={120}
                                                            />
                                                            <button
                                                                 type="button"
                                                                 disabled={photoUploading}
                                                                 onClick={() => photoInputRef.current?.click()}
                                                                 className="w-full rounded-lg bg-white py-2.5 text-xs font-black text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
                                                            >
                                                                 {photoUploading ? '업로드 중...' : '갤러리에서 사진 선택'}
                                                            </button>
                                                       </div>
                                                  )}

                                                  {homePostsLoading ? (
                                                       <div className="flex justify-center py-10">
                                                            <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
                                                       </div>
                                                  ) : homePosts.length === 0 ? (
                                                       <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                                                            <ImagePlus className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                                            <p className="text-sm font-bold text-slate-500">
                                                                 {isOwner ? '첫 사진을 올려 나를 어필해보세요!' : '아직 사진첩에 등록된 사진이 없어요.'}
                                                            </p>
                                                       </div>
                                                  ) : (
                                                       // 인스타그램처럼 한 장씩 세로로 쌓아 보여줍니다. homePosts는 이미
                                                       // $createdAt 내림차순(orderDesc)으로 불러오므로 최신 사진이 항상 맨 위입니다.
                                                       <div className="flex flex-col gap-4">
                                                            {homePosts.map((post) => (
                                                                 <article key={post.$id} className="overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-sm">
                                                                      <div className="flex items-center gap-2 px-3 py-2.5">
                                                                           <img src={avatarUrl} alt={displayName} className="h-7 w-7 rounded-full object-cover" />
                                                                           <span className="text-xs font-black text-slate-700">{displayName}</span>
                                                                           <span className="ml-auto text-[10px] font-bold text-slate-400">
                                                                                {new Date(post.$createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                           </span>
                                                                      </div>
                                                                      {post.imageUrls?.[0] && (
                                                                           <div className="flex max-h-[560px] min-h-[280px] items-center justify-center bg-slate-50">
                                                                                <img src={post.imageUrls[0]} alt={post.title || '사진첩 사진'} className="max-h-[560px] w-full object-contain" />
                                                                           </div>
                                                                      )}
                                                                      <div className="p-3">
                                                                           <p className="text-sm font-bold text-slate-700">{post.content || post.title || '사진첩에 새 사진을 올렸어요.'}</p>
                                                                      </div>
                                                                 </article>
                                                            ))}
                                                       </div>
                                                  )}
                                             </section>

                                             <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                                                  <div className="mb-3 flex items-center justify-between gap-3">
                                                       <div>
                                                            <p className="text-xs font-black text-brand-accent">Guestbook</p>
                                                            <h3 className="text-lg font-black text-brand-ink">최근 방명록</h3>
                                                       </div>
                                                       <button type="button" onClick={() => setActivePane('guestbook')} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-brand-light">
                                                            전체 보기
                                                       </button>
                                                  </div>
                                                  {guestbookEntries.length === 0 ? (
                                                       <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                                                            <p className="text-sm font-bold text-slate-500">아직 남겨진 방문 흔적이 없어요.</p>
                                                            <p className="mt-1 text-xs font-semibold text-slate-400">첫 방명록을 남기면 이곳에 표시됩니다.</p>
                                                       </div>
                                                  ) : (
                                                       <div className="grid gap-2">
                                                            {guestbookEntries.slice(0, 3).map((entry) => (
                                                                 <article key={entry.$id} className="rounded-2xl bg-slate-50 px-4 py-3">
                                                                      <div className="mb-1 flex items-center justify-between gap-3">
                                                                           <p className="truncate text-sm font-black text-brand-ink">{entry.authorUsername || '익명'}</p>
                                                                           <p className="shrink-0 text-[10px] font-bold text-slate-400">{new Date(entry.$createdAt).toLocaleDateString()}</p>
                                                                      </div>
                                                                      <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{entry.content}</p>
                                                                 </article>
                                                            ))}
                                                       </div>
                                                  )}
                                             </section>
                                        </div>
                                   )}

                                   {activePane === 'guestbook' && (
                                        <div className="space-y-4">
                                             <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                                  <div className="flex gap-2">
                                                       <input
                                                            type="text"
                                                            value={newComment}
                                                            onChange={(event) => setNewComment(event.target.value)}
                                                            onKeyDown={(event) => event.key === 'Enter' && handlePostComment()}
                                                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-100"
                                                            placeholder="방명록을 남겨주세요"
                                                       />
                                                       <button type="button" onClick={handlePostComment} className="rounded-xl bg-sky-900 px-4 text-sm font-black text-white">
                                                            <Send className="h-4 w-4" />
                                                       </button>
                                                  </div>
                                             </div>

                                             <div className="space-y-3">
                                                  {guestbookEntries.length === 0 && (
                                                       <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
                                                            아직 방명록이 없습니다.
                                                       </div>
                                                  )}
                                                  {guestbookEntries.map((entry) => (
                                                       <article key={entry.$id} className="rounded-2xl border border-slate-200 p-4">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                 <p className="text-sm font-black text-brand-ink">{entry.authorUsername || '익명'}</p>
                                                                 <p className="text-[11px] font-bold text-slate-400">{new Date(entry.$createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <p className="text-sm font-semibold leading-6 text-slate-600">{entry.content}</p>
                                                            <button type="button" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                                                 <Heart className="h-3 w-3" />
                                                                 공감
                                                            </button>
                                                       </article>
                                                  ))}
                                             </div>
                                        </div>
                                   )}

                                   {activePane === 'surf' && (
                                        <div className="space-y-3">
                                             <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                                                  <h3 className="text-lg font-black text-sky-950">파도타기</h3>
                                                  <p className="mt-1 text-sm font-semibold text-sky-700">일촌과 관심사가 이어진 강남 미니홈피를 둘러보세요.</p>
                                             </div>
                                             {surfProfiles.map((profile) => (
                                                  <div key={profile.$id} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50">
                                                       <div>
                                                            <p className="text-sm font-black text-brand-ink">{displayNameOfProfile(profile)}</p>
                                                            <p className="mt-1 text-xs font-bold text-slate-500">{profile.location || '강남'} · {profile.statusMessage || '미니홈피 운영 중'}</p>
                                                       </div>
                                                       <div className="flex shrink-0 gap-2">
                                                            <button type="button" onClick={() => handleFriend(profile)} className={`rounded-full px-3 py-1 text-[11px] font-black ${friendIds.has(profile.$id) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                                                                 {friendIds.has(profile.$id) ? '일촌' : '일촌 맺기'}
                                                            </button>
                                                            <button type="button" onClick={() => onOpenProfile?.(profile)} className="rounded-full bg-sky-900 px-3 py-1 text-[11px] font-black text-white">방문</button>
                                                       </div>
                                                  </div>
                                             ))}
                                             {surfProfiles.length === 0 && (
                                                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
                                                       둘러볼 미니홈피를 찾는 중입니다.
                                                  </div>
                                             )}
                                        </div>
                                   )}

                                   {activePane === 'shop' && (
                                        <div className="space-y-4">
                                             <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                                  <h3 className="text-lg font-black text-brand-ink">미니홈피 전용 매장</h3>
                                                  <p className="mt-1 text-sm font-semibold text-amber-800">ON으로 아바타 스타일을 구입하고 프로필 꾸미기에 사용할 수 있어요.</p>
                                             </div>
                                             <div className="grid gap-3 sm:grid-cols-2">
                                                  {Object.entries(AVATAR_STYLE_PRICES).map(([styleId, price]) => {
                                                       const owned = profileData?.unlockedStyles?.includes(styleId) || price === 0;
                                                       return (
                                                            <div key={styleId} className="rounded-2xl border border-slate-200 bg-white p-4">
                                                                 <img src={`https://api.dicebear.com/7.x/${styleId}/svg?seed=${displayName}`} alt={styleId} className="mx-auto h-20 w-20 rounded-2xl bg-slate-50 object-cover" />
                                                                 <p className="mt-3 text-sm font-black text-brand-ink">{styleId}</p>
                                                                 <p className="mt-1 text-xs font-bold text-slate-400">{price.toLocaleString()} ON</p>
                                                                 <button
                                                                      type="button"
                                                                      disabled={!isOwner || owned || shopLoading === styleId}
                                                                      onClick={() => handlePurchaseStyle(styleId)}
                                                                      className={`mt-3 w-full rounded-xl px-3 py-2 text-xs font-black ${owned ? 'bg-slate-100 text-slate-400' : 'bg-brand text-white hover:bg-brand-dark'} disabled:cursor-not-allowed`}
                                                                 >
                                                                      {shopLoading === styleId ? '구입 중...' : owned ? '보유중' : '구입하기'}
                                                                 </button>
                                                            </div>
                                                       );
                                                  })}
                                             </div>
                                        </div>
                                   )}
                              </div>
                         </main>
                    </div>
               </div>
          </div>
     );
};

export default MiniHomepage;
