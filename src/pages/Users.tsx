import { useState, useEffect, FormEvent } from "react";
import { User, Plus, Search, Mail, Shield, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "react-hot-toast";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "", email: "", perfil: "usuario", status: "ativo"
  });

  const fetchUsers = () => {
    fetch("/api/users", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/users/${editingId}` : "/api/users";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      toast.success(editingId ? "Usuário atualizado com sucesso!" : "Usuário cadastrado com sucesso!");
      setShowModal(false);
      setEditingId(null);
      fetchUsers();
      setFormData({ nome: "", email: "", perfil: "usuario", status: "ativo" });
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      nome: user.nome || "",
      email: user.email || "",
      perfil: user.perfil || "usuario",
      status: user.status || "ativo"
    });
    setShowModal(true);
  };

  const toggleStatus = async (user: any) => {
    const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    const res = await fetch(`/api/users/${user.id}/status`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      toast.success(`Usuário ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
      fetchUsers();
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (res.ok) {
      toast.success("Usuário excluído com sucesso!");
      fetchUsers();
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const filtered = users.filter(u => 
    u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
          <p className="text-slate-500">Controle de acesso e perfis do sistema.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ nome: "", email: "", perfil: "usuario", status: "ativo" });
            setShowModal(true);
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-slate-900/20"
        >
          <Plus className="w-5 h-5" /> Novo Usuário
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <User className="w-6 h-6 text-slate-600" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  u.perfil === 'admin' ? "text-indigo-600 bg-indigo-50 border-indigo-200" : "text-slate-600 bg-slate-50 border-slate-200"
                )}>
                  {u.perfil}
                </span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  u.status === 'ativo' ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"
                )}>
                  {u.status}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{u.nome}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
              <Mail className="w-4 h-4" /> {u.email}
            </p>

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => handleEdit(u)}
                className="flex-1 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Editar
              </button>
              <button 
                onClick={() => toggleStatus(u)}
                className={cn(
                  "px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors",
                  u.status === 'ativo' ? "text-red-600" : "text-green-600"
                )}
                title={u.status === 'ativo' ? "Desativar" : "Ativar"}
              >
                {u.status === 'ativo' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => handleDelete(u.id)}
                className="px-3 py-2 text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar Usuário" : "Novo Usuário"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                <input required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                <input required type="email" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <p className="text-[10px] text-slate-400 mt-1">O usuário deve estar previamente cadastrado no Supabase Auth.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Perfil</label>
                  <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20" value={formData.perfil} onChange={e => setFormData({...formData, perfil: e.target.value})}>
                    <option value="usuario">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold">{editingId ? "Salvar Alterações" : "Cadastrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
