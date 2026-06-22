"use client";
import { useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ImportarUnidadesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ ok: number; erros: string[] }>();
  const [preview, setPreview] = useState<any[]>([]);

  function parseCSV(text: string) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? "";
      });
      return obj;
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const text = await file.text();
    const rows = parseCSV(text);
    const supabase = createClient();
    let ok = 0;
    const erros: string[] = [];

    for (const row of rows) {
      const data = {
        empreendimento_id: id,
        unidade: row.unidade,
        pavimento: row.pavimento || null,
        posicao: row.posicao || null,
        area_construida: row.area_construida
          ? Number(row.area_construida)
          : null,
        area_privativa_externa: row.area_privativa_externa
          ? Number(row.area_privativa_externa)
          : null,
        area_total: row.area_total ? Number(row.area_total) : null,
        quartos: row.quartos ? Number(row.quartos) : null,
        suites: row.suites ? Number(row.suites) : null,
        valor_imovel: row.valor_imovel ? Number(row.valor_imovel) : null,
        percentual_sinal: row.percentual_sinal
          ? Number(row.percentual_sinal)
          : null,
        valor_sinal: row.valor_sinal ? Number(row.valor_sinal) : null,
        quantidade_parcelas: row.quantidade_parcelas
          ? Number(row.quantidade_parcelas)
          : null,
        valor_parcela: row.valor_parcela ? Number(row.valor_parcela) : null,
        quantidade_intercaladas: row.quantidade_intercaladas
          ? Number(row.quantidade_intercaladas)
          : null,
periodicidade_intercaladas: ['semestrais','anuais','personalizada'].includes(row.periodicidade_intercaladas) 
  ? row.periodicidade_intercaladas 
  : null,        valor_intercalada: row.valor_intercalada
          ? Number(row.valor_intercalada)
          : null,
        percentual_chaves: row.percentual_chaves
          ? Number(row.percentual_chaves)
          : null,
        valor_chaves: row.valor_chaves ? Number(row.valor_chaves) : null,
        status: row.status || "disponivel",
        observacoes_publicas: row.observacoes_publicas || null,
      };
      const { error } = await supabase.from("unidades").insert([data]);
      if (error) erros.push(`${row.unidade}: ${error.message}`);
      else ok++;
    }

    setResultado({ ok, erros });
    setLoading(false);
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111" }}>
          Importar Unidades via CSV
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            marginTop: "0.25rem",
          }}
        >
          Faça upload do arquivo CSV com as unidades do empreendimento
        </p>
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
          style={{ fontSize: "15px", fontWeight: "600", marginBottom: "16px" }}
        >
          Upload do arquivo CSV
        </h2>

        <div
          style={{
            border: "2px dashed #DDD9D3",
            borderRadius: "10px",
            padding: "32px",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📂</div>
          <p
            style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}
          >
            Selecione o arquivo CSV com as unidades
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            disabled={loading}
            style={{ display: "block", margin: "0 auto", fontSize: "14px" }}
          />
        </div>

        {loading && (
          <div
            style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>⏳</div>
            Importando unidades... aguarde
          </div>
        )}

        {resultado && (
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                background:
                  resultado.erros.length === 0 ? "#f0fdf4" : "#fffbeb",
                border: `1px solid ${resultado.erros.length === 0 ? "#bbf7d0" : "#fde68a"}`,
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontWeight: "600",
                  color: resultado.erros.length === 0 ? "#15803d" : "#92400e",
                  marginBottom: "4px",
                }}
              >
                {resultado.erros.length === 0 ? "✅" : "⚠️"} {resultado.ok}{" "}
                unidades importadas com sucesso!
              </p>
              {resultado.erros.length > 0 && (
                <p style={{ fontSize: "13px", color: "#92400e" }}>
                  {resultado.erros.length} erros encontrados
                </p>
              )}
            </div>
            {resultado.erros.length > 0 &&
              resultado.erros.map((e, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "12px",
                    color: "#b91c1c",
                    padding: "4px 0",
                  }}
                >
                  {e}
                </div>
              ))}
            <button
              onClick={() =>
                router.push(`/admin/empreendimentos/${id}/unidades`)
              }
              style={{
                marginTop: "12px",
                padding: "8px 20px",
                background: "#E8390E",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Ver unidades importadas →
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          background: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "16px",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "8px",
            color: "#374151",
          }}
        >
          Colunas esperadas no CSV:
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "#6b7280",
            fontFamily: "monospace",
            lineHeight: "1.8",
          }}
        >
          unidade, pavimento, posicao, area_construida, area_privativa_externa,
          quartos, valor_imovel, percentual_sinal, valor_sinal,
          quantidade_parcelas, valor_parcela, quantidade_intercaladas,
          periodicidade_intercaladas, valor_intercalada, percentual_chaves,
          valor_chaves, status
        </p>
      </div>
    </div>
  );
}
