import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { DocumentItem, ChatMessage, StudyMode } from '../types';
import GlassCard from '../components/ui/GlassCard';
import GlowingButton from '../components/ui/GlowingButton';
import Badge from '../components/ui/Badge';
import ThinkingIndicator from '../components/ui/ThinkingIndicator';
import OrbitAiOrb, { OrbState } from '../components/3d/OrbitAiOrb';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Send,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  Bookmark,
  Layers,
  ArrowLeft,
  Download,
  AlertCircle
} from 'lucide-react';

interface ExtractedPage {
  page: number;
  text: string;
}

export const WorkspacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const docIdParam = searchParams.get('docId');

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [pagesData, setPagesData] = useState<ExtractedPage[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  // AI Assistant side state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState<string>('');
  const [studyMode, setStudyMode] = useState<StudyMode>('technical');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllDocuments();
  }, []);

  useEffect(() => {
    if (docIdParam && documents.length > 0) {
      const match = documents.find((d) => d.id === parseInt(docIdParam));
      if (match) {
        selectDocument(match.id);
      }
    } else if (documents.length > 0 && !selectedDoc) {
      selectDocument(documents[0].id);
    }
  }, [docIdParam, documents]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const loadAllDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents list:', err);
    }
  };

  const selectDocument = async (docId: number) => {
    try {
      const fullDoc = await api.getDocument(docId);
      setSelectedDoc(fullDoc);
      setCurrentPage(1);

      if (fullDoc.extracted_text) {
        try {
          const parsed = JSON.parse(fullDoc.extracted_text);
          if (Array.isArray(parsed)) {
            setPagesData(parsed);
          } else {
            setPagesData([{ page: 1, text: fullDoc.extracted_text }]);
          }
        } catch {
          setPagesData([{ page: 1, text: fullDoc.extracted_text }]);
        }
      } else {
        setPagesData([]);
      }

      // Initial welcoming AI message for this document
      setChatMessages([
        {
          id: 1,
          conversation_id: 0,
          sender: 'gemini',
          content: `Hello! I have indexed **"${fullDoc.title}"** (${fullDoc.page_count} pages). You can ask me to explain concepts, extract formulas, summarize chapters, or generate practice questions. All answers will cite specific page numbers!`,
          mode: 'technical',
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('Failed to load document detail:', err);
    }
  };

  const handleAskQuestion = async (queryText?: string) => {
    const text = (queryText || questionInput).trim();
    if (!text || isLoading || !selectedDoc) return;

    setQuestionInput('');
    setIsLoading(true);
    setOrbState('thinking');

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: 0,
      sender: 'user',
      content: text,
      mode: studyMode,
      timestamp: new Date().toISOString()
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      setOrbState('generating');
      const response = await api.sendMessage({
        message: text,
        study_mode: studyMode,
        document_id: selectedDoc.id
      });

      setChatMessages((prev) => [...prev, response]);
      setOrbState('completed');
      setTimeout(() => setOrbState('idle'), 2500);
    } catch (err: any) {
      setOrbState('idle');
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        conversation_id: 0,
        sender: 'gemini',
        content: `⚠️ Error querying document: ${err.message || 'Gemini processing failed.'}`,
        mode: studyMode,
        timestamp: new Date().toISOString()
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookmark = (pageNum: number) => {
    if (bookmarks.includes(pageNum)) {
      setBookmarks((prev) => prev.filter((p) => p !== pageNum));
    } else {
      setBookmarks((prev) => [...prev, pageNum]);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentPageData = pagesData.find((p) => p.page === currentPage) || pagesData[0];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Workspace Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-space-900/80 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/documents"
            className="p-2 rounded-xl bg-space-800 hover:bg-space-700 text-ui-textSecondary hover:text-white transition-colors"
            title="Back to Document Library"
          >
            <ArrowLeft className="w-4 h-4 text-cosmic-cyan" />
          </Link>

          {/* Document Switcher Dropdown */}
          <div className="min-w-0">
            <select
              value={selectedDoc?.id || ''}
              onChange={(e) => selectDocument(parseInt(e.target.value))}
              className="bg-space-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cosmic-cyan truncate max-w-xs sm:max-w-md font-heading"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.page_count} pages)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page & Zoom Controls */}
        {selectedDoc && (
          <div className="flex items-center gap-3 text-xs font-mono w-full sm:w-auto justify-between sm:justify-end">
            {/* Page Navigation */}
            <div className="flex items-center gap-1.5 bg-space-800/80 p-1 rounded-xl border border-white/10">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded text-ui-textSecondary hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white px-2">
                Page {currentPage} of {selectedDoc.page_count || pagesData.length || 1}
              </span>
              <button
                disabled={currentPage >= (selectedDoc.page_count || pagesData.length || 1)}
                onClick={() => setCurrentPage((p) => Math.min(selectedDoc.page_count || pagesData.length, p + 1))}
                className="p-1 rounded text-ui-textSecondary hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bookmark current page */}
            <button
              onClick={() => toggleBookmark(currentPage)}
              className={`p-2 rounded-xl border transition-colors ${
                bookmarks.includes(currentPage)
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-space-800 border-white/10 text-ui-textSecondary hover:text-white'
              }`}
              title="Bookmark Page"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-1 bg-space-800/80 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                className="p-1 rounded text-ui-textSecondary hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] text-ui-textSecondary">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                className="p-1 rounded text-ui-textSecondary hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)] min-h-[640px]">
        {/* Left & Center: Document Reader Canvas (7 cols) */}
        <GlassCard className="lg:col-span-7 flex flex-col h-full overflow-hidden p-0 border-white/10">
          <div className="px-5 py-3 border-b border-white/[0.08] bg-space-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cosmic-cyan" />
              <span className="text-xs font-heading font-medium text-white truncate max-w-sm">
                {selectedDoc?.title || 'Document Excerpt'}
              </span>
            </div>

            {bookmarks.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                <Bookmark className="w-3 h-3" />
                <span>Bookmarks: {bookmarks.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Document Content Canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-space-950/60 font-sans text-sm leading-relaxed select-text">
            {!selectedDoc ? (
              <div className="text-center py-20 text-ui-textSecondary">
                Select a document from the top toolbar to begin reading.
              </div>
            ) : pagesData.length === 0 ? (
              <div className="text-center py-20 text-ui-textSecondary">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="font-heading text-white">No selectable text found in this PDF.</p>
                <p className="text-xs text-ui-textMuted mt-1">
                  The document might be an image scan or encrypted.
                </p>
              </div>
            ) : (
              <div style={{ fontSize: `${zoomLevel}%` }} className="space-y-6">
                <div className="p-4 rounded-xl bg-space-900/40 border border-white/[0.04]">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.06] text-xs font-mono text-cosmic-cyan">
                    <span>--- Page {currentPage} ---</span>
                    <button
                      onClick={() => handleAskQuestion(`Summarize key concepts from Page ${currentPage}`)}
                      className="text-[11px] hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-cosmic-violet" />
                      <span>Summarize Page</span>
                    </button>
                  </div>

                  <div className="whitespace-pre-wrap text-ui-textPrimary font-normal leading-relaxed">
                    {currentPageData?.text || 'No text extracted for this page.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Grounded Prompts Toolbar */}
          <div className="p-3 border-t border-white/[0.08] bg-space-900/60 flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className="text-ui-textMuted text-[10px] uppercase shrink-0">Quick AI Prompts:</span>
            <button
              onClick={() => handleAskQuestion("What are the main topics and objectives covered in this document?")}
              className="px-2.5 py-1 rounded-lg bg-space-800 hover:bg-space-700 text-ui-textSecondary hover:text-white border border-white/5 shrink-0"
            >
              Document Overview
            </button>
            <button
              onClick={() => handleAskQuestion("Extract all critical mathematical formulas and definitions from this material.")}
              className="px-2.5 py-1 rounded-lg bg-space-800 hover:bg-space-700 text-ui-textSecondary hover:text-white border border-white/5 shrink-0"
            >
              Extract Formulas
            </button>
            <button
              onClick={() => handleAskQuestion("Generate 5 practice exam questions directly from this document content.")}
              className="px-2.5 py-1 rounded-lg bg-space-800 hover:bg-space-700 text-ui-textSecondary hover:text-white border border-white/5 shrink-0"
            >
              5 Practice Questions
            </button>
          </div>
        </GlassCard>

        {/* Right: Gemini Grounded Assistant (5 cols) */}
        <GlassCard className="lg:col-span-5 flex flex-col h-full overflow-hidden p-0 border-cosmic-cyan/30">
          {/* Header */}
          <div className="px-5 py-3 border-b border-white/[0.08] bg-space-900/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-cosmic-cyan/15 border border-cosmic-cyan/30 flex items-center justify-center text-cosmic-cyan">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-heading font-semibold text-white text-sm">
                Document Intelligence AI
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={studyMode}
                onChange={(e) => setStudyMode(e.target.value as StudyMode)}
                className="bg-space-800 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-mono text-cosmic-cyan focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="exam">Exam</option>
                <option value="technical">Technical</option>
                <option value="revision">Revision</option>
                <option value="coding">Coding</option>
              </select>
            </div>
          </div>

          {/* Grounded Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-cosmic-violet/25 border border-cosmic-violet/40 text-white rounded-br-sm'
                        : 'bg-space-900/90 border border-white/[0.08] text-ui-textPrimary rounded-bl-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-ui-textMuted mb-1.5 pb-1 border-b border-white/[0.06]">
                      <span>{isUser ? 'You' : 'ORBIT Grounded AI'}</span>
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="hover:text-cosmic-cyan flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.page_references && msg.page_references.length > 0 && (
                      <div className="mt-2.5 pt-1.5 border-t border-white/[0.06] flex items-center gap-1 text-[11px] font-mono text-cosmic-cyan">
                        <BookOpen className="w-3 h-3" />
                        <span>Source: Page {msg.page_references.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2">
                <ThinkingIndicator label="Grounding answer in document..." />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-white/[0.08] bg-space-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Ask about this uploaded document..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-space-800/90 border border-white/10 focus:border-cosmic-cyan focus:outline-none text-xs text-white placeholder-ui-textMuted transition-colors"
              />
              <GlowingButton
                type="submit"
                variant="cyan"
                size="sm"
                disabled={!questionInput.trim() || isLoading}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Ask
              </GlowingButton>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default WorkspacePage;

