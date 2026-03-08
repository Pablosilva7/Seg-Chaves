import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  Building2, 
  ClipboardList, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatDateTime, getStatusColor, getStatusLabel, cn } from "@/src/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Carregando indicadores...</div>;

  const cards = [
    { label: "Cautelas Ativas", value: stats.cautelasAtivas, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Cautelas Devolvidas", value: stats.cautelasDevolvidas, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "Cautelas Atrasadas", value: stats.cautelasAtrasadas, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Chaves Disponíveis", value: stats.chavesDisponiveis, icon: Key, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Chaves em Uso", value: stats.chavesEmUso, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Técnicos Ativos", value: stats.tecnicosAtivos, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const chartData = [
    { name: "Ativas", value: stats.cautelasAtivas },
    { name: "Devolvidas", value: stats.cautelasDevolvidas },
    { name: "Atrasadas", value: stats.cautelasAtrasadas },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#ef4444"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Visão geral do sistema e indicadores operacionais.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`${card.bg} ${card.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Status de Cautelas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            {chartData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-sm text-slate-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Últimas Movimentações</h3>
          <div className="space-y-4">
            {stats.ultimasMovimentacoes.map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  item.action === 'withdrawal' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                )}>
                  {item.action === 'withdrawal' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.details}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3" /> {item.user_name} • {formatDateTime(item.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
