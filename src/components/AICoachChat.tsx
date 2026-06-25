import React from "react";
import { Sparkles, Send, RefreshCw, AlertCircle } from "lucide-react";

interface AICoachChatProps {
  chatMessages: Array<{ role: 'user' | 'assistant'; text: string }>;
  currentChatMessage: string;
  setCurrentChatMessage: (msg: string) => void;
  onSendChatMessage: (e?: React.FormEvent) => void;
  coachChatLoading: boolean;
  isDarkTheme: boolean;
}

export default function AICoachChat({
  chatMessages,
  currentChatMessage,
  setCurrentChatMessage,
  onSendChatMessage,
  coachChatLoading,
  isDarkTheme
}: AICoachChatProps) {
  const chips = [
    "I'm feeling frozen from procrastination",
    "How do I split an overwhelming syllabus?",
    "I have 2 hours before a high-stakes exam",
    "Review my stress levels & give a 5-minute break routine"
  ];

  const cardBg = "bg-white border-[#E5EAF5] text-[#1F2937]";
  const userBubble = "bg-[#5B6CFF] text-white rounded-[20px] rounded-tr-none";
  const assistantBubble = "bg-[#F7F8FC] text-[#1F2937] rounded-[20px] rounded-tl-none border border-[#E5EAF5]";

  const handleChipClick = (chipText: string) => {
    setCurrentChatMessage(chipText);
  };

  return (
    <div className={`custom-card p-6 flex flex-col h-[600px] ${cardBg}`} id="ai-coach-container">
      {/* Header */}
      <div className="flex items-center gap-3.5 pb-4 mb-4 border-b border-[#E5EAF5]">
        <div className="p-2.5 bg-[#EEF2FF] text-[#5B6CFF] rounded-xl animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-outfit font-semibold text-[18px] tracking-tight text-[#1F2937]">Interactive AI Coach</h3>
          <p className="text-[13px] text-[#5F6B7A] font-semibold uppercase tracking-wider">Powered by Gemini AI</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
        {chatMessages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] px-4.5 py-3.5 text-[15px] font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? userBubble : assistantBubble}`}>
              {msg.text.split("\n").map((para, pIdx) => (
                <p key={pIdx} className={pIdx > 0 ? "mt-2" : ""}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        ))}
        {coachChatLoading && (
          <div className="flex justify-start">
            <div className={`${assistantBubble} px-4.5 py-3.5 text-[15px] font-medium flex items-center gap-2 shadow-sm`}>
              <RefreshCw className="w-4 h-4 animate-spin text-[#5B6CFF]" />
              <span>Gemini is tailoring compassionate micro-advice...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions Prompt Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            disabled={coachChatLoading}
            onClick={() => handleChipClick(chip)}
            className="px-3.5 py-2 text-[13px] font-semibold rounded-[14px] border border-[#E5EAF5] bg-[#F7F8FC] text-[#5F6B7A] hover:text-[#5B6CFF] hover:border-[#5B6CFF] hover:bg-[#EEF2FF] cursor-pointer transition-all duration-250 hover:scale-[1.02]"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Form Input */}
      <form onSubmit={onSendChatMessage} className="flex gap-2.5">
        <input
          type="text"
          disabled={coachChatLoading}
          placeholder="Write your struggle or click a prompt suggestion..."
          value={currentChatMessage}
          onChange={(e) => setCurrentChatMessage(e.target.value)}
          className="flex-1 px-4 py-3 text-[15px] font-medium rounded-[14px] border outline-none bg-[#F7F8FC] border-[#E5EAF5] text-[#1F2937] focus:ring-4 focus:ring-[#5B6CFF]/12 focus:border-[#5B6CFF]"
        />
        <button
          type="submit"
          disabled={coachChatLoading || !currentChatMessage.trim()}
          className="px-5 py-3 bg-[#5B6CFF] hover:bg-[#4758E8] text-white font-semibold rounded-[14px] hover:scale-[1.02] transition-all duration-250 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span className="text-[15px]">Send</span>
        </button>
      </form>
    </div>
  );
}
