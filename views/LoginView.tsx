import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Dumbbell, Lock, User as UserIcon } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useStore();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!login(username, password)) {
      setError('Credenciais inválidas. Verifique usuário e senha.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-4 text-[#4E342E]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E5E0D8]">
        <div className="bg-[#A66B5D] p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex p-4 bg-[#F8F6F2] rounded-full mb-4 shadow-lg text-[#A66B5D]">
              <Dumbbell size={48} />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-widest mb-1" style={{ fontFamily: 'sans-serif' }}>BEFIT</h1>
            <p className="text-[#F8F6F2] text-sm uppercase tracking-wide">Moda Fitness</p>
          </div>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#4E342E] mb-2 uppercase tracking-wide">
                Usuário / Nickname
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A66B5D]" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F8F6F2] border border-[#E5E0D8] text-[#4E342E] focus:border-[#A66B5D] focus:ring-1 focus:ring-[#A66B5D] outline-none transition-all placeholder-gray-400"
                  placeholder="ex: caixa"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#4E342E] mb-2 uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A66B5D]" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#F8F6F2] border border-[#E5E0D8] text-[#4E342E] focus:border-[#A66B5D] focus:ring-1 focus:ring-[#A66B5D] outline-none transition-all placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#4E342E] hover:bg-[#3E2723] text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 shadow-lg uppercase tracking-wider"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Admin: <strong>admin</strong> / <strong>admin</strong></p>
            <p>Caixa: <strong>caixa</strong> / <strong>caixa</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};