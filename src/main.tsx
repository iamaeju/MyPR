import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthGate } from './components/AuthGate';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AuthGate>
    {(session, signOut) => {
      const user = session.user;
      const metaName = user.user_metadata?.username;
      const defaultName =
        (typeof metaName === 'string' && metaName.trim()) || user.email?.split('@')[0] || 'MyPR';
      return <App key={user.id} userId={user.id} defaultName={defaultName} onSignOut={signOut} />;
    }}
  </AuthGate>
);
