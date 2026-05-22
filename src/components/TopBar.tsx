import { User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';

interface TopBarProps {
  onChangeNickname?: () => void;
}

export function TopBar({ onChangeNickname }: TopBarProps) {
  const nickname = useSettingsStore((s) => s.nickname);

  return (
    <header className="flex items-center justify-between border-b border-white/8 bg-ink/80 px-4 py-3 backdrop-blur-sm">
      <Link to="/" className="font-retro text-2xl tracking-widest text-gold hover:text-gold-light transition-colors">
        BRASFOOT
      </Link>

      {nickname && (
        <button
          onClick={onChangeNickname}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-cream/60 transition-colors hover:bg-white/5 hover:text-cream"
        >
          <User size={14} />
          <span>{nickname}</span>
        </button>
      )}
    </header>
  );
}
