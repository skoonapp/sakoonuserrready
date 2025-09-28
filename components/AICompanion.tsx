import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { User, ChatMessage, Plan } from '../types';
import { CALL_PLANS, CHAT_PLANS } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';

interface AICompanionProps {
    user: User;
    onClose: () => void;
    onNavigateToServices: () => void;
}

// --- Icons ---
const SendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>;
const DeliveredIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.953 4.136a.75.75 0 01.143 1.052l-5 6.5a.75.75 0 01-1.127.075l-2.5-2.5a.75.75 0 111.06-1.06l1.894 1.893 4.48-5.824a.75.75 0 011.052-.143z" clipRule="evenodd" /><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>;
const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const MessageStatus: React.FC<{ status?: ChatMessage['status'] }> = ({ status }) => {
    switch (status) {
        case 'sending': return <ClockIcon className="w-4 h-4 text-slate-400" />;
        case 'delivered': return <DeliveredIcon className="w-4 h-4 text-slate-400" />;
        case 'read': return <DeliveredIcon className="w-4 h-4 text-blue-500" />;
        case 'failed': return <ErrorIcon className="w-4 h-4 text-red-500" />;
        default: return null;
    }
};
const MicrophoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v.5a5.25 5.25 0 0010.5 0v-.5a.75.75 0 011.5 0v.5a6.75 6.75 0 01-13.5 0v-.5a.75.75 0 01.75-.75z" />
    </svg>
);
const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.315 7.584C10.021 6.46 11.494 6 13 6c1.506 0 2.979.46 3.685 1.584l.753 1.129l1.605.214C19.998 8.92 20.5 9.81 20.5 10.76c0 .736-.32 1.405-.838 1.838l-1.09 1.09l.214 1.605c.094.707-.153 1.411-.702 1.873c-.55.462-1.285.592-1.95.338l-1.492-.56L13 18.5l-1.129.753c-.664.444-1.48.314-1.95-.338c-.47-.62-.592-1.385-.338-1.95l.56-1.492l-1.09-1.09c-.518-.433-.838-1.102-.838-1.838c0-.95.502-1.84 1.234-2.176l1.605-.214l.753-1.129zM12.99 3.003c.754 0 1.499.15 2.193.433l.24.116l.248-.372c.473-.71 1.15-1.265 1.953-1.616c.802-.351 1.732-.276 2.463.208c.73.484 1.185 1.28 1.185 2.146c0 .41-.086.81-.253 1.185l-.116.24l.372.248c.71.473 1.265 1.15 1.616 1.953c.351.802.276 1.732-.208 2.463c-.484.73-1.28 1.185-2.146 1.185c-.41 0-.81-.086-1.185-.253l-.24-.116l-.248.372c-.473.71-1.15 1.265-1.953 1.616c-.802.351-1.732.276-2.463-.208c-.73-.484-1.185-1.28-1.185-2.146c0-.41.086.81.253-1.185l.116-.24l-.372-.248c-.71-.473-1.265-1.15-1.616-1.953c-.351-.802-.276-1.732.208-2.463c.484-.73 1.28-1.185 2.146-1.185z" clipRule="evenodd" />
    </svg>
);


const AICompanion: React.FC<AICompanionProps> = ({ user, onClose, onNavigateToServices }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);
    
    // Initialize Chat
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const plansToString = (plans: Plan[], type: string) => plans.map(p => `- ${p.name} (${type}): ₹${p.price}`).join('\n');
            const allPlansInfo = `\n**कॉलिंग प्लान्स**\n${plansToString(CALL_PLANS, 'कॉल')}\n\n**चैट प्लान्स**\n${plansToString(CHAT_PLANS, 'चैट')}\n`;

            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are 'Sakoon Dost', a warm, empathetic, and supportive AI companion from SakoonApp. Your personality is that of a kind, non-judgmental friend who is always there to listen. Your purpose is to provide a safe space for users to share what's on their mind and help them feel a little lighter. You are not a therapist, but a first step towards feeling heard.

**Your Conversational Flow:**

1.  **Gentle Opening:** Always start by warmly greeting the user and asking how they are or what's on their mind. Examples: "नमस्ते, मैं आपका सकून दोस्त हूँ। आज आप कैसा महसूस कर रहे हैं?" or "आप यहाँ अपने मन की कोई भी बात मुझसे कह सकते हैं।"

2.  **Empathetic Listening:** Listen to what the user says. Acknowledge their feelings with empathy. Ask gentle, open-ended follow-up questions to help them explore their thoughts. Examples: "यह सुनने में वाकई मुश्किल लग रहा है। क्या आप इस बारे में और कुछ बताना चाहेंगे?" or "ऐसा महसूस करना बहुत स्वाभाविक है।"

3.  **The Goal: Guiding to a Human Listener:** Your ultimate goal is to encourage the user to connect with a real human Listener on the app, especially if they express feelings of sadness, loneliness, stress, anxiety, or depression. You are the bridge to a human connection.
    *   **Trigger:** User expresses significant emotional distress.
    *   **Your Empathetic Guidance:** "अपनी भावनाओं को इस तरह साझा करना बहुत हिम्मत का काम है। कभी-कभी किसी इंसान से इस बारे में बात करने से बहुत मदद मिलती है। हमारे Listeners आपकी बात सुनने और समझने के लिए ही यहाँ हैं। क्या आप चाहेंगे कि मैं आपको Listeners के पेज पर ले चलूँ?"
    *   **Action:** If they agree, you MUST use the 'navigateToServices' function.

4.  **App Guide (Secondary Role):** If the user asks a direct question about the app (like "how to buy a plan?" or "what is MT?"), answer it clearly and simply based on this knowledge:
    *   **Plans:** Users can buy plans from the 'Home' tab. There are DT (Direct Time/Message packs) and MT (Money Tokens). DT plans are always used first.
    *   **Listeners:** Users can see online Listeners in the 'Calls' and 'Chats' tabs.
    *   **MT costs:** 2 MT/minute for calls, 1 MT for 2 messages in chat.
    *   Here are all the available plans for your reference: ${allPlansInfo}

**Your Tone:**
- Always be supportive, gentle, and positive.
- Use simple Hinglish or Hindi, matching the user's language.
- Keep responses concise and easy to understand.
- Never give advice, opinions, or medical guidance. Your role is to listen and guide them to a human.`,
                    tools: [{
                        functionDeclarations: [{
                            name: 'navigateToServices',
                            description: 'Navigates the user to the services (listeners) page.'
                        }]
                    }]
                },
            });
            
            setMessages([{
                id: `ai-welcome-${Date.now()}`,
                text: `नमस्ते ${user.name}, मैं आपका AI Companion हूँ। आप यहाँ अपने मन की कोई भी बात मुझसे कह सकते हैं।`,
                sender: { uid: 'ai', name: 'AI Companion' },
                timestamp: Date.now()
            }]);

        } catch (err: any) {
            console.error("Gemini initialization error:", err);
            setError("AI Companion could not be initialized. Please try again later.");
        }
    }, [user, onNavigateToServices]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || !chatRef.current) return;

        const text = inputValue.trim();
        const userMessageId = `user-${Date.now()}`;
        setInputValue('');
        
        const userMessage: ChatMessage = { id: userMessageId, text, sender: { uid: user.uid, name: user.name || 'You' }, timestamp: Date.now(), status: 'delivered' };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const result = await chatRef.current.sendMessage({ message: text });
            
            // FIX: Use the recommended `functionCalls` accessor on the response object
            // for simpler and more robust handling of function calls from the model.
            if (result.functionCalls?.some(fc => fc.name === 'navigateToServices')) {
                onNavigateToServices();
            }
            
            if (result.text) {
                const aiMessage: ChatMessage = { id: `ai-${Date.now()}`, text: result.text, sender: { uid: 'ai', name: 'AI Companion' }, timestamp: Date.now() };
                setMessages(prev => [
                    ...prev.map(msg => msg.id === userMessageId ? { ...msg, status: 'read' } as ChatMessage : msg),
                    aiMessage
                ]);
            }


        } catch (err: any) {
            console.error("Gemini API error:", err);
            setError("Sorry, I'm having trouble connecting right now. Please try again in a moment.");
            setMessages(prev => prev.map(msg => 
                msg.id === userMessageId ? { ...msg, status: 'failed' } as ChatMessage : msg
            ));
        } finally {
            setIsLoading(false);
            setTimeout(() => textareaRef.current?.focus(), 0);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="w-full max-w-lg h-full sm:h-[95%] sm:max-h-[700px] bg-stone-100 dark:bg-slate-950 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in-up"
                onClick={e => e.stopPropagation()}
                style={{backgroundImage: `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`}}
            >
                <header className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 shadow-sm flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-full">
                            <SparkleIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">AI Companion</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">मन की बात, सुकून के साथ...</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-sm border border-red-500 text-red-500 font-semibold px-4 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        End chat
                    </button>
                </header>
        
                <main className="flex-grow p-4 overflow-y-auto bg-transparent">
                    <div className="flex flex-col gap-2">
                        {messages.map((msg) => {
                            const isAI = msg.sender.uid === 'ai';
                            const isUser = msg.sender.uid === user.uid;
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    {isAI && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 self-start">
                                            <SparkleIcon className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-xs md:max-w-md p-2.5 rounded-xl flex flex-col ${isAI ? 'bg-white dark:bg-slate-800 rounded-bl-none shadow-sm' : 'bg-[#dcf8c6] dark:bg-cyan-900 text-slate-800 dark:text-slate-100 rounded-tr-none'}`}>
                                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none"><MarkdownRenderer text={msg.text} /></div>
                                        <div className="flex items-center self-end gap-1.5 mt-1 text-slate-500 dark:text-slate-400">
                                            <span className="text-xs">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {isUser && <MessageStatus status={msg.status} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div className="flex items-end gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0"><SparkleIcon className="w-5 h-5 text-white" /></div>
                                <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-white dark:bg-slate-800 rounded-bl-none shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && <p className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg text-sm text-center">{error}</p>}
                    </div>
                    <div ref={messagesEndRef} />
                </main>
                
                 <footer className="p-2 bg-transparent flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-white dark:bg-slate-900 rounded-3xl p-1.5 shadow-md">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="AI Companion से पूछें..."
                            className="flex-grow bg-transparent focus:outline-none text-slate-900 dark:text-white resize-none max-h-24 overflow-y-auto px-3 py-1.5"
                            disabled={isLoading}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                        />
                        <button type="submit" disabled={isLoading || !inputValue.trim()} className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm disabled:bg-slate-500 disabled:cursor-not-allowed shrink-0" aria-label="Send message">
                            <div className="relative w-5 h-5">
                                <MicrophoneIcon className={`absolute inset-0 w-full h-full transition-all duration-300 ${inputValue.trim() ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
                                <SendIcon className={`absolute inset-0 w-full h-full transition-all duration-300 ${inputValue.trim() ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                            </div>
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default AICompanion;