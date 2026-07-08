import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, ID, Permission, Role, Query } from '../lib/appwrite';
import { EyeOff, Loader2, Send, Shield } from 'lucide-react';

const AnonymousBoard = ({ user }) => {
     const [posts, setPosts] = useState([]);
     const [loading, setLoading] = useState(true);
     const [content, setContent] = useState('');
     const [submitting, setSubmitting] = useState(false);

     const fetchPosts = async () => {
          setLoading(true);
          try {
               const res = await databases.listDocuments({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.posts,
                    queries: [
                         Query.equal('type', ['anonymous']),
                         Query.orderDesc('$createdAt'),
                         Query.limit(50),
                    ],
               });
               setPosts(res.documents);
          } catch (error) {
               console.error('익명 게시판 로딩 실패:', error);
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          fetchPosts();
     }, []);

     const handleSubmit = async () => {
          if (!user?.id) {
               alert('로그인 후 글을 작성할 수 있습니다.');
               return;
          }
          const trimmed = content.trim();
          if (!trimmed) {
               alert('내용을 입력해주세요.');
               return;
          }
          if (trimmed.length > 1000) {
               alert('1000자 이내로 작성해주세요.');
               return;
          }

          setSubmitting(true);
          try {
               await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTIONS.posts,
                    documentId: ID.unique(),
                    data: {
                         authorId: user.id,
                         authorUsername: '익명',
                         authorAvatarUrl: '',
                         type: 'anonymous',
                         title: trimmed.slice(0, 40),
                         content: trimmed,
                         locationName: '강남',
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
               setContent('');
               await fetchPosts();
          } catch (error) {
               console.error('익명 글 작성 실패:', error);
               alert('글 작성에 실패했습니다.');
          } finally {
               setSubmitting(false);
          }
     };

     if (loading) {
          return (
               <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
               </div>
          );
     }

     return (
          <div className="space-y-4">
               <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 p-4">
                    <div className="flex items-start gap-3">
                         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                              <Shield className="h-5 w-5 text-violet-600" />
                         </div>
                         <div>
                              <h3 className="text-sm font-black text-violet-900">익명 게시판</h3>
                              <p className="mt-1 text-xs font-semibold leading-5 text-violet-700">
                                   닉네임은 공개되지 않아요. 서로를 존중하는 말로 속마음을 나눠보세요.
                              </p>
                         </div>
                    </div>
               </div>

               <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <textarea
                         value={content}
                         onChange={(event) => setContent(event.target.value)}
                         placeholder={user ? '익명으로 하고 싶은 말을 남겨보세요...' : '로그인 후 작성할 수 있습니다.'}
                         disabled={!user || submitting}
                         className="min-h-24 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:bg-gray-50"
                         maxLength={1000}
                    />
                    <div className="mt-3 flex items-center justify-between">
                         <span className="text-[11px] font-bold text-gray-400">{content.length}/1000</span>
                         <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={!user || submitting || !content.trim()}
                              className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-black text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                         >
                              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                              익명으로 올리기
                         </button>
                    </div>
               </div>

               {posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                         <EyeOff className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                         <p className="font-bold text-gray-500">아직 익명 글이 없어요</p>
                         <p className="mt-1 text-sm text-gray-400">첫 번째 속닥속닥을 남겨보세요.</p>
                    </div>
               ) : (
                    posts.map((post) => (
                         <article key={post.$id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                              <div className="mb-3 flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-600">익명</span>
                                        <span className="text-[11px] font-bold text-gray-400">
                                             {new Date(post.$createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                   </div>
                              </div>
                              <p className="whitespace-pre-wrap text-sm font-semibold leading-7 text-gray-700">{post.content}</p>
                         </article>
                    ))
               )}
          </div>
     );
};

export default AnonymousBoard;
