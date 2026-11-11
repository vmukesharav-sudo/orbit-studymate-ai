import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Conversation, ChatMessage, StudyMode } from '../types';
import OrbitAiOrb, { OrbState } from '../components/3d/OrbitAiOrb';
import GlassCard from '../components/ui/GlassCard';
import GlowingButton from '../components/ui/GlowingButton';
import Badge from '../components/ui/Badge';
import ThinkingIndicator from '../components/ui/ThinkingIndicator';
import {
  Send,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  Code,
  GraduationCap,
  Cpu,
  Zap,
  BookOpen,
  MessageSquare
} from 'lucide-react';

export const AskOrbitPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('docId') ? parseInt(searchParams.get('docId')!) : undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [studyMode, setStudyMode] = useState<StudyMode>('technical');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const studyModes: { mode: StudyMode; label: string; icon: React.ElementType; desc: string }[] = [
    { mode: 'beginner', label: 'Beginner Mode', icon: BookOpen, desc: 'Simple English, analogies & zero jargon' },
    { mode: 'exam', label: 'Exam Mode', icon: GraduationCap, desc: 'Mark-optimized, formal definitions & headings' },
    { mode: 'technical', label: 'Technical Mode', icon: Cpu, desc: 'In-depth architecture & algorithmic rigor' },
    { mode: 'revision', label: 'Quick Revision', icon: Zap, desc: 'High-density bullets & formula memory hooks' },
    { mode: 'coding', label: 'Coding Mode', icon: Code, desc: 'Syntax highlighted code & complexity analysis' },
  ];

  const suggestedPrompts = [
    'Explain DBMS normalization (1NF, 2NF, 3NF, BCNF) with clear student examples.',
    'Teach Object-Oriented Inheritance in Java with syntax and UML relationships.',
    'Explain Operating System Deadlocks: 4 conditions and the Banker’s Algorithm.',
    'Generate 10 rapid exam questions on SQL Joins and Aggregations.',
    'Explain QuickSort algorithm step-by-step with best, average, and worst-case time complexity.'
  ];

  // Fetch initial conversations list
  useEffect(() => {
    loadConversations();
  }, []);

  // When active conversation changes, load messages
  useEffect(() => {
    if (activeConvId) {
      loadConversationMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const convList = await api.getConversations();
      setConversations(convList);
      if (convList.length > 0 && !activeConvId) {
        setActiveConvId(convList[0].id);
        setStudyMode(convList[0].study_mode || 'technical');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const loadConversationMessages = async (id: number) => {
    try {
      const detail = await api.getConversation(id);
      setMessages(detail.messages || []);
      setStudyMode(detail.study_mode || 'technical');
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const handleStartNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setOrbState('idle');
  };

  const handleDeleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    setIsLoading(true);
    setOrbState('thinking');

    // Optimistically show user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: activeConvId || 0,
      sender: 'user',
      content: text,
      mode: studyMode,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      setOrbState('generating');
      const response = await api.sendMessage({
        message: text,
        study_mode: studyMode,
        conversation_id: activeConvId || undefined,
        document_id: initialDocId,
      });

      setMessages((prev) => [...prev, response]);
      setOrbState('completed');

      // Update conversations list if new conversation created
      if (!activeConvId) {
        setActiveConvId(response.conversation_id);
        loadConversations();
      }

      // Revert orb to gentle idle after 2.5s
      setTimeout(() => setOrbState('idle'), 2500);
    } catch (err: any) {
      setOrbState('idle');
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        conversation_id: activeConvId || 0,
        sender: 'gemini',
        content: `⚠️ Error: ${err.message || 'Failed to generate response from Gemini. Please check your API key in Settings.'}`,
        mode: studyMode,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[620px]">
      {/* Sidebar: Conversation History & Mode Select (4 cols) */}
      <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 h-full">
        {/* Active 3D Orb Reactive Status Card */}
        <GlassCard className="p-4 flex items-center gap-4 relative overflow-hidden shrink-0">
          <div className="relative shrink-0">
            <OrbitAiOrb state={orbState} size="sm" interactive={false} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-cosmic-cyan">
              <Sparkles className="w-3.5 h-3.5 text-cosmic-violet" />
              <span className="uppercase tracking-wider">AI Orb State: {orbState}</span>
            </div>
            <h4 className="text-sm font-heading font-bold text-white mt-0.5">
              ORBIT Intelligence Core
            </h4>
            <p className="text-[11px] text-ui-textSecondary mt-0.5 truncate">
              Adaptive reasoning via Gemini SDK
            </p>
          </div>
        </GlassCard>

        {/* Study Mode Selector */}
        <GlassCard className="p-4 shrink-0">
          <label className="text-[11px] font-mono uppercase tracking-wider text-ui-textSecondary block mb-2">
            Academic Study Mode
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {studyModes.map((m) => {
              const Icon = m.icon;
              const isSelected = studyMode === m.mode;
              return (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => setStudyMode(m.mode)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-cosmic-cyan/15 border border-cosmic-cyan/40 text-cosmic-cyan shadow-sm'
                      : 'hover:bg-white/[0.04] text-ui-textSecondary border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-heading font-medium block text-white">
                      {m.label}
                    </span>
                    <span className="text-[10px] text-ui-textMuted block truncate">
                      {m.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Conversation Sessions List */}
        <GlassCard className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
            <span className="text-xs font-mono uppercase text-ui-textSecondary">
              Study Sessions
            </span>
            <button
              onClick={handleStartNewConversation}
              className="text-xs font-mono text-cosmic-cyan hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-ui-textMuted text-center py-6">
                No previous conversations. Start asking ORBIT!
              </p>
            ) : (
              conversations.map((c) => {
                const isActive = activeConvId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                      isActive
                        ? 'bg-cosmic-violet/20 border border-cosmic-violet/40 text-white'
                        : 'hover:bg-white/[0.04] text-ui-textSecondary border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-3.5 h-3.5 text-cosmic-cyan shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>

      {/* Main Chat Conversation Canvas (8 cols) */}
      <GlassCard className="lg:col-span-8 flex flex-col h-full overflow-hidden p-0 relative border-cosmic-cyan/20">
        {/* Chat Top Header */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-space-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cosmic-cyan/10 border border-cosmic-cyan/30 flex items-center justify-center text-cosmic-cyan">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-white text-sm">
                Ask ORBIT Assistant
              </h3>
              <span className="text-[10px] font-mono text-cosmic-cyan">
                Active Mode: {studyMode.toUpperCase()}
              </span>
            </div>
          </div>

          <button
            onClick={handleStartNewConversation}
            className="text-xs font-mono px-3 py-1.5 rounded-xl bg-space-800 border border-white/10 hover:border-cosmic-cyan/40 text-ui-textSecondary hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-cosmic-cyan" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Message Feed Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            /* Empty State: Suggested Academic Prompts */
            <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto py-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cosmic-violet via-cosmic-blue to-cosmic-cyan p-0.5 mb-4 shadow-neon-cyan/30">
                <div className="w-full h-full bg-space-950 rounded-[22px] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-cosmic-cyan" />
                </div>
              </div>
              <h3 className="text-xl font-heading font-bold text-white">
                What would you like to master today?
              </h3>
              <p className="text-xs text-ui-textSecondary mt-1.5 leading-relaxed">
                Ask any complex concept, algorithm, formula, or exam question. ORBIT adapts its explanation directly to your chosen study mode.
              </p>

              <div className="grid grid-cols-1 gap-2 mt-6 w-full text-left">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 rounded-xl bg-space-900/60 border border-white/[0.06] hover:border-cosmic-cyan/40 hover:bg-space-800/80 text-xs text-ui-textSecondary hover:text-white transition-all text-left flex items-start gap-2.5 group"
                  >
                    <span className="text-cosmic-cyan font-mono text-[10px] mt-0.5">0{idx + 1}</span>
                    <span className="flex-1 leading-snug">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Render Messages */
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cosmic-violet to-cosmic-cyan p-0.5 shrink-0 shadow-neon-cyan/30">
                      <div className="w-full h-full bg-space-950 rounded-[10px] flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-cosmic-cyan" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 sm:p-5 relative group ${
                      isUser
                        ? 'bg-gradient-to-r from-cosmic-violet/25 to-cosmic-blue/30 border border-cosmic-violet/40 text-white rounded-br-sm'
                        : 'bg-space-900/80 border border-white/[0.08] text-ui-textPrimary rounded-bl-sm'
                    }`}
                  >
                    {/* Header with Mode & Copy */}
                    <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/[0.06] text-[10px] font-mono text-ui-textMuted">
                      <span>{isUser ? 'You' : `ORBIT [${msg.mode?.toUpperCase() || 'AI'}]`}</span>
                      
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="hover:text-cosmic-cyan transition-colors flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Content formatted with clean line breaks and code formatting */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Cited Pages Badge if any */}
                    {msg.page_references && msg.page_references.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center gap-1.5 text-xs font-mono text-cosmic-cyan">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Referenced in Uploaded Document: Page {msg.page_references.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* AI Thinking Animation Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-space-800 border border-cosmic-cyan/30 flex items-center justify-center text-cosmic-cyan">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <ThinkingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/[0.08] bg-space-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask ORBIT in ${studyMode.toUpperCase()} Mode...`}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-space-800/90 border border-white/10 focus:border-cosmic-cyan focus:outline-none focus:ring-1 focus:ring-cosmic-cyan text-sm text-white placeholder-ui-textMuted transition-colors"
            />
            <GlowingButton
              type="submit"
              variant="cyan"
              size="md"
              disabled={!inputMessage.trim() || isLoading}
              icon={<Send className="w-4 h-4" />}
            >
              Ask
            </GlowingButton>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default AskOrbitPage;
