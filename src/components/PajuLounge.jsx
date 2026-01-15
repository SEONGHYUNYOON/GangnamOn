import React, { useState, useEffect } from 'react';
import { Zap, Send, Gamepad2, ArrowLeft } from 'lucide-react';
import PajuBlockGame from './PajuBlockGame';
import PajuTarot from './PajuTarot';


const PajuLounge = ({ onExit, user }) => {
     const [activeFeature, setActiveFeature] = useState(null); // 'balance', 'mbti', 'chat', 'bingo', 'block'

     // Handle Browser Back Button
     useEffect(() => {
          // Sync state on mount (in case we navigated forward/back to here)
          const currentFeature = window.history.state?.feature || null;
          setActiveFeature(currentFeature);

          const handlePopState = (event) => {
               // Sync with history state
               const feature = event.state?.feature || null;
               setActiveFeature(feature);
          };

          window.addEventListener('popstate', handlePopState);
          return () => window.removeEventListener('popstate', handlePopState);
     }, []);

     const handleOpenFeature = (feature) => {
          // Push state so back button works.
          // We use standard 'tab' key so App.jsx's popstate handler can recognize it if needed.
          // But predominantly, this component's own popstate listener will catch it first if mounted.
          window.history.pushState({ tab: 'paju_lounge', feature }, '', '');
          setActiveFeature(feature);
     };

     const handleCloseFeature = () => {
          // If we are closing via UI button, go back to remove the history state
          // This will trigger popstate, which sets activeFeature(null)
          // But to be safe and immediate, we can check history length or just back.
          // Using history.back() is the correct way to reverse pushState.
          window.history.back();
     };

     // === MBTI STATE ===
     const [mbtiStep, setMbtiStep] = useState(0);
     const [mbtiScores, setMbtiScores] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
     const [mbtiResult, setMbtiResult] = useState(null);

     const mbtiQuestions = [
          // PART 1. E vs I
          { q: "평일 내내 야근으로 지친 금요일 저녁, 나의 선택은?", a: { text: "피곤할수록 놀아야지! 친구들과 맥주 한잔하러 나간다.", type: "E" }, b: { text: "일단 집으로. 씻고 누워서 좋아하는 유튜브 보며 쉰다.", type: "I" } },
          { q: "새로운 모임(동호회)에 처음 나간 날, 나는?", a: { text: "먼저 사람들에게 다가가 인사하고 대화를 주도한다.", type: "E" }, b: { text: "누군가 말을 걸어줄 때까지 기다리거나 조용히 분위기를 살핀다.", type: "I" } },
          { q: "갑자기 친구가 '지금 당장 나와!'라고 불렀을 때?", a: { text: "'오, 무슨 일이야? 어디로 가면 돼?' (설렘/신남)", type: "E" }, b: { text: "'갑자기? 나 지금 좀...' (부담/귀찮음)", type: "I" } },
          { q: "자주 가는 카페, 사장님이 나를 알아보고 서비스를 주셨다.", a: { text: "'우와 사장님 감사합니다! 이거 진짜 맛있네요!' 폭풍 리액션.", type: "E" }, b: { text: "'아... 감사합니다 ㅎㅎ' (감동했지만 표현은 소심하게)", type: "I" } },
          { q: "내 핸드폰의 연락처 목록이나 카톡 친구 수는?", a: { text: "아주 많다. 얕고 넓은 인맥도 소중하다.", type: "E" }, b: { text: "정예 멤버만 있다. 깊고 좁은 관계가 편하다.", type: "I" } },
          { q: "엘리베이터에서 이웃 주민과 마주쳤을 때?", a: { text: "'안녕하세요~ 날씨 춥죠?' 가볍게 스몰토크를 건넨다.", type: "E" }, b: { text: "가볍게 목례만 하고 층수가 바뀌길 기다린다.", type: "I" } },
          { q: "파티나 회식 자리에서 나의 위치는?", a: { text: "분위기의 중심. 테이블을 옮겨 다니며 건배 제의를 한다.", type: "E" }, b: { text: "구석 자리. 친한 동료 한두 명과 조용히 이야기한다.", type: "I" } },

          // PART 2. S vs N
          { q: "멍 때릴 때 나의 머릿속은?", a: { text: "아무 생각 없다. 그냥 멍... 하니 있는다.", type: "S" }, b: { text: "'만약 좀비가 나타나면?', '로또 당첨되면 뭐 하지?' 등 상상의 나래를 펼친다.", type: "N" } },
          { q: "식당을 고를 때 더 신뢰하는 정보는?", a: { text: "구체적인 데이터 (별점 4.5점, 재방문율 80%, 가격 합리적).", type: "S" }, b: { text: "느낌적인 느낌 ('사장님의 철학이 느껴짐', '분위기가 미쳤음').", type: "N" } },
          { q: "영화를 보고 나서 친구가 '어땠어?'라고 물으면?", a: { text: "'주인공이 범인을 잡는 장면이 실감 나더라. 액션이 좋았어.' (장면/사실 묘사)", type: "S" }, b: { text: "'주인공의 고독함이 현대인의 소외를 보여주는 것 같았어.' (의미/해석 부여)", type: "N" } },
          { q: "요리를 할 때 나는?", a: { text: "레시피 정량 그대로 계량해서 넣는다.", type: "S" }, b: { text: "대충 눈대중으로 '이 정도 넣으면 맛있겠지' 하고 넣는다.", type: "N" } },
          { q: "길을 설명할 때 나는?", a: { text: "'300m 직진해서 편의점 끼고 우회전해.' (구체적 지형지물)", type: "S" }, b: { text: "'쭉 가다가 느낌 쎄한 골목 나오면 꺾어.' (감각적 설명)", type: "N" } },
          { q: "'사과'라는 단어를 들으면 떠오르는 것은?", a: { text: "빨갛다, 맛있다, 둥글다.", type: "S" }, b: { text: "백설공주, 애플(아이폰), 뉴턴, 유혹.", type: "N" } },
          { q: "새로운 일을 시작할 때 선호하는 방식은?", a: { text: "이미 검증된 방법과 매뉴얼을 따른다.", type: "S" }, b: { text: "나만의 새롭고 독창적인 방법을 시도해 본다.", type: "N" } },

          // PART 3. T vs F
          { q: "친구가 '나 차 사고 났어...'라고 전화했을 때 첫 마디는?", a: { text: "'보험사는 불렀어? 과실은 어떻게 나왔어?' (해결 중심)", type: "T" }, b: { text: "'헐! 몸은 괜찮아? 안 다쳤어? ㅠㅠ' (공감 중심)", type: "F" } },
          { q: "누군가와 논쟁할 때 나는?", a: { text: "상대방의 논리적 허점을 찾아내어 반박하는 편이다.", type: "T" }, b: { text: "상대방의 기분이 상하지 않게 돌려서 말하거나 참는 편이다.", type: "F" } },
          { q: "친구가 '나 살찐 것 같지?'라고 물어본다면?", a: { text: "'응, 얼굴이 좀 붓긴 했네. 야식 줄여.' (솔직)", type: "T" }, b: { text: "'아냐~ 옷이 좀 두꺼워서 그래. 전혀 안 쪄 보여!' (빈말이라도)", type: "F" } },
          { q: "나를 더 기분 좋게 하는 칭찬은?", a: { text: "'너 진짜 똑똑하다. 일 처리 정말 잘하네.' (능력 인정)", type: "T" }, b: { text: "'너 진짜 좋은 사람이야. 배려심이 깊어.' (인격 존중)", type: "F" } },
          { q: "고민 상담을 해줄 때 나는?", a: { text: "'그래서 결론이 뭐야? 이렇게 하면 해결되겠네.'", type: "T" }, b: { text: "'진짜 힘들었겠다... 그 사람 진짜 나쁘네.'", type: "F" } },
          { q: "상사가 부당하게 화를 낼 때 속마음은?", a: { text: "'저 말이 논리적으로 말이 되나? 근거가 없잖아.'", type: "T" }, b: { text: "'어떻게 말을 저렇게 심하게 하지? 상처받네...'", type: "F" } },
          { q: "의사결정을 내릴 때 가장 중요한 기준은?", a: { text: "무엇이 가장 효율적이고 합리적인가?", type: "T" }, b: { text: "이 결정이 다른 사람들에게 어떤 영향을 미치는가?", type: "F" } },

          // PART 4. J vs P
          { q: "여행 가기 전날, 짐 싸기 스타일은?", a: { text: "일주일 전부터 리스트를 짜고, 파우치별로 정리해서 넣는다.", type: "J" }, b: { text: "출발 직전에 눈에 보이는 대로 캐리어에 쓸어 담는다.", type: "P" } },
          { q: "데이트나 약속 장소를 정할 때?", a: { text: "맛집, 카페, 동선까지 미리 다 알아보고 예약한다.", type: "J" }, b: { text: "일단 만나서 '뭐 먹을래?' 하고 그날 땡기는 곳으로 간다.", type: "P" } },
          { q: "일이나 과제를 할 때 스타일은?", a: { text: "마감 기한에 맞춰 계획을 세우고 미리미리 해둔다.", type: "J" }, b: { text: "미루고 미루다가 마감 직전에 초인적인 힘으로 끝낸다.", type: "P" } },
          { q: "갑작스러운 일정 변경(친구가 늦음)이 생기면?", a: { text: "계획이 틀어져서 매우 스트레스받는다.", type: "J" }, b: { text: "'오, 그럼 그동안 서점이나 들르지 뭐~' 하고 여유롭게 넘긴다.", type: "P" } },
          { q: "내 컴퓨터 바탕화면이나 방 상태는?", a: { text: "폴더별로 깔끔하게 정리되어 있다.", type: "J" }, b: { text: "어디에 뭐가 있는지 나만 아는 혼돈의 상태다.", type: "P" } },
          { q: "쇼핑할 때 나는?", a: { text: "사야 할 물건 목록을 적어가서 그것만 산다.", type: "J" }, b: { text: "구경하다가 예쁘면 충동적으로 산다.", type: "P" } },
          { q: " '주말에 뭐 해?'라는 질문에 대한 대답은?", a: { text: "'오전엔 운동하고 오후엔 결혼식 갔다가 저녁엔 쉴 거야.' (구체적)", type: "J" }, b: { text: "'글쎄? 아마 집에서 쉴걸?' (유동적)", type: "P" } }
     ];

     const handleMbtiSelect = (type) => {
          setMbtiScores(prev => ({ ...prev, [type]: prev[type] + 1 }));
          // Increment step regardless of whether it's the last question.
          // When mbtiStep === mbtiQuestions.length, the Result View is rendered.
          setMbtiStep(prev => prev + 1);
     };

     const calculateResult = () => {
          setTimeout(() => {
               // Calc logic here or in getFinalMBTI
          }, 100);
     };

     const getFinalMBTI = () => {
          const { E, I, S, N, T, F, J, P } = mbtiScores;
          const r1 = E >= I ? 'E' : 'I';
          const r2 = S >= N ? 'S' : 'N';
          const r3 = T >= F ? 'T' : 'F';
          const r4 = J >= P ? 'J' : 'P';
          return r1 + r2 + r3 + r4;
     };

     // === BALANCE GAME STATE ===
     const [balanceVote, setBalanceVote] = useState(null); // 'A' or 'B'
     const [balanceStats, setBalanceStats] = useState({ a: 45, b: 55 });

     const handleBalanceVote = (option) => {
          setBalanceVote(option);
          // Mock stats update
          setBalanceStats(prev => option === 'A' ? ({ a: prev.a + 1, b: prev.b }) : ({ a: prev.a, b: prev.b + 1 }));
     };

     // === CHAT STATE ===
     const [messages, setMessages] = useState([
          { id: 1, text: "안녕하세요 파주 날씨 어떤가요?", type: "recv", time: "10:00" },
          { id: 2, text: "지금 운정엔 비 와요 ㅠㅠ", type: "recv", time: "10:01" },
          { id: 3, text: "금촌은 흐리기만 하네요", type: "recv", time: "10:02" },
     ]);
     const [chatInput, setChatInput] = useState("");

     const handleSendChat = (e) => {
          e.preventDefault();
          if (!chatInput.trim()) return;
          setMessages([...messages, { id: Date.now(), text: chatInput, type: "sent", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
          setChatInput("");
     };

     // === RENDER ===
     const renderContent = () => {
          if (activeFeature === 'block') {
               return <PajuBlockGame onClose={handleCloseFeature} user={user} />;
          }

          if (activeFeature === 'tarot') {
               return <PajuTarot onClose={handleCloseFeature} user={user} />;
          }

          if (activeFeature === 'balance') {
               return (
                    // ... (keep existing balance UI) ...
                    <div className="flex flex-col items-center justify-center p-6 animate-in slide-in-from-right max-w-2xl mx-auto h-full overflow-y-auto">
                         <div className="w-full flex justify-between items-center mb-8">
                              <button onClick={handleCloseFeature} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-500" /></button>
                              <h2 className="text-xl font-black text-gray-800">🔥 오늘의 밸런스</h2>
                              <div className="w-10" />
                         </div>

                         <div className="w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-30 -mr-20 -mt-20 pointer-events-none" />

                              <h3 className="text-2xl md:text-3xl font-black text-center text-gray-900 mb-8 leading-tight">
                                   탕수육 먹을 때...<br />
                                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">부먹 vs 찍먹?</span>
                              </h3>

                              <div className="flex gap-4 w-full h-48 md:h-60 mb-8 relative">
                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-white rounded-full p-2 shadow-lg z-10 border-4 border-gray-100">
                                             <span className="text-xl font-black text-gray-400 italic">VS</span>
                                        </div>
                                   </div>

                                   <button
                                        onClick={() => handleBalanceVote('A')}
                                        className={`flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 group
                                             ${balanceVote === 'A'
                                                  ? 'bg-blue-100 border-4 border-blue-500 text-blue-700 shadow-inner'
                                                  : 'bg-gray-50 border-2 border-transparent hover:bg-blue-50 hover:border-blue-200 hover:-translate-y-1 shadow-md'
                                             }`}
                                   >
                                        <div className="text-6xl md:text-7xl group-hover:scale-110 transition-transform">🥢</div>
                                        <div className="flex flex-col items-center">
                                             <span className="font-black text-xl md:text-2xl">찍먹</span>
                                             <span className="text-sm opacity-60 font-medium">소스는 찍어야 제맛</span>
                                        </div>
                                   </button>

                                   <button
                                        onClick={() => handleBalanceVote('B')}
                                        className={`flex-1 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 group
                                             ${balanceVote === 'B'
                                                  ? 'bg-red-100 border-4 border-red-500 text-red-700 shadow-inner'
                                                  : 'bg-gray-50 border-2 border-transparent hover:bg-red-50 hover:border-red-200 hover:-translate-y-1 shadow-md'
                                             }`}
                                   >
                                        <div className="text-6xl md:text-7xl group-hover:scale-110 transition-transform">🥘</div>
                                        <div className="flex flex-col items-center">
                                             <span className="font-black text-xl md:text-2xl">부먹</span>
                                             <span className="text-sm opacity-60 font-medium">촉촉하게 적셔먹기</span>
                                        </div>
                                   </button>
                              </div>

                              {balanceVote && (
                                   <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="relative h-12 bg-gray-100 rounded-full overflow-hidden shadow-inner p-1">
                                             <div className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-1000 ease-out flex items-center justify-start px-4 text-white font-black text-lg" style={{ width: `${balanceStats.a / (balanceStats.a + balanceStats.b) * 100}%` }}>
                                                  {Math.round(balanceStats.a / (balanceStats.a + balanceStats.b) * 100)}%
                                             </div>
                                             <div className="absolute inset-y-0 right-0 bg-red-500 transition-all duration-1000 ease-out flex items-center justify-end px-4 text-white font-black text-lg" style={{ width: `${balanceStats.b / (balanceStats.a + balanceStats.b) * 100}%` }}>
                                                  {Math.round(balanceStats.b / (balanceStats.a + balanceStats.b) * 100)}%
                                             </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                                             <p className="text-purple-600 font-bold mb-1">
                                                  {balanceVote === 'A' ? "크으~ 잘 아시네요! 탕수육은 찍먹이죠! 👍" : "오! 부먹파시군요! 촉촉한 매력을 아시는 분! 😋"}
                                             </p>
                                             <p className="text-xs text-gray-400">참여자 1,240명 • 의견 52개</p>
                                        </div>

                                        <div className="flex justify-center gap-2">
                                             <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50">실시간 댓글 보기</button>
                                             <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50">친구에게 공유</button>
                                        </div>
                                   </div>
                              )}
                         </div>
                    </div>
               );
          }

          if (activeFeature === 'mbti') {
               const totalSteps = mbtiQuestions.length;

               // Result View
               if (mbtiStep >= totalSteps) {
                    const result = getFinalMBTI();
                    const characterMap = {
                         'ESTJ': { animal: '🦁', title: '파주 보안관', desc: '지킬 건 지키는 원칙주의자! 파주의 평화는 내가 지킨다.' },
                         'ESTP': { animal: '🦅', title: '자유로의 독수리', desc: '스릴과 모험을 즐기는 당신! 오늘도 파주 곳곳을 누비네요.' },
                         'ESFJ': { animal: '🕊️', title: '파주 마당발', desc: '이웃집 숟가락 개수까지 아는 당신, 친화력 최고!' },
                         'ESFP': { animal: '🎉', title: '헤이리 인싸', desc: '어딜 가나 분위기 메이커! 당신 주변엔 늘 웃음이 끊이지 않아요.' },
                         'ENTJ': { animal: '👑', title: '운정 신도시주', desc: '큰 그림을 그리는 리더! 파주의 미래를 이끌어갈 야망가.' },
                         'ENTP': { animal: '💡', title: '출판단지 아이디어뱅크', desc: '기상천외한 아이디어로 모두를 놀라게 하는 창의력 대장!' },
                         'ENFJ': { animal: '☀️', title: '임진각 평화지킴이', desc: '따뜻한 마음으로 모두를 포용하는 당신은 파주의 힐러.' },
                         'ENFP': { animal: '🌈', title: '프로방스 몽상가', desc: '톡톡 튀는 매력의 소유자! 당신의 상상력엔 한계가 없어요.' },
                         'ISTJ': { animal: '🐢', title: '율곡 이이의 후예', desc: '신중하고 꼼꼼한 당신, 한 번 시작한 일은 끝을 보네요.' },
                         'ISTP': { animal: '🛠️', title: '공릉천 맥가이버', desc: '말보단 행동! 문제가 생기면 뚝딱 해결해내는 해결사.' },
                         'ISFJ': { animal: '🦌', title: '심학산 꽃사슴', desc: '조용하지만 세심한 배려심의 소유자. 진국이라는 소리 많이 듣죠?' },
                         'ISFP': { animal: '🎨', title: '헤이리 예술가', desc: '나만의 감성이 확실한 당신. 자유로운 영혼의 예술가 타입!' },
                         'INTJ': { animal: '🦉', title: '지혜의 숲 현자', desc: '남다른 통찰력으로 본질을 꿰뚫는 당신은 파주의 브레인.' },
                         'INTP': { animal: '🧪', title: '방구석 연구원', desc: '호기심 천국! 관심 있는 분야는 끝까지 파고드는 덕후 기질.' },
                         'INFJ': { animal: '🌌', title: 'DMZ 수호자', desc: '겉은 조용하지만 속은 단단한 당신. 신념이 확고하시군요.' },
                         'INFP': { animal: '☁️', title: '감성 시인', desc: '노을 지는 자유로를 보며 눈물 흘리는 풍부한 감수성의 소유자.' },
                    };

                    const char = characterMap[result] || characterMap['ESTJ']; // Fallback

                    return (
                         <div className="flex flex-col items-center justify-center p-6 animate-in zoom-in max-w-2xl mx-auto h-full overflow-y-auto">
                              <div className="w-full flex justify-between items-center mb-8">
                                   <button onClick={handleCloseFeature} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-500" /></button>
                                   <h2 className="text-xl font-black text-gray-800">결과 확인</h2>
                                   <div className="w-10" />
                              </div>

                              <div className="bg-white rounded-3xl shadow-xl p-10 w-full text-center border border-gray-100">
                                   <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg mx-auto text-5xl">
                                        {char.animal}
                                   </div>
                                   <h2 className="text-xl font-bold text-gray-400 mb-2">나의 파주 캐릭터는?</h2>
                                   <div className="text-2xl font-black text-purple-600 mb-2 tracking-widest">{result}</div>
                                   <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-6">{char.title}</h1>
                                   <div className="bg-orange-50 rounded-xl p-6 mb-8">
                                        <p className="text-gray-700 font-medium leading-relaxed">
                                             "{char.desc}"
                                        </p>
                                   </div>
                                   <div className="space-y-3">
                                        <button onClick={() => { setMbtiStep(0); setMbtiScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }); handleCloseFeature(); }} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg">
                                             라운지로 돌아가기
                                        </button>
                                        <button onClick={() => { setMbtiStep(0); setMbtiScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }); }} className="w-full py-4 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                                             다시 테스트하기
                                        </button>
                                   </div>
                              </div>
                         </div>
                    );
               }

               // Question View
               const q = mbtiQuestions[mbtiStep];
               if (!q) return null; // Safety check

               return (
                    <div className="flex flex-col p-6 max-w-2xl mx-auto h-full overflow-y-auto animate-in slide-in-from-right">
                         {/* Header with Back Button */}
                         <div className="w-full flex justify-between items-center mb-8">
                              <button onClick={handleCloseFeature} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-500" /></button>
                              <div className="flex flex-col items-center">
                                   <h2 className="text-lg font-black text-gray-800">나의 MBTI 테스트</h2>
                                   <span className="text-xs text-purple-600 font-bold">{mbtiStep + 1} / {totalSteps}</span>
                              </div>
                              <div className="w-10" />
                         </div>

                         <div className="w-full bg-gray-100 h-2 rounded-full mb-8">
                              <div className="bg-purple-600 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${((mbtiStep + 1) / totalSteps) * 100}%` }} />
                         </div>

                         <div className="flex-1 flex flex-col justify-center">
                              <span className="text-purple-600 font-black text-lg mb-4 block">Q{mbtiStep + 1}.</span>
                              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 leading-relaxed">
                                   {q.q}
                              </h2>
                              <div className="space-y-4 w-full">
                                   <button onClick={() => handleMbtiSelect(q.a.type)} className="w-full p-6 text-left bg-white border-2 border-gray-100 rounded-3xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-md transition-all group relative overflow-hidden">
                                        <span className="relative z-10 text-lg font-bold text-gray-700 group-hover:text-purple-700">{q.a.text}</span>
                                   </button>
                                   <button onClick={() => handleMbtiSelect(q.b.type)} className="w-full p-6 text-left bg-white border-2 border-gray-100 rounded-3xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-md transition-all group relative overflow-hidden">
                                        <span className="relative z-10 text-lg font-bold text-gray-700 group-hover:text-purple-700">{q.b.text}</span>
                                   </button>
                              </div>
                         </div>
                    </div>
               )
          }

          if (activeFeature === 'bingo') {
               // ... (keep existing bingo UI) ...
               return (
                    <div className="p-6 flex flex-col items-center">
                         <h2 className="text-2xl font-black text-gray-900 mb-2">매일매일 출석 빙고</h2>
                         <p className="text-gray-500 mb-8">빙고를 완성하고 커피 쿠폰 받아가세요!</p>
                         <div className="grid grid-cols-3 gap-3 mb-8">
                              {[...Array(9)].map((_, i) => (
                                   <div key={i} className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all cursor-pointer ${i === 4 || i === 0 ? 'bg-purple-500 border-purple-700 text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                                        {i === 4 || i === 0 ? '🎁' : i + 1}
                                   </div>
                              ))}
                         </div>
                         <button onClick={handleCloseFeature} className="text-gray-400 hover:text-gray-600 underline">돌아가기</button>
                    </div>
               )
          }

          if (activeFeature === 'chat') {
               // ... (keep existing chat UI) ...
               return (
                    <div className="flex flex-col h-full max-h-[600px]">
                         <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                              <div>
                                   <h2 className="font-bold text-lg flex items-center gap-2">🔥 실시간 파주 톡 <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">42명 접속중</span></h2>
                              </div>
                              <button onClick={handleCloseFeature} className="text-gray-400 hover:text-gray-600">
                                   나가기
                              </button>
                         </div>
                         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                              {messages.map(msg => (
                                   <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${msg.type === 'sent' ? 'bg-purple-500 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'}`}>
                                             {msg.text}
                                             <div className={`text-[10px] mt-1 text-right ${msg.type === 'sent' ? 'text-purple-200' : 'text-gray-400'}`}>{msg.time}</div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                         <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                              <input
                                   value={chatInput}
                                   onChange={e => setChatInput(e.target.value)}
                                   placeholder="메시지를 입력하세요..."
                                   className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <button type="submit" className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors">
                                   <Send className="w-4 h-4" />
                              </button>
                         </form>
                    </div>
               )
          }

          // DEFAULT DASHBOARD
          return (
               <div className="max-w-4xl mx-auto">
                    <div className="mb-10 text-center relative">
                         <button
                              onClick={onExit}
                              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors md:hidden"
                         >
                              <ArrowLeft className="w-6 h-6" />
                         </button>
                         <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center justify-center gap-3">
                              Paju Lounge <span className="text-4xl text-purple-600 animate-pulse">⚡️</span>
                         </h1>
                         <p className="text-gray-500 font-medium">
                              심심할 땐 여기로 모여라! 파주 사람들의 인터랙티브 놀이터
                         </p>
                    </div>




                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                         {/* 0. NEW: Paju Block Game */}
                         <div
                              onClick={() => handleOpenFeature('block')}
                              className="col-span-1 md:col-span-2 bg-gray-900 rounded-[2rem] p-8 shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden text-white border border-gray-800"
                         >
                              {/* Decorative Background */}
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0)_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,rgba(0,0,0,0)_50%,rgba(0,0,0,0)_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_100%)] bg-[length:20px_20px] opacity-20" />
                              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-30 -mr-20 -mt-20 group-hover:opacity-50 transition-opacity" />

                              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                                   <div className="flex text-center md:text-left flex-col items-center md:items-start">
                                        <div className="bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full inline-block mb-3 animate-bounce">NEW GAME!</div>
                                        <h3 className="text-3xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
                                             PAJU BLOCK <Gamepad2 className="w-8 h-8 text-purple-400" />
                                        </h3>
                                        <p className="text-gray-400 mb-6">90년대 오락실 감성 그대로!<br />실시간 랭킹에 도전하고 파주 짱이 되어보세요.</p>
                                        <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-purple-900/50 transition-all transform group-hover:scale-105">
                                             게임 시작하기 🕹️
                                        </button>
                                   </div>

                                   {/* Mini Leaderboard Preview */}
                                   <div className="bg-black/50 p-4 rounded-xl border border-white/10 w-full md:w-64 backdrop-blur-sm">
                                        <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Daily Rank Top 3</div>
                                        <div className="space-y-2">
                                             <div className="flex justify-between text-sm"><span className="text-yellow-400 font-bold">1. 파주불주먹</span> <span className="text-gray-400">12,500</span></div>
                                             <div className="flex justify-between text-sm"><span className="text-gray-300">2. 운정테트신</span> <span className="text-gray-500">10,200</span></div>
                                             <div className="flex justify-between text-sm"><span className="text-gray-300">3. 금촌고양이</span> <span className="text-gray-500">8,800</span></div>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         {/* 1. Balance Game */}
                         <div
                              onClick={() => handleOpenFeature('balance')}
                              className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden relative"
                         >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none" />
                              <div className="relative z-10">
                                   <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⚖️</div>
                                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">HOT</span>
                                   </div>
                                   <h3 className="text-2xl font-bold text-gray-900 mb-2">밸런스 게임</h3>
                                   <p className="text-gray-500 text-sm mb-4">매일 바뀌는 난제!<br />부먹 vs 찍먹, 당신의 선택은?</p>
                                   <div className="inline-flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                                        참여하기 <Zap className="w-4 h-4 ml-1" />
                                   </div>
                              </div>
                         </div>

                         {/* 2. MBTI */}
                         <div
                              onClick={() => handleOpenFeature('mbti')}
                              className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[2rem] p-8 shadow-lg shadow-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group text-white relative overflow-hidden"
                         >
                              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                              <div className="relative z-10">
                                   <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🧠</div>
                                   </div>
                                   <h3 className="text-2xl font-bold mb-2">나의 MBTI 테스트</h3>
                                   <p className="text-purple-100 text-sm mb-4">내 안에 숨겨진 파주 캐릭터 찾기!<br />총 28문항 (약 3분 소요)</p>
                                   <div className="inline-flex items-center text-white font-bold text-sm bg-white/20 px-4 py-2 rounded-full backdrop-blur-md group-hover:bg-white/30 transition-colors">
                                        테스트 시작
                                   </div>
                              </div>
                         </div>

                         {/* 3. NEW: Tarot Card */}
                         <div
                              onClick={() => handleOpenFeature('tarot')}
                              className="col-span-1 md:col-span-2 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 rounded-[2rem] p-8 shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group text-white relative overflow-hidden"
                         >
                              {/* Stars Background */}
                              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse" />
                              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10 pointer-events-none" />

                              <div className="relative z-10 flex flex-col items-center text-center">
                                   <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                        🔮
                                   </div>
                                   <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest mb-2 backdrop-blur-sm">NEW ARRIVAL</div>
                                   <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                                        오늘의 파주 타로 <span className="text-yellow-300">☪</span>
                                   </h3>
                                   <p className="text-purple-200 text-sm mb-6 max-w-sm">
                                        "연애, 금전, 오늘의 운세..."<br />
                                        신비로운 타로 카드가 당신에게 따뜻한 조언을 드려요.
                                   </p>
                                   <button className="bg-white text-purple-900 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-purple-50 transition-colors transform group-hover:scale-105">
                                        카드 뽑으러 가기 ✨
                                   </button>
                              </div>
                         </div>

                         {/* 3. Live Chat */}
                         <div
                              onClick={() => handleOpenFeature('chat')}
                              className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden relative"
                         >
                              <div className="absolute top-0 left-0 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-50 -ml-10 -mt-10 pointer-events-none" />
                              <div className="relative z-10">
                                   <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">💬</div>
                                        <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                             <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                             <span className="text-xs font-bold text-green-700">42명 접속중</span>
                                        </div>
                                   </div>
                                   <h3 className="text-2xl font-bold text-gray-900 mb-2">실시간 톡</h3>
                                   <p className="text-gray-500 text-sm mb-4">지금 접속 중인 이웃들과<br />가볍게 수다 떨어요!</p>
                              </div>
                         </div>

                         {/* 4. Bingo */}
                         <div
                              onClick={() => handleOpenFeature('bingo')}
                              className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden relative"
                         >
                              <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-100 rounded-full blur-3xl opacity-50 -mr-10 -mb-10 pointer-events-none" />
                              <div className="relative z-10">
                                   <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📅</div>
                                   </div>
                                   <h3 className="text-2xl font-bold text-gray-900 mb-2">출석 빙고</h3>
                                   <p className="text-gray-500 text-sm mb-4">매일매일 도장 쾅!<br />빙고 완성하고 경품 받자</p>
                                   <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className="w-2/3 h-full bg-pink-500" />
                                   </div>
                                   <p className="text-xs text-right text-pink-500 font-bold mt-1">오늘 미션 완료!</p>
                              </div>
                         </div>
                    </div>
               </div>
          );
     };

     return (
          <div className="min-h-full py-8 px-4 animate-in fade-in duration-500">
               {renderContent()}
          </div>
     );
};

export default PajuLounge;
