"use client";
import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function EditarEmpreendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [uploadOkField, setUploadOkField] = useState<string | null>(null);
  const [uploadMB, setUploadMB] = useState<number | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("empreendimentos").select("*").eq("id", id).single()
      .then(({ data }) => { if (data) setForm(data); });
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((f: any) => ({ ...f, [name]: val }));
  }

  // Sobe o arquivo com progresso real 0-100%, SEM depender de policy de RLS:
  // 1) pede ao servidor uma URL assinada (gerada com service role);
  // 2) sobe o arquivo do navegador direto para o Storage por essa URL (XHR),
  //    no mesmo formato do supabase-js (FormData: cacheControl + arquivo).
  async function uploadComProgresso(file: File, field: string): Promise<string> {
    let ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!/^[a-z0-9]{2,5}$/.test(ext)) {
      ext = file.type === 'application/pdf' ? 'pdf' : (file.type.split('/')[1] || 'bin');
    }
    const resp = await fetch('/api/admin/folder-upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, field, ext }),
    });
    const info = await resp.json();
    if (!resp.ok) throw new Error(info?.erro || `HTTP ${resp.status}`);

    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const fd = new FormData();
    fd.append('cacheControl', '3600');
    fd.append('', file, file.name);
    return await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', info.signedUrl);
      xhr.setRequestHeader('apikey', anon);
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(`${info.publicUrl}?v=${Date.now()}`);
        } else {
          let msg = xhr.responseText;
          try { msg = JSON.parse(xhr.responseText)?.message || msg; } catch {}
          reject(new Error(msg || `HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Falha de rede durante o envio.'));
      xhr.send(fd);
    });
  }

  async function fazerUpload(e: React.ChangeEvent<HTMLInputElement>, field: string, rotulo: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadingField(field); setUploadPct(0); setUploadOkField(null); setUploadMB(null); setError('');
    try {
      const publicUrl = await uploadComProgresso(file, field);
      setForm((f: any) => ({ ...f, [field]: publicUrl }));
      setUploadMB(file.size / (1024 * 1024));
      setUploadOkField(field);
    } catch (err: any) {
      setError(`Falha ao enviar ${rotulo}: ${err?.message ?? err}`);
    } finally {
      setUploading(false); setUploadingField(null); e.target.value = '';
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => fazerUpload(e, field, 'a imagem');
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => fazerUpload(e, field, 'o folder');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Valida soma dos percentuais — só no modelo padrão (parcelado). No modelo
    // por m² (valor_m2 preenchido, ex.: Villa Maui) esses percentuais não se
    // aplicam, então a soma não precisa fechar 100%.
    if (!form.valor_m2) {
      const somaPerc = (Number(form.percentual_sinal_padrao) || 0) +
        (Number(form.percentual_mensais_padrao) || 0) +
        (Number(form.percentual_intercaladas_padrao) || 0) +
        (Number(form.percentual_chaves_padrao) || 0)
      if (somaPerc > 0 && somaPerc !== 100) {
        setError(`A soma dos percentuais deve ser 100%. Atual: ${somaPerc}%`)
        setSaving(false)
        return
      }
    }

    // Campos vazios ("") viram null — senão o Postgres recusa colunas numéricas
    // ("invalid input syntax for type numeric: \"\"").
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
    );

    const supabase = createClient();
    const { error: err } = await supabase.from("empreendimentos").update(payload).eq("id", id);
    if (err) { setError(err.message); setSaving(false); return; }
    // Recarga completa (não client-side) para evitar tela branca por "skew" de
    // deploy e garantir que a lista venha com os dados atualizados.
    window.location.assign("/admin/empreendimentos");
  }

  if (!form) return <div style={{ padding: "2rem", color: "#6b7280" }}>Carregando...</div>;

  const S = { label: { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "4px" } as React.CSSProperties };

  const inp = (name: string, type = "text", placeholder = "") => (
    <input name={name} type={type} placeholder={placeholder} value={form[name] ?? ""} onChange={handleChange}
      style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
  );

  const sel = (name: string, opts: { value: string; label: string }[]) => (
    <select name={name} value={form[name] ?? ""} onChange={handleChange}
      style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", background: "white" }}>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  // Barra de progresso (durante o envio) + confirmação de "enviado" por campo.
  const renderUploadStatus = (field: string) => (
    <>
      {uploadingField === field && (
        <div style={{ marginTop: "8px" }}>
          <div style={{ height: "8px", background: "#eee", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${uploadPct}%`, background: "#E8390E", transition: "width .15s" }} />
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Enviando… {uploadPct}%</div>
        </div>
      )}
      {uploadOkField === field && uploadingField !== field && (
        <div style={{ marginTop: "8px", fontSize: "13px", color: "#15803d", fontWeight: 600 }}>
          ✅ Enviado{uploadMB != null ? ` (${uploadMB.toFixed(1)} MB)` : ""}! Clique em <strong>Salvar</strong> para confirmar.
        </div>
      )}
      {uploadOkField === field && uploadingField !== field && uploadMB != null && uploadMB > 8 && (
        <div style={{ marginTop: "6px", fontSize: "12px", color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "6px 10px" }}>
          ⚠️ Arquivo pesado ({uploadMB.toFixed(1)} MB) — pode demorar para abrir no celular. Considere comprimir o PDF antes (ex.: Pré-visualização do Mac → Exportar → "Reduzir Tamanho do Arquivo", ou iLovePDF/Smallpdf "Comprimir PDF") e reenviar. Costuma cair para 3–6 MB sem perda visível.
        </div>
      )}
    </>
  );

  const imageField = (field: string, label: string) => (
    <div style={{ gridColumn: "1/-1" }}>
      <label style={S.label}>{label}</label>
      {form[field] && (
        <div style={{ marginBottom: "8px" }}>
          <img src={form[field]} alt={label} style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "8px", border: "1px solid #DDD9D3" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#f9fafb", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "13px", cursor: "pointer", color: "#374151" }}>
          {uploadingField === field ? `Enviando… ${uploadPct}%` : "📁 Fazer upload"}
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, field)} style={{ display: "none" }} disabled={uploading} />
        </label>
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>ou</span>
        <input name={field} type="url" placeholder="Cole a URL da imagem" value={form[field] ?? ""} onChange={handleChange}
          style={{ flex: 1, minWidth: "200px", padding: "7px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "13px", outline: "none" }} />
        {form[field] && (
          <button type="button" onClick={() => setForm((f: any) => ({ ...f, [field]: "" }))}
            style={{ padding: "7px 12px", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#b91c1c", background: "white", cursor: "pointer" }}>
            ✕ Remover
          </button>
        )}
      </div>
      {renderUploadStatus(field)}
    </div>
  );

  const linkCurtoFolder = () =>
    typeof window !== "undefined" && form.slug ? `${window.location.origin}/f/${form.slug}` : "";

  const fileField = (field: string, label: string) => (
    <div style={{ gridColumn: "1/-1" }}>
      <label style={S.label}>{label}</label>
      {form[field] && (
        <div style={{ marginBottom: "8px" }}>
          <a href={form[field]} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#E8390E", fontWeight: 600, textDecoration: "none" }}>📄 Ver arquivo atual</a>
        </div>
      )}
      {field === "folder_url" && form.folder_url && form.slug && (
        <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", padding: "8px 10px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>🔗 Link curto p/ compartilhar:</span>
          <code style={{ fontSize: "13px", color: "#111", background: "white", border: "1px solid #e5e7eb", padding: "3px 8px", borderRadius: "6px" }}>{linkCurtoFolder()}</code>
          <button type="button"
            onClick={() => { navigator.clipboard.writeText(linkCurtoFolder()); setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2000); }}
            style={{ padding: "5px 12px", border: "1px solid #E8390E", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: linkCopiado ? "#15803d" : "#E8390E", background: "white", cursor: "pointer" }}>
            {linkCopiado ? "✓ Copiado!" : "Copiar"}
          </button>
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#f9fafb", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "13px", cursor: "pointer", color: "#374151" }}>
          {uploadingField === field ? `Enviando… ${uploadPct}%` : "📁 Enviar folder (PDF)"}
          <input type="file" accept="application/pdf,image/*" onChange={(e) => handleFileUpload(e, field)} style={{ display: "none" }} disabled={uploading} />
        </label>
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>ou</span>
        <input name={field} type="url" placeholder="Cole a URL do folder" value={form[field] ?? ""} onChange={handleChange}
          style={{ flex: 1, minWidth: "200px", padding: "7px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "13px", outline: "none" }} />
        {form[field] && (
          <button type="button" onClick={() => setForm((f: any) => ({ ...f, [field]: "" }))}
            style={{ padding: "7px 12px", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#b91c1c", background: "white", cursor: "pointer" }}>
            ✕ Remover
          </button>
        )}
      </div>
      {renderUploadStatus(field)}
    </div>
  );

  const somaPerc = (Number(form.percentual_sinal_padrao) || 0) +
    (Number(form.percentual_mensais_padrao) || 0) +
    (Number(form.percentual_intercaladas_padrao) || 0) +
    (Number(form.percentual_chaves_padrao) || 0)

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111" }}>Editar Empreendimento</h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>{form.nome}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <a href={`/admin/empreendimentos/${id}/unidades`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "white", color: "#374151", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            🏠 Unidades (status em massa)
          </a>
          <a href={`/admin/empreendimentos/${id}/tabela-m2`}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#111", color: "white", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            📐 Tabela por m² (m² + áreas)
          </a>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#b91c1c", fontSize: "14px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Informações básicas */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #DDD9D3", padding: "24px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "16px" }}>Informações básicas</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Nome *</label>{inp("nome")}</div>
            <div><label style={S.label}>Slug</label>{inp("slug")}</div>
            <div><label style={S.label}>Cidade *</label>{inp("cidade")}</div>
            <div><label style={S.label}>Estado</label>{sel("estado", [
              { value: "AL", label: "AL" }, { value: "PE", label: "PE" }, { value: "BA", label: "BA" },
              { value: "SE", label: "SE" }, { value: "CE", label: "CE" }, { value: "RN", label: "RN" }, { value: "PB", label: "PB" },
            ])}</div>
            <div><label style={S.label}>Localização</label>{inp("localizacao")}</div>
            <div><label style={S.label}>Status</label>{sel("status", [
              { value: "pre_lancamento", label: "Pré-lançamento" }, { value: "lancamento", label: "Lançamento" },
              { value: "em_obras", label: "Em obras" }, { value: "entregue", label: "Entregue" }, { value: "encerrado", label: "Encerrado" },
            ])}</div>
            <div><label style={S.label}>Tipo</label>{sel("tipo", [
              { value: "apartamentos", label: "Apartamentos" }, { value: "casas", label: "Casas" },
              { value: "studios", label: "Studios" }, { value: "lotes", label: "Lotes" }, { value: "misto", label: "Misto" },
            ])}</div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Descrição curta</label>
              <textarea name="descricao_curta" value={form.descricao_curta ?? ""} onChange={handleChange} rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical" }} />
            </div>
            {imageField("imagem_capa_url", "🖼️ Imagem de capa")}
            {imageField("logo_url", "🏷️ Logo do empreendimento")}
            {fileField("folder_url", "📄 Folder do empreendimento (PDF) — aparece destacado na tabela pública")}
          </div>
        </div>

        {/* Configuração Comercial */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #DDD9D3", padding: "24px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "4px" }}>⚙️ Configuração Comercial</h2>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "16px" }}>Define as regras de cálculo automático para todas as unidades deste empreendimento.</p>

          {/* Tipo de cálculo */}
          <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "14px 16px", marginBottom: "16px", border: "1px solid #e5e7eb" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <input type="checkbox" name="considerar_area_externa_no_calculo" checked={form.considerar_area_externa_no_calculo ?? false} onChange={handleChange}
                style={{ width: "16px", height: "16px", accentColor: "#E8390E" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>Considerar área privativa externa no cálculo</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                  Se marcado: valor = área construída × preço/m² + área externa × preço/m² externo
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Se desmarcado: valor = área construída × preço/m²
                </div>
              </div>
            </label>
          </div>

          {/* Índices */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={S.label}>Índice até entrega</label>
              {sel("indice_ate_entrega", [
                { value: "incc_m", label: "INCC-M" }, { value: "incc", label: "INCC" },
                { value: "ipca", label: "IPCA" }, { value: "igpm", label: "IGP-M" }, { value: "outro", label: "Outro" },
              ])}
            </div>
            <div>
              <label style={S.label}>Índice após entrega</label>
              {sel("indice_apos_entrega", [
                { value: "1_mais_igpm", label: "1% + IGP-M" }, { value: "1_mais_ipca", label: "1% + IPCA" },
                { value: "1_mais_incc", label: "1% + INCC" }, { value: "ipca", label: "IPCA" },
                { value: "igpm", label: "IGP-M" }, { value: "outro", label: "Outro" },
              ])}
            </div>
            <div><label style={S.label}>Data prevista de entrega</label>{inp("data_prevista_entrega", "date")}</div>
          </div>

          {/* Percentuais */}
          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Fluxo de pagamento padrão</label>
              <span style={{
                fontSize: "12px", fontWeight: "600", padding: "2px 10px", borderRadius: "20px",
                background: somaPerc === 100 ? "#dcfce7" : somaPerc === 0 ? "#f3f4f6" : "#fee2e2",
                color: somaPerc === 100 ? "#15803d" : somaPerc === 0 ? "#6b7280" : "#b91c1c"
              }}>
                {somaPerc === 0 ? "Não configurado" : `Total: ${somaPerc}%${somaPerc === 100 ? " ✓" : " — deve ser 100%"}`}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={S.label}>% Sinal/Entrada</label>
                <input name="percentual_sinal_padrao" type="number" min="0" max="100" value={form.percentual_sinal_padrao ?? ""} onChange={handleChange}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={S.label}>% Mensais</label>
                <input name="percentual_mensais_padrao" type="number" min="0" max="100" value={form.percentual_mensais_padrao ?? ""} onChange={handleChange}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={S.label}>% Intercaladas</label>
                <input name="percentual_intercaladas_padrao" type="number" min="0" max="100" value={form.percentual_intercaladas_padrao ?? ""} onChange={handleChange}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={S.label}>% Chaves</label>
                <input name="percentual_chaves_padrao" type="number" min="0" max="100" value={form.percentual_chaves_padrao ?? ""} onChange={handleChange}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
              </div>
            </div>
          </div>

          {/* Quantidades */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <div>
              <label style={S.label}>Qtd. parcelas mensais</label>
              <input name="quantidade_mensais_padrao" type="number" min="1" value={form.quantidade_mensais_padrao ?? ""} onChange={handleChange}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div>
              <label style={S.label}>Qtd. intercaladas</label>
              <input name="quantidade_intercaladas_padrao" type="number" min="1" value={form.quantidade_intercaladas_padrao ?? ""} onChange={handleChange}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div>
              <label style={S.label}>Periodicidade intercaladas</label>
              {sel("periodicidade_intercaladas_padrao", [
                { value: "mensal", label: "Mensal" },
                { value: "semestral", label: "Semestral" },
                { value: "anual", label: "Anual" },
                { value: "personalizada", label: "Personalizada" },
              ])}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #DDD9D3", padding: "24px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "16px" }}>Observações</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={S.label}>Observações públicas</label>
              <textarea name="observacoes_publicas" value={form.observacoes_publicas ?? ""} onChange={handleChange} rows={3}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical" }} />
            </div>
            <div>
              <label style={S.label}>Observações internas</label>
              <textarea name="observacoes_internas" value={form.observacoes_internas ?? ""} onChange={handleChange} rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical" }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
              <input type="checkbox" name="ativo_publico" checked={form.ativo_publico ?? false} onChange={handleChange}
                style={{ width: "16px", height: "16px", accentColor: "#E8390E" }} />
              Exibir no site público
            </label>
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
