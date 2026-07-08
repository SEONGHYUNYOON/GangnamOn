import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, User, MapPin, Smile } from 'lucide-react';
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Permission, Role, OAuthProvider } from '../lib/appwrite';
import TermsAndPrivacyModal from './TermsAndPrivacyModal';

const AuthWidget = ({ onLoginSuccess }) => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [username, setUsername] = useState('');
     const [region, setRegion] = useState('역삼1동');
     const [gender, setGender] = useState('female'); // 'male' or 'female'
     const [agreedToTerms, setAgreedToTerms] = useState(false);
     const [termsModalTab, setTermsModalTab] = useState(null); // null | 'terms' | 'privacy'

     const [isSignUpMode, setIsSignUpMode] = useState(false);
     const [isForgotMode, setIsForgotMode] = useState(false);
     const [authLoading, setAuthLoading] = useState(false);
     const [authError, setAuthError] = useState(null);

     // 강남권 동 단위 (지역 선택)
     const gangnamRegions = [
          '역삼1동',
          '역삼2동',
          '삼성동',
          '논현1동',
          '논현2동',
          '신사동',
          '청담동',
          '압구정동',
          '서초동',
          '방배동',
          '사평동',
          '잠원동',
          '개포동',
          '세곡동'
     ];

     const getOAuthRedirectUrl = (status) => {
          const redirectUrl = new URL(window.location.href);
          redirectUrl.search = '';
          redirectUrl.searchParams.set('oauth', status);
          return redirectUrl.toString();
     };

     const handleOAuthLogin = async (provider, scopes = []) => {
          setAuthLoading(true);
          setAuthError(null);

          const providerLabel = provider === OAuthProvider.Google ? '구글' : '카카오톡';

          try {
               const oauthUrl = account.createOAuth2Session(
                    provider,
                    getOAuthRedirectUrl('success'),
                    getOAuthRedirectUrl('failure'),
                    scopes
               );

               if (typeof oauthUrl === 'string') {
                    window.location.href = oauthUrl;
               }
          } catch (error) {
               console.error(`${providerLabel} OAuth login error:`, error);
               setAuthError(`${providerLabel} 로그인 연결에 실패했습니다. 관리자 설정을 확인해주세요.`);
               setAuthLoading(false);
          }
     };

     const handleLogin = async (e) => {
          e.preventDefault();
          setAuthLoading(true);
          setAuthError(null);
          try {
               await account.createEmailPasswordSession(email, password);
               if (onLoginSuccess) onLoginSuccess();
          } catch (error) {
               console.error("Login error:", error);
               if (error.code === 401) {
                    setAuthError("이메일 또는 비밀번호를 확인해주세요.");
               } else if (error.message === 'Failed to fetch') {
                    setAuthError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
               } else {
                    setAuthError(error.message);
               }
          } finally {
               setAuthLoading(false);
          }
     };

     const handleSignUp = async (e) => {
          e.preventDefault();
          if (!username) {
               setAuthError("닉네임을 입력해주세요!");
               return;
          }
          if (!agreedToTerms) {
               setAuthError("이용약관 및 개인정보처리방침에 동의해주세요.");
               return;
          }
          setAuthLoading(true);
          setAuthError(null);

          // Assign default avatar based on gender
          // Using DiceBear Avataaars seeds that look clearly male/female
          const defaultAvatar = gender === 'male'
               ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
               : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka';

          try {
               const newAccount = await account.create(ID.unique(), email, password, username);

               // 이메일 인증 절차 없이 바로 로그인 처리 (보안 강화는 추후 별도 작업 예정)
               await account.createEmailPasswordSession(email, password);

               // 프로필 문서 생성
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.profiles,
                    documentId: newAccount.$id,
                    data: {
                         username,
                         fullName: username,
                         avatarUrl: defaultAvatar,
                         location: region,
                         gender,
                         beans: 1250,
                         unlockedStyles: ['lorelei', 'avataaars'],
                    },
                    permissions: [
                         Permission.read(Role.any()),
                         Permission.update(Role.user(newAccount.$id)),
                         Permission.delete(Role.user(newAccount.$id)),
                    ],
               });

               // 인증 메일 발송 (실패해도 가입 자체는 정상 진행 — 나중에 재전송 버튼으로 다시 보낼 수 있음)
               try {
                    await account.createVerification(window.location.origin + window.location.pathname);
               } catch (verifyError) {
                    console.error('인증 메일 발송 실패:', verifyError);
               }

               if (onLoginSuccess) onLoginSuccess({ isNewUser: true, username });
          } catch (error) {
               console.error("Signup error:", error);
               if (error.code === 409) {
                    setAuthError("이미 가입된 이메일입니다.");
               } else if (error.message === 'Failed to fetch') {
                    setAuthError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
               } else {
                    setAuthError(error.message || '가입에 실패했습니다.');
               }
          } finally {
               setAuthLoading(false);
          }
     };

     // 비밀번호 재설정 메일 발송. flow=recovery 파라미터를 붙여서
     // App.jsx가 이메일 인증 콜백과 구분할 수 있도록 합니다.
     const handleForgotPassword = async (e) => {
          e.preventDefault();
          if (!email) {
               setAuthError("이메일을 입력해주세요!");
               return;
          }
          setAuthLoading(true);
          setAuthError(null);
          try {
               const redirectUrl = `${window.location.origin}${window.location.pathname}?flow=recovery`;
               await account.createRecovery(email, redirectUrl);
          } catch (error) {
               console.error('비밀번호 재설정 메일 발송 실패:', error);
               // 계정 존재 여부가 노출되지 않도록 실패해도 동일한 안내 메시지를 보여줍니다.
          } finally {
               setAuthError('입력하신 이메일로 재설정 링크를 보내드렸어요. 메일함을 확인해주세요 📧');
               setAuthLoading(false);
          }
     };

     return (
          <div className="bg-white rounded-card p-6 shadow-soft border border-surface-border mb-5 group relative overflow-hidden w-full max-w-sm mx-auto">
               <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                         {isForgotMode ? 'Find Password' : isSignUpMode ? 'Join Gangnam On' : 'Welcome Back'}
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></div>
               </div>

               <div className="flex flex-col relative z-10">
                    <div className="text-center mb-6">
                         <h2 className="text-xl font-black text-brand-ink mb-1">
                              {isForgotMode ? '비밀번호 찾기' : isSignUpMode ? '강남온 시작하기' : '강남온 로그인'}
                         </h2>
                         <p className="text-xs text-gray-500">
                              {isForgotMode ? '가입하신 이메일로 재설정 링크를 보내드릴게요' : isSignUpMode ? '이웃과 소통하는 강남 라이프!' : '오늘도 강남에서 즐거운 하루 보내세요!'}
                         </p>
                    </div>

                    <form onSubmit={isForgotMode ? handleForgotPassword : (isSignUpMode ? handleSignUp : handleLogin)} className="space-y-3">
                         {!isForgotMode && (
                              <>
                                   <div className="grid grid-cols-1 gap-2">
                                        <button
                                             type="button"
                                             onClick={() => handleOAuthLogin(OAuthProvider.Google)}
                                             disabled={authLoading}
                                             className="w-full h-11 rounded-xl border border-surface-border bg-white text-sm font-black text-brand-ink hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                             <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[15px] font-black text-[#4285F4]">G</span>
                                             구글로 계속하기
                                        </button>
                                        <button
                                             type="button"
                                             onClick={() => handleOAuthLogin(OAuthProvider.Oidc, ['openid'])}
                                             disabled={authLoading}
                                             className="w-full h-11 rounded-xl bg-[#FEE500] text-sm font-black text-[#191600] hover:bg-[#f7dc00] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                             <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#191600] text-[10px] font-black text-[#FEE500]">톡</span>
                                             카카오톡으로 계속하기
                                        </button>
                                   </div>

                                   <div className="flex items-center gap-3 py-1">
                                        <div className="h-px flex-1 bg-gray-100" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">or</span>
                                        <div className="h-px flex-1 bg-gray-100" />
                                   </div>
                              </>
                         )}

                         {/* Signup Extra Fields */}
                         {isSignUpMode && !isForgotMode && (
                              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                                   {/* Username */}
                                   <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                             type="text"
                                             placeholder="닉네임 (활동명)"
                                             value={username}
                                             onChange={(e) => setUsername(e.target.value)}
                                             className="w-full pl-10 pr-4 py-3 bg-surface-muted border border-surface-border rounded-xl text-sm focus:outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/15 transition-all"
                                             required
                                        />
                                   </div>

                                   {/* Gender Selection */}
                                   <div className="flex gap-2">
                                        <button
                                             type="button"
                                             onClick={() => setGender('female')}
                                             className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${gender === 'female'
                                                  ? 'bg-brand text-white border-brand ring-2 ring-brand-gold/20'
                                                  : 'bg-surface-muted text-gray-500 border-surface-border hover:bg-white'
                                                  }`}
                                        >
                                             <Smile className="w-4 h-4" />
                                             여성
                                        </button>
                                        <button
                                             type="button"
                                             onClick={() => setGender('male')}
                                             className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${gender === 'male'
                                                  ? 'bg-brand text-white border-brand ring-2 ring-brand-gold/20'
                                                  : 'bg-surface-muted text-gray-500 border-surface-border hover:bg-white'
                                                  }`}
                                        >
                                             <Smile className="w-4 h-4" />
                                             남성
                                        </button>
                                   </div>

                                   {/* Region Selection */}
                                   <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select
                                             value={region}
                                             onChange={(e) => setRegion(e.target.value)}
                                             className="w-full pl-10 pr-4 py-3 bg-surface-muted border border-surface-border rounded-xl text-sm focus:outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/15 transition-all appearance-none cursor-pointer text-gray-700 font-medium"
                                        >
                                             {gangnamRegions.map((r) => (
                                                  <option key={r} value={r}>{r}</option>
                                             ))}
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                                   </div>
                              </div>
                         )}

                         <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                   type="email"
                                   placeholder="이메일 주소"
                                   value={email}
                                   onChange={(e) => setEmail(e.target.value)}
                                   className="w-full pl-10 pr-4 py-3 bg-surface-muted border border-surface-border rounded-xl text-sm focus:outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/15 transition-all"
                                   required
                              />
                         </div>
                         {!isForgotMode && (
                              <div className="relative">
                                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                   <input
                                        type="password"
                                        placeholder="비밀번호"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-surface-muted border border-surface-border rounded-xl text-sm focus:outline-none focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/15 transition-all"
                                        required
                                   />
                              </div>
                         )}

                         {/* 로그인 화면에서만: 비밀번호 찾기 링크 */}
                         {!isSignUpMode && !isForgotMode && (
                              <div className="text-right -mt-1">
                                   <button
                                        type="button"
                                        onClick={() => { setIsForgotMode(true); setAuthError(null); }}
                                        className="text-[11px] text-gray-400 hover:text-brand-accent hover:underline"
                                   >
                                        비밀번호를 잊으셨나요?
                                   </button>
                              </div>
                         )}

                         {/* 회원가입 화면에서만: 약관 동의 체크박스 */}
                         {isSignUpMode && !isForgotMode && (
                              <label className="flex items-start gap-2 px-1 cursor-pointer select-none">
                                   <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-gold/40"
                                   />
                                   <span className="text-[11px] text-gray-500 leading-snug">
                                        [필수]{' '}
                                        <button type="button" onClick={() => setTermsModalTab('terms')} className="underline font-bold text-gray-700 hover:text-brand-accent">
                                             이용약관
                                        </button>{' '}
                                        및{' '}
                                        <button type="button" onClick={() => setTermsModalTab('privacy')} className="underline font-bold text-gray-700 hover:text-brand-accent">
                                             개인정보처리방침
                                        </button>
                                        에 동의합니다.
                                   </span>
                              </label>
                         )}

                         {authError && (
                              <p className={`text-xs text-center font-bold px-2 ${authError.includes('전송했습니다') ? 'text-green-600' : 'text-red-500'}`}>
                                   {authError}
                              </p>
                         )}

                         <button
                              type="submit"
                              disabled={authLoading}
                              className="w-full bg-brand text-white font-bold py-3 rounded-xl shadow-soft hover:bg-brand-dark hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group/btn"
                         >
                              {authLoading ? '처리중...' : (isForgotMode ? '재설정 링크 보내기' : isSignUpMode ? '가입하고 시작하기' : '로그인')}
                              {!authLoading && <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                         </button>
                    </form>

                    {isForgotMode ? (
                         <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                              <button
                                   onClick={() => { setIsForgotMode(false); setAuthError(null); }}
                                   className="text-xs font-bold text-brand-accent hover:underline"
                              >
                                   ← 로그인으로 돌아가기
                              </button>
                         </div>
                    ) : (
                    <div className="mt-6 pt-4 border-t border-gray-50 text-center">
                         <p className="text-xs text-gray-400">
                              {isSignUpMode ? '이미 계정이 있으신가요? ' : '아직 계정이 없으신가요? '}
                              <button
                                   onClick={() => {
                                        setIsSignUpMode(!isSignUpMode);
                                        setAuthError(null);
                                        setEmail('');
                                        setPassword('');
                                        setUsername('');
                                        setAgreedToTerms(false);
                                   }}
                                   className="font-bold text-brand-accent hover:underline"
                              >
                                   {isSignUpMode ? '로그인' : '회원가입'}
                                   {!isSignUpMode && <span className="text-[10px] bg-brand-light text-brand-accent px-1 py-0.5 rounded ml-1 border border-brand-gold/20">3초컷</span>}
                              </button>
                         </p>
                    </div>
                    )}
               </div>

               {termsModalTab && (
                    <TermsAndPrivacyModal initialTab={termsModalTab} onClose={() => setTermsModalTab(null)} />
               )}
          </div>
     );
};

export default AuthWidget;
