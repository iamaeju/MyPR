import React, { useEffect, useId, useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { CARD_COLOR_PRESETS } from '../data/defaultCards';
import type {
  CardFontStyle,
  CardGraphicStyle,
  CardIconKey,
  PRCardData,
  PRCardDraft,
} from '../types/card';
import { normalizeExternalUrl } from '../utils/deckMath';
import { processUploadedImage } from '../utils/imageHelper';
import { CardIcon } from './CardIcon';
import { PRCard } from './PRCard';

interface CardFormModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialCard?: PRCardData | null;
  onClose: () => void;
  onSave: (draft: PRCardDraft) => void;
}

const ICON_OPTIONS: Array<{ key: CardIconKey; label: string }> = [
  { key: 'compass', label: 'Compass' },
  { key: 'camera', label: 'Camera' },
  { key: 'layers', label: 'Layers' },
  { key: 'briefcase', label: 'Career' },
  { key: 'play', label: 'Video' },
  { key: 'book', label: 'Writing' },
  { key: 'mail', label: 'Contact' },
  { key: 'globe', label: 'Web' },
  { key: 'code', label: 'Code' },
];

const GRAPHIC_OPTIONS: Array<{ key: CardGraphicStyle; label: string }> = [
  { key: 'minimal', label: 'Minimal' },
  { key: 'circles', label: 'Circles' },
  { key: 'lines', label: 'Lines' },
  { key: 'grid', label: 'Grid' },
  { key: 'editorial', label: 'Frame' },
];

const FONT_OPTIONS: Array<{ key: CardFontStyle; label: string }> = [
  { key: 'sans', label: 'Sans' },
  { key: 'serif', label: 'Serif' },
  { key: 'mono', label: 'Mono' },
];

function createInitialDraft(initialCard?: PRCardData | null): PRCardDraft {
  if (initialCard) {
    return {
      category: initialCard.category,
      title: initialCard.title,
      subtitle: initialCard.subtitle,
      description: initialCard.description,
      url: initialCard.url,
      bgColor: initialCard.bgColor,
      accentColor: initialCard.accentColor,
      graphicStyle: initialCard.graphicStyle,
      fontStyle: initialCard.fontStyle,
      iconKey: initialCard.iconKey,
      imageUrl: initialCard.imageUrl,
    };
  }
  return {
    category: '',
    title: '',
    subtitle: '',
    description: '',
    url: '',
    bgColor: '#E8E5DC',
    accentColor: '#E5482E',
    graphicStyle: 'circles',
    fontStyle: 'sans',
    iconKey: 'compass',
    imageUrl: undefined,
  };
}

export const CardFormModal: React.FC<CardFormModalProps> = ({
  isOpen,
  mode,
  initialCard,
  onClose,
  onSave,
}) => {
  const formId = useId();
  const [draft, setDraft] = useState<PRCardDraft>(() => createInitialDraft(initialCard));
  const [errors, setErrors] = useState<{ category?: string; title?: string; url?: string }>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(createInitialDraft(initialCard));
      setErrors({});
    }
  }, [isOpen, initialCard]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const previewCard: PRCardData = {
    id: initialCard?.id ?? 'preview-card',
    createdAt: initialCard?.createdAt ?? Date.now(),
    category: draft.category.trim() || 'CATEGORY',
    title: draft.title.trim() || 'Your Card Title',
    subtitle: draft.subtitle.trim() || 'Subtitle or Handle',
    description: draft.description.trim(),
    url: draft.url.trim(),
    bgColor: draft.bgColor,
    accentColor: draft.accentColor,
    graphicStyle: draft.graphicStyle,
    fontStyle: draft.fontStyle,
    iconKey: draft.iconKey,
    imageUrl: draft.imageUrl,
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const processed = await processUploadedImage(file);
      setDraft((prev) => ({ ...prev, imageUrl: processed }));
    } catch {
      // Ignore invalid image silently; keep previous state
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { category?: string; title?: string; url?: string } = {};

    const cleanCategory = draft.category.trim();
    const cleanTitle = draft.title.trim();
    const cleanUrl = draft.url.trim();

    if (!cleanCategory) {
      nextErrors.category = '카드 카테고리를 입력해주세요.';
    }
    if (!cleanTitle) {
      nextErrors.title = '카드 제목을 입력해주세요.';
    }
    if (cleanUrl && !normalizeExternalUrl(cleanUrl)) {
      nextErrors.url = '올바른 URL(https://... 또는 mailto:...)을 입력해주세요.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      ...draft,
      category: cleanCategory.toUpperCase(),
      title: cleanTitle,
      subtitle: draft.subtitle.trim(),
      description: draft.description.trim(),
      url: cleanUrl,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] p-0 sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-heading`}
        className="w-full sm:max-w-[680px] max-h-[92vh] bg-[#FFFFFF] rounded-t-[24px] sm:rounded-[24px] border border-[#E8E8E8] shadow-[0_24px_60px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E8E8E8]">
          <div>
            <h2
              id={`${formId}-heading`}
              className="text-[17px] font-bold tracking-[-0.02em] text-[#111111]"
            >
              {mode === 'add' ? 'Add New PR Card' : 'Edit PR Card'}
            </h2>
            <p className="text-[12px] text-[#888888] mt-0.5">
              {mode === 'add'
                ? '나를 표현하는 새로운 카드를 디자인하세요.'
                : '카드 디자인과 연결 링크를 수정하세요.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#888888] hover:text-[#111111] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Live Card Preview */}
          <div className="bg-[#F7F7F5] rounded-[20px] p-4 sm:p-5 border border-[#E8E8E8]/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#888888]">
                Live Preview
              </span>
              <span className="text-[11px] text-[#888888] tabular-nums">1.5 : 1</span>
            </div>
            <div className="max-w-[340px] mx-auto shadow-[0_14px_30px_-10px_rgba(17,17,17,0.18)] rounded-[24px]">
              <PRCard card={previewCard} isInteractive={false} />
            </div>
          </div>

          {/* Core Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`${formId}-category`}
                className="block text-[12px] font-semibold text-[#111111] mb-1.5"
              >
                Category <span className="text-[#D94E34]">*</span>
              </label>
              <input
                id={`${formId}-category`}
                type="text"
                value={draft.category}
                onChange={(e) => {
                  setDraft((prev) => ({ ...prev, category: e.target.value }));
                  if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                placeholder="e.g. PORTFOLIO, GITHUB, BLOG"
                maxLength={24}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E8] text-[14px] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
              />
              {errors.category && (
                <p className="text-[12px] text-[#D94E34] mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${formId}-title`}
                className="block text-[12px] font-semibold text-[#111111] mb-1.5"
              >
                Card Title <span className="text-[#D94E34]">*</span>
              </label>
              <input
                id={`${formId}-title`}
                type="text"
                value={draft.title}
                onChange={(e) => {
                  setDraft((prev) => ({ ...prev, title: e.target.value }));
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                placeholder="e.g. My Architecture Projects"
                maxLength={48}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E8] text-[14px] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
              />
              {errors.title && (
                <p className="text-[12px] text-[#D94E34] mt-1">{errors.title}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`${formId}-subtitle`}
                className="block text-[12px] font-semibold text-[#111111] mb-1.5"
              >
                Subtitle / Brand Name
              </label>
              <input
                id={`${formId}-subtitle`}
                type="text"
                value={draft.subtitle}
                onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="e.g. Studio SORA · Selected Works"
                maxLength={48}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E8] text-[14px] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor={`${formId}-url`}
                className="block text-[12px] font-semibold text-[#111111] mb-1.5"
              >
                Destination URL
              </label>
              <input
                id={`${formId}-url`}
                type="url"
                value={draft.url}
                onChange={(e) => {
                  setDraft((prev) => ({ ...prev, url: e.target.value }));
                  if (errors.url) setErrors((prev) => ({ ...prev, url: undefined }));
                }}
                placeholder="https://example.com (optional)"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E8] text-[14px] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors"
              />
              {errors.url && (
                <p className="text-[12px] text-[#D94E34] mt-1">{errors.url}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor={`${formId}-description`}
              className="block text-[12px] font-semibold text-[#111111] mb-1.5"
            >
              Short Description
            </label>
            <textarea
              id={`${formId}-description`}
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="A brief story about this card..."
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E8] text-[14px] text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111] focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Background Color & Image Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            <div>
              <span className="block text-[12px] font-semibold text-[#111111] mb-2">
                Background Color
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {CARD_COLOR_PRESETS.map((preset) => {
                  const selected =
                    draft.bgColor.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          bgColor: preset.hex,
                          accentColor: preset.accent,
                        }))
                      }
                      aria-label={`Select color ${preset.label}`}
                      title={preset.label}
                      style={{ backgroundColor: preset.hex }}
                      className={`w-8 h-8 rounded-full border transition-transform cursor-pointer ${
                        selected
                          ? 'ring-2 ring-[#111111] ring-offset-2 scale-105 border-black/20'
                          : 'border-black/15 hover:scale-105'
                      }`}
                    />
                  );
                })}
                <label
                  htmlFor={`${formId}-custom-color`}
                  className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-full border border-[#E8E8E8] bg-[#F7F7F5] text-[11px] font-medium text-[#111111] cursor-pointer hover:border-[#111111]"
                >
                  <input
                    id={`${formId}-custom-color`}
                    type="color"
                    value={draft.bgColor}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, bgColor: e.target.value }))
                    }
                    className="w-4 h-4 rounded-full border-0 p-0 bg-transparent cursor-pointer"
                  />
                  <span>Custom</span>
                </label>
              </div>
            </div>

            <div>
              <span className="block text-[12px] font-semibold text-[#111111] mb-2">
                Card Image (Optional)
              </span>
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`${formId}-image-upload`}
                  className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-[#E8E8E8] text-[13px] font-medium text-[#111111] hover:border-[#111111] transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                  <span>{uploading ? 'Processing...' : 'Upload Image'}</span>
                  <input
                    id={`${formId}-image-upload`}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                {draft.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, imageUrl: undefined }))}
                    aria-label="Remove uploaded image"
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl border border-[#E8E8E8] text-[12px] font-medium text-[#888888] hover:text-[#D94E34] hover:border-[#D94E34]/40 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Graphic Style, Typography, Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <span className="block text-[12px] font-semibold text-[#111111] mb-2">
                Graphic Motif
              </span>
              <div className="flex flex-wrap gap-1.5">
                {GRAPHIC_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, graphicStyle: opt.key }))}
                    className={`px-3 py-1.5 min-h-[36px] rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${
                      draft.graphicStyle === opt.key
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#F7F7F5] text-[#555555] border-[#E8E8E8] hover:text-[#111111]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[12px] font-semibold text-[#111111] mb-2">
                Typography
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FONT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, fontStyle: opt.key }))}
                    className={`px-3 py-1.5 min-h-[36px] rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${
                      draft.fontStyle === opt.key
                        ? 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#F7F7F5] text-[#555555] border-[#E8E8E8] hover:text-[#111111]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="block text-[12px] font-semibold text-[#111111] mb-2">
              Card Icon
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, iconKey: opt.key }))}
                  aria-label={`Select ${opt.label} icon`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${
                    draft.iconKey === opt.key
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-[#F7F7F5] text-[#555555] border-[#E8E8E8] hover:text-[#111111]'
                  }`}
                >
                  <CardIcon iconKey={opt.key} className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E8E8]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E8E8] bg-white text-[13px] font-medium text-[#555555] hover:text-[#111111] hover:border-[#111111] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#111111] text-white text-[13px] font-semibold hover:bg-[#2B2B2B] transition-colors cursor-pointer"
            >
              {mode === 'add' ? 'Save Card' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
