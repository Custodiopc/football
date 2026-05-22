import { useState } from 'react';
import { isValidNickname } from '../lib/utils';
import { Button } from './Button';

interface NicknameInputProps {
  initial?: string;
  onSave: (nickname: string) => void;
  loading?: boolean;
}

export function NicknameInput({ initial = '', onSave, loading = false }: NicknameInputProps) {
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);

  const valid = isValidNickname(value);
  const error = touched && !valid ? 'Use de 3 a 20 caracteres: letras, números ou _' : null;

  const handleSubmit = () => {
    setTouched(true);
    if (valid) onSave(value.trim());
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#a8b8cc', marginBottom: 6 }}>
          Apelido do treinador
        </label>
        <input
          type="text"
          value={value}
          maxLength={20}
          placeholder="ex: Craque2026"
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%',
            borderRadius: 8,
            border: error ? '1px solid #ef4444' : '1px solid #1e3a5c',
            backgroundColor: '#0d1f36',
            padding: '10px 14px',
            fontSize: 14,
            color: '#f5f5f0',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
        <p style={{ fontSize: 11, color: '#6b7c93', marginTop: 2 }}>{value.length}/20</p>
      </div>
      <Button onClick={handleSubmit} loading={loading} fullWidth>
        Salvar apelido »
      </Button>
    </div>
  );
}
