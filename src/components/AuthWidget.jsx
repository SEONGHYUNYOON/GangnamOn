import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, User, MapPin, Smile } from 'lucide-react';
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Permission, Role } from '../lib/appwrite';

const AuthWidget = ({ onLoginSuccess }) => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [username, setUsername] = useState('');
     const [region, setRegion] = useState('역삼1동');
     const [gender, setGender] = useState('female'); // 'male' or 'female'

     const [isSignUpMode, setIsSignUpMode] = useState(false);
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
                    ],
               });

               // 인증 메일 발송 (실패해도 가입 자체는 정상 진행 — 나중에 재전송 버튼으로 다시 보낼 수 있음)
               try {
                    await account.createVerification(window.location.origin + window.location.pathname);
               } catch (verifyError) {
                    console.error('인증 메일 발송 실패:', verifyError);
               }

               if (onLoginSuccess) onLoginSuccess();
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

     return (
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-6 group relative overflow-hidden w-full max-w-sm mx-auto">
               <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                         {isSignUpMode ? 'Join Gangnam On' : 'Welcome Back'}
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
               </div>

               <div className="flex flex-col relative z-10">
                    <div className="text-center mb-6">
                         <h2 className="text-xl font-bold text-gray-900 mb-1">
                              {isSignUpMode ? '강남온 시작하기' : '강남온 로그인'}
                         </h2>
                         <p className="text-xs text-gray-500">
                              {isSignUpMode ? '이웃과 소통하는 강남 라이프!' : '오늘도 강남에서 즐거운 하루 보내세요!'}
                         </p>
                    </div>

                    <form onSubmit={isSignUpMode ? handleSignUp : handleLogin} className="space-y-3">

                         {/* Signup Extra Fields */}
                         {isSignUpMode && (
                              <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                                   {/* Username */}
                                   <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                             type="text"
                                             placeholder="닉네임 (활동명)"
                                             value={username}
                                             onChange={(e) => setUsername(e.target.value)}
                                             className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                             required
                                        />
                                   </div>

                                   {/* Gender Selection */}
                                   <div className="flex gap-2">
                                        <button
                                             type="button"
                                             onClick={() => setGender('female')}
                                             className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${gender === 'female'
                                                  ? 'bg-pink-50 text-pink-600 border-pink-200 ring-2 ring-pink-100'
                                                  : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                                                  }`}
                                        >
                                             <Smile className="w-4 h-4" />
                                             여성
                                        </button>
                                        <button
                                             type="button"
                                             onClick={() => setGender('male')}
                                             className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${gender === 'male'
                                                  ? 'bg-blue-50 text-blue-600 border-blue-200 ring-2 ring-blue-100'
                                                  : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
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
                                             className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all appearance-none cursor-pointer text-gray-700 font-medium"
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
                                   className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                   required
                              />
                         </div>
                         <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                   type="password"
                                   placeholder="비밀번호"
                                   value={password}
                                   onChange={(e) => setPassword(e.target.value)}
                                   className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                   required
                              />
                         </div>

                         {authError && (
                              <p className={`text-xs text-center font-bold px-2 ${authError.includes('전송했습니다') ? 'text-green-600' : 'text-red-500'}`}>
                                   {authError}
                              </p>
                         )}

                         <button
                              type="submit"
                              disabled={authLoading}
                              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group/btn"
                         >
                              {authLoading ? '처리중...' : (isSignUpMode ? '가입하고 시작하기' : '로그인')}
                              {!authLoading && <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                         </button>
                    </form>

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
                                   }}
                                   className="font-bold text-amber-700 hover:underline"
                              >
                                   {isSignUpMode ? '로그인' : '회원가입'}
                                   {!isSignUpMode && <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded ml-1">3초컷</span>}
                              </button>
                         </p>
                    </div>
               </div>
          </div>
     );
};

export default AuthWidget;
