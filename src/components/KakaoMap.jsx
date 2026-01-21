import React, { useEffect, useRef } from "react";

const KakaoMap = ({ latitude, longitude, level = 3, style = { width: "100%", height: "200px" } }) => {
     const mapContainer = useRef(null);

     useEffect(() => {
          // Check if SDK is loaded
          if (!window.kakao) {
               const script = document.createElement("script");
               // IMPORTANT: Replace 'YOUR_APP_KEY' with process.env.VITE_KAKAO_MAP_API_KEY later, or instructions
               // For now, we assume user inserts their key or sets environment variable.
               // We will try to read from env if possible, else rely on manual insertion instructions.
               const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;

               script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
               script.async = true;

               script.onload = () => {
                    window.kakao.maps.load(() => {
                         initMap();
                    });
               };

               document.head.appendChild(script);
          } else {
               initMap();
          }

          function initMap() {
               if (!mapContainer.current) return;

               const options = {
                    center: new window.kakao.maps.LatLng(latitude, longitude),
                    level: level,
               };

               const map = new window.kakao.maps.Map(mapContainer.current, options);

               // Marker
               const markerPosition = new window.kakao.maps.LatLng(latitude, longitude);
               const marker = new window.kakao.maps.Marker({
                    position: markerPosition
               });
               marker.setMap(map);
          }
     }, [latitude, longitude]);

     if (!import.meta.env.VITE_KAKAO_MAP_API_KEY || import.meta.env.VITE_KAKAO_MAP_API_KEY === 'YOUR_KAKAO_JAVASCRIPT_KEY_HERE') {
          return (
               <div style={{ ...style, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.875rem', flexDirection: 'column', gap: '8px', padding: '16px', textAlign: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                    <div>
                         <b>카카오 지도 API 키가 필요합니다.</b><br />
                         <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">.env</code> 파일에 <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">VITE_KAKAO_MAP_API_KEY</code>를 설정해주세요.
                    </div>
               </div>
          )
     }

     return <div ref={mapContainer} style={style} className="rounded-xl overflow-hidden border border-gray-100 shadow-inner" />;
};

export default KakaoMap;
