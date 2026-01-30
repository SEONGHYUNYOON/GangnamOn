import React, { useState } from 'react';
import { User, MapPin } from 'lucide-react';
import KakaoMap from './KakaoMap';

const DiningCompanion = () => {
    const [filter, setFilter] = useState('all'); // all, korean, western, cafe
    const [genderFilter, setGenderFilter] = useState('all'); // all, mixed, male, female
    const [activeMapId, setActiveMapId] = useState(null);

    // Mock Data
    const companions = [
        {
            id: 1,
            category: 'western',
            foodIcon: '🍝',
            title: '파스타 맛집 뿌실 분',
            user: '파스타러버',
            userImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
            gender: 'female',
            mannerTemp: 37.2,
            location: '역삼 카페거리',
            tags: ['#맛집탐방', '#조용한식사'],
            bg: 'bg-orange-50'
        },
        {
            id: 2,
            category: 'cafe',
            foodIcon: '☕',
            title: '신상 카페 투어해요',
            user: '카페인중독',
            userImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery',
            gender: 'mixed',
            mannerTemp: 38.5,
            location: '강남역 근처',
            tags: ['#카페투어', '#인생샷'],
            bg: 'bg-amber-50'
        },
        {
            id: 3,
            category: 'korean',
            foodIcon: '🥘',
            title: '얼큰한 부대찌개 ㄱㄱ',
            user: '밥심최고',
            userImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
            gender: 'male',
            mannerTemp: 36.5,
            location: '역삼 로타리',
            tags: ['#더치페이', '#반주가능'],
            bg: 'bg-red-50'
        },
        {
            id: 4,
            category: 'cafe',
            foodIcon: '🍰',
            title: '디저트 배는 따로!',
            user: '달콤한인생',
            userImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
            gender: 'female',
            mannerTemp: 40.1,
            location: '청담동',
            tags: ['#디저트', '#수다타임'],
            bg: 'bg-pink-50'
        },
        {
            id: 5,
            category: 'western',
            foodIcon: '🥗',
            title: '가볍게 샐러드 드실 분',
            user: '헬시라이프',
            userImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
            gender: 'mixed',
            mannerTemp: 36.8,
            location: '코엑스 잔디광장',
            tags: ['#건강식', '#다이어트'],
            bg: 'bg-green-50'
        },
        {
            id: 6,
            category: 'korean',
            foodIcon: '🍗',
            title: '치맥 하실 남자분!',
            user: '축구왕',
            userImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Brian',
            gender: 'male',
            mannerTemp: 37.0,
            location: '강남역',
            tags: ['#축구시청', '#치맥'],
            bg: 'bg-blue-50'
        }
    ];

    const filteredList = companions.filter(item => {
        if (filter !== 'all' && item.category !== filter) return false;
        if (genderFilter !== 'all' && item.gender !== genderFilter) return false;
        return true;
    });

    return (
        <div className="py-2">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-1 mb-4 gap-3">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        혼밥 매칭 🍝
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">취향에 맞는 밥친구를 찾아보세요!</p>
                </div>

                {/* Gender Filter Buttons */}
                <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setGenderFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${genderFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        전체
                    </button>
                    <button
                        onClick={() => setGenderFilter('mixed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${genderFilter === 'mixed' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        👫 혼성
                    </button>
                    <button
                        onClick={() => setGenderFilter('male')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${genderFilter === 'male' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        👨 남성만
                    </button>
                    <button
                        onClick={() => setGenderFilter('female')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${genderFilter === 'female' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        👩 여성만
                    </button>
                </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 mb-5 px-1 overflow-x-auto scrollbar-hide">
                {['all', 'korean', 'western', 'cafe'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${filter === cat
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        {cat === 'all' && '전체 메뉴'}
                        {cat === 'korean' && '🥡 한식'}
                        {cat === 'western' && '🍕 양식'}
                        {cat === 'cafe' && '☕ 카페·디저트'}
                    </button>
                ))}
            </div>

            {/* Horizontal Scroll List */}
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-1 snap-x">
                {filteredList.map((item) => (
                    <div
                        key={item.id}
                        className="snap-center min-w-[280px] md:min-w-[300px] bg-white rounded-[2rem] p-5 shadow-lg shadow-gray-100 border border-gray-100 relative group hover:-translate-y-1 transition-transform duration-300"
                    >
                        {/* 3D Icon Area */}
                        <div className={`h-32 rounded-3xl ${item.bg} mb-4 flex items-center justify-center relative overflow-hidden`}>
                            <div className="text-[5rem] drop-shadow-xl transform group-hover:scale-110 transition-transform duration-500 filter hover:brightness-110">
                                {item.foodIcon}
                            </div>
                            <div className="absolute top-3 right-3 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-purple-500" /> {item.location}
                            </div>

                            {/* Gender Badge on Card */}
                            <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${item.gender === 'female' ? 'bg-pink-100 text-pink-600'
                                : item.gender === 'male' ? 'bg-blue-100 text-blue-600'
                                    : 'bg-purple-100 text-purple-600'
                                }`}>
                                {item.gender === 'female' ? '👩 여성'
                                    : item.gender === 'male' ? '👨 남성'
                                        : '👫 혼성'}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center">
                            {/* User Info */}
                            <div className="flex justify-center -mt-10 mb-2 relative z-10">
                                <div className="relative">
                                    <img
                                        src={item.userImage}
                                        alt={item.user}
                                        className="w-12 h-12 rounded-full border-4 border-white shadow-md bg-white"
                                    />
                                    <div className="absolute -bottom-1 -right-4 bg-white px-1.5 py-0.5 rounded-full border border-purple-100 shadow-sm flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-gray-500">{item.mannerTemp}℃</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 font-bold mb-1">{item.user}</p>
                            <h3 className="text-lg font-black text-gray-900 leading-tight mb-3">
                                {item.title}
                            </h3>

                            {/* Tags */}
                            <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                                {item.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Action Button */}
                            {activeMapId === item.id ? (
                                <div className="mt-3 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                        <KakaoMap
                                            latitude={37.751853} // Dummy Logic
                                            longitude={126.764666}
                                            style={{ width: '100%', height: '150px' }}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveMapId(null); }}
                                            className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-gray-600 shadow-sm hover:bg-white"
                                        >
                                            <MapPin className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setActiveMapId(item.id)}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 group-hover:shadow-md ${item.category === 'cafe'
                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white'
                                        : 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white'
                                        }`}>
                                    {item.category === 'cafe' ? '같이 가요 ☕' : '밥 먹자! 🍴'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredList.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold text-sm">해당 조건의 밥친구가 없어요 😭</p>
                    <button onClick={() => { setFilter('all'); setGenderFilter('all'); }} className="text-purple-600 text-xs font-bold mt-2 hover:underline">
                        조건 초기화
                    </button>
                </div>
            )}
        </div>
    );
};

export default DiningCompanion;
