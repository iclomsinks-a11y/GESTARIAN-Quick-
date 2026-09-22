import React from 'react';
import { AuthUser } from '../types';
import { AccessScreen } from './AccessScreen';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onUserChange: (user: AuthUser | null) => void;
  onToast: (msg: string, type?: 'success' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onToast,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg my-auto">
        <AccessScreen
          currentUser={currentUser}
          onUserChange={onUserChange}
          onClose={onClose}
          onToast={onToast}
          isModal={true}
        />
      </div>
    </div>
  );
};
