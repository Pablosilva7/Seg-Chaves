import { useState, useEffect, FormEvent } from "react";
import { Building2, Plus, Search, Phone, Mail, User, MoreVertical, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "react-hot-toast";

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "", cnpj: "", telefone: "", email: "", status: "ativo"
  });

  const fetchCompanies = () => {
    fetch("/api/companies", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/companies/${editingId}` : "/api/companies";
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
      toast.success(editingId ? "Empresa atualizada com sucesso!" : "Empresa cadastrada com sucesso!");
      setShowModal(false);
      setEditingId(null);
      fetchCompanies();
      setFormData({ nome: "", cnpj: "", telefone: "", email: "", status: "ativo" });
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const handleEdit = (company: any) => {
    setEditingId(company.id);
    setFormData({
      nome: company.nome || "",
      cnpj: company.cnpj || "",
      telefone: company.telefone || "",
      email: company.email || "",
      status: company.status || "ativo"
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;

    const res = await fetch(`/api/companies/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (res.ok) {
      toast.success("Empresa excluída com sucesso!");
      fetchCompanies();
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const filtered = companies.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj?.includes(searchTerm)
  );

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.perfil === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas Parceiras</h1>
          <p className="text-slate-500">Gestão de empresas terceirizadas e parceiras.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ nome: "", cnpj: "", telefone: "", email: "", status: "ativo" });
              setShowModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-5 h-5" /> Nova Empresa
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CNPJ..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <Building2 className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                c.status === 'ativo' ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"
              )}>
                {c.status}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{c.nome}</h3>
            <p className="text-sm text-slate-500 mb-4">{c.cnpj}</p>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{c.telefone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 truncate">{c.email || "N/A"}</span>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-6 flex gap-2">
                <button 
                  onClick={() => handleEdit(c)}
                  className="flex-1 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-2 text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar Empresa" : "Nova Empresa"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome da Empresa</label>
                  <input required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">CNPJ</label>
                  <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                  <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                  <input type="email" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold">{editingId ? "Salvar Alterações" : "Cadastrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
