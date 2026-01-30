import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Train, Car, Bus, Sun, Zap, Clock, ChevronDown, Check, MapPin, X, ArrowRight } from 'lucide-react';

// Portal Helper for SSR safety
const Portal = ({ children }) => {
     const [mounted, setMounted] = useState(false);
     useEffect(() => setMounted(true), []);
     if (!mounted) return null;
     return createPortal(children, document.body);
};

// Selection Overlay Component - Fixed Modal
const SelectionOverlay = ({ title, items, current, onSelect, onClose, icon: Icon, color }) => {
     return (
          <Portal>
               <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200"
                    onClick={onClose}
                    style={{ pointerEvents: 'auto' }} // Force pointer events
               >
                    <div
                         className="bg-white w-full max-w-[320px] rounded-3xl p-5 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 relative"
                         onClick={(e) => e.stopPropagation()}
                    >
                         <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 shrink-0">
                              <div className="flex items-center gap-2">
                                   <Icon className={`w-5 h-5 ${color}`} />
                                   <span className="font-bold text-gray-900 text-lg">{title}</span>
                              </div>
                              <button
                                   type="button"
                                   onClick={onClose}
                                   className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                              >
                                   <X className="w-5 h-5 text-gray-400" />
                              </button>
                         </div>
                         <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                              {items.map(item => (
                                   <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => {
                                             onSelect(item.name);
                                             onClose();
                                        }}
                                        className={`w-full flex flex-col p-4 rounded-2xl transition-all border cursor-pointer text-left ${item.name === current
                                             ? 'bg-gray-900 text-white border-gray-900 shadow-md ring-2 ring-gray-200'
                                             : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                             }`}
                                   >
                                        <div className="flex items-center justify-between w-full mb-1">
                                             <span className="font-bold text-base">{item.name}</span>
                                             {item.name === current && <Check className="w-5 h-5 text-green-400" />}
                                        </div>
                                        {item.stops && (
                                             <span className={`text-xs block truncate ${item.name === current ? 'text-gray-300' : 'text-gray-400'}`}>
                                                  {item.stops}
                                             </span>
                                        )}
                                        {item.details && (
                                             <span className={`text-xs block truncate ${item.name === current ? 'text-gray-300' : 'text-gray-400'}`}>
                                                  {item.details.join(' · ')}
                                             </span>
                                        )}
                                   </button>
                              ))}
                         </div>
                    </div>
               </div>
          </Portal>
     );
};

const GangnamTraffic = () => {
     // State for Selections
     const [selectedSubway, setSelectedSubway] = useState('강남');
     const [selectedBus, setSelectedBus] = useState('강남·역삼');

     // State for UI Toggles
     const [isSelectingSubway, setIsSelectingSubway] = useState(false);
     const [isSelectingBus, setIsSelectingBus] = useState(false);

     // Mock Data: 2호선 강남권
     const subwayStations = [
          { name: '강남', time: '2분', next: '5분', details: ['역삼', '선릉', '삼성', '종합운동장', '잠실'] },
          { name: '역삼', time: '3분', next: '6분', details: ['선릉', '삼성', '종합운동장', '잠실'] },
          { name: '선릉', time: '2분', next: '5분', details: ['삼성', '종합운동장', '잠실'] },
          { name: '삼성', time: '4분', next: '8분', details: ['종합운동장', '잠실', '신천'] },
          { name: '신논현', time: '3분', next: '7분', details: ['강남', '역삼', '선릉'] },
          { name: '논현', time: '5분', next: '10분', details: ['신논현', '강남', '역삼'] }
     ];

     const busRoutes = [
          { name: '강남·역삼', wait: '8분', status: '원활', stops: '강남역 · 역삼역 · 테헤란로 · 뱅뱅사거리' },
          { name: '삼성·코엑스', wait: '12분', status: '보통', stops: '삼성역 · 코엑스 · 봉은사 · 종합운동장' },
          { name: '논현·신사', wait: '6분', status: '원활', stops: '논현역 · 신사동 · 압구정로데오' },
          { name: '청담·압구정', wait: '15분', status: '보통', stops: '청담역 · 압구정 · 한남대교' },
          { name: '서초·방배', wait: '18분', status: '지연', stops: '서초역 · 방배역 · 사평대교' }
     ];

     const currentSubwayData = subwayStations.find(s => s.name === selectedSubway) || subwayStations[0];
     const currentBusData = busRoutes.find(r => r.name === selectedBus) || busRoutes[0];

     return (
          <div className="w-full bg-white rounded-3xl p-5 border border-indigo-50 shadow-sm relative overflow-visible transition-all duration-300">
               {/* Selection Overlays */}

               {isSelectingSubway && (
                    <SelectionOverlay
                         title="2호선 역 선택"
                         items={subwayStations}
                         current={selectedSubway}
                         onSelect={setSelectedSubway}
                         onClose={() => setIsSelectingSubway(false)}
                         icon={Train}
                         color="text-green-600"
                    />
               )}
               {isSelectingBus && (
                    <SelectionOverlay
                         title="강남권 버스 노선"
                         items={busRoutes}
                         current={selectedBus}
                         onSelect={setSelectedBus}
                         onClose={() => setIsSelectingBus(false)}
                         icon={Zap}
                         color="text-purple-600"
                    />
               )}

               {/* Header */}
               <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                         <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">LIVE</span>
                         <h2 className="text-gray-900 font-bold text-sm tracking-tight">실시간 교통</h2>
                    </div>
                    <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                         <Sun className="w-3 h-3 text-orange-500" />
                         <span className="text-[10px] font-bold text-orange-600">드라이브 추천</span>
                    </div>
               </div>

               <div className="space-y-3">
                    {/* 1. 2호선 Row */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 overflow-hidden">
                         <div
                              onClick={() => setIsSelectingSubway(true)}
                              className="flex items-center justify-between cursor-pointer group mb-3"
                         >
                              <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                        <Train className="w-4 h-4" />
                                   </div>
                                   <div>
                                        <div className="flex items-center gap-1">
                                             <span className="text-xs font-bold text-gray-900">2호선</span>
                                             <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-nowrap flex items-center gap-0.5 group-hover:bg-green-100 transition-colors">
                                                  {selectedSubway} <ChevronDown className="w-3 h-3" />
                                             </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">강남권</div>
                                   </div>
                              </div>
                              <div className="text-right">
                                   <div className="flex items-center justify-end gap-1">
                                        <span className="text-sm font-black text-gray-900">{currentSubwayData.time}</span>
                                        <span className="text-[10px] text-green-500 font-medium">({currentSubwayData.next})</span>
                                   </div>
                              </div>
                         </div>
                         {/* Route Graphic */}
                         <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pt-1 pb-1">
                              <div className="flex items-center text-[10px] font-bold text-gray-800 shrink-0">
                                   <span className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-100 mr-1" />
                                   {selectedSubway}
                              </div>
                              <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                              {currentSubwayData.details.map((stop, idx) => (
                                   <React.Fragment key={stop}>
                                        <span className={`text-[10px] shrink-0 ${idx === 0 ? 'text-gray-600 font-bold' : 'text-gray-400'}`}>
                                             {stop}
                                        </span>
                                        {idx < currentSubwayData.details.length - 1 && <ArrowRight className="w-3 h-3 text-gray-200 shrink-0" />}
                                   </React.Fragment>
                              ))}
                         </div>
                    </div>

                    {/* 2. Road Row */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                         <div className="flex items-center gap-3 w-full">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                   <Car className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                   <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-900">테헤란로</span>
                                        <span className="text-[10px] text-green-600 font-bold">원활 (60km/h)</span>
                                   </div>
                                   <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[80%] rounded-full" />
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* 3. Bus Row */}
                    <div className="grid grid-cols-2 gap-2">
                         {/* M-Bus */}
                         <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-1 text-center">
                              <div className="flex items-center gap-1.5 mb-1">
                                   <Bus className="w-3.5 h-3.5 text-gray-400" />
                                   <span className="text-xs font-bold text-gray-900">146</span>
                              </div>
                              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">잔여 5석</span>
                              <span className="text-[9px] text-gray-400 mt-0.5">강남역/역삼</span>
                         </div>

                         {/* Gangnam Bus - Interactive */}
                         <div
                              onClick={() => setIsSelectingBus(true)}
                              className="col-span-1 p-2.5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 flex flex-col gap-1 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                         >
                              <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-purple-600" />
                                        <span className="text-xs font-bold text-purple-900">강남권</span>
                                   </div>
                                   <ChevronDown className="w-3 h-3 text-purple-400" />
                              </div>

                              <div className="mt-1">
                                   <div className="flex items-center gap-1 mb-0.5">
                                        <MapPin className="w-3 h-3 text-purple-400" />
                                        <span className="text-[10px] font-bold text-gray-700 truncate" title={selectedBus}>{selectedBus}</span>
                                   </div>
                                   <p className="text-[9px] text-gray-500 line-clamp-1 leading-tight h-3">
                                        {currentBusData.stops}
                                   </p>
                              </div>

                              <div className="mt-1.5 flex justify-end">
                                   <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-white/60 ${currentBusData.status === '지연' ? 'text-red-500' : 'text-purple-600'}`}>
                                        대기 {currentBusData.wait}
                                   </span>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default GangnamTraffic;
