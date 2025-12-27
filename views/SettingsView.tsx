import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole, User } from '../types';
import { User as UserIcon, Lock, Store, Users, Save, Trash2, Plus, Shield, AlertTriangle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, users, storeConfig, updateStoreConfig, updateUser, addUser, deleteUser } = useStore();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'USERS' | 'STORE'>('PROFILE');

  // Profile State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileUsername, setProfileUsername] = useState(currentUser?.username || '');
  const [newPassword, setNewPassword] = useState('');

  // Store State
  const [storeName, setStoreName] = useState(storeConfig.storeName);
  const [storeAddr, setStoreAddr] = useState(storeConfig.storeAddress);
  const [lowStockThresh, setLowStockThresh] = useState(storeConfig.lowStockThreshold || 5);

  // New User State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserNickname, setNewUserNickname] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.CAIXA);

  const handleUpdateProfile = () => {
    if (currentUser) {
      updateUser({
        ...currentUser,
        name: profileName,
        username: profileUsername,
        password: newPassword ? newPassword : currentUser.password
      });
      alert('Perfil atualizado com sucesso!');
      setNewPassword('');
    }
  };

  const handleUpdateStore = () => {
    updateStoreConfig({
      ...storeConfig,
      storeName: storeName,
      storeAddress: storeAddr,
      lowStockThreshold: Number(lowStockThresh)
    });
    alert('Configurações da loja salvas!');
  };

  const handleAddUser = () => {
    if (newUserName && newUserNickname && newUserPass) {
      addUser({
        id: Date.now(),
        name: newUserName,
        username: newUserNickname,
        password: newUserPass,
        role: newUserRole,
        permissions: []
      });
      setShowUserModal(false);
      setNewUserName('');
      setNewUserNickname('');
      setNewUserPass('');
    }
  };

  return (
    <div className="flex h-full bg-[#F8F6F2]">
      {/* Sidebar Navigation for Settings */}
      <div className="w-64 bg-white border-r border-[#D7CCC8] flex flex-col">
        <div className="p-6 border-b border-[#D7CCC8]">
            <h2 className="text-xl font-bold text-[#4E342E]">Configurações</h2>
            <p className="text-xs text-[#8D6E63]">Gerencie o sistema</p>
        </div>
        <div className="flex-1 py-4">
            <button 
                onClick={() => setActiveTab('PROFILE')}
                className={`w-full text-left px-6 py-4 flex items-center gap-3 font-medium transition-colors ${activeTab === 'PROFILE' ? 'bg-[#EFEBE9] text-[#A66B5D] border-r-4 border-[#A66B5D]' : 'text-[#5D4037] hover:bg-[#FAFAFA]'}`}
            >
                <UserIcon size={20} /> Meu Perfil & Senha
            </button>
            <button 
                onClick={() => setActiveTab('STORE')}
                className={`w-full text-left px-6 py-4 flex items-center gap-3 font-medium transition-colors ${activeTab === 'STORE' ? 'bg-[#EFEBE9] text-[#A66B5D] border-r-4 border-[#A66B5D]' : 'text-[#5D4037] hover:bg-[#FAFAFA]'}`}
            >
                <Store size={20} /> Estilo & Loja
            </button>
            {currentUser?.role === UserRole.ADMIN && (
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`w-full text-left px-6 py-4 flex items-center gap-3 font-medium transition-colors ${activeTab === 'USERS' ? 'bg-[#EFEBE9] text-[#A66B5D] border-r-4 border-[#A66B5D]' : 'text-[#5D4037] hover:bg-[#FAFAFA]'}`}
                >
                    <Users size={20} /> Usuários & Permissões
                </button>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* --- PROFILE TAB --- */}
        {activeTab === 'PROFILE' && (
            <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-[#4E342E] mb-6">Meu Perfil</h3>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-[#D7CCC8] space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-2">Nome Completo</label>
                            <input 
                                className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white text-[#4E342E]"
                                value={profileName}
                                onChange={e => setProfileName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-2">Usuário / Nickname</label>
                            <input 
                                className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white text-[#4E342E]"
                                value={profileUsername}
                                onChange={e => setProfileUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t border-[#E0E0E0] pt-6">
                        <h4 className="flex items-center gap-2 font-bold text-[#A66B5D] mb-4">
                            <Lock size={18} /> Alterar Senha
                        </h4>
                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-2">Nova Senha</label>
                            <input 
                                type="password"
                                className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white text-[#4E342E]"
                                placeholder="Deixe em branco para manter a atual"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                            <p className="text-xs text-gray-400 mt-1">Mínimo de 6 caracteres recomendado.</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleUpdateProfile}
                        className="flex items-center justify-center gap-2 w-full bg-[#4E342E] text-white py-3 rounded font-bold hover:bg-[#3E2723] transition-colors"
                    >
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </div>
        )}

        {/* --- STORE TAB --- */}
        {activeTab === 'STORE' && (
             <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-[#4E342E] mb-6">Configurações da Loja</h3>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-[#D7CCC8] space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-[#5D4037] mb-2">Nome da Loja</label>
                        <input 
                            className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white text-[#4E342E]"
                            value={storeName}
                            onChange={e => setStoreName(e.target.value)}
                        />
                        <p className="text-xs text-[#8D6E63] mt-1">Aparece no topo do menu e nos cupons.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#5D4037] mb-2">Endereço / Cabeçalho Cupom</label>
                        <textarea 
                            className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] h-24 bg-white text-[#4E342E]"
                            value={storeAddr}
                            onChange={e => setStoreAddr(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-[#5D4037] mb-2 flex items-center gap-2">
                           <AlertTriangle size={16} /> Alerta de Estoque Baixo
                        </label>
                        <input 
                            type="number"
                            className="w-full p-3 border border-[#D7CCC8] rounded outline-none focus:border-[#A66B5D] bg-white text-[#4E342E]"
                            value={lowStockThresh}
                            onChange={e => setLowStockThresh(Number(e.target.value))}
                        />
                        <p className="text-xs text-[#8D6E63] mt-1">Quantidade mínima para o sistema avisar sobre reposição.</p>
                    </div>

                    <button 
                        onClick={handleUpdateStore}
                        className="flex items-center justify-center gap-2 w-full bg-[#A66B5D] text-white py-3 rounded font-bold hover:bg-[#8D5A4D] transition-colors"
                    >
                        <Save size={18} /> Atualizar Loja
                    </button>
                </div>
            </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'USERS' && currentUser?.role === UserRole.ADMIN && (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-[#4E342E]">Usuários e Permissões</h3>
                    <button 
                        onClick={() => setShowUserModal(true)}
                        className="flex items-center gap-2 bg-[#4E342E] text-white px-4 py-2 rounded hover:bg-[#3E2723]"
                    >
                        <Plus size={18} /> Novo Usuário
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-[#D7CCC8] overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#EFEBE9] border-b border-[#D7CCC8]">
                            <tr>
                                <th className="p-4 font-bold text-[#5D4037]">Nome</th>
                                <th className="p-4 font-bold text-[#5D4037]">Usuário</th>
                                <th className="p-4 font-bold text-[#5D4037]">Função</th>
                                <th className="p-4 font-bold text-[#5D4037] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F0F0]">
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="p-4 text-[#4E342E] font-medium">{u.name}</td>
                                    <td className="p-4 text-gray-500">{u.username}</td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${u.role === UserRole.ADMIN ? 'bg-[#4E342E] text-white' : 'bg-[#EFEBE9] text-[#5D4037]'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {u.id !== currentUser.id && (
                                            <button 
                                                onClick={() => { if(window.confirm('Excluir este usuário?')) deleteUser(u.id); }}
                                                className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </div>

        {/* Add User Modal */}
        {showUserModal && (
            <div className="fixed inset-0 bg-[#4E342E]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-[#A66B5D]">
                    <h3 className="text-xl font-bold text-[#4E342E] mb-4">Adicionar Usuário</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-1">Nome</label>
                            <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none bg-white text-[#4E342E]" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-1">Usuário / Nickname</label>
                            <input className="w-full p-2 border border-[#D7CCC8] rounded outline-none bg-white text-[#4E342E]" value={newUserNickname} onChange={e => setNewUserNickname(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-1">Senha</label>
                            <input type="password" className="w-full p-2 border border-[#D7CCC8] rounded outline-none bg-white text-[#4E342E]" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#5D4037] mb-1">Cargo / Função</label>
                            <div className="flex gap-2">
                                <button onClick={() => setNewUserRole(UserRole.CAIXA)} className={`flex-1 py-2 border rounded font-bold text-sm ${newUserRole === UserRole.CAIXA ? 'bg-[#A66B5D] text-white' : 'text-[#4E342E]'}`}>CAIXA</button>
                                <button onClick={() => setNewUserRole(UserRole.ADMIN)} className={`flex-1 py-2 border rounded font-bold text-sm ${newUserRole === UserRole.ADMIN ? 'bg-[#A66B5D] text-white' : 'text-[#4E342E]'}`}>ADMIN</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setShowUserModal(false)} className="flex-1 py-2 border border-[#D7CCC8] text-[#5D4037] font-bold rounded">Cancelar</button>
                        <button onClick={handleAddUser} className="flex-1 py-2 bg-[#4E342E] text-white font-bold rounded">Salvar</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};