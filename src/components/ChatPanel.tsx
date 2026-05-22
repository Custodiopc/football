import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { useMultiStore } from '../stores/multiStore';
import type { ChatMessage } from '../types/multi';

interface ChatPanelProps {
  className?: string;
  onClose?: () => void;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.is_system) {
    return (
      <div className="py-0.5 text-center text-xs text-cream/35 italic">
        {msg.text}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gold/80">{msg.from}</span>
      <p className="rounded-xl rounded-tl-sm bg-white/6 px-3 py-1.5 text-sm text-cream/90 leading-snug">
        {msg.text}
      </p>
    </div>
  );
}

export function ChatPanel({ className = '', onClose }: ChatPanelProps) {
  const { chat, sendChat } = useMultiStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ao receber mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendChat(trimmed);
    setInput('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={['flex flex-col border border-white/8 bg-ink-card rounded-2xl overflow-hidden', className].join(' ')}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-cream/70">
          <MessageSquare size={15} />
          Chat
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-cream/40 hover:text-cream">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">
        {chat.length === 0 && (
          <p className="text-center text-xs text-cream/25 py-4">
            Nenhuma mensagem ainda
          </p>
        )}
        {chat.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/8 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          maxLength={200}
          placeholder="Mensagem..."
          className="flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-gold/40"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="rounded-xl bg-gold px-3 py-2 text-ink transition-opacity disabled:opacity-40 hover:bg-gold-light"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
