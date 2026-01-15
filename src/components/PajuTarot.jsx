import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Heart, DollarSign, Clover, Share2, RefreshCw, Camera, Sun, Moon, Star, CloudRain, Zap, Anchor, Key, Gift, Music, Coffee, Smile, ThumbsUp, Map, Compass, Crown, Shield, Bell, Globe, Scale, Sprout, Droplet, Ghost, Book } from 'lucide-react';

const PajuTarot = ({ onClose, user }) => {
     const [step, setStep] = useState('topic'); // topic, shuffle, result
     const [selectedTopic, setSelectedTopic] = useState(null);
     const [isShuffling, setIsShuffling] = useState(false);
     const [selectedCardResult, setSelectedCardResult] = useState(null);

     // Full 22 Major Arcana Data
     const majorArcana = [
          {
               id: 0, name: "The Fool", Icon: Map, color: "text-sky-500", bg: "bg-sky-50",
               love: { k: "#새로운시작 #순수한사랑", m: "계산하지 않는 순수한 마음이 사랑을 불러일으키네요. 어린아이처럼 솔직하게 다가가 보세요! 🎒" },
               wealth: { k: "#모험 #뜻밖의지출", m: "새로운 분야에 도전하고 싶은 마음이 생기네요. 다만 충동구매는 조심해야 해요! 💸" },
               daily: { k: "#자유 #무계획", m: "가벼운 발걸음으로 새로운 여행을 떠나는 기분! 무거운 고민은 내려놓고 일단 저질러보는 건 어때요? 🕊️" }
          },
          {
               id: 1, name: "The Magician", Icon: Sparkles, color: "text-violet-600", bg: "bg-violet-50",
               love: { k: "#매력발산 #주도권", m: "당신의 매력이 폭발하는 날! 좋아하는 사람에게 먼저 말을 걸어도 좋아요. 주도권을 잡아보세요. ✨" },
               wealth: { k: "#능력발휘 #다재다능", m: "당신의 재능이 돈이 되는 시기입니다. 아이디어만 있다면 실현할 수 있는 능력이 충분해요! 🎩" },
               daily: { k: "#창의력 #시작", m: "당신은 뭐든지 할 수 있는 마법사예요! 오늘은 잠재된 능력을 마음껏 펼쳐보세요. 👌" }
          },
          {
               id: 2, name: "The High Priestess", Icon: Book, color: "text-indigo-600", bg: "bg-indigo-50",
               love: { k: "#신비주의 #짝사랑", m: "서두르지 마세요. 조용히 지켜보며 때를 기다리는 것이 좋습니다. 직관을 믿으세요. 🌙" },
               wealth: { k: "#문서운 #학업", m: "계약이나 공부 관련해서 좋은 기운이 있어요. 꼼꼼하게 따져보면 이득을 볼 수 있습니다. 📜" },
               daily: { k: "#직관 #지혜", m: "내면의 목소리에 귀를 기울여보세요. 남들의 조언보다 당신의 느낌이 정답일 거예요. 🤫" }
          },
          {
               id: 3, name: "The Empress", Icon: Crown, color: "text-rose-500", bg: "bg-rose-50",
               love: { k: "#매력적인 #결실", m: "사랑받기 충분한 하루예요. 당신의 따뜻한 배려가 상대방을 감동시킬 거예요. 👑" },
               wealth: { k: "#풍요 #보너스", m: "통장이 넉넉해지는 기분 좋은 소식이 있을 수 있어요. 맛있는 걸 먹으며 풍요를 즐기세요! 🍇" },
               daily: { k: "#편안함 #힐링", m: "오늘은 나를 위해 투자하는 날! 푹 쉬고 맛있는 음식을 먹으며 에너지를 충전하세요. 🛋️" }
          },
          {
               id: 4, name: "The Emperor", Icon: Shield, color: "text-red-700", bg: "bg-red-50",
               love: { k: "#리더십 #신뢰", m: "든든하고 책임감 있는 모습을 보여주세요. 상대방에게 큰 신뢰를 줄 수 있습니다. 🛡️" },
               wealth: { k: "#성공 #안정", m: "체계적인 계획이 성공을 부릅니다. 지금은 안정을 추구하고 기반을 다질 때예요. 🏛️" },
               daily: { k: "#책임감 #결단력", m: "망설이지 말고 결단을 내리세요. 당신의 확신에 찬 모습이 주변을 이끌 거예요. 🔥" }
          },
          {
               id: 5, name: "The Hierophant", Icon: Key, color: "text-emerald-700", bg: "bg-emerald-50",
               love: { k: "#신뢰 #약속", m: "서로에 대한 믿음이 깊어지는 날이에요. 진지한 대화나 약속을 하기에 좋습니다. 🤝" },
               wealth: { k: "#조언 #도움", m: "전문가나 윗사람의 조언을 들으면 금전적인 이득이 생길 수 있어요. 귀인을 찾아보세요. 🔑" },
               daily: { k: "#배움 #규칙", m: "원칙을 지키는 것이 마음 편한 날이에요. 오늘은 정석대로 가는 것이 지름길입니다. 📚" }
          },
          {
               id: 6, name: "The Lovers", Icon: Heart, color: "text-pink-500", bg: "bg-pink-50",
               love: { k: "#설렘가득 #선택", m: "두근거리는 설렘이 다가오고 있어요! 마음이 통하는 사람과 즐거운 시간을 보낼 수 있어요. 💕" },
               wealth: { k: "#파트너 #합작", m: "혼자보다는 함께할 때 시너지가 납니다. 동업이나 협력을 통해 수익을 창출해 보세요. 👩‍❤️‍👨" },
               daily: { k: "#조화 #매력", m: "오늘은 당신이 주인공! 어디서나 환대받는 기분 좋은 하루가 될 거예요. 🥰" }
          },
          {
               id: 7, name: "The Chariot", Icon: Zap, color: "text-blue-600", bg: "bg-blue-50",
               love: { k: "#직진 #쟁취", m: "밀당은 금물! 오늘은 솔직하게 직진하는 게 매력적이에요. 원하는 사랑을 쟁취하세요! 🏎️" },
               wealth: { k: "#추진력 #성과", m: "적극적으로 움직이면 큰 성과를 얻을 수 있어요. 망설이지 말고 목표를 향해 달리세요! 💪" },
               daily: { k: "#승리 #도전", m: "장애물이 있어도 거침없이 돌파할 수 있는 에너지가 넘쳐요. 오늘은 당신의 승리! 🏆" }
          },
          {
               id: 8, name: "Strength", Icon: Smile, color: "text-orange-500", bg: "bg-orange-50",
               love: { k: "#포용력 #인내", m: "부드러움이 강함을 이깁니다. 따뜻한 미소로 상대방의 마음을 무장해제 시켜보세요. 🦁" },
               wealth: { k: "#꾸준함 #관리", m: "지금은 버티는 힘이 재산이 됩니다. 꾸준히 관리하면 결국 당신의 것이 될 거예요. 🧘" },
               daily: { k: "#외유내강 #극복", m: "어떤 어려움도 웃으며 넘길 수 있는 내면의 힘이 있어요. 당신은 생각보다 강해요! 💪" }
          },
          {
               id: 9, name: "The Hermit", Icon: Compass, color: "text-slate-500", bg: "bg-slate-100",
               love: { k: "#신중함 #짝사랑", m: "혼자만의 시간이 필요한 때입니다. 짝사랑 중이라면 잠시 한 발짝 물러서서 관망해 보세요. 🕯️" },
               wealth: { k: "#연구 #절약", m: "돈을 쓰기보다는 공부하고 계획을 세울 때입니다. 지출을 줄이고 내실을 다지세요. 📉" },
               daily: { k: "#성찰 #지혜", m: "잠시 멈춰서 나 자신을 돌아보는 시간이 필요해요. 해답은 당신 안에 있습니다. 🧘‍♂️" }
          },
          {
               id: 10, name: "Wheel of Fortune", Icon: RefreshCw, color: "text-indigo-500", bg: "bg-indigo-50",
               love: { k: "#운명 #타이밍", m: "운명적인 만남이나 재회의 기운이 있어요. 흐름에 몸을 맡겨보세요. 타이밍이 좋습니다! 🎡" },
               wealth: { k: "#변화 #기회", m: "기분 좋은 변화의 바람이 불어오네요. 우연히 찾아온 기회가 금전운을 틔워줄 거예요. 🎰" },
               daily: { k: "#행운 #전환점", m: "풀리지 않던 일이 술술 풀릴 수 있는 행운의 날이에요. 긍정적인 마음을 가지세요! 🍀" }
          },
          {
               id: 11, name: "Justice", Icon: Scale, color: "text-cyan-600", bg: "bg-cyan-50",
               love: { k: "#균형 #이성적", m: "감정보다는 이성이 앞서는 날이네요. 서로 주고받는 것이 공평한지 생각해보게 될 수 있어요. ⚖️" },
               wealth: { k: "#계약 #정당한대가", m: "일한 만큼 정직한 대가가 들어옵니다. 요행을 바라기보단 정공법이 통하는 날이에요. 📝" },
               daily: { k: "#판단 #결정", m: "중요한 결정을 내려야 한다면 지금이 적기입니다. 객관적으로 상황을 바라보세요. ✔️" }
          },
          {
               id: 12, name: "The Hanged Man", Icon: Anchor, color: "text-teal-600", bg: "bg-teal-50",
               love: { k: "#기다림 #헌신", m: "지금은 억지로 움직이려 하지 말고 흐름을 지켜보세요. 때로는 멈춤이 더 큰 전진을 만듭니다. ⚓" },
               wealth: { k: "#인내 #투자", m: "당장의 수익보다는 미래를 보고 투자해야 할 때입니다. 조급해하지 마세요. ⏳" },
               daily: { k: "#관점전환 #희생", m: "다른 시각으로 문제를 바라보면 의외의 해결책이 보일 거예요. 🙃" }
          },
          {
               id: 13, name: "Death (Rebirth)", Icon: Sprout, color: "text-gray-800", bg: "bg-gray-100",
               love: { k: "#이별 #새출발", m: "끝은 곧 새로운 시작입니다. 낡은 감정을 정리하면 더 좋은 인연이 찾아올 거예요. 🌱" },
               wealth: { k: "#정리 #변화", m: "불필요한 지출, 안 좋은 습관을 끊어내기에 딱 좋은 날입니다. 과감하게 정리하세요! ✂️" },
               daily: { k: "#변혁 #새로움", m: "과거의 나를 버리고 새롭게 태어나는 날! 변화를 두려워하지 마세요. 🦋" }
          },
          {
               id: 14, name: "Temperance", Icon: Droplet, color: "text-blue-400", bg: "bg-blue-50",
               love: { k: "#조율 #편안함", m: "서로의 다름을 인정하고 맞춰가는 과정이 아름다워요. 편안하고 안정적인 연애운입니다. 🥤" },
               wealth: { k: "#관리 #순환", m: "자금 흐름이 원활합니다. 무리하지 않고 적당히 조절하면 통장이 안정될 거예요. 🌊" },
               daily: { k: "#절제 #중용", m: "넘치지도 모자라지도 않는 평온한 하루. 마음의 여유를 즐겨보세요. 🕊️" }
          },
          {
               id: 15, name: "The Devil", Icon: Ghost, color: "text-purple-900", bg: "bg-purple-100",
               love: { k: "#치명적 #유혹", m: "거부할 수 없는 강렬한 끌림이 있네요. 위험하지만 매혹적인 사랑에 빠질 수 있어요. 😈" },
               wealth: { k: "#욕심 #속박", m: "돈에 너무 얽매이지 마세요. 과도한 욕심은 화를 부를 수 있으니 주의가 필요합니다. ⛓️" },
               daily: { k: "#집착 #해방", m: "나를 옭아매는 생각들로부터 벗어나세요. 오늘은 잠시 일탈을 꿈꿔도 좋습니다. 🎭" }
          },
          {
               id: 16, name: "The Tower", Icon: Zap, color: "text-red-600", bg: "bg-red-100",
               love: { k: "#충격 #변화", m: "예상치 못한 일이 생길 수 있어요. 하지만 이것이 전화위복이 되어 관계를 재정립할 기회가 될 거예요. ⚡" },
               wealth: { k: "#손실주의 #대비", m: "갑작스러운 지출이 생길 수 있으니 비상금을 챙기세요. 돌다리도 두들겨 보고 건너야 합니다. 🚧" },
               daily: { k: "#급변 #깨달음", m: "기존의 틀이 깨지는 경험을 할 수 있어요. 당황하지 말고 새로운 기회로 받아들이세요! 🏗️" }
          },
          {
               id: 17, name: "The Star", Icon: Star, color: "text-yellow-400", bg: "bg-indigo-900",
               love: { k: "#희망 #이상형", m: "꿈에 그리던 이상형을 만날 수도? 짝사랑 중이라면 희망을 가져도 좋아요. 반짝반짝 빛나네요! ✨" },
               wealth: { k: "#비전 #낙관", m: "미래가 밝습니다. 당장의 이익보다는 꿈과 비전에 투자하세요. 반드시 빛을 볼 거예요. 🌟" },
               daily: { k: "#영감 #치유", m: "마음이 정화되는 날이에요. 긍정적인 에너지가 당신을 감싸고 있습니다. 💖" }
          },
          {
               id: 18, name: "The Moon", Icon: Moon, color: "text-purple-300", bg: "bg-slate-800",
               love: { k: "#애매함 #불안", m: "상대방의 속마음을 알 수 없어 답답할 수 있어요. 억지로 캐내려 하지 말고 기다려주세요. 🌫️" },
               wealth: { k: "#불확실 #주의", m: "보이지 않는 위험이 있을 수 있습니다. 의심스러운 투자는 피하고 돌다리도 두들겨 보세요. 🌑" },
               daily: { k: "#감성 #꿈", m: "이성보다는 감성이 풍부해지는 밤. 오늘은 센치한 기분을 즐겨보는 것도 나쁘지 않아요. 🌙" }
          },
          {
               id: 19, name: "The Sun", Icon: Sun, color: "text-orange-500", bg: "bg-orange-50",
               love: { k: "#행복 #결혼", m: "더할 나위 없이 좋은 애정운! 아이처럼 해맑게 웃을 일이 가득한 행복한 하루예요. ☀️" },
               wealth: { k: "#성공 #번창", m: "금전운이 활짝 폈습니다! 사업이나 투자가 있다면 좋은 성과를 기대해도 좋아요. 🌻" },
               daily: { k: "#활력 #긍정", m: "에너지가 넘치는 날! 당신의 밝은 기운이 주변 사람들에게도 행복을 전파할 거예요. 😄" }
          },
          {
               id: 20, name: "Judgement", Icon: Bell, color: "text-cyan-500", bg: "bg-cyan-100",
               love: { k: "#재회 #결판", m: "기다리던 소식이 들려올 거예요. 헤어진 연인과 연락이 닿거나 관계가 한 단계 발전할 수 있어요. 📯" },
               wealth: { k: "#보상 #소식", m: "기다리던 돈이 들어오거나 노력에 대한 보상을 받게 됩니다. 좋은 소식이 올 거예요! 🔔" },
               daily: { k: "#부활 #결과", m: "그동안의 노력이 결실을 맺는 날. 뿌린 대로 거두리니, 오늘은 수확의 기쁨을 누리세요. 🎁" }
          },
          {
               id: 21, name: "The World", Icon: Globe, color: "text-green-500", bg: "bg-green-50",
               love: { k: "#완성 #해피엔딩", m: "완벽한 사랑이네요. 서로에게 더 이상 바랄 것 없는 충만한 행복을 느낄 수 있어요. 🌍" },
               wealth: { k: "#성취 #목표달성", m: "목표했던 금액을 모으거나 원하던 것을 손에 넣게 됩니다. 최고의 금전운이에요! ✈️" },
               daily: { k: "#만족 #완벽", m: "모든 것이 순조롭게 흘러가는 날. 오늘만큼은 세상의 모든 것이 당신 편인 것 같네요! 🎉" }
          }
     ];

     const [hoveredIndex, setHoveredIndex] = useState(null);

     const [isFlipping, setIsFlipping] = useState(false);
     const [flippedIndex, setFlippedIndex] = useState(null);

     const handleTopicSelect = (topic) => {
          setSelectedTopic(topic);
          setStep('shuffle');
          setIsShuffling(true);
          setHoveredIndex(null);
          setTimeout(() => setIsShuffling(false), 2000); // Shuffle animation duration
     };

     const handleCardPick = (index) => {
          if (isShuffling || isFlipping) return;

          // 1. Lock interaction and start flip animation
          setIsFlipping(true);
          setFlippedIndex(index);
          setHoveredIndex(null);

          // 2. Select Result
          // Select card based on index (simulating "Fate" that the card IS the card at that index after shuffle)
          // In a real shuffling, we would shuffle the array. Here we'll pick from the shuffled deck logic.
          // To ensure 22 Unique Outcomes matching the visual 22 cards, we should randomly permute the full deck once on shuffle.
          // But to keep it simple and stateless (and avoid complex re-render state), we will pick a random one from majorArcana,
          // OR better: Shuffle the deck indices in state when entering 'shuffle' step.

          // Let's stick to random pick but map it to the result state properly.
          // The USER wants to know: "Are all 22 different?"
          // Answer: Yes, we are picking from the `majorArcana` array which has 22 unique items.

          const randomArcana = majorArcana[Math.floor(Math.random() * majorArcana.length)];

          // Construct the Result Object with the context-specific message
          const topicContent = randomArcana[selectedTopic]; // e.g. randomArcana.love
          const resultData = {
               ...randomArcana,
               keyword: topicContent.k,
               message: topicContent.m
          };

          setSelectedCardResult(resultData);

          // Haptic Feedback
          if (window.navigator && window.navigator.vibrate) {
               window.navigator.vibrate(50);
          }

          // 3. Wait for animation then show result
          setTimeout(() => {
               setStep('result');
               setIsFlipping(false);
               setFlippedIndex(null);
          }, 800);
     };

     const handleShare = () => {
          alert("📸 카드가 캡처되어 갤러리에 저장되었습니다! (시뮬레이션)");
     };

     const CardBack = () => (
          <div className="w-full h-full rounded-2xl border-4 border-white shadow-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50" />
               <div className="w-24 h-24 rounded-full border-2 border-white/30 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white/80 animate-pulse" />
               </div>
          </div>
     );

     return (
          <div className="flex flex-col h-full bg-gradient-to-b from-indigo-50 to-purple-100 relative overflow-hidden font-sans">
               {/* Header */}
               <div className="px-6 py-4 flex justify-between items-center z-10">
                    <button onClick={onClose} className="p-2 bg-white/50 backdrop-blur-md rounded-full hover:bg-white text-gray-600 transition-colors">
                         <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                         <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                              🌙 오늘의 파주 타로
                         </h2>
                    </div>
                    <div className="w-10"></div>
               </div>

               {/* Background Decorative Elements */}
               <div className="absolute top-0 left-0 w-64 h-64 bg-purple-300 rounded-full blur-[100px] opacity-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-300 rounded-full blur-[100px] opacity-30 translate-x-1/2 translate-y-1/2 pointer-events-none" />

               {/* Content Area */}
               <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-lg mx-auto p-6 flex flex-col items-center justify-center relative z-10 scrollbar-hide">

                    {/* STEP 1: TOPIC SELECTION */}
                    {step === 'topic' && (
                         <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                              <div className="text-center space-y-2">
                                   <h3 className="text-2xl font-black text-gray-800">
                                        오늘 어떤 조언이<br />필요하신가요?
                                   </h3>
                                   <p className="text-gray-500 font-medium">마음속 고민을 카드가 들어줄 거예요.</p>
                              </div>

                              <div className="space-y-4">
                                   <button onClick={() => handleTopicSelect('love')}
                                        className="w-full bg-white p-6 rounded-3xl shadow-lg border border-pink-100 flex items-center gap-5 hover:scale-[1.02] active:scale-95 transition-all group">
                                        <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform shadow-inner">💘</div>
                                        <div className="text-left">
                                             <h4 className="text-lg font-bold text-gray-800">연애의 기운</h4>
                                             <p className="text-sm text-gray-500">그 사람의 속마음이 궁금하다면</p>
                                        </div>
                                   </button>

                                   <button onClick={() => handleTopicSelect('wealth')}
                                        className="w-full bg-white p-6 rounded-3xl shadow-lg border border-yellow-100 flex items-center gap-5 hover:scale-[1.02] active:scale-95 transition-all group">
                                        <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform shadow-inner">💰</div>
                                        <div className="text-left">
                                             <h4 className="text-lg font-bold text-gray-800">금전과 행운</h4>
                                             <p className="text-sm text-gray-500">지갑이 두둑해지는 부적</p>
                                        </div>
                                   </button>

                                   <button onClick={() => handleTopicSelect('daily')}
                                        className="w-full bg-white p-6 rounded-3xl shadow-lg border border-green-100 flex items-center gap-5 hover:scale-[1.02] active:scale-95 transition-all group">
                                        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-3xl group-hover:rotate-12 transition-transform shadow-inner">🍀</div>
                                        <div className="text-left">
                                             <h4 className="text-lg font-bold text-gray-800">오늘의 조언</h4>
                                             <p className="text-sm text-gray-500">나를 위한 따뜻한 한마디</p>
                                        </div>
                                   </button>
                              </div>
                         </div>
                    )}

                    {/* STEP 2: SHUFFLE & PICK */}
                    {step === 'shuffle' && (
                         <div className="w-full h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-500 relative">
                              <style>
                                   {`
                                   @keyframes shuffleCard {
                                        0% { transform: translate(0, 0) rotate(0deg) scale(0.9); z-index: 1; }
                                        25% { transform: translate(-40px, -10px) rotate(-15deg) scale(0.95); z-index: 10; }
                                        50% { transform: translate(0, 5px) rotate(0deg) scale(0.9); z-index: 1; }
                                        75% { transform: translate(40px, -10px) rotate(15deg) scale(0.95); z-index: 10; }
                                        100% { transform: translate(0, 0) rotate(0deg) scale(0.9); z-index: 1; }
                                   }
                                   `}
                              </style>
                              {!isFlipping && (
                                   <h3 className="text-xl font-bold text-purple-900 mb-12 animate-pulse whitespace-pre-wrap">
                                        {isShuffling ? "22장의 카드를 섞는 중입니다..." : "마음속으로 집중하고\n한 장을 뽑아주세요"}
                                   </h3>
                              )}

                              <div className="relative w-full h-[360px] flex items-center justify-center perspective-[1000px] -mt-32">
                                   {/* Full Deck of 22 Cards (Major Arcana Count) */}
                                   {[...Array(22)].map((_, i) => {
                                        // Calculate Fan Layout (Tightened for Mobile/No Overflow)
                                        const totalCards = 22;
                                        const angleStep = 5; // Reduced from 6
                                        const startAngle = -((totalCards - 1) * angleStep) / 2;
                                        const rotate = startAngle + i * angleStep;

                                        // Y offset for arc effect (cards on edges are lower)
                                        const yOffset = Math.abs(rotate) * 0.8; // Reduced to flatten bottom curve
                                        const xOffset = rotate * 2.0;

                                        const isSelected = flippedIndex === i;

                                        // Random animation properties for shuffle
                                        const shuffleDelay = `${Math.random() * 0.5}s`;
                                        const shuffleDuration = `${0.3 + Math.random() * 0.2}s`;

                                        return (
                                             <div
                                                  key={i}
                                                  onClick={() => handleCardPick(i)}
                                                  onMouseEnter={() => !isShuffling && !isFlipping && setHoveredIndex(i)}
                                                  onMouseLeave={() => !isShuffling && !isFlipping && setHoveredIndex(null)}
                                                  className={`absolute w-28 h-48 rounded-xl cursor-pointer shadow-lg border border-white/40 transition-all duration-500 ease-out will-change-transform bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
                                                  ${isShuffling ? '' : 'hover:scale-110 hover:shadow-purple-500/50 hover:border-white'}
                                                  ${isSelected ? 'z-[100] !transition-transform !duration-700' : ''}
                                                  `}
                                                  style={{
                                                       animation: isShuffling ? `shuffleCard ${shuffleDuration} ease-in-out infinite alternate` : 'none',
                                                       animationDelay: isShuffling ? shuffleDelay : '0s',
                                                       transform: isSelected
                                                            ? 'translate(0, 0) rotateY(180deg) scale(1.5)' // Flip & Center
                                                            : isShuffling
                                                                 ? 'translate(0,0)' // Overridden by animation
                                                                 : `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg) translateZ(${hoveredIndex === i ? '50px' : '0px'})`,
                                                       zIndex: isSelected ? 100 : (hoveredIndex === i ? 50 : i),
                                                       backfaceVisibility: 'visible', // Enable 3D flip effect
                                                       transformStyle: 'preserve-3d'
                                                  }}
                                             >
                                                  {/* Front (Card Back Design) */}
                                                  <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center">
                                                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50" />
                                                       <div className="w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center">
                                                            <Sparkles className="w-10 h-10 text-white/80 animate-pulse" />
                                                       </div>
                                                  </div>

                                                  {/* Back (Revealed Content - Simplified for flip effect) */}
                                                  <div className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-inner rotate-y-180 backface-hidden flex items-center justify-center">
                                                       {/* We show the result card face here during the flip */}
                                                       {selectedCardResult && (
                                                            <div className={`w-full h-full ${selectedCardResult.bg} p-2 flex flex-col items-center justify-center opacity-0 animate-in fade-in duration-300 delay-300 fill-mode-forwards`}>
                                                                 <selectedCardResult.Icon className={`w-10 h-10 ${selectedCardResult.color} mb-2`} />
                                                                 <span className="text-[10px] font-bold text-gray-800 text-center px-1 leading-tight">{selectedCardResult.name}</span>
                                                            </div>
                                                       )}
                                                  </div>
                                             </div>
                                        );
                                   })}
                              </div>

                              {!isShuffling && !isFlipping && (
                                   <div className="absolute bottom-4 left-0 right-0 z-[200]">
                                        <p className="text-sm text-purple-600 font-bold animate-bounce inline-block bg-white/90 px-6 py-2 rounded-full backdrop-blur-md shadow-lg ring-1 ring-purple-200">
                                             ✨ 총 22장의 카드 중 하나를 선택하세요
                                        </p>
                                   </div>
                              )}
                         </div>
                    )}

                    {/* STEP 3: RESULT */}
                    {step === 'result' && selectedCardResult && (
                         <div className="w-full flex flex-col items-center animate-in zoom-in duration-700 pb-10">

                              {/* Glowing Effect Background */}
                              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/30 rounded-full blur-[60px] pointer-events-none" />

                              {/* Polaroid Style Card */}
                              <div className="bg-white p-4 pb-8 rounded-2xl shadow-2xl rotate-1 mb-8 max-w-xs mx-auto transform transition-transform hover:rotate-0 relative z-10 w-64">
                                   {/* Pin Icon */}
                                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 shadow-sm border border-white z-20" />

                                   <div className={`aspect-[2/3] w-full ${selectedCardResult.bg} rounded-xl overflow-hidden mb-4 relative flex items-center justify-center border-2 border-dashed border-black/5`}>
                                        <div className={`p-6 rounded-full bg-white/30 backdrop-blur-sm shadow-sm`}>
                                             <selectedCardResult.Icon className={`w-20 h-20 ${selectedCardResult.color}`} strokeWidth={1.5} />
                                        </div>
                                        <div className="absolute bottom-3 left-0 right-0 text-center">
                                             <span className={`text-xs font-black uppercase tracking-widest opacity-40 ${selectedCardResult.color}`}>Paju Tarot</span>
                                        </div>
                                   </div>
                                   <div className="text-center">
                                        <h3 className="font-serif text-2xl font-bold text-gray-800 mb-1">{selectedCardResult.name}</h3>
                                        <div className="text-purple-600 font-bold text-xs tracking-wide mt-1">
                                             {selectedCardResult.keyword}
                                        </div>
                                   </div>
                              </div>

                              {/* Message Box */}
                              <div className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-white text-center mb-6 relative overflow-hidden">
                                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
                                   <p className="text-gray-800 leading-7 font-medium break-keep text-lg">
                                        "{selectedCardResult.message}"
                                   </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 w-full justify-center">
                                   <button onClick={() => { setStep('topic'); setSelectedTopic(null); }}
                                        className="flex-1 py-4 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                                        <RefreshCw className="w-5 h-5" /> 다시하기
                                   </button>
                                   <button onClick={handleShare}
                                        className="flex-[1.5] py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1">
                                        <Camera className="w-5 h-5" /> 결과 저장
                                   </button>
                              </div>

                         </div>
                    )}

               </div>
          </div>
     );
};

export default PajuTarot;
