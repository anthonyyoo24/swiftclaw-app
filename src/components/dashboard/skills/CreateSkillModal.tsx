"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";

interface CreateSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UploadedFile {
    name: string;
    size: number;
    type: string;
}

const ACCEPTED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "video/quicktime",
    "text/plain",
];

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.mp4,.mov,.txt";
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string): string {
    if (type.startsWith("video/")) return "lucide:video";
    if (type === "application/pdf") return "lucide:file-text";
    if (type.includes("word")) return "lucide:file-type-2";
    return "lucide:file";
}

// ──────────────────────────────────────────────────────────────────────────────
// Drop Zone sub-component
// ──────────────────────────────────────────────────────────────────────────────

interface DropZoneProps {
    isDragging: boolean;
    error: string | null;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onBrowse: () => void;
}

function DropZone({ isDragging, error, onDragOver, onDragLeave, onDrop, onBrowse }: DropZoneProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <div
                role="button"
                tabIndex={0}
                aria-label="Upload file drop zone"
                onClick={onBrowse}
                onKeyDown={(e) => e.key === "Enter" && onBrowse()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={[
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group",
                    isDragging
                        ? "border-white/40 bg-white/6"
                        : error
                            ? "border-red-500/40 bg-red-500/3"
                            : "border-white/10 hover:bg-white/4 hover:border-white/20",
                ].join(" ")}
            >
                <div
                    className={[
                        "w-12 h-12 rounded-full flex items-center justify-center mb-3 border transition-colors shadow-sm",
                        isDragging
                            ? "bg-white/15 border-white/20 text-white"
                            : "bg-white/5 border-white/5 text-neutral-400 group-hover:text-white group-hover:bg-white/10",
                    ].join(" ")}
                >
                    <Icon
                        icon={isDragging ? "lucide:download-cloud" : "lucide:upload-cloud"}
                        className="text-xl"
                    />
                </div>
                <span className="text-sm font-medium text-white mb-1">
                    {isDragging ? "Drop to upload" : "Click to upload or drag and drop"}
                </span>
                <span className="text-xs text-neutral-500">
                    PDF, DOCX, TXT, MP4, or MOV (max. {MAX_FILE_SIZE_MB}MB)
                </span>
            </div>

            {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <Icon icon="lucide:alert-circle" className="shrink-0 text-sm" />
                    {error}
                </p>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Uploaded File Preview sub-component
// ──────────────────────────────────────────────────────────────────────────────

interface UploadedFilePreviewProps {
    file: UploadedFile;
    onRemove: () => void;
}

function UploadedFilePreview({ file, onRemove }: UploadedFilePreviewProps) {
    const isVideo = file.type.startsWith("video/");
    const iconClass = isVideo
        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";

    return (
        <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/10 rounded-xl">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${iconClass}`}>
                <Icon icon={getFileIcon(file.type)} className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-neutral-500">{formatBytes(file.size)}</p>
            </div>
            <button
                onClick={onRemove}
                aria-label="Remove file"
                className="shrink-0 text-neutral-500 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 cursor-pointer"
            >
                <Icon icon="lucide:x" className="text-sm" />
            </button>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal inner content — animated via inline style driven by isOpen
// ──────────────────────────────────────────────────────────────────────────────

function ModalContent({ isOpen, onClose }: CreateSkillModalProps) {
    const [description, setDescription] = useState("");
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync isVisible state when modal closes
    if (!isOpen && isVisible) {
        setIsVisible(false);
    }

    // Animate in after mount
    useEffect(() => {
        if (isOpen) {
            const raf = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(raf);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(onClose, 310);
    }, [onClose]);

    // Escape key closes the modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleClose]);

    const validateAndSetFile = useCallback((file: File) => {
        setFileError(null);
        if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
            setFileError("Unsupported file type. Please upload a PDF, DOCX, TXT, MP4, or MOV.");
            return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setFileError(`File exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
            return;
        }
        setUploadedFile({ name: file.name, size: file.size, type: file.type });
    }, []);

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) validateAndSetFile(file);
            e.target.value = "";
        },
        [validateAndSetFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) validateAndSetFile(file);
        },
        [validateAndSetFile]
    );

    const handleRemoveFile = useCallback(() => {
        setUploadedFile(null);
        setFileError(null);
    }, []);

    const handleGenerate = useCallback(() => {
        // TODO: wire up to actual API
        handleClose();
    }, [handleClose]);

    const canGenerate = description.trim().length > 0 || uploadedFile !== null;

    return (
        <>
            {/* Backdrop */}
            <div
                role="presentation"
                onClick={handleClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                style={{ opacity: isVisible ? 1 : 0 }}
            />

            {/* Modal Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-skill-modal-title"
                className="relative z-10 w-full max-w-130 mx-4 flex flex-col transition-all duration-300"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "scale(1) translateY(0)" : "scale(0.95) translateY(8px)",
                }}
            >
                <div className="bg-[#09090b] border border-white/10 rounded-[24px] shadow-2xl shadow-black/60 flex flex-col overflow-hidden">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/1 shrink-0">
                        <h3
                            id="create-skill-modal-title"
                            className="text-base font-semibold text-white tracking-tight"
                        >
                            Create Custom Skill
                        </h3>
                        <button
                            onClick={handleClose}
                            aria-label="Close modal"
                            className="text-neutral-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 cursor-pointer"
                        >
                            <Icon icon="lucide:x" className="text-lg" />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[65vh] no-scrollbar">

                        {/* Workflow Description */}
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="skill-description"
                                className="text-sm font-semibold text-white tracking-tight"
                            >
                                Workflow Description
                            </label>
                            <p className="text-xs text-neutral-400 leading-relaxed -mt-0.5">
                                Describe the exact steps, tools, and expected outcome for this skill.
                            </p>
                            <textarea
                                id="skill-description"
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Log into the CRM, find contacts without activity in 30 days, and send a re-engagement email..."
                                className="w-full bg-white/2 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                            />
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/5" />
                            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
                                Or Attach Reference
                            </span>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>

                        {/* Upload SOP or Video */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-white tracking-tight">
                                Upload SOP or Video
                            </label>
                            <p className="text-xs text-neutral-400 leading-relaxed -mt-0.5">
                                Provide a document (PDF, DOCX, TXT) or screen recording (MP4, MOV) demonstrating the
                                workflow.
                            </p>

                            {uploadedFile ? (
                                <UploadedFilePreview file={uploadedFile} onRemove={handleRemoveFile} />
                            ) : (
                                <DropZone
                                    isDragging={isDragging}
                                    error={fileError}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onBrowse={() => fileInputRef.current?.click()}
                                />
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_EXTENSIONS}
                                className="hidden"
                                aria-hidden="true"
                                onChange={handleFileInputChange}
                            />
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 py-4 border-t border-white/5 bg-white/1 flex items-center justify-end gap-3 shrink-0">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-black bg-white hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
                        >
                            Generate Skill
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Portal wrapper — mounts the modal above all page content
// ──────────────────────────────────────────────────────────────────────────────

export function CreateSkillModal({ isOpen, onClose }: CreateSkillModalProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    // Hydration guard — only render portal on the client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Immediately sync shouldRender when isOpen becomes true
    if (isOpen && !shouldRender) {
        setShouldRender(true);
    }

    // Keep DOM alive during exit animation
    useEffect(() => {
        if (!isOpen && shouldRender) {
            const t = setTimeout(() => setShouldRender(false), 350);
            return () => clearTimeout(t);
        }
    }, [isOpen, shouldRender]);

    if (!isMounted || !shouldRender) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <ModalContent isOpen={isOpen} onClose={onClose} />
        </div>,
        document.body
    );
}
