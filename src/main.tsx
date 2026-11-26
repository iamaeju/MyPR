import { createRoot } from 'react-dom/client';
import { AuthGate } from './components/AuthGate';
import { OwnerRoot } from './OwnerRoot';
import { PublicRoot } from './PublicRoot';
import { handleFromPath } from './utils/handle';
import './index.css';

// <site>/<handle> is someone's public page; everything else is the owner's editor.
const handle = handleFromPath(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  handle ? (
    <PublicRoot handle={handle} />
  ) : (
    <AuthGate>
      {(session, signOut) => <OwnerRoot key={session.user.id} session={session} onSignOut={signOut} />}
    </AuthGate>
  )
);
