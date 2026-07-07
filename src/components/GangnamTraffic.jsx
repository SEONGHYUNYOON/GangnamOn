import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
     ArrowRight,
     Bus,
     Car,
     Check,
     ChevronDown,
     ExternalLink,
     MapPin,
     Navigation,
     Train,
     X,
} from 'lucide-react';

const Portal = ({ children }) => {
     const [mounted, setMounted] = React.useState(false);
     React.useEffect(() => setMounted(true), []);
     if (!mounted) return null;
     return createPortal(children, document.body);
};

const subwayStations = [
     {
          id: 'gangnam',
          name: '강남역',
          description: '2호선 · 신분당선',
          mapQuery: '강남역',
          lines: [
               {
                    id: 'gangnam-line2',
                    chip: '2',
                    color: 'bg-green-500',
                    label: '2호선',
                    directions: [
                         { toward: '역삼 · 선릉 · 삼성 방면', destination: '성수행', eta: '2분', next: '6분', platform: '내선순환 승강장' },
                         { toward: '교대 · 서초 · 방배 방면', destination: '신도림행', eta: '4분', next: '9분', platform: '외선순환 승강장' },
                    ],
                    transfer: '신분당선 환승은 지하 2층 환승통로 이용',
               },
               {
                    id: 'gangnam-shinbundang',
                    chip: '신분당',
                    color: 'bg-red-500',
                    label: '신분당선',
                    directions: [
                         { toward: '신논현 · 논현 · 신사 방면', destination: '신사행', eta: '3분', next: '8분', platform: '상행 승강장' },
                         { toward: '양재 · 판교 · 광교 방면', destination: '광교행', eta: '5분', next: '11분', platform: '하행 승강장' },
                    ],
                    transfer: '2호선 환승 및 강남대로 출구 이동 수요가 많음',
               },
          ],
          stops: ['신논현', '강남', '양재', '양재시민의숲', '청계산입구'],
     },
     {
          id: 'sinnonhyeon',
          name: '신논현역',
          description: '9호선 · 신분당선',
          mapQuery: '신논현역',
          lines: [
               {
                    id: 'sinnonhyeon-line9',
                    chip: '9',
                    color: 'bg-amber-500',
                    label: '9호선',
                    directions: [
                         { toward: '고속터미널 · 동작 · 김포공항 방면', destination: '김포공항행', eta: '3분', next: '7분', platform: '상행 승강장' },
                         { toward: '언주 · 선정릉 · 중앙보훈병원 방면', destination: '중앙보훈병원행', eta: '4분', next: '8분', platform: '하행 승강장' },
                    ],
                    transfer: '급행 정차 여부를 현장 전광판에서 확인',
               },
               {
                    id: 'sinnonhyeon-shinbundang',
                    chip: '신분당',
                    color: 'bg-red-500',
                    label: '신분당선',
                    directions: [
                         { toward: '논현 · 신사 방면', destination: '신사행', eta: '4분', next: '9분', platform: '상행 승강장' },
                         { toward: '강남 · 양재 · 판교 · 광교 방면', destination: '광교행', eta: '5분', next: '10분', platform: '하행 승강장' },
                    ],
                    transfer: '강남역보다 북쪽 이동 시 신논현 승차가 유리',
               },
          ],
          stops: ['사평', '신논현', '언주', '선정릉', '삼성중앙'],
     },
     {
          id: 'seolleung',
          name: '선릉역',
          description: '2호선 · 수인분당선',
          mapQuery: '선릉역',
          lines: [
               {
                    id: 'seolleung-line2',
                    chip: '2',
                    color: 'bg-green-500',
                    label: '2호선',
                    directions: [
                         { toward: '삼성 · 종합운동장 · 잠실 방면', destination: '성수행', eta: '2분', next: '5분', platform: '내선순환 승강장' },
                         { toward: '역삼 · 강남 · 교대 방면', destination: '신도림행', eta: '4분', next: '8분', platform: '외선순환 승강장' },
                    ],
                    transfer: '수인분당선 환승 동선은 출근 시간 혼잡',
               },
               {
                    id: 'seolleung-bundang',
                    chip: '분당',
                    color: 'bg-yellow-500',
                    label: '수인분당선',
                    directions: [
                         { toward: '선정릉 · 강남구청 · 왕십리 방면', destination: '왕십리행', eta: '6분', next: '13분', platform: '상행 승강장' },
                         { toward: '한티 · 도곡 · 수서 · 죽전 방면', destination: '죽전행', eta: '5분', next: '12분', platform: '하행 승강장' },
                    ],
                    transfer: '테헤란로 동쪽 이동 시 선릉역 환승 효율 높음',
               },
          ],
          stops: ['역삼', '선릉', '삼성', '종합운동장', '잠실새내'],
     },
     {
          id: 'express-terminal',
          name: '고속터미널역',
          description: '3호선 · 7호선 · 9호선',
          mapQuery: '고속터미널역',
          lines: [
               {
                    id: 'terminal-line3',
                    chip: '3',
                    color: 'bg-orange-500',
                    label: '3호선',
                    directions: [
                         { toward: '잠원 · 압구정 · 옥수 방면', destination: '대화행', eta: '4분', next: '9분', platform: '상행 승강장' },
                         { toward: '교대 · 남부터미널 · 양재 방면', destination: '오금행', eta: '5분', next: '10분', platform: '하행 승강장' },
                    ],
                    transfer: '강남 북서권 이동과 고속버스 환승 거점',
               },
               {
                    id: 'terminal-line7',
                    chip: '7',
                    color: 'bg-emerald-700',
                    label: '7호선',
                    directions: [
                         { toward: '반포 · 논현 · 강남구청 방면', destination: '장암행', eta: '5분', next: '11분', platform: '상행 승강장' },
                         { toward: '내방 · 이수 · 상도 방면', destination: '석남행', eta: '6분', next: '13분', platform: '하행 승강장' },
                    ],
                    transfer: '논현·청담 이동 시 7호선 이용',
               },
               {
                    id: 'terminal-line9',
                    chip: '9',
                    color: 'bg-amber-500',
                    label: '9호선',
                    directions: [
                         { toward: '신반포 · 동작 · 김포공항 방면', destination: '김포공항행', eta: '3분', next: '8분', platform: '상행 승강장' },
                         { toward: '사평 · 신논현 · 선정릉 방면', destination: '중앙보훈병원행', eta: '4분', next: '9분', platform: '하행 승강장' },
                    ],
                    transfer: '신논현·선정릉 이동은 9호선이 가장 직접적',
               },
          ],
          stops: ['반포', '고속터미널', '사평', '신논현', '언주'],
     },
];

const busRoutes = [
     {
          id: '146',
          name: '146',
          type: '간선',
          description: '상계주공7단지 ↔ 강남역',
          stop: '강남역 11번출구 중앙차로',
          stopId: '22011',
          direction: '역삼역 · 선릉역 방면',
          opposite: '신논현역 · 논현역 방면',
          eta: '6분',
          next: '14분',
          route: ['강남역', '역삼역', '선릉역', '삼성역'],
     },
     {
          id: '341',
          name: '341',
          type: '간선',
          description: '강동공영차고지 ↔ 강남역',
          stop: '강남역 서초현대타워 앞',
          stopId: '22173',
          direction: '양재역 · 도곡동 방면',
          opposite: '신논현역 · 논현역 방면',
          eta: '9분',
          next: '17분',
          route: ['강남역', '양재역', '매봉역', '도곡동'],
     },
     {
          id: '360',
          name: '360',
          type: '간선',
          description: '복정역 ↔ 여의도',
          stop: '역삼역 포스코타워 앞',
          stopId: '23285',
          direction: '강남역 · 신논현역 방면',
          opposite: '선릉역 · 삼성역 방면',
          eta: '5분',
          next: '12분',
          route: ['역삼역', '강남역', '신논현역', '고속터미널'],
     },
     {
          id: '9404',
          name: '9404',
          type: '광역',
          description: '분당 ↔ 강남역',
          stop: '강남역나라빌딩앞',
          stopId: '22009',
          direction: '판교 · 분당 방면',
          opposite: '신논현 · 논현 방면',
          eta: '8분',
          next: '18분',
          route: ['강남역', '양재역', '판교역', '서현역'],
     },
     {
          id: '6009',
          name: '6009',
          type: '공항',
          description: '인천공항 T2 ↔ 신논현 · 강남역',
          stop: '신논현역 4번출구 공항버스 정류장',
          stopId: '22793',
          direction: '인천공항 제1·2터미널 방면',
          opposite: '강남역 · 역삼동 방면',
          eta: '21분',
          next: '42분',
          route: ['신논현역', '논현역', '인천공항T1', '인천공항T2'],
     },
];

const roadSegments = [
     {
          name: '테헤란로',
          directions: [
               { label: '강남역 → 선릉·삼성', status: '서행', speed: '24km/h', tone: 'bg-amber-500', width: '48%', note: '역삼역 사거리 전후 정체' },
               { label: '삼성 → 선릉·강남역', status: '정체', speed: '18km/h', tone: 'bg-red-500', width: '36%', note: '선릉역 접근 구간 지체' },
          ],
     },
     {
          name: '강남대로',
          directions: [
               { label: '신논현 → 양재', status: '정체', speed: '16km/h', tone: 'bg-red-500', width: '32%', note: '강남역 교차로 신호 대기 길음' },
               { label: '양재 → 신논현', status: '서행', speed: '22km/h', tone: 'bg-amber-500', width: '44%', note: '뱅뱅사거리 이후 흐름 회복' },
          ],
     },
     {
          name: '올림픽대로',
          directions: [
               { label: '잠실 → 반포', status: '원활', speed: '58km/h', tone: 'bg-green-500', width: '86%', note: '한남대교 진입 전까지 원활' },
               { label: '반포 → 잠실', status: '서행', speed: '34km/h', tone: 'bg-amber-500', width: '62%', note: '청담대교 합류부 주의' },
          ],
     },
];

const SelectionOverlay = ({ title, items, currentId, onSelect, onClose, icon: Icon }) => (
     <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
               <div className="flex max-h-[80vh] w-full max-w-[420px] flex-col rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3">
                         <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-brand-accent" />
                              <span className="text-base font-black text-brand-ink">{title}</span>
                         </div>
                         <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-surface-muted" aria-label="닫기">
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

const DetailOverlay = ({ title, subtitle, children, onClose, mapQuery }) => (
     <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
               <div className="w-full max-w-[520px] rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-4 flex items-start justify-between gap-4 border-b border-surface-border pb-4">
                         <div>
                              <h3 className="text-lg font-black text-brand-ink">{title}</h3>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
                         </div>
                         <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-surface-muted" aria-label="닫기">
                              <X className="h-5 w-5" />
                         </button>
                    </div>
                    {children}
                    {mapQuery && (
                         <a
                              href={`https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-black text-white transition-colors hover:bg-brand-ink"
                         >
                              카카오맵에서 위치 확인
                              <ExternalLink className="h-4 w-4" />
                         </a>
                    )}
               </div>
          </div>
     </Portal>
);

const GangnamTraffic = ({ embedded = false }) => {
     const [stationId, setStationId] = useState('gangnam');
     const [busId, setBusId] = useState('146');
     const [isStationOpen, setIsStationOpen] = useState(false);
     const [isBusOpen, setIsBusOpen] = useState(false);
     const [lineDetail, setLineDetail] = useState(null);
     const [busDetail, setBusDetail] = useState(false);
     const [roadDetail, setRoadDetail] = useState(null);

     const station = subwayStations.find((item) => item.id === stationId) || subwayStations[0];
     const bus = busRoutes.find((item) => item.id === busId) || busRoutes[0];

     const fastest = useMemo(() => {
          const allDirections = station.lines.flatMap((line) => line.directions.map((direction) => ({ line, direction })));
          return allDirections.sort((a, b) => parseInt(a.direction.eta, 10) - parseInt(b.direction.eta, 10))[0];
     }, [station]);

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
               {lineDetail && (
                    <DetailOverlay
                         title={`${lineDetail.station.name} ${lineDetail.line.label}`}
                         subtitle="양방향 도착 예정 · 승강장 · 환승 참고"
                         onClose={() => setLineDetail(null)}
                         mapQuery={`${lineDetail.station.name} ${lineDetail.line.label}`}
                    >
                         <div className="space-y-3">
                              {lineDetail.line.directions.map((direction) => (
                                   <div key={direction.toward} className="rounded-xl border border-surface-border bg-surface-muted p-4">
                                        <div className="flex items-center justify-between gap-3">
                                             <div>
                                                  <p className="text-sm font-black text-brand-ink">{direction.toward}</p>
                                                  <p className="mt-1 text-xs font-semibold text-slate-500">{direction.platform} · {direction.destination}</p>
                                             </div>
                                             <div className="text-right">
                                                  <p className="text-lg font-black text-brand-accent">{direction.eta}</p>
                                                  <p className="text-[11px] font-semibold text-slate-400">다음 {direction.next}</p>
                                             </div>
                                        </div>
                                   </div>
                              ))}
                              <div className="rounded-xl bg-brand-light p-4 text-xs font-bold leading-relaxed text-brand-ink">
                                   {lineDetail.line.transfer}
                              </div>
                         </div>
                    </DetailOverlay>
               )}
               {busDetail && (
                    <DetailOverlay
                         title={`${bus.type} ${bus.name}`}
                         subtitle={`${bus.stop} · 정류장 ID ${bus.stopId}`}
                         onClose={() => setBusDetail(false)}
                         mapQuery={`${bus.stop} ${bus.name}`}
                    >
                         <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                   <div className="rounded-xl border border-surface-border bg-surface-muted p-4">
                                        <p className="text-[11px] font-black text-slate-400">현재 선택 방향</p>
                                        <p className="mt-1 text-sm font-black text-brand-ink">{bus.direction}</p>
                                        <p className="mt-2 text-lg font-black text-brand-accent">{bus.eta}</p>
                                   </div>
                                   <div className="rounded-xl border border-surface-border bg-white p-4">
                                        <p className="text-[11px] font-black text-slate-400">반대 방향</p>
                                        <p className="mt-1 text-sm font-black text-brand-ink">{bus.opposite}</p>
                                        <p className="mt-2 text-xs font-bold text-slate-500">정류장 위치 확인 필요</p>
                                   </div>
                              </div>
                              <div className="rounded-xl border border-surface-border bg-white p-4">
                                   <p className="mb-3 text-xs font-black text-brand-ink">주요 경유</p>
                                   <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold text-slate-500">
                                        {bus.route.map((stop, index) => (
                                             <React.Fragment key={stop}>
                                                  <span>{stop}</span>
                                                  {index < bus.route.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />}
                                             </React.Fragment>
                                        ))}
                                   </div>
                              </div>
                         </div>
                    </DetailOverlay>
               )}
               {roadDetail && (
                    <DetailOverlay
                         title={roadDetail.name}
                         subtitle="양방향 도로 흐름"
                         onClose={() => setRoadDetail(null)}
                         mapQuery={`${roadDetail.name} 강남`}
                    >
                         <div className="space-y-3">
                              {roadDetail.directions.map((direction) => (
                                   <div key={direction.label} className="rounded-xl border border-surface-border bg-surface-muted p-4">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                             <p className="text-sm font-black text-brand-ink">{direction.label}</p>
                                             <p className="text-sm font-black text-slate-600">{direction.status} · {direction.speed}</p>
                                        </div>
                                        <div className="mb-2 h-2 overflow-hidden rounded-full bg-white">
                                             <div className={`h-full rounded-full ${direction.tone}`} style={{ width: direction.width }} />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-500">{direction.note}</p>
                                   </div>
                              ))}
                         </div>
                    </DetailOverlay>
               )}

               <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-black text-white">LIVE</span>
                         <h2 className="text-sm font-black tracking-tight text-brand-ink">강남 교통</h2>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">지하철 · 도로 · 버스</span>
               </div>

               <div className="space-y-3">
                    <div className="rounded-xl border border-surface-border bg-surface-muted p-3">
                         <button type="button" onClick={() => setIsStationOpen(true)} className="mb-3 flex w-full items-start justify-between gap-3 text-left">
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
                                   <p className="text-lg font-black text-brand-ink">{fastest.direction.eta}</p>
                              </div>
                         </button>

                         <div className="mb-3 grid gap-2">
                              {station.lines.map((line) => (
                                   <button
                                        key={line.id}
                                        type="button"
                                        onClick={() => setLineDetail({ station, line })}
                                        className="rounded-lg bg-white px-3 py-2 text-left transition-colors hover:bg-brand-light"
                                   >
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                             <div className="flex items-center gap-2">
                                                  <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${line.color}`}>{line.chip}</span>
                                                  <span className="text-xs font-black text-slate-700">{line.label}</span>
                                             </div>
                                             <span className="text-[10px] font-black text-brand-accent">상세</span>
                                        </div>
                                        <div className="grid gap-1.5">
                                             {line.directions.map((direction) => (
                                                  <div key={direction.toward} className="flex items-center justify-between gap-3 text-[11px]">
                                                       <span className="truncate font-semibold text-slate-500">{direction.toward}</span>
                                                       <span className="shrink-0 font-black text-brand-ink">{direction.eta}</span>
                                                  </div>
                                             ))}
                                        </div>
                                   </button>
                              ))}
                         </div>

                         <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold text-slate-400 scrollbar-hide">
                              {station.stops.map((stop, index) => (
                                   <React.Fragment key={stop}>
                                        <span className={stop === station.name.replace('역', '') ? 'text-brand-ink' : ''}>{stop}</span>
                                        {index < station.stops.length - 1 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />}
                                   </React.Fragment>
                              ))}
                         </div>
                    </div>

                    <div className="rounded-xl border border-surface-border bg-white p-3">
                         <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                   <Car className="h-4 w-4 text-brand-accent" />
                                   <p className="text-xs font-black text-brand-ink">주요 도로 흐름</p>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">양방향</span>
                         </div>
                         <div className="space-y-3">
                              {roadSegments.map((road) => {
                                   const slowest = road.directions[0];
                                   return (
                                        <button key={road.name} type="button" onClick={() => setRoadDetail(road)} className="w-full text-left">
                                             <div className="mb-1 flex items-center justify-between">
                                                  <span className="text-xs font-bold text-slate-700">{road.name}</span>
                                                  <span className="text-[11px] font-black text-slate-500">{slowest.status} · {slowest.speed}</span>
                                             </div>
                                             <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                  <div className={`h-full rounded-full ${slowest.tone}`} style={{ width: slowest.width }} />
                                             </div>
                                             <p className="truncate text-[10px] font-semibold text-slate-400">{slowest.label}</p>
                                        </button>
                                   );
                              })}
                         </div>
                    </div>

                    <div className="rounded-xl border border-surface-border bg-surface-muted p-3">
                         <button type="button" onClick={() => setIsBusOpen(true)} className="mb-3 flex w-full items-start justify-between gap-3 text-left">
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
                                   </div>
                              </div>
                              <div className="shrink-0 text-right">
                                   <p className="text-[10px] font-bold text-slate-400">도착 예정</p>
                                   <p className="mt-1 text-lg font-black text-brand-accent">{bus.eta}</p>
                              </div>
                         </button>
                         <button type="button" onClick={() => setBusDetail(true)} className="w-full rounded-lg bg-white px-3 py-2 text-left transition-colors hover:bg-brand-light">
                              <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-slate-600">
                                   <MapPin className="h-3 w-3 text-brand-accent" />
                                   <span className="truncate">{bus.stop}</span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                   <div className="flex min-w-0 items-center gap-1 text-[11px] font-semibold text-slate-500">
                                        <Navigation className="h-3 w-3 shrink-0 text-slate-400" />
                                        <span className="truncate">{bus.direction}</span>
                                   </div>
                                   <span className="shrink-0 text-[10px] font-black text-brand-accent">상세</span>
                              </div>
                         </button>
                    </div>
               </div>
          </div>
     );
};

export default GangnamTraffic;
