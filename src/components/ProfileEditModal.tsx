import React, { useEffect, useState } from 'react';
import { Camera, Loader2, Plus, Trash2, X } from 'lucide-react';
import type { ProfileLink, UserProfile } from '../types/profile';
import { normalizeHandle, validateHandle } from '../utils/handle';
import { processUploadedImage } from '../utils/imageHelper';
import { detectPlatform, PLATFORM_META, toSafeLink } from '../utils/linkPlatform';
import { Avatar } from './Avatar';
import { SocialIcon } from './SocialIcon';

interface ProfileEditModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  /** Resolves to an error message when the address is taken, or null. */
  checkHandle: (handle: string) => Promise<string | null>;
}

const MAX_LINKS = 6;

const newLinkId = () => `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
  checkHandle,
}) => {
  const [handle, setHandle] = useState(profile.handle);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [links, setLinks] = useState<ProfileLink[]>(profile.links);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setHandle(profile.handle);
    setIsSaving(false);
    setName(profile.name);
    setBio(profile.bio);
    setAvatarUrl(profile.avatarUrl);
    setLinks(profile.links.length > 0 ? profile.links : [{ id: newLinkId(), url: '' }]);
    setError(null);
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setAvatarUrl(await processUploadedImage(file, 320, 0.85));
    } catch {
      setError('사진을 불러오지 못했어요. 다른 사진을 골라주세요.');
    }
  };

  const updateLink = (id: string, url: string) =>
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, url } : l)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    const cleanHandle = normalizeHandle(handle);
    const handleError = validateHandle(cleanHandle);
    if (handleError) {
      setError(handleError);
      return;
    }
    const cleanName = name.trim();
    if (!cleanName) {
      setError('이름을 입력해주세요.');
      return;
    }
    const cleanedLinks: ProfileLink[] = [];
    for (const link of links) {
      if (!link.url.trim()) continue;
      const safe = toSafeLink(link.url);
      if (!safe) {
        setError(`"${link.url.trim()}" 은(는) 올바른 링크가 아니에요.`);
        return;
      }
      cleanedLinks.push({ id: link.id, url: safe });
    }
    if (cleanHandle !== profile.handle) {
      setIsSaving(true);
      const takenError = await checkHandle(cleanHandle);
      setIsSaving(false);
      if (takenError) {
        setError(takenError);
        return;
      }
    }
    onSave({ handle: cleanHandle, name: cleanName, bio: bio.trim(), avatarUrl, links: cleanedLinks });
  };

  const inputClass =
    'w-full h-12 rounded-xl border border-[#E3E3E0] bg-white px-3.5 text-[16px] text-[#111111] placeholder:text-[#B0B0AC] focus:outline-none focus:border-[#111111] transition-colors';

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-heading"
        onSubmit={handleSubmit}
        noValidate
        className="w-full sm:max-w-[460px] max-h-[92dvh] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <h2 id="profile-edit-heading" className="text-[17px] font-bold tracking-[-0.02em]">
            프로필 편집
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2">
            <label className="relative cursor-pointer group" aria-label="프로필 사진 바꾸기">
              <Avatar name={name || 'M'} src={avatarUrl} size={96} />
              <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-[#E3E3E0] flex items-center justify-center shadow-sm group-hover:bg-[#111111] group-hover:text-white transition-colors">
                <Camera className="w-4 h-4" aria-hidden="true" />
              </span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            </label>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(undefined)}
                className="text-[13px] text-[#888888] underline underline-offset-2 cursor-pointer"
              >
                사진 삭제
              </button>
            )}
          </div>

          <div>
            <label htmlFor="profile-name" className="block text-[13px] font-semibold text-[#555555] mb-1.5">
              이름
            </label>
            <input
              id="profile-name"
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="profile-handle" className="block text-[13px] font-semibold text-[#555555] mb-1.5">
              내 페이지 주소
            </label>
            <div className="flex items-center h-12 rounded-xl border border-[#E3E3E0] bg-white focus-within:border-[#111111] transition-colors overflow-hidden">
              <span className="pl-3.5 pr-0.5 text-[15px] text-[#999999] whitespace-nowrap">
                {window.location.host}/
              </span>
              <input
                id="profile-handle"
                value={handle}
                maxLength={20}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="flex-1 min-w-0 h-full pr-3.5 bg-transparent text-[16px] text-[#111111] focus:outline-none"
              />
            </div>
            <p className="mt-1.5 text-[12px] text-[#999999]">영어 소문자, 숫자, 밑줄(_) 3~20자</p>
          </div>

          <div>
            <label htmlFor="profile-bio" className="block text-[13px] font-semibold text-[#555555] mb-1.5">
              한 줄 소개
            </label>
            <input
              id="profile-bio"
              value={bio}
              maxLength={60}
              placeholder="예: 공간을 디자인하는 건축가"
              onChange={(e) => setBio(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <p className="text-[13px] font-semibold text-[#555555] mb-1.5">소셜 링크</p>
            <p className="text-[12px] text-[#999999] mb-2.5">
              인스타그램, 블로그, 유튜브 주소나 이메일을 넣으면 아이콘이 자동으로 정해져요.
            </p>
            <div className="flex flex-col gap-2">
              {links.map((link) => {
                const safe = toSafeLink(link.url);
                const platform = safe ? detectPlatform(safe) : 'website';
                return (
                  <div key={link.id} className="flex items-center gap-2">
                    <span
                      className="w-12 h-12 shrink-0 rounded-xl bg-white border border-[#E3E3E0] flex items-center justify-center text-[#111111]"
                      title={PLATFORM_META[platform].label}
                    >
                      <SocialIcon platform={platform} />
                    </span>
                    <input
                      value={link.url}
                      inputMode="url"
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="instagram.com/내아이디"
                      aria-label="소셜 링크 주소"
                      onChange={(e) => updateLink(link.id, e.target.value)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setLinks((prev) => prev.filter((l) => l.id !== link.id))}
                      aria-label="링크 삭제"
                      className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-[#999999] hover:text-[#D94E34] hover:bg-black/5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
            {links.length < MAX_LINKS && (
              <button
                type="button"
                onClick={() => setLinks((prev) => [...prev, { id: newLinkId(), url: '' }])}
                className="mt-2.5 inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-[14px] font-medium text-[#111111] hover:bg-black/5 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                링크 추가
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="text-[14px] text-[#C2412B]">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-[#EEEEEE] bg-white">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-[52px] rounded-2xl bg-[#111111] text-white text-[16px] font-bold inline-flex items-center justify-center gap-2 hover:bg-[#2A2A2A] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            저장
          </button>
        </div>
      </form>
    </div>
  );
};
