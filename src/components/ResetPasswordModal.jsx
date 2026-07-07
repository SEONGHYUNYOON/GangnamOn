import React, { useState } from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import { account } from '../lib/appwrite';

// 비밀번호 재설정 메일의 링크를 클릭해서 돌아왔을 때(?flow=recovery&userId=...&secret=...)
// 새 비밀번호를 입력받는 모달입니다. App.jsx가 URL 파라미터를 감지해서 열어줍니다.
const ResetPasswordModal = ({ userId, secret, onDone }) => {
     const [password, setPassword] = useState('');
     const [passwordConfirm, setPasswordConfirm] = useState('');
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState(null);
     const [done, setDone] = useState(false);

     const handleSubmit = async (e) => {
          e.preventDefault();
          setError(null);

          if (password.length < 8) {
               setError('비밀번호는 8자 이상이어야 해요.');
               return;
          }
          if (password !== passwordConfirm) {
               setError('비밀번호가 일치하지 않아요.');
               return;
          }

          setLoading(true);
          try {
               await account.updateRecovery(userId, secret, password);
               setDone(true);
          } catch (err) {
               console.error('비밀번호 재설정 실패:', err);
               setError('링크가 만료됐거나 이미 사용됐어요. 다시 요청해주세요.');
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
                    {done ? (
                         <div className="text-center py-4">
                              <div className="text-4xl mb-4">✅</div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">비밀번호가 변경됐어요!</h3>
                              <p className="text-sm text-gray-500 mb-6">새 비밀번호로 다시 로그인해주세요.</p>
                              <button
                                   onClick={onDone}
                                   className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                              >
                                   확인
                              </button>
                         </div>
                    ) : (
                         <>
                              <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">새 비밀번호 설정</h2>
                              <p className="text-xs text-gray-500 mb-6 text-center">새로 사용할 비밀번호를 입력해주세요.</p>

                              <form onSubmit={handleSubmit} className="space-y-3">
                                   <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                             type="password"
                                             placeholder="새 비밀번호 (8자 이상)"
                                             value={password}
                                             onChange={(e) => setPassword(e.target.value)}
                                             className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                             required
                                        />
                                   </div>
                                   <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                             type="password"
                                             placeholder="새 비밀번호 확인"
                                             value={passwordConfirm}
                                             onChange={(e) => setPasswordConfirm(e.target.value)}
                                             className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                                             required
                                        />
                                   </div>

                                   {error && (
                                        <p className="text-xs text-center font-bold text-red-500 px-2">{error}</p>
                                   )}

                                   <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                   >
                                        {loading ? '처리중...' : '비밀번호 변경'}
                                        {!loading && <ChevronRight className="w-4 h-4" />}
                                   </button>
                              </form>
                         </>
                    )}
               </div>
          </div>
     );
};

export default ResetPasswordModal;
