import { useState, useEffect } from "react";
import { History as HistoryIcon, Search, User, Clock, ArrowUpRight, ArrowDownRight, Tag, Filter } from "lucide-react";
import { formatDateTime, cn } from "@/src/lib/utils";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => {
    fetch("/api/history", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      });
  }, []);

  const filtered = history.filter(h => {
    const matchesSearch = 
      h.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.action?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntity = !entityFilter || h.entity_type === entityFilter;

    return matchesSearch && matchesEntity;
  });

  const entities = Array.from(new Set(history.map(h => h.entity_type))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Histórico de Movimentações</h1>
        <p className="text-slate-500">Rastreabilidade completa de todas as ações no sistema.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar no histórico..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select 
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-600"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {entities.map(e => (
              <option key={e as string} value={e as string}>{(e as string).charAt(0).toUpperCase() + (e as string).slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                item.action === 'withdrawal' ? "bg-blue-50 text-blue-600" : 
                item.action === 'return' ? "bg-green-50 text-green-600" : 
                "bg-slate-50 text-slate-600"
              )}>
                {item.action === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> : 
                 item.action === 'return' ? <ArrowDownRight className="w-5 h-5" /> : 
                 <Tag className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">{item.details}</p>
                  <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {formatDateTime(item.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> {item.user_name}
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {item.entity_type}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
