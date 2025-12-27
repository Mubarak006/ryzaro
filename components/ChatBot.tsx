
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Alarm, UserStats } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  onBack: () => void;
  alarms: Alarm[];
  stats: UserStats;
}

const ChatBot: React.FC<Props> = ({ onBack, alarms, stats }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with a context-aware message
  useEffect(() => {
    const activeCount = alarms.filter(a => a.active).length;
    let initialText = `Hi! I’m your Wake Up Assistant. I see you have ${activeCount} active alarms. `;
    
    if (stats.currentStreak > 0) {
      initialText += `You're on a ${stats.currentStreak}-day streak—let's keep it going! `;
    } else {
      initialText += `Ready to start a new wake-up streak today? `;
    }

    setMessages([{ role: 'assistant', content: initialText }]);
  }, [alarms, stats.currentStreak]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const alarmContextString = useMemo(() => {
    if (alarms.length === 0) return "The user currently has NO alarms set.";
    
    const alarmDetails = alarms.map((a, i) => {
      const days = a.date ? `on specific date ${a.date}` : (a.days.length === 7 ? "every day" : `on days indices ${a.days.join(',')}`);
      return `${i + 1}. [${a.active ? 'ACTIVE' : 'INACTIVE'}] ${a.time} ${a.period} - Label: "${a.label}", Task: ${a.task} (${a.difficulty}), Recurrence: ${days}`;
    }).join('\n');

    return `USER ALARM DATA:\n${alarmDetails}\n\nUSER STATS:\n- Current Streak: ${stats.currentStreak} days\n- Best Streak: ${stats.bestStreak} days\n- Total Successful Wakes: ${stats.totalWakes}`;
  }, [alarms, stats]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        You are the Wake Up Assistant for the "Task-Based Alarm Enforcer" app. 
        You have direct access to the user's current alarm settings and statistics to provide personalized help.
        
        ${alarmContextString}
        
        YOUR PERSONALITY:
        - Firm but encouraging. You want the user to succeed and beat laziness.
        - Knowledgeable about sleep hygiene and the app's strict protocols.
        - Concise and mobile-friendly.
        
        YOUR CAPABILITIES:
        - If the user asks about their alarms, summarize them accurately using the provided data.
        - If the user is unmotivated, use their streak and total wake count to push them forward.
        - Explain how tasks like Math, Shake, or QR scanning work within the app.
        - Offer advice on how to improve sleep or prepare for their specific upcoming alarms.
        
        DO NOT hallucinate alarms that aren't in the provided list. If a user asks to change an alarm, explain that you can't do it directly and they should use the "Edit" button on the Home screen.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const text = response.text || "I'm sorry, I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my brain right now. Please check your connection and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      <header className="sticky top-0 z-10 flex items-center px-4 py-3 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
        <button onClick={onBack} className="p-2 -ml-2 text-primary">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="ml-2">
          <h2 className="text-base font-bold leading-tight">Wake Up Assistant</h2>
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Connected & Aware</span>
          </div>
        </div>
      </header>

      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-50/50 dark:bg-background-dark"
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-white dark:bg-card-dark text-slate-800 dark:text-slate-100 rounded-tl-none border border-gray-100 dark:border-white/5'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-card-dark px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-white/5 flex gap-1">
              <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="size-1.5 rounded-full bg-slate-400 animate-bounce"></span>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-white/5 pb-8">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-background-dark p-2 rounded-2xl border border-gray-200 dark:border-white/10">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your alarms or streaks..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-2 px-3 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`size-10 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isLoading ? 'bg-primary text-white scale-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 scale-90'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatBot;
