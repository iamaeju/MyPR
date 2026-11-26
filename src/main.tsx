import { createRoot } from 'react-dom/client';
import { BrandSite } from './brand/BrandSite';
import { AuthGate } from './components/AuthGate';
import { OwnerRoot } from './OwnerRoot';
import { PublicRoot } from './PublicRoot';
import { handleFromPath } from './utils/handle';
import './index.css';

// /about (or /brand-story) is the brand page, <site>/<handle> is someone's public page,
// and everything else is the owner's editor (logged-out visitors see the brand page there too).
const path = window.location.pathname.replace(/\/+$/, '') || '/';
const isBrandPage = path === '/about' || path === '/brand-story';
const handle = isBrandPage ? null : handleFromPath(path);

createRoot(document.getElementById('root')!).render(
  isBrandPage ? (
    <BrandSite />
  ) : handle ? (
    <PublicRoot handle={handle} />
  ) : (
    <AuthGate>
      {(session, signOut) => <OwnerRoot key={session.user.id} session={session} onSignOut={signOut} />}
    </AuthGate>
  )
);
