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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${id}-${field}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('empreendimentos')
      .upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from('empreendimentos').getPublicUrl(path);
      setForm((f: any) => ({ ...f, [field]: data.publicUrl }));
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("empreendimentos").update(form).eq("id", id);
    if (err) { setError(err.message); setSaving(false); return; }
    router.push("/admin/empreendimentos");
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

  const imageField = (field: string, label: string) => (
    <div style={{ gridColumn: "1/-1" }}>
      <label style={S.label}>{label}</label>
      {form[field] && (
        <div style={{ marginBottom: "8px", position: "relative" }}>
          <img src={form[field]} alt={label} style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "8px", border: "1px solid #DDD9D3" }} />
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#f9fafb", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "13px", cursor: "pointer", color: "#374151" }}>
          {uploading ? "Enviando..." : "📁 Fazer upload"}
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, field)}
            style={{ display: "none" }} disabled={uploading} />
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
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#111" }}>Editar Empreendimento</h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>{form.nome}</p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#b91c1c", fontSize: "14px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #DDD9D3", padding: "24px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "16px" }}>Condições comerciais</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div><label style={S.label}>Índice até entrega</label>{sel("indice_ate_entrega", [
              { value: "INCC", label: "INCC" }, { value: "INCC-M", label: "INCC-M" },
              { value: "IPCA", label: "IPCA" }, { value: "IGP-M", label: "IGP-M" }, { value: "outro", label: "Outro" },
            ])}</div>
            <div><label style={S.label}>Índice após entrega</label>{sel("indice_apos_entrega", [
              { value: "1_mais_igpm", label: "1% + IGP-M" }, { value: "1_mais_ipca", label: "1% + IPCA" },
              { value: "IPCA", label: "IPCA" }, { value: "IGP-M", label: "IGP-M" }, { value: "outro", label: "Outro" },
            ])}</div>
            <div>
              <label style={S.label}>Parcelas padrão</label>
              <input name="parcelas_padrao" type="number" value={form.parcelas_padrao ?? ""} onChange={handleChange}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div>
              <label style={S.label}>% Sinal padrão</label>
              <input name="percentual_sinal_padrao" type="number" value={form.percentual_sinal_padrao ?? ""} onChange={handleChange}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div>
              <label style={S.label}>% Chaves padrão</label>
              <input name="percentual_chaves_padrao" type="number" value={form.percentual_chaves_padrao ?? ""} onChange={handleChange}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div><label style={S.label}>Data prevista entrega</label>{inp("data_prevista_entrega", "date")}</div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Observações públicas</label>
              <textarea name="observacoes_publicas" value={form.observacoes_publicas ?? ""} onChange={handleChange} rows={3}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical" }} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Observações internas</label>
              <textarea name="observacoes_internas" value={form.observacoes_internas ?? ""} onChange={handleChange} rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #DDD9D3", borderRadius: "8px", fontSize: "14px", outline: "none", resize: "vertical" }} />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                <input type="checkbox" name="ativo_publico" checked={form.ativo_publico ?? false} onChange={handleChange}
                  style={{ width: "16px", height: "16px", accentColor: "#E8390E" }} />
                Exibir no site público
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
