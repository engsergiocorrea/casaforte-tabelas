"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type U = {
  id: string; unidade: string; pavimento: string | null; area_construida: number | null;
  quartos: number | null; valor_imovel: number | null; valor_sinal: number | null;
  quantidade_parcelas: number | null; valor_parcela: number | null; status: string;
};

const STATUS_LABEL: Record<string, string> = {
  disponivel: "Disponível", reservada: "Reservada", vendida: "Vendida",
  bloqueada: "Bloqueada", indisponivel: "Indisponível",
};
const statusColors: Record<string, { bg: string; color: string }> = {
  disponivel: { bg: "#dcfce7", color: "#15803d" },
  reservada: { bg: "#fef3c7", color: "#92400e" },
  vendida: { bg: "#fee2e2", color: "#b91c1c" },
  bloqueada: { bg: "#f3f4f6", color: "#6b7280" },
  indisponivel: { bg: "#f3f4f6", color: "#9ca3af" },
};
const brl = (v: number | null, min = 2) =>
  v ? `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: min })}` : "—";

export function UnidadesTable({ unidades, empreendimentoId }: { unidades: U[]; empreendimentoId: string }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [novoStatus, setNovoStatus] = useState("indisponivel");
  const [aplicando, setAplicando] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  const todasMarcadas = unidades.length > 0 && sel.size === unidades.length;

  function toggle(id: string) {
    setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleTodas() {
    setSel(todasMarcadas ? new Set() : new Set(unidades.map((u) => u.id)));
  }

  async function aplicar() {
    setAplicando(true); setErro(""); setMsg("");
    try {
      const resp = await fetch("/api/admin/unidades-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ empreendimento_id: empreendimentoId, unidade_ids: [...sel], status: novoStatus }),
      });
      const info = await resp.json();
      if (!resp.ok) throw new Error(info?.erro || `HTTP ${resp.status}`);
      setMsg(`${info.atualizadas} unidade(s) marcada(s) como "${STATUS_LABEL[novoStatus]}".`);
      setSel(new Set());
      router.refresh();
    } catch (e: any) {
      setErro(e?.message ?? String(e));
    } finally {
      setAplicando(false);
    }
  }

  const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "10px 12px", whiteSpace: "nowrap" };

  return (
    <div>
      {/* Barra de ação em massa */}
      {sel.size > 0 && (
        <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#111", color: "white", padding: "12px 16px", borderRadius: 10, marginBottom: 12 }}>
          <strong style={{ fontSize: 14 }}>{sel.size} selecionada(s)</strong>
          <span style={{ fontSize: 13, opacity: 0.8 }}>marcar como</span>
          <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "none", fontSize: 13 }}>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={aplicar} disabled={aplicando}
            style={{ padding: "6px 16px", background: "#E8390E", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: aplicando ? "default" : "pointer", opacity: aplicando ? 0.7 : 1 }}>
            {aplicando ? "Aplicando..." : "Aplicar"}
          </button>
          <button onClick={() => setSel(new Set())}
            style={{ padding: "6px 12px", background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
            Limpar
          </button>
        </div>
      )}

      {erro && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 12, color: "#b91c1c", fontSize: 14 }}>{erro}</div>}
      {msg && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, marginBottom: 12, color: "#15803d", fontSize: 14 }}>{msg}</div>}

      <div style={{ background: "white", borderRadius: 12, border: "1px solid #DDD9D3", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ ...th, width: 40, textAlign: "center" }}>
                  <input type="checkbox" checked={todasMarcadas} onChange={toggleTodas} aria-label="Selecionar todas" style={{ cursor: "pointer" }} />
                </th>
                {["Unidade", "Pavimento", "Área", "Quartos", "Valor", "Sinal", "Parcelas", "Status", "Ações"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => {
                const sc = statusColors[u.status] ?? statusColors.indisponivel;
                const marcada = sel.has(u.id);
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6", background: marcada ? "#fff7ed" : "transparent" }}>
                    <td style={{ ...td, textAlign: "center" }}>
                      <input type="checkbox" checked={marcada} onChange={() => toggle(u.id)} aria-label={`Selecionar ${u.unidade}`} style={{ cursor: "pointer" }} />
                    </td>
                    <td style={{ ...td, fontWeight: 600, color: "#111" }}>{u.unidade}</td>
                    <td style={{ ...td, color: "#6b7280" }}>{u.pavimento ?? "—"}</td>
                    <td style={{ ...td, color: "#6b7280" }}>{u.area_construida ? `${u.area_construida}m²` : "—"}</td>
                    <td style={{ ...td, color: "#6b7280", textAlign: "center" }}>{u.quartos ?? "—"}</td>
                    <td style={{ ...td, fontWeight: 500, color: "#111" }}>{brl(u.valor_imovel)}</td>
                    <td style={{ ...td, color: "#6b7280" }}>{brl(u.valor_sinal)}</td>
                    <td style={{ ...td, color: "#6b7280" }}>
                      {u.quantidade_parcelas && u.valor_parcela ? `${u.quantidade_parcelas}x ${brl(u.valor_parcela)}` : "—"}
                    </td>
                    <td style={td}>
                      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {STATUS_LABEL[u.status] ?? u.status}
                      </span>
                    </td>
                    <td style={td}>
                      <Link href={`/admin/unidades/${u.id}/editar`}
                        style={{ padding: "3px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, color: "#374151", textDecoration: "none" }}>
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
