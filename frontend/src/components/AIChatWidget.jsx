import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Operations Assistant. How can I help you manage workforce tasks today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef(null);

  const handleSend = async (textToSend) => {
    const text = textToSend || prompt;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    if (!textToSend) setPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { prompt: text });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer || 'No response received.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I failed to process that request. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const quickPrompts = [
    'What are our company policies?',
    'Show me our team leaves',
    'List our job candidates and their screening status',
    'Are there any open support tickets?'
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Slide-out Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 w-full sm:w-96 h-screen z-50 glass-card bg-white/95 dark:bg-darkSurface/95 border-l border-gray-200 dark:border-darkBorder shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-darkBorder flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">AI Operations Assistant</h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Platform Companion</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-light"
              >
                &times;
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Quick Actions Suggestions */}
            <div className="p-3 border-t border-gray-100 dark:border-darkBorder bg-gray-50/50 dark:bg-gray-900/30">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Suggested Queries</p>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(qp)}
                    className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-darkBorder hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-600 dark:text-gray-300 rounded-lg px-2.5 py-1 text-left transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                  >
                    {qp}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-4 border-t border-gray-100 dark:border-darkBorder flex gap-2 items-center bg-white dark:bg-darkSurface"
            >
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-darkBorder rounded-xl py-2 px-3.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-2 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatWidget;
