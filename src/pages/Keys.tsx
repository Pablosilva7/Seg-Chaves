import { useState, useEffect, FormEvent } from "react";
import { Key as KeyIcon, Plus, Search, MapPin, Tag, Info, MoreVertical, X, Filter } from "lucide-react";
import { cn, getStatusColor, getStatusLabel } from "@/src/lib/utils";
import { toast } from "react-hot-toast";

export default function Keys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [regionais, setRegionais] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    regional_id: "",
    local_id: ""
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    codigo: "", modelo: "", tipo: "", regional_id: "", local_id: "", status: "disponível", observacoes: ""
  });

  const fetchKeys = () => {
    fetch("/api/keys", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setKeys(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchKeys();
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    fetch("/api/regionais", { headers }).then(res => res.json()).then(data => setRegionais(data));
    fetch("/api/locais", { headers }).then(res => res.json()).then(data => setLocais(data));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/keys/${editingId}` : "/api/keys";
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
      toast.success(editingId ? "Chave atualizada com sucesso!" : "Chave cadastrada com sucesso!");
      setShowModal(false);
      setEditingId(null);
      fetchKeys();
      setFormData({ codigo: "", modelo: "", tipo: "", regional_id: "", local_id: "", status: "disponível", observacoes: "" });
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const handleEdit = (key: any) => {
    setEditingId(key.id);
    setFormData({
      codigo: key.codigo || "",
      modelo: key.modelo || "",
      tipo: key.tipo || "",
      regional_id: key.regional_id?.toString() || "",
      local_id: key.local_id?.toString() || "",
      status: key.status || "disponível",
      observacoes: key.observacoes || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta chave?")) return;

    const res = await fetch(`/api/keys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (res.ok) {
      toast.success("Chave excluída com sucesso!");
      fetchKeys();
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const filtered = keys.filter(k => {
    const matchesSearch = 
      k.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.regional_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.local_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || k.status === filters.status;
    const matchesRegional = !filters.regional_id || k.regional_id?.toString() === filters.regional_id;
    const matchesLocal = !filters.local_id || k.local_id?.toString() === filters.local_id;

    return matchesSearch && matchesStatus && matchesRegional && matchesLocal;
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.perfil === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Controle de Chaves</h1>
          <p className="text-slate-500">Gestão de inventário e status de chaves.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ codigo: "", modelo: "", tipo: "", regional_id: "", local_id: "", status: "disponível", observacoes: "" });
              setShowModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-5 h-5" /> Nova Chave
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por código, modelo, regional ou local..." 
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
                <option value="disponível">Disponível</option>
                <option value="em uso">Em Uso</option>
                <option value="bloqueada">Bloqueada</option>
                <option value="extraviada">Extraviada</option>
                <option value="manutenção">Manutenção</option>
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
              <label className="text-xs font-bold text-slate-500 uppercase">Local</label>
              <select 
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={filters.local_id}
                onChange={e => setFilters({...filters, local_id: e.target.value})}
              >
                <option value="">Todos</option>
                {locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((k) => (
          <div key={k.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <KeyIcon className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                getStatusColor(k.status)
              )}>
                {getStatusLabel(k.status)}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{k.codigo}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
              <Tag className="w-4 h-4" /> {k.modelo}
            </p>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-900 font-medium">{k.regional_nome}</p>
                  <p className="text-slate-500 text-xs">{k.local_nome}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="text-slate-600 text-xs line-clamp-2">{k.observacoes || "Sem observações"}</p>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-6 flex gap-2">
                <button 
                  onClick={() => handleEdit(k)}
                  className="flex-1 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(k.id)}
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
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar Chave" : "Nova Chave"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Código da Chave</label>
                  <input required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Modelo</label>
                  <input required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                  <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Regional</label>
                  <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.regional_id} onChange={e => setFormData({...formData, regional_id: e.target.value})}>
                    <option value="">Selecione</option>
                    {regionais.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Local</label>
                  <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.local_id} onChange={e => setFormData({...formData, local_id: e.target.value})}>
                    <option value="">Selecione</option>
                    {locais.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="disponível">Disponível</option>
                    <option value="em uso">Em Uso</option>
                    <option value="bloqueada">Bloqueada</option>
                    <option value="extraviada">Extraviada</option>
                    <option value="manutenção">Manutenção</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Observações</label>
                <textarea rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} />
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
