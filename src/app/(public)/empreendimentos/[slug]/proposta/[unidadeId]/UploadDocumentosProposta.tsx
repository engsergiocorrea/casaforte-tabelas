'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_MB = 40

// Área de upload de documentos do cliente na proposta: sobe ao Storage
// (bucket privado), pede a leitura pela IA e devolve os campos já mapeados
// para o formulário via onPreencher.
export default function UploadDocumentosProposta({
  onPreencher,
  onDocumentos,
}: {
  onPreencher: (campos: Record<string, string>) => void
  onDocumentos?: (docs: { nome: string; path: string; mime: string; tamanho: number }[]) => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [anexados, setAnexados] = useState(0)
  const [consentido, setConsentido] = useState(false)

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const novos = Array.from(e.target.files ?? [])
    const grande = novos.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (grande) setErro(`"${grande.name}" tem ${(grande.size / 1048576).toFixed(1)} MB (máx. ${MAX_MB} MB por arquivo).`)
    else if (novos.length) { setErro(''); setFiles((prev) => [...prev, ...novos].slice(0, 6)) }
    e.target.value = ''
  }
  function remove(i: number) { setFiles((prev) => prev.filter((_, idx) => idx !== i)) }

  async function ler() {
    if (files.length === 0) { setErro('Selecione ao menos um documento (RG/CNH, CPF, comprovante, certidão…).'); return }
    if (!consentido) { setErro('Confirme que você tem autorização do cliente para enviar os documentos dele.'); return }
    setLoading(true)
    setErro('')
    setOk('')
    try {
      const supabase = createClient()
      const folder = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
      const paths: string[] = []
      const meta: { nome: string; path: string; mime: string; tamanho: number }[] = []
      for (const f of files) {
        const safe = f.name.replace(/[^\w.\-]+/g, '_').slice(-90)
        const path = `documentos/${folder}/${Date.now()}_${safe}`
        const { error } = await supabase.storage.from('proposta-documentos').upload(path, f, { contentType: f.type || undefined })
        if (error) { setErro(`Falha ao enviar "${f.name}": ${error.message}`); setLoading(false); return }
        paths.push(path)
        meta.push({ nome: f.name, path, mime: f.type || 'application/octet-stream', tamanho: f.size })
      }

      // Anexa os documentos à proposta (independe da leitura pela IA): a
      // diretoria terá acesso a eles no admin, mesmo se a extração falhar.
      onDocumentos?.(meta)
      setAnexados((prev) => prev + meta.length)

      const resp = await fetch('/api/extrair-documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      })
      let j: any = null
      try { j = await resp.json() } catch {}
      if (!resp.ok || !j) {
        setErro('Documentos anexados, mas não consegui ler com a IA. Preencha os campos manualmente.')
        setFiles([])
      } else if (!j.ok) {
        setErro('Documentos anexados, mas a leitura por IA falhou. Preencha os campos manualmente.')
        setFiles([])
      } else {
        const campos: Record<string, string> = j.campos || {}
        const n = Object.keys(campos).length
        if (n === 0) setOk('Documentos anexados à proposta. A IA não encontrou dados legíveis — preencha os campos abaixo.')
        else { onPreencher(campos); setOk(`✅ ${n} campo(s) preenchido(s) pelos documentos. Confira e ajuste abaixo.`) }
        setFiles([])
      }
    } catch (e: any) {
      setErro('Falha ao enviar/ler os documentos. ' + (e?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E8390E55', padding: 20, marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>📄 Preencher com documentos (IA)</h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
        Envie RG/CNH, CPF, comprovante e/ou certidão de casamento (imagem ou PDF). Os documentos são lidos por
        inteligência artificial para pré-preencher a proposta e ficam armazenados de forma privada. A leitura pode ser
        processada por serviço no exterior. Veja a{' '}
        <a href="/privacidade" target="_blank" rel="noreferrer" style={{ color: '#E8390E', textDecoration: 'underline' }}>Política de Privacidade</a>.
      </p>

      <input type="file" accept="image/*,application/pdf" multiple onChange={onPick} style={{ fontSize: 14 }} />
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {files.map((f, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 12.5, color: '#374151' }}>
              {f.type === 'application/pdf' ? '📄' : '🖼️'} {f.name}
              <button type="button" onClick={() => remove(i)} aria-label="Remover" style={{ border: 'none', background: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}

      {erro && <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#b91c1c', fontSize: 13 }}>⚠️ {erro}</div>}
      {ok && <div style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', color: '#15803d', fontSize: 13 }}>{ok}</div>}
      {anexados > 0 && <div style={{ marginTop: 8, fontSize: 12.5, color: '#6b7280' }}>📎 {anexados} documento(s) anexado(s) — serão enviados junto com a proposta.</div>}

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14, fontSize: 12.5, color: '#374151', cursor: 'pointer', lineHeight: 1.5 }}>
        <input type="checkbox" checked={consentido} onChange={(e) => setConsentido(e.target.checked)} style={{ marginTop: 2, width: 15, height: 15, accentColor: '#E8390E', flexShrink: 0 }} />
        <span>Confirmo que tenho autorização do cliente para enviar e tratar os documentos dele nesta proposta.</span>
      </label>

      <button
        type="button"
        onClick={ler}
        disabled={loading}
        style={{ marginTop: 14, padding: '10px 18px', background: '#E8390E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? '⏳ Enviando e lendo…' : '🔎 Ler documentos e preencher'}
      </button>
    </div>
  )
}
