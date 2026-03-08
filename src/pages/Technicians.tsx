import { useState, useEffect, FormEvent } from "react";
import { Users, Plus, Search, MapPin, Building2, Phone, MoreVertical, ShieldCheck, ShieldAlert, X, Filter } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "react-hot-toast";

export default function Technicians() {
  const [techs, setTechs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [regionais, setRegionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    regional_id: "",
    empresa_id: ""
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "", cpf: "", telefone: "", empresa_id: "", regional_id: "", status: "ativo"
  });

  const fetchTechs = () => {
    fetch("/api/technicians", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setTechs(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTechs();
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    fetch("/api/companies", { headers }).then(res => res.json()).then(data => setCompanies(data));
    fetch("/api/regionais", { headers }).then(res => res.json()).then(data => setRegionais(data));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/technicians/${editingId}` : "/api/technicians";
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
      toast.success(editingId ? "Técnico atualizado com sucesso!" : "Técnico cadastrado com sucesso!");
      setShowModal(false);
      setEditingId(null);
      fetchTechs();
      setFormData({ nome: "", cpf: "", telefone: "", empresa_id: "", regional_id: "", status: "ativo" });
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const handleEdit = (tech: any) => {
    setEditingId(tech.id);
    setFormData({
      nome: tech.nome || "",
      cpf: tech.cpf || "",
      telefone: tech.telefone || "",
      empresa_id: tech.empresa_id?.toString() || "",
      regional_id: tech.regional_id?.toString() || "",
      status: tech.status || "ativo"
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este técnico?")) return;

    const res = await fetch(`/api/technicians/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (res.ok) {
      toast.success("Técnico excluído com sucesso!");
      fetchTechs();
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const filtered = techs.filter(t => {
    const matchesSearch = 
      t.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cpf?.includes(searchTerm) ||
      t.empresa_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || t.status === filters.status;
    const matchesRegional = !filters.regional_id || t.regional_id?.toString() === filters.regional_id;
    const matchesEmpresa = !filters.empresa_id || t.empresa_id?.toString() === filters.empresa_id;

    return matchesSearch && matchesStatus && matchesRegional && matchesEmpresa;
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.perfil === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Técnicos</h1>
          <p className="text-slate-500">Cadastro e controle de acesso de técnicos.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ nome: "", cpf: "", telefone: "", empresa_id: "", regional_id: "", status: "ativo" });
              setShowModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-5 h-5" /> Novo Técnico
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF ou empresa..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors",
              showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Filter className="w-5 h-5" /> Filtros
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={filters.status}
                onChange={e => setFilters({...filters, status: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="bloqueado">Bloqueado</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Regional</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={filters.regional_id}
                onChange={e => setFilters({...filters, regional_id: e.target.value})}
              >
                <option value="">Todas</option>
                {regionais.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Empresa</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={filters.empresa_id}
                onChange={e => setFilters({...filters, empresa_id: e.target.value})}
              >
                <option value="">Todas</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((t) => (
          <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <Users className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                t.status === 'ativo' ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"
              )}>
                {t.status}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t.nome}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
              <Building2 className="w-4 h-4" /> {t.empresa_nome}
            </p>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">CPF:</span>
                <span className="text-slate-900 font-medium">{t.cpf}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Telefone:</span>
                <span className="text-slate-900 font-medium">{t.telefone}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Regional:</span>
                <span className="text-slate-900 font-medium">{t.regional_nome}</span>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-6 flex gap-2">
                <button 
                  onClick={() => handleEdit(t)}
                  className="flex-1 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(t.id)}
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
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar Técnico" : "Novo Técnico"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                  <input required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">CPF</label>
                  <input required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                  <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Empresa</label>
                  <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.empresa_id} onChange={e => setFormData({...formData, empresa_id: e.target.value})}>
                    <option value="">Selecione</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Regional</label>
                  <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.regional_id} onChange={e => setFormData({...formData, regional_id: e.target.value})}>
                    <option value="">Selecione</option>
                    {regionais.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="bloqueado">Bloqueado</option>
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
