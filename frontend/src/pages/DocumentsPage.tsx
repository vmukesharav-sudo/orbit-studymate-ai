import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import GlassCard from '../components/ui/GlassCard';
import GlowingButton from '../components/ui/GlowingButton';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import {
  FileText,
  UploadCloud,
  Search,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowUpDown,
  AlertCircle,
  FileCheck2,
  FileWarning
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Rename modal state
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');

  // Delete modal state
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Only PDF documents are supported (.pdf).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB maximum limit.');
      return;
    }
    if (file.size === 0) {
      setErrorMessage('Uploaded PDF is empty (0 bytes).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Extracting page structure from ${file.name}...`);

    try {
      const newDoc = await api.uploadDocument(file);
      setDocuments((prev) => [newDoc, ...prev]);
      setUploadProgress(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload and process PDF.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameDoc || !newTitle.trim()) return;

    try {
      const updated = await api.renameDocument(renameDoc.id, newTitle.trim());
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setRenameDoc(null);
    } catch (err: any) {
      alert(err.message || 'Failed to rename document');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return;
    try {
      await api.deleteDocument(deleteDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteDoc.id));
      setDeleteDoc(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  // Filter & Sort
  const filteredDocs = documents
    .filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'size') {
        return b.file_size - a.file_size;
      }
      return 0;
    });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <span className="text-xs font-mono text-cosmic-cyan tracking-wider uppercase block">
            Academic Vault
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
            PDF Document Library
          </h1>
          <p className="text-xs sm:text-sm text-ui-textSecondary mt-0.5">
            Manage your textbooks, lecture slides, and notes for grounded Gemini AI synthesis.
          </p>
        </div>

        <GlowingButton
          variant="cyan"
          size="md"
          icon={<UploadCloud className="w-4 h-4 text-space-950" />}
          onClick={() => fileInputRef.current?.click()}
          isLoading={isUploading}
        >
          Upload PDF Material
        </GlowingButton>
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 backdrop-blur-md ${
          isDragging
            ? 'border-cosmic-cyan bg-cosmic-cyan/10 shadow-neon-cyan/30 scale-[1.01]'
            : 'border-white/10 bg-space-900/50 hover:border-cosmic-cyan/40 hover:bg-space-900/80'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-space-800 border border-white/10 flex items-center justify-center text-cosmic-cyan mx-auto mb-3 shadow-lg">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-base sm:text-lg font-heading font-semibold text-white">
          Drag and drop your academic PDF here, or <span className="text-cosmic-cyan underline">browse</span>
        </h3>
        <p className="text-xs text-ui-textSecondary mt-1">
          Supports college textbooks, unit handouts, slides, and syllabus documents (Max 25MB)
        </p>

        {isUploading && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-cosmic-cyan bg-cosmic-cyan/10 px-3 py-1.5 rounded-full border border-cosmic-cyan/30">
            <span className="w-2 h-2 rounded-full bg-cosmic-cyan animate-ping" />
            <span>{uploadProgress || 'Extracting pages...'}</span>
          </div>
        )}
      </div>

      {/* Error notification banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-xs text-red-300">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ui-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-space-900/70 border border-white/10 focus:border-cosmic-cyan focus:outline-none focus:ring-1 focus:ring-cosmic-cyan text-xs text-white placeholder-ui-textMuted transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-mono">
          <span className="text-ui-textSecondary">Sort by:</span>
          {(['date', 'name', 'size'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                sortBy === s
                  ? 'bg-cosmic-cyan/15 border-cosmic-cyan/40 text-cosmic-cyan'
                  : 'bg-space-900/60 border-white/10 text-ui-textSecondary hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid / Table */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-space-900/30 border border-dashed border-white/10">
          <FileText className="w-12 h-12 text-ui-textMuted mx-auto mb-3" />
          <h3 className="text-lg font-heading font-semibold text-white">
            {searchQuery ? 'No documents match your query' : 'Your Document Library is empty'}
          </h3>
          <p className="text-xs text-ui-textSecondary mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try searching with a different keyword or clear the search input.'
              : 'Upload your first PDF above to begin grounded Q&A, chapter summaries, and quiz generation.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <GlassCard
              key={doc.id}
              glow="cyan"
              className="p-5 flex flex-col justify-between hover:border-cosmic-cyan/50 transition-all duration-300 group"
            >
              <div>
                {/* Status & Page Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    {doc.status === 'ready' ? (
                      <Badge variant="emerald" size="sm" icon={<FileCheck2 className="w-3 h-3" />}>
                        Ready
                      </Badge>
                    ) : (
                      <Badge variant="amber" size="sm" icon={<FileWarning className="w-3 h-3" />}>
                        Warning
                      </Badge>
                    )}
                    <span className="text-[11px] font-mono text-ui-textSecondary">
                      {doc.page_count} Pages
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-ui-textMuted">
                    {roundSize(doc.file_size)}
                  </span>
                </div>

                {/* Title & Filename */}
                <h3 className="text-base font-heading font-semibold text-white group-hover:text-cosmic-cyan transition-colors line-clamp-2">
                  {doc.title}
                </h3>
                <p className="text-[11px] font-mono text-ui-textMuted truncate mt-1">
                  {doc.original_filename}
                </p>

                {doc.error_message && (
                  <p className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg mt-2 border border-amber-500/20">
                    ⚠️ {doc.error_message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-col gap-2">
                <Link
                  to={`/workspace?docId=${doc.id}`}
                  className="w-full py-2 px-3 rounded-xl bg-cosmic-cyan/15 hover:bg-cosmic-cyan/25 border border-cosmic-cyan/30 text-cosmic-cyan font-heading font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Open Intelligence Workspace</span>
                </Link>

                <div className="flex items-center justify-between gap-1 text-xs">
                  <Link
                    to={`/summary?docId=${doc.id}`}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-ui-textSecondary hover:text-cosmic-violet transition-colors flex items-center gap-1"
                    title="Generate Summary"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Summary</span>
                  </Link>

                  <Link
                    to={`/quiz?docId=${doc.id}`}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-ui-textSecondary hover:text-cosmic-magenta transition-colors flex items-center gap-1"
                    title="Generate Quiz"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Quiz</span>
                  </Link>

                  <button
                    onClick={() => {
                      setRenameDoc(doc);
                      setNewTitle(doc.title);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-ui-textSecondary hover:text-white transition-colors"
                    title="Rename Document"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteDoc(doc)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-ui-textSecondary hover:text-red-400 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Rename Modal */}
      <Modal
        isOpen={!!renameDoc}
        onClose={() => setRenameDoc(null)}
        title="Rename Document"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-ui-textSecondary mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 focus:border-cosmic-cyan focus:outline-none text-sm text-white"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRenameDoc(null)}
              className="px-4 py-2 rounded-xl text-xs font-mono text-ui-textSecondary hover:text-white"
            >
              Cancel
            </button>
            <GlowingButton type="submit" variant="cyan" size="sm">
              Save Title
            </GlowingButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        title="Confirm Deletion"
      >
        <p className="text-sm text-ui-textSecondary leading-relaxed">
          Are you sure you want to delete <span className="text-white font-medium">"{deleteDoc?.title}"</span>? This will permanently remove the extracted text, linked summaries, and disk files.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setDeleteDoc(null)}
            className="px-4 py-2 rounded-xl text-xs font-mono text-ui-textSecondary hover:text-white"
          >
            Cancel
          </button>
          <GlowingButton
            variant="danger"
            size="sm"
            onClick={handleDeleteConfirm}
          >
            Delete Document
          </GlowingButton>
        </div>
      </Modal>
    </div>
  );
};

function roundSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default DocumentsPage;

