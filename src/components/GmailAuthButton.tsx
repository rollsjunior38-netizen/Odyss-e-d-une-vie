import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Mail, LogOut, CheckCircle, Loader2 } from 'lucide-react';
import { googleSignIn, googleLogout } from '../services/googleAuth';

interface GmailAuthButtonProps {
  currentUser: User | null;
  onAuthChange: (user: User | null, token: string | null) => void;
}

export const GmailAuthButton: React.FC<GmailAuthButtonProps> = ({
  currentUser,
  onAuthChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthChange(res.user, res.accessToken);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleLogout();
      onAuthChange(null, null);
      setShowDropdown(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  if (currentUser) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs text-neutral-200 transition-colors"
          title="Compte Gmail connecté pour l'envoi des billets"
        >
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover border border-amber-400/50"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
              {currentUser.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="max-w-[130px] truncate text-white font-medium">
            {currentUser.displayName || currentUser.email}
          </span>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl p-3 z-50 text-xs space-y-2.5">
            <div className="border-b border-neutral-800 pb-2">
              <div className="font-semibold text-white truncate">{currentUser.displayName || 'Utilisateur'}</div>
              <div className="text-neutral-400 truncate text-[11px] font-mono">{currentUser.email}</div>
              <div className="text-emerald-400 text-[10px] flex items-center gap-1 mt-1">
                <CheckCircle className="w-3 h-3" />
                <span>Prêt pour l'envoi de billets via Gmail</span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-neutral-300 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnecter Gmail</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-medium text-neutral-200 transition-colors shadow-sm"
      title="Connecter un compte Gmail pour envoyer les billets directement par email"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
          />
        </svg>
      )}
      <span>Connecter Gmail</span>
    </button>
  );
};
