"use client";
import { useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NovaUnidadePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    unidade: "",
    bloco: "",
    pavimento: "",
    tipo: "",
    categoria: "",
    area_construida: "",
    area_privativa_externa: "",
    area_total: "",
    area_terreno: "",
    quartos: "",
    suites: "",
    banheiros: "",
    vagas: "",
    posicao: "",
    valor_imovel: "",
    percentual_sinal: "10",
    valor_sinal: "",
    quantidade_parcelas: "60",
    valor_parcela: "",
    quantidade_intercaladas: "",
    periodicidade_intercaladas: "semestrais",
    valor_intercalada: "",
    valor_chaves: "",
    percentual_chaves: "20",
    status: "disponivel",
    observacoes_publicas: "",
    destaque: false,
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((f) => {
      const updated = { ...f, [name]: val };
      // Auto-calcular valor do sinal
      if (
        (name === "valor_imovel" || name === "percentual_sinal") &&
        updated.valor_imovel &&
        updated.percentual_sinal
      ) {
        updated.valor_sinal = String(
          Math.round(
            (Number(updated.valor_imovel) * Number(updated.percentual_sinal)) /
              100,
          ),
        );
      }
      // Auto-calcular parcela
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
        if (parcelas > 0)
          updated.valor_parcela = String(Math.round(saldo / parcelas));
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const data = {
      ...form,
      empreendimento_id: id,
      area_construida: form.area_construida
        ? Number(form.area_construida)
        : null,
      area_privativa_externa: form.area_privativa_externa
        ? Number(form.area_privativa_externa)
        : null,
      area_total: form.area_total ? Number(form.area_total) : null,
      area_terreno: form.area_terreno ? Number(form.area_terreno) : null,
      quartos: form.quartos ? Number(form.quartos) : null,
      suites: form.suites ? Number(form.suites) : null,
      banheiros: form.banheiros ? Number(form.banheiros) : null,
      vagas: form.vagas ? Number(form.vagas) : null,
      valor_imovel: form.valor_imovel ? Number(form.valor_imovel) : null,
      percentual_sinal: form.percentual_sinal
        ? Number(form.percentual_sinal)
        : null,
      valor_sinal: form.valor_sinal ? Number(form.valor_sinal) : null,
      quantidade_parcelas: form.quantidade_parcelas
        ? Number(form.quantidade_parcelas)
        : null,
      valor_parcela: form.valor_parcela ? Number(form.valor_parcela) : null,
      quantidade_intercaladas: form.quantidade_intercaladas
        ? Number(form.quantidade_intercaladas)
        : null,
      valor_intercalada: form.valor_intercalada
        ? Number(form.valor_intercalada)
        : null,
      valor_chaves: form.valor_chaves ? Number(form.valor_chaves) : null,
      percentual_chaves: form.percentual_chaves
        ? Number(form.percentual_chaves)
        : null,
      posicao: form.posicao || null,
    };
    const { error: err } = await supabase.from("unidades").insert([data]);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push(`/admin/empreendimentos/${id}/unidades`);
  }

  const S = {
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "500",
      color: "#374151",
      marginBottom: "4px",
    } as React.CSSProperties,
  };
  const inp = (name: string, type = "text", placeholder = "") => (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={String((form as any)[name])}
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
      value={String((form as any)[name])}
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
          Nova Unidade
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            marginTop: "0.25rem",
          }}
        >
          Os valores são calculados automaticamente
        </p>
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
              <label style={S.label}>Unidade *</label>
              {inp("unidade", "text", "Ex: 101")}
            </div>
            <div>
              <label style={S.label}>Bloco</label>
              {inp("bloco", "text", "Ex: A")}
            </div>
            <div>
              <label style={S.label}>Pavimento</label>
              {inp("pavimento", "text", "Ex: 1º Pavimento")}
            </div>
            <div>
              <label style={S.label}>Tipo</label>
              {inp("tipo", "text", "Ex: Apartamento")}
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
                { value: "frente_mar", label: "Frente mar" },
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
              marginBottom: "4px",
            }}
          >
            Valores financeiros
          </h2>
          <p
            style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "16px" }}
          >
            Sinal e parcela são calculados automaticamente ao preencher o valor
            do imóvel
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "14px",
            }}
          >
            <div>
              <label style={S.label}>Valor do imóvel (R$)</label>
              {inp("valor_imovel", "number", "Ex: 780000")}
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
              <label style={S.label}>Qtd. parcelas mensais</label>
              {inp("quantidade_parcelas", "number")}
            </div>
            <div>
              <label style={S.label}>Valor da parcela (R$)</label>
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
            Observações
          </h2>
          <textarea
            name="observacoes_publicas"
            value={form.observacoes_publicas}
            onChange={handleChange}
            rows={2}
            placeholder="Observações visíveis na tabela pública"
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
          <div style={{ marginTop: "12px" }}>
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
                checked={form.destaque}
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
            disabled={loading}
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
            {loading ? "Salvando..." : "Salvar unidade"}
          </button>
        </div>
      </form>
    </div>
  );
}
