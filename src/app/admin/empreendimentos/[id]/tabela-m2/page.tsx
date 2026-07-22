"use client";
import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Unid = { id: string; unidade: string; pavimento: string | null; area_construida: string };

export default function TabelaM2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [valorM2, setValorM2] = useState("");
  const [unidades, setUnidades] = useState<Unid[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    const sb = createClient();
    (async () => {
      const { data: emp } = await sb.from("empreendimentos").select("*").eq("id", id).single();
      const { data: uns } = await sb.from("unidades")
        .select("id, unidade, pavimento, area_construida")
        .eq("empreendimento_id", id)
        .order("pavimento", { ascending: true })
        .order("unidade", { ascending: true });
      if (emp) { setNome(emp.nome); setValorM2(emp.valor_m2 != null ? String(emp.valor_m2) : ""); }
      setUnidades((uns ?? []).map((u: any) => ({
        id: u.id, unidade: u.unidade, pavimento: u.pavimento,
        area_construida: u.area_construida != null ? String(u.area_construida) : "",
      })));
      setLoading(false);
    })();
  }, [id]);

  function setArea(uid: string, v: string) {
    setUnidades((arr) => arr.map((u) => (u.id === uid ? { ...u, area_construida: v } : u)));
  }

  const vm2 = valorM2 === "" ? null : Number(valorM2);
  const fmt = (n: number | null) =>
    n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const calc = (areaStr: string) => {
    const area = areaStr === "" ? null : Number(areaStr);
    if (vm2 == null || area == null || !isFinite(area) || area <= 0) return { valor: null, entrada: null, saldo: null };
    const valor = Math.round(area * vm2 * 100) / 100;
    const entrada = Math.round(valor * 0.2 * 100) / 100;
    return { valor, entrada, saldo: Math.round((valor - entrada) * 100) / 100 };
  };

  async function salvar() {
    setSaving(true); setErro(""); setMsg("");
    try {
      const resp = await fetch("/api/admin/tabela-m2", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          empreendimento_id: id,
          valor_m2: valorM2,
          unidades: unidades.map((u) => ({ id: u.id, area_construida: u.area_construida })),
        }),
      });
      const info = await resp.json();
      if (!resp.ok) throw new Error(info?.erro || `HTTP ${resp.status}`);
      setMsg(`Salvo! ${info.atualizadas} unidade(s) atualizada(s).`);
    } catch (e: any) {
      setErro(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: "2rem", color: "#6b7280" }}>Carregando...</div>;

  const th: React.CSSProperties = { padding: "8px 10px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f3f4f6", fontSize: "13px", whiteSpace: "nowrap" };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#6b7280", fontSize: "13px", cursor: "pointer", padding: 0 }}>← Voltar</button>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111", marginTop: "6px" }}>Tabela por m² — {nome}</h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>
          Edite <strong>somente o valor do m² e as áreas</strong>. O valor do imóvel, a entrada (20%) e o saldo (financiamento) são calculados automaticamente.
        </p>
      </div>

      {erro && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 12, color: "#b91c1c", fontSize: 14 }}>{erro}</div>}
      {msg && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, marginBottom: 12, color: "#15803d", fontSize: 14 }}>{msg}</div>}

      <div style={{ background: "white", border: "1px solid #DDD9D3", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Valor do m² (R$)</label>
        <input type="number" value={valorM2} onChange={(e) => setValorM2(e.target.value)} placeholder="Ex: 12000"
          style={{ padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: 8, fontSize: 14, width: 160, outline: "none" }} />
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Aplicado a todas as unidades abaixo.</span>
      </div>

      <div style={{ background: "white", border: "1px solid #DDD9D3", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Unid.</th>
                <th style={th}>Pavimento</th>
                <th style={{ ...th, width: 130 }}>Área (m²)</th>
                <th style={{ ...th, textAlign: "right" }}>Valor do imóvel</th>
                <th style={{ ...th, textAlign: "right" }}>Entrada (20%)</th>
                <th style={{ ...th, textAlign: "right" }}>Saldo (financ.)</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => {
                const c = calc(u.area_construida);
                return (
                  <tr key={u.id}>
                    <td style={{ ...td, fontWeight: 600, color: "#111" }}>{u.unidade}</td>
                    <td style={{ ...td, color: "#6b7280" }}>{u.pavimento ?? "—"}</td>
                    <td style={td}>
                      <input type="number" value={u.area_construida} onChange={(e) => setArea(u.id, e.target.value)} placeholder="0"
                        style={{ padding: "6px 10px", border: "1px solid #DDD9D3", borderRadius: 6, fontSize: 13, width: 110, outline: "none" }} />
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "#111" }}>{fmt(c.valor)}</td>
                    <td style={{ ...td, textAlign: "right", color: "#6b7280" }}>{fmt(c.entrada)}</td>
                    <td style={{ ...td, textAlign: "right", color: "#6b7280" }}>{fmt(c.saldo)}</td>
                  </tr>
                );
              })}
              {unidades.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: "center", color: "#9ca3af", padding: 32 }}>Nenhuma unidade cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={salvar} disabled={saving}
          style={{ padding: "10px 24px", background: "#E8390E", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Salvando..." : "Salvar tabela"}
        </button>
      </div>
    </div>
  );
}
