/**
 * Turns raw Supabase / network errors into messages a person can act on.
 * Safari reports any failed fetch as "Load failed", Chrome as "Failed to fetch".
 */
export function toKoreanAuthError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error ?? '');
  const message = raw.toLowerCase();

  if (
    message.includes('load failed') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed')
  ) {
    return '서버에 연결하지 못했어요. 인터넷 연결을 확인하고 잠시 후 다시 시도해주세요.';
  }
  if (message.includes('invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않아요.';
  }
  if (message.includes('email not confirmed')) {
    return '이메일 인증이 아직 완료되지 않았어요. 받은 메일함에서 인증 링크를 눌러주세요.';
  }
  if (message.includes('already registered') || message.includes('already been registered')) {
    return '이미 가입된 이메일이에요. 로그인해주세요.';
  }
  if (message.includes('password should be at least') || message.includes('weak password')) {
    return '비밀번호가 너무 짧거나 쉬워요. 6자 이상으로 입력해주세요.';
  }
  if (message.includes('invalid') && message.includes('email')) {
    return '이메일 형식이 올바르지 않아요.';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
  }
  if (message.includes('signups not allowed') || message.includes('signup is disabled')) {
    return '현재 회원가입이 비활성화되어 있어요.';
  }
  return raw ? `오류가 발생했어요: ${raw}` : '알 수 없는 오류가 발생했어요. 다시 시도해주세요.';
}
