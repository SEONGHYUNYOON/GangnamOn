/**
 * DB 등에 남아 있는 파주 관련 문자열을 화면 표시용으로 강남으로 치환합니다.
 * (가상 게시물/시드 데이터가 파주일 때 일관된 강남온 UI를 위해 사용)
 */
export function normalizeForGangnamDisplay(str) {
     if (str == null || typeof str !== 'string') return str;
     const replacements = [
          ['파주사랑꾼', '강남사랑꾼'],
          ['파주지킴이', '강남지킴이'],
          ['야당역_이자카야', '강남역_이자카야'],
          ['파주 운정', '강남 역삼'],
          ['파주 야당동', '강남 역삼동'],
          ['파주 교하', '강남 역삼'],
          ['운정댁', '역삼댁'],
          ['금촌사랑꾼', '강남사랑꾼'],
          ['문산토박이', '강남토박이'],
          ['운정', '역삼'],
          ['금촌', '강남'],
          ['야당', '강남'],
          ['교하', '신사'],
          ['문산', '논현'],
          ['파주', '강남']
     ];
     let s = str;
     for (const [from, to] of replacements) {
          s = s.split(from).join(to);
     }
     return s;
}
