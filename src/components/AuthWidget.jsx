import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, User, MapPin, Smile, Phone, ShieldCheck } from 'lucide-react';
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Permission, Role, OAuthProvider, completePhoneSignup } from '../lib/appwrite';
import { getDefaultAvatarUrl } from '../lib/avatar';
import TermsAndPrivacyModal from './TermsAndPrivacyModal';

const AuthWidget = ({ onLoginSuccess }) => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [username, setUsername] = useState('');
     const [region, setRegion] = useState('');
     const [gender, setGender] = useState(''); // 'male' or 'female'
     const [phone, setPhone] = useState('');
     const [phoneCode, setPhoneCode] = useState('');
     const [phoneUserId, setPhoneUserId] = useState('');
     const [phoneVerified, setPhoneVerified] = useState(false);
     const [phoneSending, setPhoneSending] = useState(false);
     const [phoneVerifying, setPhoneVerifying] = useState(false);
     const [phoneFeedback, setPhoneFeedback] = useState(null);
     const [agreedToTerms, setAgreedToTerms] = useState(false);
     const [termsModalTab, setTermsModalTab] = useState(null); // null | 'terms' | 'privacy'

     const [isSignUpMode, setIsSignUpMode] = useState(false);
     const [isForgotMode, setIsForgotMode] = useState(false);
     const [authLoading, setAuthLoading] = useState(false);
     const [authError, setAuthError] = useState(null);
     const duplicateEmailMessage = '이미 가입된 이메일 주소 입니다.';

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

     const normalizeKoreanPhone = (value) => {
          const trimmed = value.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('+')) return trimmed.replace(/[^\d+]/g, '');

          const digits = trimmed.replace(/\D/g, '');
          if (digits.startsWith('82')) return `+${digits}`;
          if (digits.startsWith('0')) return `+82${digits.slice(1)}`;
          return `+82${digits}`;
     };

     const handleSendPhoneCode = async () => {
          const normalizedPhone = normalizeKoreanPhone(phone);
          if (!/^\+8210\d{8}$/.test(normalizedPhone)) {
               setAuthError('휴대폰 번호를 정확히 입력해주세요.');
               setPhoneFeedback({ type: 'error', message: '010으로 시작하는 휴대폰 번호 11자리를 입력해주세요.' });
               return;
          }

          setPhoneSending(true);
          setAuthError(null);
          setPhoneFeedback(null);

          try {
               const token = await account.createPhoneToken(ID.unique(), normalizedPhone);
               setPhoneUserId(token.userId);
               setPhone(normalizedPhone);
               setPhoneVerified(false);
               setAuthError('인증번호를 보냈어요. 문자로 받은 번호를 입력해주세요.');
               setPhoneFeedback({ type: 'success', message: '인증번호를 발송했습니다. 문자가 오지 않으면 번호를 확인한 뒤 다시 요청해주세요.' });
          } catch (error) {
               console.error('휴대폰 인증번호 발송 실패:', error);
               setPhoneUserId('');
               setPhoneVerified(false);
               const rawMessage = String(error?.message || '');
               const isQuotaExceeded = /limit|billing cycle|budget cap|higher plan/i.test(rawMessage);
               const message = isQuotaExceeded
                    ? '현재 문자 인증 발송 한도가 소진되어 인증번호를 보낼 수 없습니다. 운영자가 SMS 요금제 또는 예산 한도를 조정해야 합니다.'
                    : '인증번호 발송에 실패했습니다. 번호를 확인한 뒤 잠시 후 다시 시도해주세요.';
               setAuthError(message);
               setPhoneFeedback({ type: 'error', message });
          } finally {
               setPhoneSending(false);
          }
     };

     const handleVerifyPhoneCode = async () => {
          if (!phoneUserId || !phoneCode.trim()) {
               const message = phoneUserId
                    ? '문자로 받은 인증번호를 입력해주세요.'
                    : '먼저 인증 버튼을 눌러 인증번호를 발송해주세요.';
               setAuthError(message);
               setPhoneFeedback({ type: 'error', message });
               return;
          }

          setPhoneVerifying(true);
          setAuthError(null);
          setPhoneFeedback(null);

          try {
               await account.updatePhoneSession(phoneUserId, phoneCode.trim());
               setPhoneVerified(true);
               setAuthError('휴대폰 인증이 완료됐어요.');
               setPhoneFeedback({ type: 'success', message: '휴대폰 인증이 완료되었습니다.' });
          } catch (error) {
               console.error('휴대폰 인증 실패:', error);
               const message = '인증번호가 올바르지 않거나 만료됐습니다. 다시 확인해주세요.';
               setAuthError(message);
               setPhoneFeedback({ type: 'error', message });
          } finally {
               setPhoneVerifying(false);
          }
     };

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
          if (!gender) {
               setAuthError("성별을 선택해주세요.");
               return;
          }
          if (!region) {
               setAuthError("지역을 선택해주세요.");
               return;
          }
          if (!phoneVerified) {
               setAuthError("휴대폰 번호 인증을 완료해야 가입할 수 있습니다.");
               return;
          }
          if (!agreedToTerms) {
               setAuthError("이용약관 및 개인정보처리방침에 동의해주세요.");
               return;
          }
          setAuthLoading(true);
          setAuthError(null);

          // Assign default avatar based on gender — 같은 성별이라도 사용자마다(아이디 기준)
          // 조금씩 다른 캐릭터가 배정되도록 여러 시드 중 하나를 고정 선택합니다.
          const defaultAvatar = getDefaultAvatarUrl(gender, username);

          try {
               const signupResult = await completePhoneSignup({
                    email,
                    password,
                    username,
                    avatarUrl: defaultAvatar,
                    location: region,
                    gender,
                    phone,
               });

               if (!signupResult.success) {
                    throw new Error(signupResult.message || '가입에 실패했습니다.');
               }

               // 가입 보너스도 재화 발급 내역에 남겨서 관리자 대시보드의 "발급된 재화" 통계에 잡히도록 합니다.
               try {
                    await databases.createDocument({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.beanTransactions,
                         documentId: ID.unique(),
                         data: { userId: signupResult.userId, type: 'signup_bonus', amount: 1250, note: '가입 축하 보너스' },
                         permissions: [Permission.read(Role.any())],
                    });
               } catch (txError) {
                    console.warn('가입 보너스 기록 실패 (통계용, 가입 자체는 정상):', txError);
               }

               // 인증 메일 발송 (실패해도 가입 자체는 정상 진행 — 나중에 재전송 버튼으로 다시 보낼 수 있음)
               try {
                    await account.createVerification(window.location.origin + window.location.pathname);
               } catch (verifyError) {
                    console.error('인증 메일 발송 실패:', verifyError);
               }

               if (onLoginSuccess) onLoginSuccess({ isNewUser: true, username });
          } catch (error) {
               console.error("Signup error:", error);
               const message = error.message || '';
               if (error.code === 409 || message.includes('이미 가입된 이메일')) {
                    setAuthError(duplicateEmailMessage);
                    window.alert(duplicateEmailMessage);
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
                                   <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold leading-5 text-amber-700">
                                        소셜 로그인은 Appwrite 콘솔에서 Google/OIDC provider를 활성화하고 클라이언트 ID를 등록해야 정상 연결됩니다.
                                   </p>
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

                                   <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
                                        <div className="mb-2 flex items-start gap-2">
                                             <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                                             <p className="text-[11px] font-bold leading-5 text-amber-800">
                                                  강남ON은 휴대폰 인증 후 가입할 수 있습니다. 한 휴대폰 번호로 다른 지역 ON 계정은 추가 생성할 수 있지만, 같은 지역 ON 계정은 1개의 계정만 생성 할 수 있습니다.
                                             </p>
                                        </div>
                                        <div className="flex min-w-0 gap-2">
                                             <div className="relative min-w-0 flex-1">
                                                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                  <input
                                                       type="tel"
                                                       placeholder="휴대폰 번호"
                                                       value={phone}
                                                       onChange={(e) => {
                                                            setPhone(e.target.value);
                                                            setPhoneCode('');
                                                            setPhoneUserId('');
                                                            setPhoneVerified(false);
                                                            setPhoneFeedback(null);
                                                       }}
                                                       className="w-full rounded-xl border border-surface-border bg-white py-3 pl-10 pr-3 text-sm transition-all focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/15"
                                                       required
                                                  />
                                             </div>
                                             <button
                                                  type="button"
                                                  onClick={handleSendPhoneCode}
                                                  disabled={phoneSending || phoneVerified}
                                                  className="min-w-[64px] rounded-xl bg-brand px-3 text-xs font-black text-white transition-all hover:bg-brand-dark disabled:opacity-50"
                                             >
                                                  {phoneSending ? '발송중' : phoneVerified ? '완료' : '인증'}
                                             </button>
                                        </div>
                                        {!phoneVerified && (
                                             <div className="mt-2 flex gap-2">
                                                  <input
                                                       type="text"
                                                       inputMode="numeric"
                                                       autoComplete="one-time-code"
                                                       maxLength={6}
                                                       placeholder="인증번호 6자리"
                                                       value={phoneCode}
                                                       onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                       className="min-w-0 flex-1 rounded-xl border border-surface-border bg-white px-3 py-3 text-sm transition-all focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/15"
                                                  />
                                                  <button
                                                       type="button"
                                                       onClick={handleVerifyPhoneCode}
                                                       disabled={!phoneUserId || phoneCode.length !== 6 || phoneVerifying}
                                                       className="w-[76px] shrink-0 rounded-xl border border-brand-gold/30 bg-white px-2 text-xs font-black text-brand-accent transition-all hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
                                                  >
                                                       {phoneVerifying ? '확인중' : '인증확인'}
                                                  </button>
                                             </div>
                                        )}
                                        {phoneVerified && (
                                             <p className="mt-2 flex items-center gap-1 text-[11px] font-black text-green-600">
                                                  <ShieldCheck className="h-3.5 w-3.5" />
                                                  휴대폰 인증 완료
                                             </p>
                                        )}
                                        {phoneFeedback && (
                                             <p className={`mt-2 text-[11px] font-bold leading-4 ${phoneFeedback.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                                                  {phoneFeedback.message}
                                             </p>
                                        )}
                                        <p className="mt-2 text-[10px] leading-4 text-gray-500">
                                             통신사 선택이 필요 없는 SMS 번호 인증입니다. 문자 수신이 가능한 본인 휴대폰을 사용해주세요.
                                        </p>
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
                                             required
                                        >
                                             <option value="" disabled>지역 선택</option>
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
                         <button
                              type="button"
                              onClick={(e) => {
                                   e.stopPropagation();
                                   setIsSignUpMode(!isSignUpMode);
                                   setIsForgotMode(false);
                                   setAuthError(null);
                                   setEmail('');
                                   setPassword('');
                                   setUsername('');
                                   setPhone('');
                                   setPhoneCode('');
                                   setPhoneUserId('');
                                   setPhoneVerified(false);
                                   setAgreedToTerms(false);
                              }}
                              onPointerDown={(e) => {
                                   // 모바일 터치에서 클릭 타이밍 이슈가 있을 수 있어 포인터 다운에서도 먼저 상태를 준비합니다.
                                   e.stopPropagation();
                              }}
                              className="w-full inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 text-[13px] font-bold text-gray-600 bg-brand-light/70 transition-colors hover:bg-brand-light hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                         >
                              <span>{isSignUpMode ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}</span>
                              <span className="text-brand-accent">{isSignUpMode ? '로그인' : '회원가입'}</span>
                              {!isSignUpMode && <span className="text-[10px] bg-brand-light text-brand-accent px-1 py-0.5 rounded border border-brand-gold/20">3초컷</span>}
                         </button>
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
