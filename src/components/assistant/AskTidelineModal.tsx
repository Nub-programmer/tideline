import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';

interface AskTidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskTidelineModal: React.FC<AskTidelineModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    { sender: 'assistant', text: 'Hello. I am the TIDELINE Intelligence Assistant. Ask me anything about current flood scenarios, isolated neighbourhoods, or routing protocols.' }
  ]);
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      let reply = "Based on current simulation parameters, the North Arch Bridge closure has isolated 2 eastern residential sectors. Emergency routing has automatically diverted traffic via Southport Civic Shelter.";
      if (userMsg.toLowerCase().includes('bridge')) {
        reply = "The North Arch Bridge is a critical node in the urban graph. When submerged above 1.4m, connectivity to the northern medical sector drops by 45%.";
      } else if (userMsg.toLowerCase().includes('shelter')) {
        reply = "ReliefNet has allocated evacuees across Southport and Pine Hill shelters, maintaining 82% average utilization without exceeding threshold limits.";
      }

      setMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#E4E8E3] shadow-2xl flex flex-col h-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E4E8E3]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#326B58]" />
            <h2 className="text-base font-bold text-[#18221F]">Ask TIDELINE Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F2EF] flex items-center justify-center hover:bg-[#E4E8E3] transition-colors"
          >
            <X className="w-4 h-4 text-[#18221F]" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F7F8F6]">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                msg.sender === 'user' ? 'bg-[#18221F] text-white' : 'bg-[#326B58] text-white'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-md ${
                msg.sender === 'user' ? 'bg-[#18221F] text-white' : 'bg-white text-[#18221F] border border-[#E4E8E3]'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div className="p-4 border-t border-[#E4E8E3] bg-white flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask about isolated zones, bridges, or routing..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-3 bg-[#F7F8F6] border border-[#E4E8E3] rounded-xl text-xs text-[#18221F] focus:outline-none focus:border-[#326B58]"
          />
          <button
            onClick={handleSend}
            className="px-5 py-3 rounded-xl bg-[#326B58] text-white text-xs font-semibold hover:bg-[#285545] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
