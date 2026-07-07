import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Bus, Car, Check, ChevronDown, Clock3, MapPin, Train, X } from 'lucide-react';

const Portal = ({ children }) => {
     const [mounted, setMounted] = React.useState(false);
     React.useEffect(() => setMounted(true), []);
     if (!mounted) return null;
     return createPortal(children, document.body);
};

const SelectionOverlay = ({ title, items, currentId, onSelect, onClose, icon: Icon }) => (
     <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
               <div className="flex max-h-[80vh] w-full max-w-[360px] flex-col rounded-card bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3">
                         <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-brand-accent" />
                              <span className="text-base font-black text-brand-ink">{title}</span>
                         </div>
                         <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-surface-muted">
                              <X className="h-5 w-5" />
                         </button>
                    </div>
                    <div className="space-y-2 overflow-y-auto pr-1">
                         {items.map((item) => (
                              <button
                                   key={item.id}
                                   type="button"
                                   onClick={() => {
                                        onSelect(item.id);
                                        onClose();
                                   }}
                                   className={`w-full rounded-xl border p-4 text-left transition-all ${item.id === currentId
                                        ? 'border-brand bg-brand text-white'
                                        : 'border-surface-border bg-white text-slate-600 hover:bg-surface-muted'
                                        }`}
                              >
                                   <div className="flex items-center justify-between gap-3">
                                        <div>
                                             <p className="font-black">{item.name}</p>
                                             <p className={`mt-1 text-xs font-semibold ${item.id === currentId ? 'text-white/70' : 'text-slate-400'}`}>{item.description}</p>
                                        </div>
                                        {item.id === currentId && <Check className="h-5 w-5 text-brand-gold" />}
                                   </div>
                              </button>
                         ))}
                    </div>
               </div>
          </div>
     </Portal>
);

const subwayStations = [
     {
          id: 'gangnam',
          name: '강남역',
          description: '2호선 · 신분당선',
          lines: [
               { name: '2', color: 'bg-green-500', label: '2호선', eta: '2분', direction: '역삼 방면' },
               { name: '신분당', color: 'bg-red-500', label: '신분당선', eta: '4분', direction: '양재 방면' },
          ],
          stops: ['신논현', '강남', '역삼', '선릉', '삼성'],
     },
     {
          id: 'sinnonhyeon',
          name: '신논현역',
          description: '9호선 · 신분당선',
          lines: [
               { name: '9', color: 'bg-amber-500', label: '9호선', eta: '3분', direction: '언주 방면' },
               { name: '신분당', color: 'bg-red-500', label: '신분당선', eta: '5분', direction: '강남 방면' },
          ],
          stops: ['사평', '신논현', '언주', '선정릉', '삼성중앙'],
     },
     {
          id: 'seolleung',
          name: '선릉역',
          description: '2호선 · 수인분당선',
          lines: [
               { name: '2', color: 'bg-green-500', label: '2호선', eta: '2분', direction: '삼성 방면' },
               { name: '분당', color: 'bg-yellow-500', label: '수인분당선', eta: '6분', direction: '한티 방면' },
          ],
          stops: ['역삼', '선릉', '삼성', '종합운동장', '잠실새내'],
     },
     {
          id: 'express-terminal',
          name: '고속터미널역',
          description: '3호선 · 7호선 · 9호선',
          lines: [
               { name: '3', color: 'bg-orange-500', label: '3호선', eta: '4분', direction: '교대 방면' },
               { name: '7', color: 'bg-emerald-700', label: '7호선', eta: '5분', direction: '논현 방면' },
               { name: '9', color: 'bg-amber-500', label: '9호선', eta: '3분', direction: '신논현 방면' },
          ],
          stops: ['반포', '고속터미널', '사평', '신논현', '언주'],
     },
];

const busRoutes = [
     { id: '146', name: '146', type: '간선', description: '상계주공7단지 ↔ 강남역', stop: '강남역 11번출구', eta: '6분', next: '14분', direction: '역삼역 방면' },
     { id: '341', name: '341', type: '간선', description: '강동공영차고지 ↔ 강남역', stop: '강남역', eta: '9분', next: '17분', direction: '양재역 방면' },
     { id: '360', name: '360', type: '간선', description: '복정역 ↔ 여의도', stop: '역삼역', eta: '5분', next: '12분', direction: '강남역 방면' },
     { id: '9404', name: '9404', type: '광역', description: '분당 ↔ 강남역', stop: '강남역나라빌딩앞', eta: '8분', next: '18분', direction: '분당 방면' },
     { id: '6009', name: '6009', type: '공항', description: '인천공항 ↔ 강남역', stop: '신논현역', eta: '21분', next: '42분', direction: '인천공항 방면' },
];

const roadSegments = [
     { name: '테헤란로', status: '서행', speed: '24km/h', tone: 'bg-amber-500', width: '48%' },
     { name: '강남대로', status: '정체', speed: '16km/h', tone: 'bg-red-500', width: '32%' },
     { name: '올림픽대로', status: '원활', speed: '58km/h', tone: 'bg-green-500', width: '86%' },
];

const GangnamTraffic = ({ embedded = false }) => {
     const [stationId, setStationId] = useState('gangnam');
     const [busId, setBusId] = useState('146');
     const [isStationOpen, setIsStationOpen] = useState(false);
     const [isBusOpen, setIsBusOpen] = useState(false);

     const station = subwayStations.find((item) => item.id === stationId) || subwayStations[0];
     const bus = busRoutes.find((item) => item.id === busId) || busRoutes[0];

     return (
          <div className={`w-full ${embedded ? '' : 'rounded-card border border-surface-border bg-white p-5 shadow-soft'}`}>
               {isStationOpen && (
                    <SelectionOverlay
                         title="강남권 역 선택"
                         items={subwayStations}
                         currentId={stationId}
                         onSelect={setStationId}
                         onClose={() => setIsStationOpen(false)}
                         icon={Train}
                    />
               )}
               {isBusOpen && (
                    <SelectionOverlay
                         title="주요 버스 선택"
                         items={busRoutes}
                         currentId={busId}
                         onSelect={setBusId}
                         onClose={() => setIsBusOpen(false)}
                         icon={Bus}
                    />
               )}

               <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-black text-white">LIVE</span>
                         <h2 className="text-sm font-black tracking-tight text-brand-ink">강남 교통</h2>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">지하철 · 도로 · 버스</span>
               </div>

               <div className="space-y-3">
                    <button
                         type="button"
                         onClick={() => setIsStationOpen(true)}
                         className="w-full rounded-xl border border-surface-border bg-surface-muted p-3 text-left transition-all hover:bg-white"
                    >
                         <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                   <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                                        <Train className="h-4 w-4" />
                                   </div>
                                   <div>
                                        <div className="flex items-center gap-2">
                                             <p className="text-sm font-black text-brand-ink">{station.name}</p>
                                             <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{station.description}</p>
                                   </div>
                              </div>
                              <div className="text-right">
                                   <p className="text-[10px] font-bold text-slate-400">가장 빠른 도착</p>
                                   <p className="text-lg font-black text-brand-ink">{station.lines[0].eta}</p>
                              </div>
                         </div>

                         <div className="mb-3 grid gap-2">
                              {station.lines.map((line) => (
                                   <div key={line.label} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                                        <div className="flex items-center gap-2">
                                             <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${line.color}`}>{line.name}</span>
                                             <span className="text-xs font-bold text-slate-700">{line.label}</span>
                                             <span className="text-[11px] font-semibold text-slate-400">{line.direction}</span>
                                        </div>
                                        <span className="text-xs font-black text-brand-accent">{line.eta}</span>
                                   </div>
                              ))}
                         </div>

                         <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold text-slate-400 scrollbar-hide">
                              {station.stops.map((stop, index) => (
                                   <React.Fragment key={stop}>
                                        <span className={stop.replace(/\s/g, '') === station.name.replace('역', '').replace(/\s/g, '') ? 'text-brand-ink' : ''}>{stop}</span>
                                        {index < station.stops.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />}
                                   </React.Fragment>
                              ))}
                         </div>
                    </button>

                    <div className="rounded-xl border border-surface-border bg-white p-3">
                         <div className="mb-3 flex items-center gap-2">
                              <Car className="h-4 w-4 text-brand-accent" />
                              <p className="text-xs font-black text-brand-ink">주요 도로 흐름</p>
                         </div>
                         <div className="space-y-3">
                              {roadSegments.map((road) => (
                                   <div key={road.name}>
                                        <div className="mb-1 flex items-center justify-between">
                                             <span className="text-xs font-bold text-slate-700">{road.name}</span>
                                             <span className="text-[11px] font-black text-slate-500">{road.status} · {road.speed}</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                             <div className={`h-full rounded-full ${road.tone}`} style={{ width: road.width }} />
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </div>

                    <button
                         type="button"
                         onClick={() => setIsBusOpen(true)}
                         className="w-full rounded-xl border border-surface-border bg-surface-muted p-3 text-left transition-all hover:bg-white"
                    >
                         <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                   <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                                        <Bus className="h-4 w-4" />
                                   </div>
                                   <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                             <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-black text-white">{bus.type}</span>
                                             <p className="text-sm font-black text-brand-ink">{bus.name}</p>
                                             <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                        </div>
                                        <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{bus.description}</p>
                                        <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                             <MapPin className="h-3 w-3 text-brand-accent" />
                                             {bus.stop}
                                        </div>
                                   </div>
                              </div>
                              <div className="shrink-0 text-right">
                                   <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400">
                                        <Clock3 className="h-3 w-3" />
                                        도착 예정
                                   </div>
                                   <p className="mt-1 text-lg font-black text-brand-accent">{bus.eta}</p>
                                   <p className="text-[10px] font-semibold text-slate-400">다음 {bus.next}</p>
                              </div>
                         </div>
                         <div className="mt-3 rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-slate-500">
                              {bus.direction}
                         </div>
                    </button>
               </div>
          </div>
     );
};

export default GangnamTraffic;
