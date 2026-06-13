"use client";
import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function EditarUnidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>(null);
  const [empreendimento, setEmpreendimento] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("unidades").select("*").eq("id", id).single()
      .then(async ({ data }) => {
        if (data) {
          setForm(data);
          // Busca configuração do empreendimento
          const { data: emp } = await supabase
            .from("empreendimentos")
            .select("*")
            .eq("id", data.empreendimento_id)
            .single();
          if (emp) setEmpreendimento(emp);
        }
      });
  }, [id]);

  function calcularValores(updated: any, emp: any) {
    if (!emp) return updated;

    const areaConstruida = Number(updated.area_construida) || 0;
    const areaExterna = Number(updated.area_privativa_externa) || 0;
    const precoM2 = Number(updated.preco_m2_construido) || 0;
    const precoM2Ext = Number(updated.preco_m2_externo) || 0;

    // Recalcula valor do imóvel se tiver preço/m²
    if (precoM2 > 0 && areaConstruida > 0) {
      let valorImovel = areaConstruida * precoM2;
      if (emp.considerar_area_externa_no_calculo && areaExterna > 0 && precoM2Ext > 0) {
        valorImovel += areaExterna * precoM2Ext;
      }
      updated.valor_imovel = Math.round(valorImovel * 100) / 100;
    }

    // Recalcula fluxo com base no valor e percentuais do empreendimento
    const valor = Number(updated.valor_imovel) || 0;
    if (valor > 0) {
      const percSinal = Number(emp.percentual_sinal_padrao) || 0;
      const percMensais = Number(emp.percentual_mensais_padrao) || 0;
      const percIntercaladas = Number(emp.percentual_intercaladas_padrao) || 0;
      const percChaves = Number(emp.percentual_chaves_padrao) || 0;
      const qtdMensais = Number(emp.quantidade_mensais_padrao) || Number(updated.quantidade_parcelas) || 0;
      const qtdIntercaladas = Number(emp.quantidade_intercaladas_padrao) || Number(updated.quantidade_intercaladas) || 0;

      if (percSinal > 0) {
        updated.valor_sinal = Math.round(valor * percSinal / 100 * 100) / 100;
        updated.percentual_sinal = percSinal;
      }
      if (percMensais > 0 && qtdMensais > 0) {
        const totalMensais = valor * percMensais / 100;
        updated.valor_parcela = Math.round(totalMensais / qtdMensais * 100) / 100;
        updated.quantidade_parcelas = qtdMensais;
      }
      if (percIntercaladas > 0 && qtdIntercaladas > 0) {
        const totalIntercaladas = valor * percIntercaladas / 100;
        updated.valor_intercalada = Math.round(totalIntercaladas / qtdIntercaladas * 100) / 100;
        updated.quantidade_intercaladas = qtdIntercaladas;
        updated.periodicidade_intercaladas = emp.periodicidade_intercaladas_padrao ?? updated.periodicidade_intercaladas;
      }
      if (percChaves > 0) {
        updated.valor_chaves = Math.round(valor * percChaves / 100 * 100) / 100;
        updated.percentual_chaves = percChaves;
      }
    }

    return updated;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((f: any) => {
      const updated = { ...f, [name]: val };
      // Recalcula automaticamente quando mudar preço/m² ou áreas
      if (['preco_m2_construido', 'preco_m2_externo', 'area_construida', 'area_privativa_externa'].includes(name)) {
        return calcularValores(updated, empreendimento);
      }
      // Recalculo manual do fluxo se alterar valor diretamente
      if (name === 'valor_imovel' && empreendimento) {
        return calcularValores(updated, empreendimento);
      }
      return updated;
    });
  }

  function recalcularTudo() {
    setForm((f: any) => calcularValores({ ...f }, empreendimento));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("unidades").update(form).eq("id", id);
    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/admin/empreendimentos/${form.empreendimento_id}/unidades`);
  }

  if (!form) return <div style={{ padding: "2rem", color: "#6b7280" }}>Carregando...</div>;

  const S = { label: { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "4px" } as React.CSSProperties };

  const inp = (name: string, type = "text") => (
    <input name={name} type={type} value={form[name] ?? ""} onChange={handleChange}
      style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
  );

  const inpReadonly = (value: any) => (
    <input type="text" readOnly value={value ?? ""}
      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#f9fafb", color: "#374151", fontWeight: "600" }} />
  );

  const sel = (name: string, opts: { value: string; label: string }[]) => (
    <select name={name} value={form[name] ?? ""} onChange={handleChange}
      style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", background: "white" }}>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const fmtMoeda = (v: any) => v ? `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—";

  // Cálculo do valor estimado para preview
  const areaC = Number(form.area_construida) || 0;
  const areaE = Number(form.area_privativa_externa) || 0;
  const precoC = Number(form.preco_m2_construido) || 0;
  const precoE = Number(form.preco_m2_externo) || 0;
  const valorEstimado = precoC > 0 ? (
    areaC * precoC + (empreendimento?.considerar_area_externa_no_calculo && areaE > 0 && precoE > 0 ? areaE * precoE : 0)
  ) : 0;

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111" }}>Editar Unidade — {form.unidade}</h1>
        {empreendimento && <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "4px" }}>{empreendimento.nome}</p>}
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#b91c1c", fontSize: "14px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Identificação */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #DDD9D3", padding: "24px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "16px" }}>Identificação</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            <div><label style={S.label}>Unidade</label>{inp("unidade")}</div>
            <div><label style={S.label}>Bloco</label>{inp("bloco")}</div>
            <div><label style={S.label}>Pavimento</label>{inp("pavimento")}</div>
            <div><label style={S.label}>Tipo</label>{inp("tipo")}</div>
            <div><label style={S.label}>Quartos</label>{inp("quartos", "number")}</div>
            <div><label style={S.label}>Suítes</label>{inp("suites", "number")}</div>
            <div><label style={S.label}>Banheiros</label>{inp("banheiros", "number")}</div>
            <div><label style={S.label}>Vagas</label>{inp("vagas", "number")}</div>
            <div>
              <label style={S.label}>Posição</label>
              {sel("posicao", [
                { value: "", label: "Selecione" },
                { value: "frente_mar", label: "Frente Mar" },
                { value: "lateral", label: "Lateral" },
                { value: "nascente", label: "Nascente" },
                { value: "poente", label: "Poente" },
                { value: "terreo", label: "Térreo" },
                { value: "rooftop", label: "Rooftop" },
                { value: "outra", label: "Outra" },
              ])}
            </div>
            <div>
              <label style={S.label}>Status</label>
              {sel("status", [
                { value: "disponivel", label: "Disponível" },
                { value: "reservada", label: "Reservada" },
                { value: "vendida", label: "Vendida" },
                { value: "bloqueada", label: "Bloqueada" },
                { value: "indisponivel", label: "Indisponível" },
              ])}
            </div>
          </div>
        </div>

        {/* Áreas */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #DDD9D3", padding: "24px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "16px" }}>Áreas (m²)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            <div><label style={S.label}>Área construída</label>{inp("area_construida", "number")}</div>
            <div><label style={S.label}>Área priv. externa</label>{inp("area_privativa_externa", "number")}</div>
            <div><label style={S.label}>Área total</label>{inp("area_total", "number")}</div>
            <div><label style={S.label}>Área terreno</label>{inp("area_terreno", "number")}</div>
          </div>
        </div>

        {/* Preço/m² — INTERNO */}
        <div style={{ background: "#1e293b", borderRadius: "12px", border: "1px solid #334155", padding: "24px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "white", marginBottom: "4px" }}>🔒 Preço/m² — Uso interno</h2>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>Esta informação nunca é exibida para clientes ou corretores externos.</p>
            </div>
            <button type="button" onClick={recalcularTudo}
              style={{ padding: "6px 14px", background: "#E8390E", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              ⟳ Recalcular tudo
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div>
              <label style={{ ...S.label, color: "#cbd5e1" }}>Preço/m² — Área construída (R$)</label>
              <input name="preco_m2_construido" type="number" value={form.preco_m2_construido ?? ""} onChange={handleChange}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #475569", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#0f172a", color: "white" }} />
            </div>
            <div>
              <label style={{ ...S.label, color: "#cbd5e1" }}>
                Preço/m² — Área externa (R$)
                {empreendimento && !empreendimento.considerar_area_externa_no_calculo && (
                  <span style={{ marginLeft: "8px", fontSize: "11px", color: "#f59e0b" }}>⚠ não entra no cálculo</span>
                )}
              </label>
              <input name="preco_m2_externo" type="number" value={form.preco_m2_externo ?? ""} onChange={handleChange}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #475569", borderRadius: "8px", fontSize: "14px", outline: "none", background: "#0f172a", color: "white" }} />
            </div>
          </div>

          {/* Preview do cálculo */}
          {valorEstimado > 0 && (
            <div style={{ background: "#0f172a", borderRadius: "8px", padding: "12px 16px", border: "1px solid #334155" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Preview do cálculo</div>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>
                {areaC}m² × R${precoC.toLocaleString("pt-BR")}/m²
                {empreendimento?.considerar_area_externa_no_calculo && areaE > 0 && precoE > 0
                  ? ` + ${areaE}m² × R${precoE.toLocaleString("pt-BR")}/m²`
                  : ""}
              </div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#E8390E" }}>
                = {fmtMoeda(valorEstimado)}
              </div>
            </div>
          )}
        </div>

        {/* Valores financeiros */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #DDD9D3", padding: "24px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111" }}>Valores financeiros</h2>
            {empreendimento && (
              <span style={{ fontSize: "11px", color: "#9ca3af", background: "#f3f4f6", padding: "3px 10px", borderRadius: "20px" }}>
                Calculado com base na config. do empreendimento
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
            <div>
              <label style={S.label}>Valor do imóvel (R$)</label>
              {inp("valor_imovel", "number")}
            </div>
            <div>
              <label style={S.label}>% Sinal</label>
              {inp("percentual_sinal", "number")}
            </div>
            <div>
              <label style={S.label}>Valor do sinal (R$)</label>
              {inpReadonly(fmtMoeda(form.valor_sinal))}
            </div>
            <div>
              <label style={S.label}>Qtd. parcelas mensais</label>
              {inp("quantidade_parcelas", "number")}
            </div>
            <div>
              <label style={S.label}>Valor parcela (R$)</label>
              {inpReadonly(fmtMoeda(form.valor_parcela))}
            </div>
            <div>
              <label style={S.label}>Qtd. intercaladas</label>
              {inp("quantidade_intercaladas", "number")}
            </div>
            <div>
              <label style={S.label}>Periodicidade</label>
              {sel("periodicidade_intercaladas", [
                { value: "semestrais", label: "Semestrais" },
                { value: "anuais", label: "Anuais" },
                { value: "mensais", label: "Mensais" },
                { value: "personalizada", label: "Personalizada" },
              ])}
            </div>
            <div>
              <label style={S.label}>Valor intercalada (R$)</label>
              {inpReadonly(fmtMoeda(form.valor_intercalada))}
            </div>
            <div>
              <label style={S.label}>% Chaves</label>
              {inp("percentual_chaves", "number")}
            </div>
            <div>
              <label style={S.label}>Valor chaves (R$)</label>
              {inpReadonly(fmtMoeda(form.valor_chaves))}
            </div>
          </div>

          {/* Resumo do fluxo */}
          {form.valor_imovel && (
            <div style={{ marginTop: "16px", padding: "14px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "8px", fontWeight: "600", textTransform: "uppercase" as const }}>Resumo do fluxo</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
                {[
                  { l: "Sinal", v: form.valor_sinal },
                  { l: `${form.quantidade_parcelas ?? 0}x Mensais`, v: form.valor_parcela },
                  { l: `${form.quantidade_intercaladas ?? 0}x Intercal.`, v: form.valor_intercalada },
                  { l: "Chaves", v: form.valor_chaves },
                ].map(item => (
                  <div key={item.l} style={{ textAlign: "center" as const }}>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>{item.l}</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#111" }}>{fmtMoeda(item.v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informações de venda */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #DDD9D3", padding: "24px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "16px" }}>Informações de venda</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div><label style={S.label}>Comprador</label>{inp("comprador_nome")}</div>
            <div><label style={S.label}>Corretor responsável</label>{inp("corretor_responsavel")}</div>
            <div><label style={S.label}>Data da reserva</label>{inp("data_reserva", "date")}</div>
            <div><label style={S.label}>Data da venda</label>{inp("data_venda", "date")}</div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Observações públicas</label>
              <textarea name="observacoes_publicas" value={form.observacoes_publicas ?? ""} onChange={handleChange} rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical" }} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Observações internas</label>
              <textarea name="observacoes_internas" value={form.observacoes_internas ?? ""} onChange={handleChange} rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical" }} />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                <input type="checkbox" name="destaque" checked={form.destaque ?? false} onChange={handleChange}
                  style={{ width: "16px", height: "16px", accentColor: "#E8390E" }} />
                Destacar unidade na tabela
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => router.back()}
            style={{ padding: "10px 20px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", background: "white", cursor: "pointer", color: "#374151" }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            style={{ padding: "10px 20px", background: "#E8390E", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
