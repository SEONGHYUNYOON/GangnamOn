import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, User, MapPin, MoreHorizontal, ChevronDown, Loader2 } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import { normalizeForGangnamDisplay } from '../lib/displayGangnam';

const NeighborhoodLife = ({ filter }) => {
     const [selectedRegion, setSelectedRegion] = useState('강남 전체');
     const [isDropdownOpen, setIsDropdownOpen] = useState(false);
     const [posts, setPosts] = useState([]);
     const [loading, setLoading] = useState(true);

     const regionList = ['강남 전체', '역삼', '삼성', '논현', '신사', '청담', '압구정', '서초', '방배', '사평', '잠원', '개포', '세곡'];

     useEffect(() => {
          const fetchPosts = async () => {
               setLoading(true);
               try {
                    // Fetch posts of type 'life' (Neighborhood Life) — author info is
                    // denormalized onto each post (authorUsername) so no join is needed.
                    const res = await databases.listDocuments({
                         databaseId: DATABASE_ID,
                         collectionId: COLLECTIONS.posts,
                         queries: [
                              Query.equal('type', ['life', 'question', 'news', 'town_story', 'gangnam_pick', 'daily_photo']),
                              Query.orderDesc('$createdAt'),
                         ],
                    });

                    // Adapt DB data to UI model
                    const mappedPosts = res.documents.map(p => {
                         let badge = '소식';
                         if (p.type === 'question') badge = '질문';
                         else if (p.type === 'news') badge = '소식';
                         else if (p.type === 'town_story') badge = '잡담';
                         else if (p.type === 'gangnam_pick') badge = '핫플';
                         else if (p.type === 'daily_photo') badge = '포토';
                         else if (p.title.includes('?')) badge = '질문'; // Fallback

                         const locationRaw = p.locationName || '강남';
                         const regionRaw = locationRaw ? locationRaw.split(' ')[0] : '강남';
                         return {
                              id: p.$id,
                              type: p.type === 'life' ? 'news' : p.type,
                              rawType: p.type,
                              badge: badge,
                              author: normalizeForGangnamDisplay(p.authorUsername || '강남이웃'),
                              title: p.title,
                              content: p.content,
                              location: normalizeForGangnamDisplay(locationRaw),
                              region: normalizeForGangnamDisplay(regionRaw),
                              views: p.views || 0,
                              likes: p.likesCount || 0,
                              comments: 0,
                              time: new Date(p.$createdAt).toLocaleDateString(),
                              image: p.imageUrls?.[0] || null
                         };
                    });
                    setPosts(mappedPosts);
               } catch (error) {
                    console.error("Error fetching neighborhood posts:", error);
               }
               setLoading(false);
          };

          fetchPosts();
     }, []);

     // Filtering Logic
     const filteredPosts = posts.filter(p => {
          // 1. Tab Filter
          let tabMatch = true;
          if (filter === 'qna') tabMatch = p.rawType === 'question';
          else if (filter === 'news') tabMatch = p.rawType === 'news' || p.rawType === 'life';
          else if (filter === 'town_story') tabMatch = p.rawType === 'town_story';
          else if (filter === 'gangnam_pick') tabMatch = p.rawType === 'gangnam_pick';
          else if (filter === 'daily_photo') tabMatch = p.rawType === 'daily_photo';

          // 2. Region Filter
          // Loose matching for region string
          const regionMatch = selectedRegion === '강남 전체'
               ? true
               : p.location.includes(selectedRegion);

          return tabMatch && regionMatch;
     });

     if (loading) {
          return (
               <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
               </div>
          );
     }

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
                                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3 whitespace-pre-wrap">{post.content}</p>

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
