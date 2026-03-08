import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateTime = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("pt-BR");
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "ativa":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "devolvida":
      return "text-green-600 bg-green-50 border-green-200";
    case "atrasada":
      return "text-red-600 bg-red-50 border-red-200";
    case "disponível":
      return "text-green-600 bg-green-50 border-green-200";
    case "em uso":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "bloqueada":
      return "text-gray-600 bg-gray-50 border-gray-200";
    case "extraviada":
      return "text-red-600 bg-red-50 border-red-200";
    case "manutenção":
      return "text-indigo-600 bg-indigo-50 border-indigo-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ativa: "Ativa",
    devolvida: "Devolvida",
    atrasada: "Atrasada",
    disponível: "Disponível",
    "em uso": "Em Uso",
    bloqueada: "Bloqueada",
    extraviada: "Extraviada",
    manutenção: "Manutenção",
  };
  return labels[status] || status;
};
