import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Activity, FileText, TrendingUp, Shield, DollarSign, X, MapPin, Calendar, MessageSquare, Heart } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
     <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
               <p className="text-sm font-bold text-gray-400 mb-1">{title}</p>
               <h3 className="text-3xl font-black text-gray-900">{value}</h3>
               {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
               <Icon className="w-6 h-6 text-white" />
          </div>
     </div>
);

const AdminDashboard = ({ onlineUsersCount }) => {
     const [stats, setStats] = useState({
          totalUsers: 0,
          totalPosts: 0,
          totalVisits: 0, // Mock for now or sum of stats
          totalBeans: 0,  // Mock or sum
     });
     const [loading, setLoading] = useState(true);
     const [recentUsers, setRecentUsers] = useState([]);
     const [selectedUser, setSelectedUser] = useState(null);

     useEffect(() => {
          fetchStats();
     }, []);

     const fetchStats = async () => {
          try {
               setLoading(true);

               // 1. Total Users
               const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

               // 2. Total Posts
               const { count: postCount, error: postError } = await supabase
                    .from('posts')
                    .select('*', { count: 'exact', head: true });

               // 3. Recent Users (Get last 5) - Select ALL fields for detail view
               const { data: users, error: listError } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);

               if (userError || postError || listError) throw new Error("Stats fetch failed");

               setStats({
                    totalUsers: userCount || 0,
                    totalPosts: postCount || 0,
                    totalVisits: 15420, // Mock for visual fullness
                    totalBeans: 85400,  // Mock
               });
               setRecentUsers(users || []);

          } catch (error) {
               console.error('Admin stats error:', error);
          } finally {
               setLoading(false);
          }
     };

     return (
          <div className="flex flex-col gap-6 animate-in fade-in duration-500 relative">
               {/* Header */}
               <div className="flex items-center justify-between">
                    <div>
                         <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                              <Shield className="w-6 h-6 text-purple-600" />
                              관리자 대시보드
                         </h1>
                         <p className="text-gray-500 text-sm mt-1">GangnamOn 서비스 현황을 한눈에 확인하세요.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-bold text-sm animate-pulse">
                         <div className="w-2 h-2 rounded-full bg-green-500"></div>
                         실시간 접속자: {onlineUsersCount}명
                    </div>
               </div>

               {/* Stats Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                         title="총 회원수"
                         value={loading ? "..." : `${stats.totalUsers.toLocaleString()}명`}
                         subtext="전일 대비 +12%"
                         icon={Users}
                         color="bg-blue-500"
                    />
                    <StatCard
                         title="총 게시글"
                         value={loading ? "..." : `${stats.totalPosts.toLocaleString()}개`}
                         subtext="새 글 +5 (오늘)"
                         icon={FileText}
                         color="bg-purple-500"
                    />
                    <StatCard
                         title="누적 방문자"
                         value={loading ? "..." : stats.totalVisits.toLocaleString()}
                         subtext="실시간 집계 중"
                         icon={Activity}
                         color="bg-orange-500"
                    />
                    <StatCard
                         title="유통된 온(재화)"
                         value={loading ? "..." : `85.4k`}
                         subtext="경제 생태계 활발"
                         icon={DollarSign}
                         color="bg-emerald-500"
                    />
               </div>

               {/* Recent Activity Section */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Joiners */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5 text-gray-400" />
                              신규 가입 회원
                         </h3>
                         <div className="space-y-4">
                              {recentUsers.map((user, idx) => (
                                   <div
                                        key={idx}
                                        onClick={() => setSelectedUser(user)}
                                        className="flex items-center justify-between group cursor-pointer hover:bg-purple-50 p-3 rounded-xl transition-colors border border-transparent hover:border-purple-100"
                                   >
                                        <div className="flex items-center gap-3">
                                             <img
                                                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                                  alt="avatar"
                                                  className="w-10 h-10 rounded-full bg-gray-100"
                                             />
                                             <div>
                                                  <h4 className="font-bold text-gray-900 text-sm group-hover:text-purple-700 transition-colors">{user.username || '익명'}</h4>
                                                  <p className="text-xs text-gray-400">{user.location || '위치 미설정'}</p>
                                             </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                             <span className="hidden group-hover:inline-block text-xs font-bold text-purple-600 bg-white px-2 py-1 rounded-full shadow-sm">
                                                  상세보기
                                             </span>
                                             <span className="text-xs font-medium text-gray-400">
                                                  {new Date(user.created_at).toLocaleDateString()}
                                             </span>
                                        </div>
                                   </div>
                              ))}
                              {recentUsers.length === 0 && !loading && (
                                   <div className="text-center py-8 text-gray-400 text-sm">최근 가입자가 없습니다.</div>
                              )}
                         </div>
                    </div>

                    {/* System Health / Traffic (Placeholder Chart) */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-gray-400" />
                              트래픽 현황
                         </h3>
                         <div className="h-64 flex items-end gap-2 justify-between px-2">
                              {/* Simple Bar Chart Visualization */}
                              {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                                   <div key={i} className="w-full flex flex-col items-center gap-2 group">
                                        <div
                                             className="w-full bg-blue-100 rounded-t-lg relative overflow-hidden group-hover:bg-blue-200 transition-colors"
                                             style={{ height: `${height}%` }}
                                        >
                                             <div className="absolute bottom-0 left-0 right-0 bg-blue-500 h-[10%] opacity-50"></div>
                                        </div>
                                        <span className="text-xs text-gray-400">{['월', '화', '수', '목', '금', '토', '일'][i]}</span>
                                   </div>
                              ))}
                         </div>
                    </div>
               </div>

               {/* User Detail Modal */}
               {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedUser(null)}>
                         <div
                              onClick={e => e.stopPropagation()}
                              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                         >
                              {/* Modal Header (Cover + Avatar) */}
                              <div className="relative h-32 bg-gradient-to-r from-purple-500 to-indigo-600">
                                   <button
                                        onClick={() => setSelectedUser(null)}
                                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                                   >
                                        <X className="w-5 h-5" />
                                   </button>
                                   <div className="absolute -bottom-12 left-8">
                                        <img
                                             src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
                                             alt="profile"
                                             className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md object-cover"
                                        />
                                   </div>
                              </div>

                              {/* Modal Content */}
                              <div className="pt-16 pb-8 px-8">
                                   <div className="mb-6">
                                        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                             {selectedUser.username}
                                             {/* Badge placeholder if any */}
                                             <span className="px-2 py-0.5 roundedElement-md bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
                                                  신규 회원
                                             </span>
                                        </h2>
                                        <p className="text-gray-500 text-sm">{selectedUser.full_name || '이름 없음'} | {selectedUser.email || 'Email 비공개'}</p>
                                   </div>

                                   {/* Stats Row */}
                                   <div className="grid grid-cols-3 gap-4 mb-8">
                                        <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                                             <div className="text-xs text-gray-400 font-bold mb-1">보유 온</div>
                                             <div className="text-lg font-black text-gray-900">{selectedUser.beans?.toLocaleString() || 0}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                                             <div className="text-xs text-gray-400 font-bold mb-1">방문자</div>
                                             <div className="text-lg font-black text-gray-900">{selectedUser.visitors_total?.toLocaleString() || 0}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                                             <div className="text-xs text-gray-400 font-bold mb-1">게시글</div>
                                             {/* Querying post count separately would be ideal, but mock for now if not joined */}
                                             <div className="text-lg font-black text-gray-900">-</div>
                                        </div>
                                   </div>

                                   {/* Info List */}
                                   <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                                  <MessageSquare className="w-4 h-4 text-blue-500" />
                                             </div>
                                             <div>
                                                  <p className="text-xs font-bold text-gray-400">상태 메시지</p>
                                                  <p className="text-gray-700 text-sm font-medium mt-0.5">
                                                       {selectedUser.status_message || "상태 메시지가 없습니다."}
                                                  </p>
                                             </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                             <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                                  <Heart className="w-4 h-4 text-red-500" />
                                             </div>
                                             <div>
                                                  <p className="text-xs font-bold text-gray-400">소개</p>
                                                  <p className="text-gray-700 text-sm mt-0.5 leading-relaxed">
                                                       {selectedUser.bio || "자기소개가 없습니다."}
                                                  </p>
                                             </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                  <MapPin className="w-4 h-4 text-green-500" />
                                             </div>
                                             <div>
                                                  <p className="text-xs font-bold text-gray-400">활동 지역</p>
                                                  <p className="text-gray-900 text-sm font-bold mt-0.5">{selectedUser.location || "미설정"}</p>
                                             </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                                                  <Calendar className="w-4 h-4 text-orange-500" />
                                             </div>
                                             <div>
                                                  <p className="text-xs font-bold text-gray-400">가입일</p>
                                                  <p className="text-gray-900 text-sm font-bold mt-0.5">
                                                       {new Date(selectedUser.created_at).toLocaleDateString()}
                                                  </p>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Action Buttons */}
                                   <div className="flex gap-3 mt-8">
                                        <button
                                             className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors"
                                             onClick={() => alert("기능 준비중입니다.")} // Placeholder action
                                        >
                                             관리자 메시지 전송
                                        </button>
                                   </div>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     );
};

export default AdminDashboard;
