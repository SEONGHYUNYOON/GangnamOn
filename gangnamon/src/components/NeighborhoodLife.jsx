import React, { useState } from 'react';
import { MessageCircle, Heart, User, MapPin, MoreHorizontal, ChevronDown } from 'lucide-react';

const NeighborhoodLife = ({ filter }) => {
     const [selectedRegion, setSelectedRegion] = useState('강남 전체');
     const [isDropdownOpen, setIsDropdownOpen] = useState(false);

     const regionList = ['강남 전체', '역삼', '논현', '청담', '신사/압구정', '대치', '삼성', '도곡', '반포', '서초/양재'];

     const posts = [
          {
               id: 1,
               type: 'question',
               badge: '질문',
               author: '도곡맘',
               title: '양재천 근처 브런치 맛집 추천해주세요! 🥗',
               content: '주말에 친구들이랑 가려고 하는데, 발렛 되고 분위기 좋은 곳 있을까요? 테라스 있으면 더 좋아요!',
               location: '도곡동',
               region: '도곡',
               views: 342,
               likes: 12,
               comments: 8,
               time: '2시간 전'
          },
          {
               id: 2,
               type: 'news',
               badge: '소식',
               author: '논현토박이',
               title: '⚠️ 테헤란로 삼성 방향 지금 엄청 막혀요',
               content: '르네상스사거리 부근에서 공사 중인 것 같습니다. 퇴근길 참고하세요! 30분째 기어가는 중입니다 ㅠㅠ',
               location: '역삼동',
               region: '역삼',
               views: 1205,
               likes: 45,
               comments: 21,
               time: '45분 전'
          },
          {
               id: 3,
               type: 'question',
               badge: '질문',
               author: '자취생',
               title: '강남역 근처 24시 빨래방 있나요?',
               content: '이불 빨래를 해야 하는데 오피스텔 세탁기가 작아서요. 시설 깨끗한 곳 추천 부탁드립니다.',
               location: '서초동',
               region: '서초/양재',
               views: 156,
               likes: 3,
               comments: 4,
               time: '4시간 전'
          },
          {
               id: 4,
               type: 'news',
               badge: '맛집',
               author: '맛따라길따라',
               title: '가로수길 팝업스토어 갔다왔어요 (사진有)',
               content: '인테리어 완전 힙하고 커피도 맛있네요. 지금 오픈 이벤트로 굿즈 줍니다! 다들 가보세요~',
               image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400&h=300',
               location: '신사동',
               region: '신사/압구정',
               views: 890,
               likes: 56,
               comments: 15,
               time: '1일 전'
          },
          {
               id: 5,
               type: 'qna',
               badge: '질문',
               author: '초보운전',
               title: '도산공원 발렛 주말에 자리 많나요?',
               content: '이번주 일요일 오후에 가려는데 웨이팅 헬인가요? ㅠㅠ',
               location: '신사동',
               region: '신사/압구정',
               views: 230,
               likes: 5,
               comments: 12,
               time: '3시간 전'
          },
          {
               id: 6,
               type: 'question',
               badge: '질문',
               author: '코엑스죽돌이',
               title: '별마당 도서관 주말에 노트북 사용 가능한가요?',
               content: '자리 잡으려면 오픈런 해야 하는지 궁금합니다. 일찍 가야 할까요?',
               location: '삼성동',
               region: '삼성',
               views: 88,
               likes: 2,
               comments: 5,
               time: '5시간 전'
          },
          {
               id: 7,
               type: 'news',
               badge: '소식',
               author: '트렌드세터',
               title: '코엑스 광장 앞 플리마켓 열렸어요!',
               content: '오늘 주말이라 그런지 사람 꽤 많네요. 구경오세요~',
               location: '삼성동',
               region: '삼성',
               views: 412,
               likes: 20,
               comments: 8,
               time: '12시간 전'
          }
     ];

     // Filtering Logic
     const filteredPosts = posts.filter(p => {
          // 1. Tab Filter (QnA / News / All)
          const tabMatch = filter === 'news'
               ? p.type === 'news'
               : filter === 'qna'
                    ? (p.type === 'question' || p.type === 'qna')
                    : true;

          // 2. Region Filter
          const regionMatch = selectedRegion === '강남 전체'
               ? true
               : p.region === selectedRegion;

          return tabMatch && regionMatch;
     });

     return (
          <div className="space-y-4">

               {/* Region Dropdown Filter */}
               <div className="flex justify-end relative">
                    <button
                         onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                         className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-bold text-gray-700 hover:border-purple-200 hover:text-purple-600 transition-colors shadow-sm"
                    >
                         <MapPin className="w-4 h-4 text-purple-500" />
                         {selectedRegion}
                         <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                         <div className="absolute top-12 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-48 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 gap-1">
                                   {regionList.map(region => (
                                        <button
                                             key={region}
                                             onClick={() => {
                                                  setSelectedRegion(region);
                                                  setIsDropdownOpen(false);
                                             }}
                                             className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${selectedRegion === region
                                                  ? 'bg-purple-50 text-purple-700'
                                                  : 'text-gray-600 hover:bg-gray-50'
                                                  }`}
                                        >
                                             {region}
                                        </button>
                                   ))}
                              </div>
                         </div>
                    )}
               </div>

               {/* Post List */}
               {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                         <div key={post.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] hover:border-purple-100 hover:shadow-md transition-all cursor-pointer">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-3">
                                   <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                             [{post.region}]
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${post.badge === '질문' ? 'bg-blue-50 text-blue-600' :
                                             post.badge === '소식' ? 'bg-red-50 text-red-600' :
                                                  'bg-green-50 text-green-600'
                                             }`}>
                                             {post.badge}
                                        </span>
                                   </div>
                                   <span className="text-xs text-gray-400">{post.time}</span>
                              </div>

                              {/* Content */}
                              <div className="flex gap-4">
                                   <div className="flex-1">
                                        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-1">{post.title}</h3>
                                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{post.content}</p>

                                        <div className="flex items-center text-xs text-gray-400 gap-3">
                                             <div className="flex items-center gap-1">
                                                  <span className="font-medium text-gray-500">{post.author}</span>
                                                  <span className="w-0.5 h-0.5 bg-gray-300 rounded-full mx-1"></span>
                                                  <MapPin className="w-3 h-3" />
                                                  <span>{post.location}</span>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Optional Thumbnail */}
                                   {post.image && (
                                        <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                             <img src={post.image} alt="thumb" className="w-full h-full object-cover" />
                                        </div>
                                   )}
                              </div>

                              {/* Footer Stats */}
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                   <div className="flex gap-4">
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                             <User className="w-4 h-4" />
                                             <span>{post.views}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                             <Heart className="w-4 h-4 text-purple-500" />
                                             <span>{post.likes}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                             <MessageCircle className="w-4 h-4 text-blue-500" />
                                             <span>{post.comments}</span>
                                        </div>
                                   </div>
                                   <MoreHorizontal className="w-4 h-4 text-gray-300" />
                              </div>
                         </div>
                    ))
               ) : (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                         <p className="font-bold text-lg mb-2">앗! 게시물이 없네요 😅</p>
                         <p className="text-sm">{selectedRegion} 지역의 첫 번째 소식을 남겨보세요!</p>
                    </div>
               )}
          </div>
     );
};

export default NeighborhoodLife;
