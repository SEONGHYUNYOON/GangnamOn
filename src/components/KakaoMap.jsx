import React, { useEffect, useMemo, useRef, useState } from "react";

const KakaoMap = ({
     latitude,
     longitude,
     level = 3,
     style = { width: "100%", height: "200px" },
     label = "강남 위치",
     address = "서울 강남구",
     showActions = true
}) => {
     const mapContainer = useRef(null);
     const [mapStatus, setMapStatus] = useState("loading");

     const lat = Number(latitude) || 37.4979;
     const lng = Number(longitude) || 127.0276;
     const encodedLabel = encodeURIComponent(label || address || "Gangnam");
     const osmEmbedUrl = useMemo(() => {
          const delta = 0.006;
          const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
          return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
     }, [lat, lng]);
     const kakaoPlaceUrl = `https://map.kakao.com/link/map/${encodedLabel},${lat},${lng}`;
     const kakaoRouteUrl = `https://map.kakao.com/link/to/${encodedLabel},${lat},${lng}`;

     useEffect(() => {
          let cancelled = false;
          const fallbackTimer = window.setTimeout(() => {
               if (!cancelled) setMapStatus((current) => current === "loading" ? "fallback" : current);
          }, 3500);

          // Check if SDK is loaded
          if (!window.kakao) {
               const script = document.createElement("script");
               const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY || '18491109e5325b0265d25f02409539ee';

               script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
               script.async = true;

               script.onload = () => {
                    window.kakao.maps.load(() => {
                         if (!cancelled) initMap();
                    });
               };
               script.onerror = () => {
                    if (!cancelled) setMapStatus("fallback");
               };

               document.head.appendChild(script);
          } else {
               initMap();
          }

          function initMap() {
               if (!mapContainer.current) return;

               const options = {
                    center: new window.kakao.maps.LatLng(lat, lng),
                    level: level,
               };

               const map = new window.kakao.maps.Map(mapContainer.current, options);

               // Marker
               const markerPosition = new window.kakao.maps.LatLng(lat, lng);
               const marker = new window.kakao.maps.Marker({
                    position: markerPosition
               });
               marker.setMap(map);
               setMapStatus("kakao");
          }

          return () => {
               cancelled = true;
               window.clearTimeout(fallbackTimer);
          };
     }, [lat, lng, level]);

     return (
          <div style={style} className="relative overflow-hidden rounded-xl border border-surface-border bg-surface-muted shadow-inner">
               {mapStatus === "fallback" && (
                    <iframe
                         title={`${label} 지도`}
                         src={osmEmbedUrl}
                         className="h-full w-full border-0"
                         loading="lazy"
                         referrerPolicy="no-referrer-when-downgrade"
                    />
               )}
               <div ref={mapContainer} className={`h-full w-full ${mapStatus === "fallback" ? "hidden" : ""}`} />
               {mapStatus === "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-muted text-xs font-bold text-slate-400">
                         <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
                         지도를 불러오는 중
                    </div>
               )}
               <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    <div className="rounded-lg bg-white/95 px-3 py-2 shadow-soft backdrop-blur">
                         <p className="text-xs font-black text-brand-ink">{label}</p>
                         <p className="mt-0.5 max-w-[180px] truncate text-[10px] font-semibold text-slate-500">{address}</p>
                    </div>
                    <span className="rounded-full bg-brand px-2 py-1 text-[10px] font-black text-white">
                         {mapStatus === "kakao" ? "Kakao" : "Map"}
                    </span>
               </div>
               {showActions && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                         <a
                              href={kakaoPlaceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-white/95 px-3 py-2 text-[11px] font-black text-brand shadow-soft backdrop-blur hover:bg-white"
                         >
                              크게 보기
                         </a>
                         <a
                              href={kakaoRouteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-brand px-3 py-2 text-[11px] font-black text-white shadow-soft hover:bg-brand-dark"
                         >
                              길찾기
                         </a>
                    </div>
               )}
          </div>
     );
};

export default KakaoMap;
