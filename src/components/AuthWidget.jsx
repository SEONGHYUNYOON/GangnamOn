import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, User, MapPin, Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AuthWidget = ({ onLoginSuccess }) => {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [username, setUsername] = useState('');
     const [region, setRegion] = useState('운정1동');
     const [gender, setGender] = useState('female'); // 'male' or 'female'

     const [isSignUpMode, setIsSignUpMode] = useState(false);
     const [authLoading, setAuthLoading] = useState(false);
     const [authError, setAuthError] = useState(null);

     // Paju Administrative Divisions (Simplified)
     const pajuRegions = [
          '운정 (1~6동)',
          '금촌 (1~3동)',
          '교하동',
          '문산읍',
          '조리읍',
          '법원읍',
          '파주읍',
          '광탄면',
          '탄현면',
          '월롱면',
          '적성면',
          '파평면',
          '장단면'
     ];

     const handleLogin = async (e) => {
          e.preventDefault();
          setAuthLoading(true);
          setAuthError(null);
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
               console.error("Login error:", error);
               if (error.message.includes("Email not confirmed")) {
                    setAuthError("이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요!");
               } else if (error.message.includes("Invalid login")) {
                    setAuthError("이메일 또는 비밀번호를 확인해주세요.");
               } else {
                    setAuthError(error.message);
               }
          } else {
               if (onLoginSuccess) onLoginSuccess();
          }
          setAuthLoading(false);
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

          const { error } = await supabase.auth.signUp({
               email,
               password,
               options: {
                    data: {
                         username: username,
                         full_name: username,
                         region: region,
                         gender: gender,
                         avatar_url: defaultAvatar
                    }
               }
          });
          if (error) {
               console.error("Signup error:", error);
               setAuthError(error.message);
          } else if (data.user) {
               // SUCCESS: Create Profile Entry immediately
               const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                         id: data.user.id,
                         username: username,
                         full_name: username,
                         region: region, // Ensure column match or map correctly (schema has 'location')
                         avatar_url: defaultAvatar,
                         beans: 1250,
                         location: region
                    });

               if (profileError) {
                    console.error("Profile creation failed:", profileError);
                    setAuthError("계정은 생성되었으나 프로필 설정에 실패했습니다.");
               } else {
                    setAuthError("가입 확인 메일을 전송했습니다! 메일함을 확인해주세요 📧");
               }
          }
          setAuthLoading(false);
     };

     return (
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-6 group relative overflow-hidden w-full max-w-sm mx-auto">
               <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                         {isSignUpMode ? 'Join PajuOn' : 'Welcome Back'}
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
               </div>

               <div className="flex flex-col relative z-10">
                    <div className="text-center mb-6">
                         <h2 className="text-xl font-bold text-gray-900 mb-1">
                              {isSignUpMode ? '파주On 시작하기' : '파주On 로그인'}
                         </h2>
                         <p className="text-xs text-gray-500">
                              {isSignUpMode ? '이웃과 소통하는 파주 라이프!' : '오늘도 파주에서 즐거운 하루 보내세요!'}
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
                                             className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
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
                                             className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all appearance-none cursor-pointer text-gray-700 font-medium"
                                        >
                                             {pajuRegions.map((r) => (
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
                                   className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
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
                                   className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
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
                              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl shadow-lg shadow-gray-200 hover:bg-purple-600 hover:shadow-purple-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group/btn"
                         >
                              {authLoading ? '처리중...' : (isSignUpMode ? '가입하고 시작하기' : '로그인')}
                              {!authLoading && <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                         </button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-gray-50 text-center">
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
                                   className="font-bold text-purple-600 hover:underline"
                              >
                                   {isSignUpMode ? '로그인' : '회원가입'}
                                   {!isSignUpMode && <span className="text-[10px] bg-purple-100 text-purple-600 px-1 py-0.5 rounded ml-1">3초컷</span>}
                              </button>
                         </p>
                    </div>
               </div>
          </div>
     );
};

export default AuthWidget;
