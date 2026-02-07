
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../App';
import { kisanSahayakChat, transcribeAudio } from '../services/aiService';

interface Message {
  role: 'user' | 'ai';
  text: string;
  image?: string;
  isThinking?: boolean;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { T } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Ram Ram! I am Kisan Sahayak. How can I help with your crops today?' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string, imageB64?: string) => {
    if (!text.trim() && !imageB64) return;

    const userMsg: Message = { role: 'user', text, image: imageB64 };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await kisanSahayakChat(text, imageB64);
      setMessages(prev => [...prev, { role: 'ai', text: response || 'I am still thinking...' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to the elder expert. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        handleSend("Please analyze this crop photo for issues.", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setLoading(true);
          const transcription = await transcribeAudio(base64);
          if (transcription) setInput(transcription);
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
      }, 4000); // 4 sec capture
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      <header className="p-4 bg-white border-b flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-xl">←</button>
        <div>
          <h1 className="font-black text-lg">Kisan Sahayak</h1>
          <span className="text-[10px] text-green-600 font-bold uppercase">AI Expert Active</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl p-4 shadow-sm ${
              m.role === 'user' ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
              {m.image && <img src={`data:image/jpeg;base64,${m.image}`} className="w-full rounded-2xl mb-2 border border-white/20" alt="Farmer upload" />}
              <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-.5s]"></div>
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400">Assistant is thinking...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t flex items-center gap-2 fixed bottom-16 left-0 right-0 max-w-md mx-auto">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl active:scale-95 transition-all"
        >
          📷
        </button>
        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
        
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or use mic..."
          className="flex-1 p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-green-600 border-none"
          onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
        />

        <button 
          onClick={startRecording}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl active:scale-95 transition-all ${
            isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-50 text-gray-600'
          }`}
        >
          {isRecording ? '⏹' : '🎤'}
        </button>

        <button 
          onClick={() => handleSend(input)}
          className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center text-xl active:scale-95 transition-all"
        >
          ↗
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
