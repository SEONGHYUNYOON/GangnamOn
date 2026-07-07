import React, { useState } from 'react';
import { X } from 'lucide-react';

// 강남온 이용약관 / 개인정보처리방침을 보여주는 모달입니다.
// 회원가입 화면의 "약관 보기" 링크와, 좌측 메뉴 하단 footer 링크에서 열립니다.
// ⚠️ 참고: 아래 내용은 서비스 특성에 맞춰 작성한 표준적인 초안입니다.
// 실제 서비스 운영 시에는 변호사 등 전문가의 검토를 받는 것을 권장합니다.

const TermsAndPrivacyModal = ({ onClose, initialTab = 'terms' }) => {
     const [tab, setTab] = useState(initialTab);

     return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                         <div className="flex gap-2">
                              <button
                                   onClick={() => setTab('terms')}
                                   className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${tab === 'terms' ? 'bg-slate-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                              >
                                   이용약관
                              </button>
                              <button
                                   onClick={() => setTab('privacy')}
                                   className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${tab === 'privacy' ? 'bg-slate-900 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                              >
                                   개인정보처리방침
                              </button>
                         </div>
                         <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                              <X className="w-5 h-5" />
                         </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                         {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
                         <button
                              onClick={onClose}
                              className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors"
                         >
                              닫기
                         </button>
                    </div>
               </div>
          </div>
     );
};

const TermsContent = () => (
     <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">강남온 이용약관</h2>
          <p className="text-xs text-gray-400 mb-6">시행일: 2026년 7월 8일</p>

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제1조 (목적)</h3>
          이 약관은 강남온(이하 "서비스")이 제공하는 지역 커뮤니티 서비스의 이용과 관련하여
          서비스와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제2조 (정의)</h3>
          1. "서비스"란 강남온이 제공하는 모임, 중고거래, 동네생활, 로맨스 매칭 등 모든 기능을 의미합니다.{"\n"}
          2. "회원"이란 이 약관에 동의하고 서비스에 가입한 자를 의미합니다.{"\n"}
          3. "온"이란 서비스 내에서 아바타 스타일 구매, 이벤트 노출 등에 사용되는 가상의 재화로,
          현금으로 환급되지 않으며 서비스 외부에서는 어떠한 금전적 가치도 갖지 않습니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제3조 (약관의 효력 및 변경)</h3>
          1. 이 약관은 서비스 화면에 게시하여 공지함으로써 효력을 발생합니다.{"\n"}
          2. 서비스는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시
          시행일자 및 변경사유를 명시하여 사전에 공지합니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제4조 (이용 계약의 체결)</h3>
          1. 이용 계약은 회원이 되고자 하는 자가 약관에 동의하고 이메일/비밀번호 등 필요
          정보를 입력하여 가입을 신청하고, 서비스가 이를 승낙함으로써 체결됩니다.{"\n"}
          2. 만 14세 미만은 서비스에 가입할 수 없습니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제5조 (회원의 의무)</h3>
          회원은 다음 행위를 해서는 안 됩니다.{"\n"}
          1. 타인의 정보를 도용하거나 허위 정보를 등록하는 행위{"\n"}
          2. 서비스의 안정적 운영을 방해할 수 있는 일체의 행위 (부정한 방법으로 온을 취득하거나
          시스템을 조작하려는 시도 포함){"\n"}
          3. 타 회원의 개인정보를 무단으로 수집·저장·공개하는 행위{"\n"}
          4. 음란물, 폭력적 표현물, 혐오 표현 등 공서양속에 반하는 콘텐츠를 게시하는 행위{"\n"}
          5. 중고거래, 모임, 로맨스 매칭 등 서비스 기능을 이용한 사기, 금전 갈취, 스토킹 등
          불법적이거나 타인에게 위해를 가하는 행위{"\n"}
          6. 관계 법령 및 이 약관에서 금지하는 행위

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제6조 (게시물의 관리)</h3>
          1. 회원이 작성한 게시물의 저작권은 해당 회원에게 있으나, 서비스는 서비스 운영,
          전시, 홍보 목적으로 이를 사용할 수 있습니다.{"\n"}
          2. 서비스는 제5조를 위반한 게시물에 대해 사전 통지 없이 삭제하거나 비공개 처리할
          수 있습니다.{"\n"}
          3. 회원은 다른 회원의 게시물, 프로필, 로맨스 상대 등에 대해 신고 기능을 통해
          부적절한 콘텐츠나 행위를 신고할 수 있습니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제7조 (가상재화 "온")</h3>
          1. "온"은 회원의 서비스 내 활동(글 작성 등)에 대한 보상, 또는 이벤트 참여를 통해
          지급되며, 아바타 스타일 구매, 이벤트 상단 노출, 닉네임 변경, 로맨스 기능 이용 등에
          사용됩니다.{"\n"}
          2. "온"은 현금 또는 現金性 자산으로 환전, 양도, 판매할 수 없습니다.{"\n"}
          3. 회원 탈퇴 시 보유한 "온"은 소멸되며 별도로 보상하지 않습니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제8조 (서비스의 중단)</h3>
          서비스는 시스템 점검, 서버 장애, 운영상 필요 등의 사유로 서비스의 전부 또는
          일부를 일시적으로 중단할 수 있으며, 이 경우 사전에 공지합니다. 다만 긴급한
          사유가 있는 경우 사후에 통지할 수 있습니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제9조 (면책조항)</h3>
          1. 서비스는 천재지변, 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이
          면제됩니다.{"\n"}
          2. 서비스는 회원 간, 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 대해
          개입할 의무가 없으며, 이로 인한 손해를 배상할 책임이 없습니다. 특히 오프라인 모임,
          중고거래, 로맨스 매칭을 통한 만남에서 발생하는 사고나 분쟁에 대해 서비스는
          책임을 지지 않으므로, 회원은 스스로 안전에 유의해야 합니다.{"\n"}
          3. 서비스는 회원이 게시한 정보, 자료, 사실의 신뢰도, 정확성에 대해 책임을 지지
          않습니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제10조 (회원 탈퇴 및 자격 상실)</h3>
          1. 회원은 언제든지 서비스에 탈퇴를 요청할 수 있습니다.{"\n"}
          2. 서비스는 회원이 제5조를 위반한 경우 사전 통지 후 이용을 제한하거나 자격을
          상실시킬 수 있습니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">제11조 (문의)</h3>
          서비스 이용과 관련한 문의는 아래 이메일로 접수해주세요.{"\n"}
          이메일: a23642514@gmail.com
     </>
);

const PrivacyContent = () => (
     <>
          <h2 className="text-lg font-bold text-gray-900 mb-4">개인정보처리방침</h2>
          <p className="text-xs text-gray-400 mb-6">시행일: 2026년 7월 8일</p>

          <h3 className="font-bold text-gray-900 mt-5 mb-2">1. 수집하는 개인정보 항목</h3>
          강남온은 회원가입 및 서비스 제공을 위해 아래 정보를 수집합니다.{"\n"}
          · 필수 항목: 이메일 주소, 비밀번호(암호화 저장), 닉네임, 성별, 활동 지역{"\n"}
          · 선택 항목: 프로필 사진(아바타), 생년, MBTI, 관심사, 자기소개, 직업/상태 메시지{"\n"}
          · 자동 수집 항목: 접속 로그, 서비스 이용 기록(글 작성, 좋아요, 매칭 등 활동 내역)

          <h3 className="font-bold text-gray-900 mt-5 mb-2">2. 개인정보의 수집 및 이용 목적</h3>
          1. 회원 식별 및 로그인 인증{"\n"}
          2. 모임, 중고거래, 동네생활, 로맨스 매칭 등 서비스 기능 제공{"\n"}
          3. 가상재화("온") 지급/차감 등 서비스 내 경제 기능 운영{"\n"}
          4. 부정 이용 방지 및 서비스 안정성 확보{"\n"}
          5. 공지사항 전달, 문의 응대

          <h3 className="font-bold text-gray-900 mt-5 mb-2">3. 개인정보의 보유 및 이용 기간</h3>
          회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우
          해당 법령이 정한 기간 동안 보관합니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">4. 개인정보의 제3자 제공 및 위탁</h3>
          강남온은 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만 서비스 운영을
          위해 아래와 같이 외부 인프라(클라우드 호스팅)를 이용하며, 이 과정에서 개인정보가
          해당 인프라 서버에 저장됩니다.{"\n"}
          · Appwrite (데이터베이스, 인증, 이메일 발송) — 데이터 처리 목적{"\n"}
          · Vercel (웹사이트 호스팅) — 서비스 제공 목적{"\n"}
          위 업체는 각자의 개인정보처리방침에 따라 정보를 안전하게 관리합니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">5. 이용자의 권리</h3>
          회원은 언제든지 본인의 개인정보를 조회, 수정할 수 있으며, 회원 탈퇴를 통해 개인정보
          처리 정지를 요청할 수 있습니다. 다른 회원의 부적절한 정보 수집·게시가 발견될 경우
          신고 기능 또는 아래 문의처를 통해 알려주시기 바랍니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">6. 가상재화("온") 관련 정보</h3>
          서비스 내 가상재화 "온"의 지급/차감 내역은 서비스 운영 및 부정 이용 방지 목적으로
          서버에서 관리되며, 별도의 대외 제공 목적으로 사용되지 않습니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">7. 개인정보 보호를 위한 조치</h3>
          비밀번호는 암호화되어 저장되며, 회원 본인만 접근 가능한 개인정보(연락처 등)는
          별도의 접근 권한 설정을 통해 보호됩니다.

          <h3 className="font-bold text-gray-900 mt-5 mb-2">8. 문의처</h3>
          개인정보 관련 문의는 아래로 연락해 주세요.{"\n"}
          이메일: a23642514@gmail.com
     </>
);

export default TermsAndPrivacyModal;
