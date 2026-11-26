import { useEffect, useState } from 'react';
import { MyPRLogo } from '../components/MyPRLogo';
import { supabase } from '../lib/supabase';
import './brand.css';

const SIGNUP_URL = '/?mode=signup';
const LOGIN_URL = '/?mode=login';

const NAV = [
  { label: 'BRAND STORY', href: '#story' },
  { label: 'HOW IT WORKS', href: '#how' },
  { label: 'OUR MESSAGE', href: '#message' },
  { label: 'BRAND MARK', href: '#mark' },
];

const PILLARS = [
  {
    num: '01',
    eng: 'Profile',
    kor: '나를 소개하는 첫 화면',
    desc: '사진, 이름, 한 줄 소개와 소셜 링크를 한 화면에. / Your photo, name, one-liner and social links at a glance.',
    bg: '#FFFFFF',
    fg: '#0A0A0A',
  },
  {
    num: '02',
    eng: 'Cards',
    kor: '나를 닮은 카드 덱',
    desc: '포트폴리오, 블로그, 영상까지 흩어진 링크를 한 장씩 카드로. / Every link becomes a card in your personal deck.',
    bg: '#E6E6E6',
    fg: '#0A0A0A',
  },
  {
    num: '03',
    eng: 'Create',
    kor: '주소 하나로 새 카드',
    desc: '+ 버튼을 누르고 주소만 넣으면 플랫폼에 맞는 카드가 완성됩니다. / Paste a link, press OK — the card styles itself.',
    bg: '#6B6B6B',
    fg: '#FFFFFF',
  },
  {
    num: '04',
    eng: 'Share',
    kor: '링크 하나로 공유',
    desc: 'mypr/내주소 하나로 누구에게나 나를 소개하세요. / One address that presents all of you.',
    bg: '#0A0A0A',
    fg: '#FFFFFF',
  },
];

const SWATCHES = [
  { name: 'Ink · 잉크 블랙', hex: '#0A0A0A', fg: '#FFFFFF', role: 'Type, buttons & the front card' },
  { name: 'Graphite · 그라파이트', hex: '#2B2B2B', fg: '#FFFFFF', role: 'Hover fills & deep accents' },
  { name: 'Steel · 스틸 그레이', hex: '#6B6B6B', fg: '#FFFFFF', role: 'Secondary text & stacked cards' },
  { name: 'Mist · 미스트', hex: '#E6E6E6', fg: '#0A0A0A', role: 'Quiet blocks & rules' },
  { name: 'Fog · 포그', hex: '#F3F3F3', fg: '#0A0A0A', role: 'Soft panels' },
  { name: 'Paper · 페이퍼 화이트', hex: '#FFFFFF', fg: '#0A0A0A', role: 'Every background' },
];

/** Little monochrome stack used inside the phone mockups. */
function MiniStack({ cards, height }: { cards: Array<{ bg: string; fg: string; label: string }>; height: number }) {
  const step = 18;
  return (
    <div className="m-stack" style={{ height }}>
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="m-card"
          style={{ top: i * step, background: c.bg, color: c.fg, zIndex: i + 1, transform: `scale(${0.9 + i * 0.033})` }}
        >
          {c.label}
        </div>
      ))}
    </div>
  );
}

const STACK = [
  { bg: '#E6E6E6', fg: '#0A0A0A', label: 'LINKEDIN' },
  { bg: '#2B2B2B', fg: '#FFFFFF', label: 'INSTAGRAM' },
  { bg: '#F3F3F3', fg: '#0A0A0A', label: 'BLOG' },
  { bg: '#0A0A0A', fg: '#FFFFFF', label: 'PORTFOLIO' },
];

function PhoneProfile() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="screen">
        <div className="m-top">
          <MyPRLogo className="h-3.5 w-auto" title="" />
          <span className="m-dots"><i /><i /><i /></span>
        </div>
        <div className="m-profile">
          <span className="m-avatar" style={{ width: 52, height: 52, fontSize: 20 }}>M</span>
          <span className="m-name" />
          <span className="m-bio" />
          <span className="m-icons"><i /><i /><i /><i /></span>
        </div>
        <div className="m-sheet" style={{ top: '52%' }}>
          <div className="m-handle" />
          <div className="m-label"><span>MY CARDS</span><span>04</span></div>
          <MiniStack cards={STACK} height={160} />
        </div>
      </div>
    </div>
  );
}

function PhoneCards() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="screen">
        <div className="m-top">
          <MyPRLogo className="h-3.5 w-auto" title="" />
          <span className="m-avatar" style={{ width: 22, height: 22, fontSize: 9 }}>M</span>
        </div>
        <div className="m-sheet" style={{ top: 44 }}>
          <div className="m-handle" />
          <div className="m-label"><span>MY CARDS</span><span>04</span></div>
          <div style={{ marginTop: 22 }}>
            <MiniStack cards={STACK} height={200} />
          </div>
        </div>
        <span className="m-plus">+</span>
      </div>
    </div>
  );
}

function PhoneCreate() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="screen">
        <div className="m-top">
          <MyPRLogo className="h-3.5 w-auto" title="" />
          <span className="m-avatar" style={{ width: 22, height: 22, fontSize: 9 }}>M</span>
        </div>
        <div className="m-sheet" style={{ top: 44 }}>
          <div className="m-handle" />
          <MiniStack cards={STACK.slice(0, 3)} height={160} />
        </div>
        <div className="m-dim" />
        <div className="m-popup">
          <p className="m-popup-title">
            CREATE
            <br />
            MYPR
            <br />
            CARD
          </p>
          <div className="m-input">
            <span>instagram.com/me</span>
            <span className="m-ok">OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** MyPR brand story / landing page. */
export function BrandSite() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    document.title = 'MyPR — Present yourself, by yourself.';
    supabase?.auth
      .getSession()
      .then(({ data }) => setIsSignedIn(Boolean(data.session)))
      .catch(() => {});
  }, []);

  const primaryHref = isSignedIn ? '/' : SIGNUP_URL;
  const primaryLabel = isSignedIn ? '내 MyPR 열기' : 'MyPR 시작하기';

  return (
    <div className="bs">
      <header className="site-header" data-surface="paper">
        <div className="grid header-grid">
          <a className="logo-link" href="/about" aria-label="MyPR 소개 맨 위로">
            <MyPRLogo className="h-7 w-auto" title="" />
            <span className="logo-wordmark">MyPR</span>
          </a>
          <nav className="main-nav" aria-label="MyPR 소개 메뉴">
            {NAV.map((n) => (
              <a key={n.href} className="t-micro btn-text u-anim" href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            {!isSignedIn && (
              <a className="header-login t-small btn-text u-anim" href={LOGIN_URL}>
                (로그인)
              </a>
            )}
            <a className="btn-primary btn-sm t-small" href={primaryHref}>
              <span>{primaryLabel}</span>
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* BRAND STORY */}
        <section className="sub-sec" id="story" data-surface="paper">
          <div className="grid">
            <p className="col-1-3 label-col t-micro">(BRAND STORY)</p>
            <div className="col-5-12">
              <p className="t-small fw-600">
                MyPR : Presentation Represented by Myself · 나를 표현하는 카드 컬렉션
              </p>
              <h1 className="t-h1" style={{ marginTop: 12 }}>
                Present yourself,
                <br />
                by yourself.
              </h1>
              <p className="t-h2" style={{ marginTop: 14 }}>
                나를 소개하는 가장 나다운 방법.
              </p>
              <div className="manifesto-strip">
                <span className="t-lead">흩어진 나를, 한 장의 카드 덱으로.</span>
                <span className="t-micro">All of you, in one deck.</span>
              </div>
              <div className="keyword-row" aria-label="Brand keywords">
                <span className="keyword-chip is-filled">#나다움</span>
                <span className="keyword-chip">#PR</span>
                <span className="keyword-chip">#카드</span>
                <span className="keyword-chip">#링크</span>
              </div>
            </div>
          </div>

          <div className="grid card-row">
            <div className="col-1-6 b-card" data-surface="paper">
              <div>
                <p className="t-micro">(WHAT IS MYPR? · MyPR의 시작)</p>
                <h2 className="t-h2" style={{ marginTop: 12 }}>
                  흩어진 링크를 나를 닮은 카드로
                </h2>
                <p className="t-body" style={{ marginTop: 16 }}>
                  인스타그램, 블로그, 포트폴리오, 유튜브까지. 여기저기 흩어진 나의 모습을 한 장씩 카드로 만들어 한
                  곳에 모아요. MyPR은 나를 소개하는 나만의 카드 컬렉션입니다.
                </p>
                <p className="t-small muted" style={{ marginTop: 10 }}>
                  MyPR turns the scattered pieces of you — posts, projects, videos — into one deck of cards that
                  presents who you are.
                </p>
              </div>
              <div className="b-card-foot">
                <span className="t-micro">PRESENTATION REPRESENTED BY MYSELF</span>
                <a className="btn-text t-micro u-anim" href="#how">
                  (어떻게 쓰나요 →)
                </a>
              </div>
            </div>

            <div className="col-7-12 b-card" data-surface="fog">
              <div>
                <p className="t-micro">(WHO? · 누가 MyPR을 만드나요?)</p>
                <h2 className="t-h2" style={{ marginTop: 12 }}>
                  나를 알리고 싶은 누구나 주인공이 됩니다
                </h2>
                <p className="t-body" style={{ marginTop: 16 }}>
                  디자이너, 크리에이터, 학생, 프리랜서, 작은 브랜드까지. 나를 한 번에 보여주고 싶은 사람이라면 누구나
                  1분 만에 나만의 MyPR 페이지를 만들 수 있어요.
                </p>
                <p className="t-small muted" style={{ marginTop: 10 }}>
                  Designers, creators, students, freelancers — anyone can build their MyPR page in a minute.
                </p>
              </div>
              <div className="b-card-foot" style={{ justifyContent: 'flex-start' }}>
                <a className="btn-primary t-small" href={primaryHref}>
                  <span>{primaryLabel}</span>
                </a>
                {!isSignedIn && (
                  <a className="btn-text t-small u-anim" href={LOGIN_URL}>
                    (이미 계정이 있어요 · 로그인)
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid" style={{ marginTop: 'var(--s7)' }}>
            <div className="col-full">
              <p className="t-micro">(FOUR PILLARS · MyPR을 이루는 네 가지)</p>
              <div className="pillars-grid">
                {PILLARS.map((p) => (
                  <article key={p.num} className="pillar-card" style={{ background: p.bg, color: p.fg }}>
                    <div>
                      <p className="t-micro">{p.num}</p>
                      <h3 className="t-h2" style={{ marginTop: 8 }}>
                        {p.eng}
                      </h3>
                      <p className="t-small fw-600" style={{ marginTop: 4 }}>
                        {p.kor}
                      </p>
                    </div>
                    <p className="t-small" style={{ opacity: 0.92 }}>
                      {p.desc}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="sec" id="how" data-surface="ink">
          <div className="grid">
            <p className="col-1-3 label-col t-micro">(HOW IT WORKS · 세 화면으로 끝)</p>
            <div className="col-5-12">
              <h2 className="t-h2">프로필을 만들고, 카드를 쌓고, 링크 하나로 공유하세요.</h2>
              <p className="t-small muted" style={{ marginTop: 10 }}>
                Make your profile, stack your cards, share one link.
              </p>
            </div>
          </div>
          <div className="grid">
            <div className="col-full steps-grid">
              <div className="step">
                <PhoneProfile />
                <div>
                  <p className="t-micro">#01 · PROFILE</p>
                  <p className="t-lead" style={{ marginTop: 6 }}>
                    처음 화면
                  </p>
                  <p className="t-small muted" style={{ marginTop: 6 }}>
                    가운데 프로필, 이름, 소셜 아이콘. 아래에는 나의 카드 덱이 놓여요.
                  </p>
                </div>
              </div>
              <div className="step">
                <PhoneCards />
                <div>
                  <p className="t-micro">#02 · MY CARDS</p>
                  <p className="t-lead" style={{ marginTop: 6 }}>
                    위로 올리면 전체화면
                  </p>
                  <p className="t-small muted" style={{ marginTop: 6 }}>
                    카드를 넘겨 보고, 프로필 사진은 오른쪽 위로 자리를 옮겨요.
                  </p>
                </div>
              </div>
              <div className="step">
                <PhoneCreate />
                <div>
                  <p className="t-micro">#03 · CREATE</p>
                  <p className="t-lead" style={{ marginTop: 6 }}>
                    + 버튼으로 새 카드
                  </p>
                  <p className="t-small muted" style={{ marginTop: 6 }}>
                    사이트 주소를 넣고 OK. 플랫폼에 어울리는 카드가 바로 만들어져요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* OUR MESSAGE */}
        <section className="sec" id="message" data-surface="ink" style={{ paddingTop: 0 }}>
          <div className="grid">
            <p className="col-1-3 label-col t-micro">(OUR MESSAGE · 나 다움)</p>
            <div className="col-5-12 findme-box">
              <p className="t-h2">
                MyPR과 함께 나를 가장 나답게 보여주세요.
                <br />
                나를 PR하세요!
              </p>
              <p className="t-h1" style={{ marginTop: 4 }}>
                Profile, Cards, Create, Share —
                <br />
                Let&apos;s PR me!
              </p>
              <p className="t-small muted">
                One page, one deck, one link. Present yourself, by yourself.
              </p>
              <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <a className="btn-primary t-small" href={primaryHref}>
                  <span>{isSignedIn ? '내 MyPR 열기 · OPEN' : 'GET STARTED · 지금 시작하기'}</span>
                </a>
                {!isSignedIn && (
                  <a className="btn-text t-small u-anim" href={LOGIN_URL}>
                    (로그인하기)
                  </a>
                )}
                <a className="btn-text t-small u-anim" href="#how">
                  (세 화면 다시 보기)
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* BRAND MARK */}
        <section className="sec" id="mark" data-surface="paper">
          <div className="grid">
            <p className="col-1-3 label-col t-micro">(BRAND MARK · 심볼과 컬러)</p>
            <h2 className="col-5-12 t-h2">겹겹이 쌓인 카드, 그리고 흑과 백.</h2>
          </div>
          <div className="grid card-row">
            <div className="col-1-6 b-card" data-surface="paper">
              <div className="logo-stage">
                <MyPRLogo className="logo-stage-mark" title="MyPR 심볼" />
              </div>
              <div>
                <h3 className="t-lead">01. MyPR 심볼 · Brand Mark</h3>
                <p className="t-body" style={{ marginTop: 8 }}>
                  네 장의 카드가 겹쳐진 형태는 여러 모습의 내가 모여 하나의 나를 이룬다는 뜻을 담았어요. 맨 앞의 가장
                  진한 카드가 지금 보여주고 싶은 나입니다. / Four stacked cards — many sides of you, one deck, with
                  the boldest card in front.
                </p>
              </div>
            </div>

            <div className="col-7-12 b-card" data-surface="fog">
              <div>
                <h3 className="t-lead">02. 모노크롬 컬러 · Monochrome System</h3>
                <p className="t-body" style={{ marginTop: 8 }}>
                  색은 덜어내고 사람을 남겼어요. 블랙과 화이트 사이 여섯 단계 톤만으로 화면 전체를 만들어, 카드에
                  담긴 사진과 이야기가 가장 먼저 보이게 했습니다. / Six tones between black and white, so your
                  content leads.
                </p>
              </div>
              <div className="swatch-grid">
                {SWATCHES.map((s) => (
                  <div key={s.hex} className="swatch-cell" style={{ background: s.hex, color: s.fg }}>
                    <div>
                      <div className="t-micro fw-600">{s.name}</div>
                      <div className="t-micro" style={{ opacity: 0.8, marginTop: 4 }}>
                        {s.role}
                      </div>
                    </div>
                    <div className="t-micro">{s.hex}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" data-surface="paper">
        <div className="grid">
          <p className="col-full t-mega" aria-hidden="true">
            MyPR
          </p>
        </div>
        <div className="grid footer-row">
          <p className="col-1-6 t-small">
            Presentation Represented by Myself.
            <br />
            <span className="muted">나를 표현하는 카드 컬렉션, MyPR.</span>
          </p>
          <div className="col-7-12 footer-links">
            <a className="btn-text t-small u-anim" href={primaryHref}>
              ({primaryLabel})
            </a>
            {!isSignedIn && (
              <a className="btn-text t-small u-anim" href={LOGIN_URL}>
                (로그인)
              </a>
            )}
            {NAV.map((n) => (
              <a key={n.href} className="btn-text t-small u-anim" href={n.href}>
                ({n.label})
              </a>
            ))}
          </div>
        </div>
        <div className="grid" style={{ marginTop: 'var(--s5)' }}>
          <p className="col-full t-micro muted">© 2026 MyPR</p>
        </div>
      </footer>
    </div>
  );
}
