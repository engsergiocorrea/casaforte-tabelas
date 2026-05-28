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

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("unidades")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setForm(data);
      });
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((f: any) => {
      const updated = { ...f, [name]: val };
      if (
        (name === "valor_imovel" || name === "percentual_sinal") &&
        updated.valor_imovel &&
        updated.percentual_sinal
      ) {
        updated.valor_sinal = Math.round(
          (Number(updated.valor_imovel) * Number(updated.percentual_sinal)) /
            100,
        );
      }
      if (
        (name === "valor_imovel" ||
          name === "percentual_sinal" ||
          name === "percentual_chaves" ||
          name === "quantidade_parcelas") &&
        updated.valor_imovel
      ) {
        const sinal =
          (Number(updated.valor_imovel) * Number(updated.percentual_sinal)) /
          100;
        const chaves =
          (Number(updated.valor_imovel) * Number(updated.percentual_chaves)) /
          100;
        const saldo = Number(updated.valor_imovel) - sinal - chaves;
        const parcelas = Number(updated.quantidade_parcelas);
        if (parcelas > 0) updated.valor_parcela = Math.round(saldo / parcelas);
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("unidades")
      .update(form)
      .eq("id", id);
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    router.push(`/admin/empreendimentos/${form.empreendimento_id}/unidades`);
  }

  if (!form)
    return (
      <div style={{ padding: "2rem", color: "#6b7280" }}>Carregando...</div>
    );

  const S = {
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "4px",
    } as React.CSSProperties,
  };
  const inp = (name: string, type = "text") => (
    <input
      name={name}
      type={type}
      value={form[name] ?? ""}
      onChange={handleChange}
      style={{
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #DDD9D3",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
      }}
    />
  );
  const sel = (name: string, opts: { value: string; label: string }[]) => (
    <select
      name={name}
      value={form[name] ?? ""}
      onChange={handleChange}
      style={{
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #DDD9D3",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none",
        background: "white",
      }}
    >
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111" }}>
          Editar Unidade — {form.unidade}
        </h1>
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            color: "#b91c1c",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #DDD9D3",
            padding: "24px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#111",
              marginBottom: "16px",
            }}
          >
            Identificação
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "14px",
            }}
          >
            <div>
              <label style={S.label}>Unidade</label>
              {inp("unidade")}
            </div>
            <div>
              <label style={S.label}>Bloco</label>
              {inp("bloco")}
            </div>
            <div>
              <label style={S.label}>Pavimento</label>
              {inp("pavimento")}
            </div>
            <div>
              <label style={S.label}>Tipo</label>
              {inp("tipo")}
            </div>
            <div>
              <label style={S.label}>Quartos</label>
              {inp("quartos", "number")}
            </div>
            <div>
              <label style={S.label}>Suítes</label>
              {inp("suites", "number")}
            </div>
            <div>
              <label style={S.label}>Banheiros</label>
              {inp("banheiros", "number")}
            </div>
            <div>
              <label style={S.label}>Vagas</label>
              {inp("vagas", "number")}
            </div>
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

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #DDD9D3",
            padding: "24px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#111",
              marginBottom: "16px",
            }}
          >
            Áreas (m²)
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "14px",
            }}
          >
            <div>
              <label style={S.label}>Área construída</label>
              {inp("area_construida", "number")}
            </div>
            <div>
              <label style={S.label}>Área priv. externa</label>
              {inp("area_privativa_externa", "number")}
            </div>
            <div>
              <label style={S.label}>Área total</label>
              {inp("area_total", "number")}
            </div>
            <div>
              <label style={S.label}>Área terreno</label>
              {inp("area_terreno", "number")}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #DDD9D3",
            padding: "24px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#111",
              marginBottom: "16px",
            }}
          >
            Valores financeiros
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "14px",
            }}
          >
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
              {inp("valor_sinal", "number")}
            </div>
            <div>
              <label style={S.label}>Qtd. parcelas</label>
              {inp("quantidade_parcelas", "number")}
            </div>
            <div>
              <label style={S.label}>Valor parcela (R$)</label>
              {inp("valor_parcela", "number")}
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
                { value: "personalizada", label: "Personalizada" },
              ])}
            </div>
            <div>
              <label style={S.label}>Valor intercalada (R$)</label>
              {inp("valor_intercalada", "number")}
            </div>
            <div>
              <label style={S.label}>% Chaves</label>
              {inp("percentual_chaves", "number")}
            </div>
            <div>
              <label style={S.label}>Valor chaves (R$)</label>
              {inp("valor_chaves", "number")}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            border: "1px solid #DDD9D3",
            padding: "24px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "#111",
              marginBottom: "16px",
            }}
          >
            Informações de venda
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            <div>
              <label style={S.label}>Comprador</label>
              {inp("comprador_nome")}
            </div>
            <div>
              <label style={S.label}>Corretor responsável</label>
              {inp("corretor_responsavel")}
            </div>
            <div>
              <label style={S.label}>Data da reserva</label>
              {inp("data_reserva", "date")}
            </div>
            <div>
              <label style={S.label}>Data da venda</label>
              {inp("data_venda", "date")}
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Observações públicas</label>
              <textarea
                name="observacoes_publicas"
                value={form.observacoes_publicas ?? ""}
                onChange={handleChange}
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #DDD9D3",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Observações internas</label>
              <textarea
                name="observacoes_internas"
                value={form.observacoes_internas ?? ""}
                onChange={handleChange}
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #DDD9D3",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                <input
                  type="checkbox"
                  name="destaque"
                  checked={form.destaque ?? false}
                  onChange={handleChange}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "#E8390E",
                  }}
                />
                Destacar unidade na tabela
              </label>
            </div>
          </div>
        </div>

        <div
          style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: "10px 20px",
              border: "1px solid #DDD9D3",
              borderRadius: "8px",
              fontSize: "14px",
              background: "white",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "#E8390E",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
