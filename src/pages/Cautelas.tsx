import { useState, useEffect, FormEvent } from "react";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  ArrowRightLeft, 
  Calendar, 
  User, 
  Building2, 
  Key as KeyIcon, 
  MapPin, 
  MoreVertical,
  X
} from "lucide-react";
import { formatDateTime, getStatusColor, getStatusLabel, cn } from "@/src/lib/utils";
import { toast } from "react-hot-toast";

export default function Cautelas() {
  const [cautelas, setCautelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    regional_id: "",
    empresa_id: ""
  });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tecnico_id: "",
    chave_id: "",
    empresa_id: "",
    regional_id: "",
    crq: "",
    observacoes: "",
    data_prevista_devolucao: ""
  });

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [regionais, setRegionais] = useState<any[]>([]);

  const fetchCautelas = () => {
    fetch("/api/cautelas", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setCautelas(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCautelas();
    
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    Promise.all([
      fetch("/api/technicians", { headers }).then(res => res.json()),
      fetch("/api/keys", { headers }).then(res => res.json()),
      fetch("/api/companies", { headers }).then(res => res.json()),
      fetch("/api/regionais", { headers }).then(res => res.json())
    ]).then(([techs, keys, comps, regs]) => {
      setTechnicians(techs.filter((t: any) => t.status === 'ativo'));
      setKeys(keys.filter((k: any) => k.status === 'disponível'));
      setCompanies(comps.filter((c: any) => c.status === 'ativo'));
      setRegionais(regs);
    });
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/cautelas", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      toast.success("Cautela aberta com sucesso!");
      setShowModal(false);
      fetchCautelas();
      setFormData({
        tecnico_id: "",
        chave_id: "",
        empresa_id: "",
        regional_id: "",
        crq: "",
        observacoes: "",
        data_prevista_devolucao: ""
      });
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const handleReturn = async (id: number) => {
    if (!confirm("Confirmar devolução desta chave?")) return;
    const res = await fetch(`/api/cautelas/${id}/return`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    if (res.ok) {
      toast.success("Devolução registrada com sucesso!");
      fetchCautelas();
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  };

  const filtered = cautelas.filter(c => {
    const matchesSearch = 
      c.tecnico_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chave_codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.empresa_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.crq?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || c.status === filters.status;
    const matchesRegional = !filters.regional_id || c.regional_id?.toString() === filters.regional_id;
    const matchesEmpresa = !filters.empresa_id || c.empresa_id?.toString() === filters.empresa_id;

    return matchesSearch && matchesStatus && matchesRegional && matchesEmpresa;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Controle de Cautelas</h1>
          <p className="text-slate-500">Gerencie retiradas e devoluções de chaves.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-5 h-5" /> Nova Cautela
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por técnico, chave, empresa ou CRQ..." 
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
                <option value="ativa">Ativa</option>
                <option value="devolvida">Devolvida</option>
                <option value="atrasada">Atrasada</option>
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico / Empresa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Chave</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Regional</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Datas</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.tecnico_nome}</p>
                        <p className="text-xs text-slate-500">{c.empresa_nome}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <KeyIcon className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{c.chave_codigo}</p>
                        <p className="text-xs text-slate-500">{c.chave_modelo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-700">{c.regional_nome}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" /> {formatDateTime(c.data_retirada)}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Prev: {formatDateTime(c.data_prevista_devolucao)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold border",
                      getStatusColor(c.status)
                    )}>
                      {getStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.status === 'ativa' && (
                      <button 
                        onClick={() => handleReturn(c.id)}
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        Devolver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">Nova Cautela</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Técnico</label>
                  <select 
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.tecnico_id}
                    onChange={e => setFormData({...formData, tecnico_id: e.target.value})}
                  >
                    <option value="">Selecione o técnico</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.empresa_nome})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Chave</label>
                  <select 
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.chave_id}
                    onChange={e => setFormData({...formData, chave_id: e.target.value})}
                  >
                    <option value="">Selecione a chave</option>
                    {keys.map(k => <option key={k.id} value={k.id}>{k.codigo} - {k.modelo}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Empresa</label>
                  <select 
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.empresa_id}
                    onChange={e => setFormData({...formData, empresa_id: e.target.value})}
                  >
                    <option value="">Selecione a empresa</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Regional</label>
                  <select 
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.regional_id}
                    onChange={e => setFormData({...formData, regional_id: e.target.value})}
                  >
                    <option value="">Selecione a regional</option>
                    {regionais.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Data Prevista Devolução</label>
                  <input 
                    required
                    type="datetime-local" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.data_prevista_devolucao}
                    onChange={e => setFormData({...formData, data_prevista_devolucao: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">CRQ / Identificador</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    value={formData.crq}
                    onChange={e => setFormData({...formData, crq: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Observações</label>
                <textarea 
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  value={formData.observacoes}
                  onChange={e => setFormData({...formData, observacoes: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Abrir Cautela
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
