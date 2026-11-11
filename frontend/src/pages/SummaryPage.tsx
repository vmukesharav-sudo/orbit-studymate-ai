import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { DocumentItem, SummaryItem } from '../types';
import GlassCard from '../components/ui/GlassCard';
import GlowingButton from '../components/ui/GlowingButton';
import Badge from '../components/ui/Badge';
import ThinkingIndicator from '../components/ui/ThinkingIndicator';
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Trash2,
  Clock,
  Layers,
  BookOpen,
  Bookmark,
  CheckCircle2,
  FileDown
} from 'lucide-react';

export const SummaryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDocId = searchParams.get('docId') ? parseInt(searchParams.get('docId')!) : undefined;

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [summariesHistory, setSummariesHistory] = useState<SummaryItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | undefined>(initialDocId);
  const [rawText, setRawText] = useState<string>('');
  const [summaryType, setSummaryType] = useState<string>('detailed');
  const [customTitle, setCustomTitle] = useState<string>('');

  const [currentSummary, setCurrentSummary] = useState<SummaryItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const summaryOptions = [
    { id: 'short', label: 'Short Summary', desc: '1-page executive distillation' },
    { id: 'detailed', label: 'Detailed Summary', desc: 'Comprehensive section-by-section breakdown' },
    { id: 'chapter', label: 'Chapter-Wise', desc: 'Modular breakdown for multi-topic units' },
    { id: 'definitions', label: 'Definitions Only', desc: 'Extracted glossaries & terminology' },
    { id: 'key_points', label: 'Bullet Points', desc: 'High-density memory recall bullets' },
    { id: 'exam', label: 'Exam Focus', desc: 'Probable university test questions & marking scheme' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docs, history] = await Promise.all([
        api.getDocuments(),
        api.getSummaries(),
      ]);
      setDocuments(docs);
      setSummariesHistory(history);
      if (history.length > 0 && !currentSummary) {
        setCurrentSummary(history[0]);
      }
    } catch (err) {
      console.error('Error loading summaries:', err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId && !rawText.trim()) {
      alert('Please select an uploaded document or paste text to summarize.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.generateSummary({
        document_id: selectedDocId,
        raw_text: rawText.trim() || undefined,
        title: customTitle.trim() || undefined,
        summary_type: summaryType,
      });

      setCurrentSummary(result);
      setSummariesHistory((prev) => [result, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to synthesize summary with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSummary = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteSummary(id);
      setSummariesHistory((prev) => prev.filter((s) => s.id !== id));
      if (currentSummary?.id === id) {
        setCurrentSummary(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete summary.');
    }
  };

  const handleCopy = () => {
    if (!currentSummary) return;
    const exportText = `--- ${currentSummary.title} (${currentSummary.summary_type.toUpperCase()}) ---\n\n${currentSummary.content}`;
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!currentSummary) return;
    const blob = new Blob([currentSummary.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSummary.title.replace(/\s+/g, '_')}_Summary.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <span className="text-xs font-mono text-cosmic-cyan tracking-wider uppercase block">
          High-Yield Synthesizer
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
          AI Summary Generator
        </h1>
        <p className="text-xs sm:text-sm text-ui-textSecondary mt-0.5">
          Transform lengthy lecture PDFs and textbook chapters into exam-ready structured summaries with Gemini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard glow="cyan" className="p-6">
            <h3 className="text-base font-heading font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cosmic-cyan" />
              <span>Synthesis Parameters</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Document Select Option */}
              <div>
                <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                  Select Uploaded Document
                </label>
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : undefined;
                    setSelectedDocId(val);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
                >
                  <option value="">-- Choose from Document Library --</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.page_count} pages)
                    </option>
                  ))}
                </select>
              </div>

              {/* Or Paste Raw Text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-ui-textSecondary uppercase">
                    Or Paste Text Excerpt
                  </label>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-[10px] text-ui-textMuted hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    if (e.target.value) setSelectedDocId(undefined);
                  }}
                  placeholder="Paste lecture notes, articles, or revision questions here..."
                  className="w-full p-3 rounded-xl bg-space-900 border border-white/10 text-xs text-white placeholder-ui-textMuted focus:border-cosmic-cyan focus:outline-none resize-none"
                />
              </div>

              {/* Summary Format Options */}
              <div>
                <label className="block text-xs font-mono text-ui-textSecondary mb-2 uppercase">
                  Summary Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {summaryOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSummaryType(opt.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all text-xs ${
                        summaryType === opt.id
                          ? 'bg-cosmic-cyan/15 border-cosmic-cyan/50 text-cosmic-cyan'
                          : 'bg-space-900/60 border-white/10 text-ui-textSecondary hover:bg-space-800'
                      }`}
                    >
                      <span className="font-heading font-semibold block text-white text-[11px]">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-ui-textMuted block mt-0.5 truncate">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <GlowingButton
                  type="submit"
                  variant="cyan"
                  size="md"
                  className="w-full"
                  isLoading={isLoading}
                  icon={<Sparkles className="w-4 h-4 text-space-950" />}
                >
                  Synthesize Summary
                </GlowingButton>
              </div>
            </form>
          </GlassCard>

          {/* Past Summaries History List */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-heading font-semibold text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cosmic-violet" />
                <span>Saved Summaries</span>
              </span>
              <span className="text-xs font-mono text-ui-textMuted">
                {summariesHistory.length} Total
              </span>
            </h3>

            {summariesHistory.length === 0 ? (
              <p className="text-xs text-ui-textMuted text-center py-4">
                No saved summaries yet. Generate one above!
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {summariesHistory.map((s) => {
                  const isActive = currentSummary?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setCurrentSummary(s)}
                      className={`p-2.5 rounded-xl cursor-pointer border text-xs flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-cosmic-violet/20 border-cosmic-violet/40 text-white'
                          : 'bg-space-900/40 border-white/[0.04] text-ui-textSecondary hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="font-medium text-white truncate text-xs">
                          {s.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-ui-textMuted mt-0.5">
                          <span className="uppercase">{s.summary_type}</span>
                          <span>•</span>
                          <span>{new Date(s.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSummary(s.id, e)}
                        className="p-1 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Output Summary Viewer (7 cols) */}
        <div className="lg:col-span-7">
          {isLoading ? (
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <ThinkingIndicator label="Synthesizing academic material with Gemini..." />
              <p className="text-xs text-ui-textMuted mt-4 max-w-sm">
                Extracting core principles, mathematical formulas, and definitions...
              </p>
            </GlassCard>
          ) : !currentSummary ? (
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[460px] border-dashed border-white/10">
              <Sparkles className="w-12 h-12 text-ui-textMuted mx-auto mb-3" />
              <h3 className="text-lg font-heading font-semibold text-white">
                No Summary Generated Yet
              </h3>
              <p className="text-xs text-ui-textSecondary mt-1 max-w-sm">
                Select an uploaded lecture document on the left or paste your notes to generate a structured synthesis.
              </p>
            </GlassCard>
          ) : (
            <GlassCard glow="violet" className="p-6 space-y-6">
              {/* Header with Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="cyan" size="sm">
                      {currentSummary.summary_type}
                    </Badge>
                    <span className="text-[11px] font-mono text-ui-textMuted">
                      {new Date(currentSummary.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    {currentSummary.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-space-800 hover:bg-space-700 text-xs font-mono text-ui-textSecondary hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownloadTxt}
                    className="px-3 py-1.5 rounded-xl bg-cosmic-violet/20 hover:bg-cosmic-violet/30 text-xs font-mono text-cosmic-violet border border-cosmic-violet/30 flex items-center gap-1.5 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>

              {/* Key Definitions Cards (if available) */}
              {currentSummary.key_definitions && currentSummary.key_definitions.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cosmic-cyan mb-2.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Core Definitions & Terminology</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {currentSummary.key_definitions.map((def, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-space-950/60 border border-white/[0.06] text-xs text-ui-textPrimary leading-relaxed">
                        • {def}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Formulas Cards (if available) */}
              {currentSummary.key_formulas && currentSummary.key_formulas.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cosmic-violet mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Key Mathematical Formulas & Equations</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {currentSummary.key_formulas.map((form, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-space-950/60 border border-cosmic-violet/20 font-mono text-xs text-cosmic-violet leading-relaxed">
                        ∑ {form}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Content Body */}
              <div className="pt-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-ui-textSecondary mb-2.5">
                  Structured Summary Breakdown
                </h4>
                <div className="p-5 rounded-2xl bg-space-950/70 border border-white/[0.06] text-sm leading-relaxed whitespace-pre-wrap font-sans text-ui-textPrimary">
                  {currentSummary.content}
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;

