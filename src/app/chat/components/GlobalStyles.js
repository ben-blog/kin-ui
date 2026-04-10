'use client'
// 채팅 페이지 전역 스타일 (Google Fonts + 애니메이션 + 스크롤바)

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&display=swap');

      @keyframes dotPulse {
        0%, 100% { opacity: 0.25; transform: scale(0.75); }
        50%       { opacity: 1;    transform: scale(1.1);  }
      }
      @keyframes msgIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0);   }
      }
      .msg-bubble {
        animation: msgIn 0.22s ease forwards;
      }
      .send-btn:hover { color: #FFE500 !important; }
      .attach-btn:hover { color: #FFE500 !important; }
      .emoji-toggle-btn:hover { color: #FFE500 !important; }
      .back-btn:hover { color: #FFE500 !important; }
      .end-btn:hover { border-color: #444 !important; color: #888 !important; }
      .emoji-btn:hover { background: #1a1a18 !important; }
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #2a2a28; border-radius: 2px; }
    `}</style>
  )
}
