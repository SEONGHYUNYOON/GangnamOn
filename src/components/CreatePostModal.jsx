import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, MapPin, Calendar, Users, DollarSign, Tag, ArrowLeft, Loader2, Megaphone, Clock } from 'lucide-react';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKET_ID, ID, Permission, Role, getFileUrl } from '../lib/appwrite';

const CreatePostModal = ({ onClose, onShare, user, initialCategory = 'gathering' }) => {
     const [selectedCategory, setSelectedCategory] = useState(initialCategory);
     // Start with null, show preview when selected
     const [previewImage, setPreviewImage] = useState(null);
     const [selectedFile, setSelectedFile] = useState(null);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const fileInputRef = useRef(null);

     // 이벤트 마감 시간 기본값: 지금부터 24시간 뒤 (datetime-local 입력용 문자열)
     const defaultEventDeadline = (() => {
          const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          return d.toISOString().slice(0, 16);
     })();

     const [formData, setFormData] = useState({
          title: '',
          price: '',
          location: '',
          date: new Date().toISOString().slice(0, 10),
          time: '19:00',
          maxMembers: 4,
          description: '',
          eventDeadline: defaultEventDeadline
     });

     const categories = [
          { id: 'event', label: '🎉 이벤트 홍보(사장님)', icon: Megaphone },
          { id: 'startup_freelance', label: '⚡ 스타트업/프리랜서', icon: Users }, // Zap changed to Users for better generic fit or import Zap if needed (it is imported)
          { id: 'lunch_networking', label: '☕ 점심 네트워킹', icon: Calendar }, // Coffee changed to Calendar or keep Coffee if imported
          { id: 'recruit_proposal', label: '👥 구인/협업', icon: Tag },
          { id: 'office_rent', label: '🏢 사무실/임대', icon: MapPin }, // Store changed to MapPin
          { id: 'gathering', label: '⚡ 동호회/모임', icon: Users },
          { id: 'market', label: '🥕 중고거래', icon: DollarSign },
     ];

     const handleFileSelect = (e) => {
          const file = e.target.files[0];
          if (file) {
               // Basic validation
               if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    alert("파일 크기는 5MB 이하여야 합니다.");
                    return;
               }
               if (!file.type.startsWith('image/')) {
                    alert("이미지 파일만 업로드 가능합니다.");
                    return;
               }

               setSelectedFile(file);
               const objectUrl = URL.createObjectURL(file);
               setPreviewImage(objectUrl);

               // Cleanup memory when component unmounts or image changes
               return () => URL.revokeObjectURL(objectUrl);
          }
     };

     const uploadImage = async (file) => {
          try {
               const uploaded = await storage.createFile({
                    bucketId: BUCKET_ID,
                    fileId: ID.unique(),
                    file,
                    permissions: [Permission.read(Role.any())],
               });

               return getFileUrl(uploaded.$id);
          } catch (error) {
               console.error("Image upload failed:", error);
               if (error.message && error.message.includes('bucket')) {
                    throw new Error("이미지 저장소(post-images)가 존재하지 않습니다. 관리자에게 문의하세요.");
               }
               throw error;
          }
     };

     const handleSubmit = async () => {
          if (!user) {
               alert("로그인이 필요합니다!");
               return;
          }
          if (!formData.title) {
               alert("제목을 입력해주세요.");
               return;
          }

          setIsSubmitting(true);

          try {
               let finalImageUrl = null;

               // Upload image if selected
               if (selectedFile) {
                    finalImageUrl = await uploadImage(selectedFile);
               } else if (previewImage && previewImage.startsWith('http')) {
                    // If it was an existing URL (not blob), keep it (logic for edit in future)
                    finalImageUrl = previewImage;
               }

               const payload = {
                    authorId: user.id,
                    authorUsername: user.user_metadata?.username || user.user_metadata?.full_name || '강남주민',
                    authorAvatarUrl: user.user_metadata?.avatar_url || '',
                    type: selectedCategory,
                    title: formData.title,
                    locationName: formData.location,
                    // Append detail info to content as we don't have columns in basic schema
                    content: selectedCategory === 'gathering'
                         ? `[일시: ${formData.date} ${formData.time}]\n\n${formData.description}`
                         : formData.description,
                    imageUrls: finalImageUrl ? [finalImageUrl] : [],
                    likesCount: 0,
               };

               if (selectedCategory === 'market') {
                    payload.price = parseInt(formData.price.replace(/[^0-9]/g, '') || 0);
               }
               if (selectedCategory === 'gathering') {
                    payload.maxParticipants = parseInt(formData.maxMembers);
                    payload.currentParticipants = 1;
               }
               if (selectedCategory === 'event') {
                    // 이벤트 홍보 글은 마감 시간을 함께 저장 (Owner's Note의 마감 타이머와 연결됨)
                    payload.expiresAt = new Date(formData.eventDeadline).toISOString();
               }

               const savedPost = await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.posts,
                    documentId: ID.unique(),
                    data: payload,
                    permissions: [
                         Permission.read(Role.any()),
                         Permission.update(Role.user(user.id)),
                         Permission.delete(Role.user(user.id)),
                    ],
               });

               // Success — 부모 컴포넌트에는 저장된 실제 문서를 그대로 전달해서
               // App.jsx가 다시 insert하지 않고 화면 상태만 갱신하도록 함
               if (onShare) {
                    onShare(selectedCategory, savedPost);
               } else {
                    window.location.reload();
               }
               onClose();

          } catch (error) {
               console.error('Error creating post:', error);
               alert(`글 작성 실패: ${error.message}`);
          } finally {
               setIsSubmitting(false);
          }
     };

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">

               {/* Container */}
               <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">

                    {/* Header (Mobile Only) */}
                    <div className="md:hidden p-4 border-b flex justify-between items-center">
                         <button onClick={onClose}><ArrowLeft className="w-6 h-6" /></button>
                         <span className="font-bold">새 게시물 만들기</span>
                         <span className="text-purple-600 font-bold" onClick={handleSubmit}>완료</span>
                    </div>

                    {/* Close Button (PC) */}
                    <button
                         onClick={onClose}
                         className="absolute top-6 right-6 z-20 text-gray-400 hover:text-gray-900 hidden md:block"
                    >
                         <X className="w-6 h-6" />
                    </button>

                    {/* === Left: Image Upload (50%) === */}
                    <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center relative border-r border-gray-100 p-6">
                         <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                              className="hidden"
                              accept="image/*"
                         />

                         {previewImage ? (
                              <div className="w-full h-full relative group rounded-2xl overflow-hidden shadow-sm">
                                   <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                             onClick={() => fileInputRef.current?.click()}
                                             className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold hover:bg-white/30 transition-colors"
                                        >
                                             사진 변경하기
                                        </button>
                                   </div>
                                   <button
                                        onClick={(e) => {
                                             e.stopPropagation();
                                             setPreviewImage(null);
                                             setSelectedFile(null);
                                        }}
                                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                                   >
                                        <X className="w-4 h-4" />
                                   </button>
                              </div>
                         ) : (
                              <div
                                   onClick={() => fileInputRef.current?.click()}
                                   className="text-center p-10 border-2 border-dashed border-gray-300 rounded-2xl w-full h-full flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 hover:bg-purple-50 transition-all cursor-pointer group"
                              >
                                   <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-8 h-8 text-purple-400" />
                                   </div>
                                   <p className="font-bold text-lg mb-1 text-gray-600 group-hover:text-purple-600">사진 추가하기</p>
                                   <p className="text-sm text-gray-400">클릭하여 이미지를 업로드하세요</p>
                                   <p className="text-xs text-gray-300 mt-4">최대 5MB, JPG/PNG</p>
                              </div>
                         )}
                    </div>

                    {/* === Right: Input Form (50%) === */}
                    <div className="w-full md:w-1/2 bg-white flex flex-col h-full">

                         {/* 1. User Profile Header */}
                         <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                   <img src={user?.user_metadata?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User" />
                              </div>
                              <span className="font-bold text-gray-900">{user?.user_metadata?.username || user?.user_metadata?.full_name || '강남주민'}</span>
                         </div>

                         {/* 2. Scrollable Form Area */}
                         <div className="flex-1 overflow-y-auto p-6 space-y-8">

                              {/* Category Selector */}
                              <div className="relative">
                                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">게시판 선택</label>
                                   <div className="grid grid-cols-2 gap-2">
                                        {categories.map(cat => {
                                             const Icon = cat.icon;
                                             return (
                                                  <button
                                                       key={cat.id}
                                                       onClick={() => setSelectedCategory(cat.id)}
                                                       className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-bold ${selectedCategory === cat.id
                                                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                            : 'border-gray-200 text-gray-500 hover:border-purple-200'
                                                            }`}
                                                  >
                                                       <Icon className="w-4 h-4" />
                                                       {cat.label}
                                                  </button>
                                             )
                                        })}
                                   </div>
                              </div>

                              {/* Common: Title & Content */}
                              <div className="space-y-4">
                                   <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="글 제목을 입력해주세요"
                                        className="w-full text-xl font-bold placeholder-gray-300 border-none focus:ring-0 p-0"
                                   />
                                   <textarea
                                        rows={6}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="내용을 입력해주세요."
                                        className="w-full text-sm text-gray-600 placeholder-gray-300 border-none focus:ring-0 p-0 resize-none leading-relaxed"
                                   />
                              </div>

                              <hr className="border-gray-100" />

                              {/* === Dynamic Fields === */}

                              {/* Case: 이벤트 홍보 (Owner's Note에 노출, 마감 타이머 자동 적용) */}
                              {selectedCategory === 'event' && (
                                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="bg-brand-light border border-brand/10 rounded-xl p-3 text-xs text-brand font-bold flex items-start gap-2">
                                             <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
                                             <span>등록하면 Owner's Note 피드에 바로 노출됩니다. 마감 시간이 지나면 자동으로 "종료된 이벤트"로 표시돼요.</span>
                                        </div>
                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                                                  <Clock className="w-3.5 h-3.5" /> 이벤트 마감 시간
                                             </label>
                                             <input
                                                  type="datetime-local"
                                                  value={formData.eventDeadline}
                                                  onChange={(e) => setFormData({ ...formData, eventDeadline: e.target.value })}
                                                  className="w-full py-3 px-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-brand/30 focus:ring-0 transition-all font-bold text-sm"
                                             />
                                        </div>
                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">매장 위치</label>
                                             <div className="flex items-center bg-gray-50 px-3 py-3 rounded-xl">
                                                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                                  <input
                                                       type="text"
                                                       value={formData.location}
                                                       onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                       className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full placeholder-gray-400 text-gray-700"
                                                       placeholder="예) 강남역 3번 출구 앞"
                                                  />
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {/* Case A: Market (Price) */}
                              {selectedCategory === 'market' && (
                                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">판매 가격</label>
                                             <div className="relative">
                                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₩</span>
                                                  <input
                                                       type="text"
                                                       value={formData.price}
                                                       onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                       placeholder="가격 입력"
                                                       className="w-full pl-8 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-purple-200 focus:ring-0 transition-all font-bold"
                                                  />
                                             </div>
                                        </div>
                                   </div>
                              )}

                              {/* Case: Office Rent (Deposit / Monthly Rent) */}
                              {selectedCategory === 'office_rent' && (
                                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">보증금 / 월세</label>
                                             <div className="flex gap-2">
                                                  <input
                                                       type="text"
                                                       placeholder="보증금 (예: 1000)"
                                                       className="flex-1 py-3 px-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-purple-200 font-bold text-sm"
                                                       onChange={(e) => setFormData({ ...formData, description: `[보증금: ${e.target.value}만원] ` + formData.description })}
                                                  />
                                                  <input
                                                       type="text"
                                                       placeholder="월세 (예: 80)"
                                                       className="flex-1 py-3 px-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-purple-200 font-bold text-sm"
                                                       onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                  />
                                             </div>
                                        </div>
                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">위치</label>
                                             <input
                                                  type="text"
                                                  value={formData.location}
                                                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                  placeholder="상세 위치 입력"
                                                  className="w-full py-3 px-4 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-purple-200 font-bold text-sm"
                                             />
                                        </div>
                                   </div>
                              )}

                              {/* Case B: Gathering / Lunch / Meeting (Date/Time/Location) */}
                              {['gathering', 'lunch_networking', 'startup_freelance', 'recruit_proposal'].includes(selectedCategory) && (
                                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">모임 날짜</label>
                                                  <div className="flex items-center bg-gray-50 px-3 py-3 rounded-xl">
                                                       <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                       <input
                                                            type="date"
                                                            value={formData.date}
                                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full text-gray-700"
                                                       />
                                                  </div>
                                             </div>
                                             <div>
                                                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">시간</label>
                                                  <div className="bg-gray-50 px-3 py-3 rounded-xl">
                                                       <input
                                                            type="time"
                                                            value={formData.time}
                                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full text-gray-700"
                                                       />
                                                  </div>
                                             </div>
                                        </div>

                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">장소</label>
                                             <div className="flex items-center bg-gray-50 px-3 py-3 rounded-xl">
                                                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                                  <input
                                                       type="text"
                                                       value={formData.location}
                                                       onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                       className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full placeholder-gray-400 text-gray-700"
                                                       placeholder="장소를 입력하거나 지도에서 선택"
                                                  />
                                             </div>
                                        </div>

                                        <div>
                                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">모집 인원 ({formData.maxMembers}명)</label>
                                             <input
                                                  type="range"
                                                  min="2" max="20"
                                                  value={formData.maxMembers}
                                                  onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                                                  className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                             />
                                             <div className="flex justify-between text-xs text-gray-400 mt-1">
                                                  <span>소규모(2명)</span>
                                                  <span>단체(20명)</span>
                                             </div>
                                        </div>
                                   </div>
                              )}

                         </div>

                         {/* 3. Footer Action */}
                         <div className="p-6 border-t border-gray-100 flex justify-end">
                              <button
                                   onClick={handleSubmit}
                                   disabled={isSubmitting}
                                   className="btn-brand py-3.5 px-10 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                   {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                   {isSubmitting ? '업로드 중...' : '공유하기'}
                              </button>
                         </div>

                    </div>
               </div>
          </div>
     );
};

export default CreatePostModal;
