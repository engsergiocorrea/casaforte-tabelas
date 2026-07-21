'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MAX_DOCUMENT_FILES,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  MAX_DOCUMENT_BATCH_SIZE_BYTES,
  isAllowedDocumentMime,
  createSafeDocumentFilename,
  buildDocumentPath,
  formatBytes,
  SOURCE_LABEL,
  DOC_ERRORS,
  type DocumentInputSource,
} from '@/lib/documentos-proposta'

const COLAGEM_ATIVA = process.env.NEXT_PUBLIC_ENABLE_DOCUMENT_PASTE !== 'false'

type DocStatus = 'ready' | 'uploading' | 'uploaded' | 'error'

type PendingDoc = {
  localId: string
  file: File
  source: DocumentInputSource
  previewUrl?: string
  status: DocStatus
  error?: string
}

const novoId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)

// Área de documentos do cliente na proposta. Aceita arquivo do explorador,
// arrastar e soltar, câmera/galeria no celular e COLAGEM (⌘V / Ctrl+V) — todos
// entram na mesma fila. Sobe ao bucket privado e pede a leitura pela IA.
export default function UploadDocumentosProposta({
  onPreencher,
  onDocumentos,
}: {
  onPreencher: (campos: Record<string, string>) => void
  onDocumentos?: (docs: { nome: string; path: string; mime: string; tamanho: number }[]) => void
}) {
  const [docs, setDocs] = useState<PendingDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [anexados, setAnexados] = useState(0)
  const [consentido, setConsentido] = useState(false)
  const [comFoco, setComFoco] = useState(false)
  const [arrastando, setArrastando] = useState(false)
  const [desktop, setDesktop] = useState(false)

  const docsRef = useRef<PendingDoc[]>([])
  docsRef.current = docs

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setDesktop(window.matchMedia('(pointer: fine)').matches)
    }
    // Libera as URLs de preview ao desmontar (evita vazamento de memória).
    return () => {
      for (const d of docsRef.current) if (d.previewUrl) URL.revokeObjectURL(d.previewUrl)
    }
  }, [])

  // ---- Entrada única para TODAS as origens -------------------------------
  function addFiles(novos: File[], source: DocumentInputSource) {
    if (novos.length === 0) return
    setOk('')

    const atuais = docsRef.current
    let totalBytes = atuais.reduce((s, d) => s + d.file.size, 0)
    const aceitos: PendingDoc[] = []
    let recusa = ''

    for (const file of novos) {
      if (atuais.length + aceitos.length >= MAX_DOCUMENT_FILES) { recusa = DOC_ERRORS.limiteQuantidade; break }
      if (!isAllowedDocumentMime(file.type)) { recusa = source === 'paste' ? DOC_ERRORS.formatoColado : DOC_ERRORS.formatoInvalido; continue }
      if (file.size === 0) { recusa = DOC_ERRORS.arquivoVazio; continue }
      if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) { recusa = DOC_ERRORS.limiteArquivo; continue }
      if (totalBytes + file.size > MAX_DOCUMENT_BATCH_SIZE_BYTES) { recusa = DOC_ERRORS.limiteConjunto; break }

      totalBytes += file.size
      aceitos.push({
        localId: novoId(),
        file,
        source,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: 'ready',
      })
    }

    if (aceitos.length > 0) {
      setDocs((prev) => [...prev, ...aceitos])
      setErro(recusa || '')
      setOk(aceitos.length === 1 ? 'Documento adicionado com sucesso.' : `${aceitos.length} documentos adicionados.`)
    } else {
      setErro(recusa || DOC_ERRORS.formatoInvalido)
    }
  }

  function remove(localId: string) {
    setDocs((prev) => {
      const alvo = prev.find((d) => d.localId === localId)
      if (alvo?.previewUrl) URL.revokeObjectURL(alvo.previewUrl)
      return prev.filter((d) => d.localId !== localId)
    })
  }

  // ---- Origens ------------------------------------------------------------
  function onPick(e: React.ChangeEvent<HTMLInputElement>, source: DocumentInputSource) {
    addFiles(Array.from(e.target.files ?? []), source)
    e.target.value = ''
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    if (!COLAGEM_ATIVA) return
    const encontrados: File[] = []
    for (const item of Array.from(e.clipboardData?.items ?? [])) {
      if (item.kind !== 'file') continue
      if (!item.type.startsWith('image/')) continue
      const f = item.getAsFile()
      if (f) encontrados.push(f)
    }
    // Sem imagem: não interfere na colagem normal (texto em input, por exemplo).
    if (encontrados.length === 0) return
    e.preventDefault()
    addFiles(encontrados, 'paste')
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setArrastando(false)
    addFiles(Array.from(e.dataTransfer?.files ?? []), 'drag-drop')
  }

  // ---- Envio + leitura ----------------------------------------------------
  async function ler() {
    if (docs.length === 0) { setErro('Adicione ao menos um documento (RG/CNH, CPF, comprovante, certidão…).'); return }
    if (!consentido) { setErro('Confirme que você tem autorização do cliente para enviar os documentos dele.'); return }
    setLoading(true)
    setErro('')
    setOk('')
    try {
      const supabase = createClient()
      const sessionId = novoId()
      const paths: string[] = []
      const meta: { nome: string; path: string; mime: string; tamanho: number }[] = []

      for (const d of docs) {
        setDocs((prev) => prev.map((x) => (x.localId === d.localId ? { ...x, status: 'uploading', error: undefined } : x)))
        const filename = createSafeDocumentFilename(d.file.type, novoId())
        const path = buildDocumentPath(sessionId, filename)
        const { error } = await supabase.storage
          .from('proposta-documentos')
          .upload(path, d.file, { contentType: d.file.type, upsert: false })

        if (error) {
          setDocs((prev) => prev.map((x) => (x.localId === d.localId ? { ...x, status: 'error', error: DOC_ERRORS.falhaUpload } : x)))
          setErro(DOC_ERRORS.falhaUpload)
          setLoading(false)
          return
        }
        setDocs((prev) => prev.map((x) => (x.localId === d.localId ? { ...x, status: 'uploaded' } : x)))
        paths.push(path)
        meta.push({
          nome: d.source === 'paste' ? 'Imagem colada' : d.file.name,
          path,
          mime: d.file.type,
          tamanho: d.file.size,
        })
      }

      // Anexa à proposta mesmo que a IA falhe — a diretoria precisa dos arquivos.
      onDocumentos?.(meta)
      setAnexados((prev) => prev + meta.length)

      const resp = await fetch('/api/extrair-documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      })
      let j: any = null
      try { j = await resp.json() } catch {}

      if (!resp.ok || !j || !j.ok) {
        setErro('Documentos anexados, mas não consegui ler com a IA. Preencha os campos manualmente.')
      } else {
        const campos: Record<string, string> = j.campos || {}
        const n = Object.keys(campos).length
        if (n === 0) setOk('Documentos anexados à proposta. A IA não encontrou dados legíveis — preencha os campos abaixo.')
        else { onPreencher(campos); setOk(`✅ ${n} campo(s) preenchido(s) pelos documentos. Confira e ajuste abaixo.`) }
      }
      // Limpa a fila (os arquivos já estão no Storage e vinculados).
      for (const d of docsRef.current) if (d.previewUrl) URL.revokeObjectURL(d.previewUrl)
      setDocs([])
    } catch {
      setErro(DOC_ERRORS.falhaLeitura)
    } finally {
      setLoading(false)
    }
  }

  const podeLer = docs.length > 0 && !loading

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E8390E55', padding: 20, marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>📄 Preencher com documentos (IA)</h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
        Envie RG/CNH, CPF, comprovante e/ou certidão de casamento. Os documentos são lidos por inteligência artificial
        para pré-preencher a proposta e ficam armazenados de forma privada. A leitura pode ser processada por serviço no
        exterior. Veja a{' '}
        <a href="/privacidade" target="_blank" rel="noreferrer" style={{ color: '#E8390E', textDecoration: 'underline' }}>Política de Privacidade</a>.
      </p>

      {/* Área única: colar, arrastar, selecionar */}
      <div
        tabIndex={0}
        role="group"
        aria-label="Área de documentos: cole, arraste ou selecione arquivos"
        onPaste={handlePaste}
        onFocus={() => setComFoco(true)}
        onBlur={() => setComFoco(false)}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${arrastando ? '#E8390E' : comFoco ? '#E8390E' : '#DDD9D3'}`,
          background: arrastando ? '#fdeee9' : '#fafafa',
          borderRadius: 10,
          padding: '18px 16px',
          outline: 'none',
          transition: 'border-color .15s, background .15s',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
          {COLAGEM_ATIVA && desktop ? 'Cole, arraste ou selecione os documentos' : 'Arraste ou selecione os documentos'}
        </div>
        <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 4 }}>
          {COLAGEM_ATIVA && desktop
            ? 'Copie uma imagem do WhatsApp e pressione ⌘ + V (Mac) ou Ctrl + V (Windows) com esta área selecionada.'
            : 'Tire uma foto ou selecione uma imagem da galeria.'}
        </div>
        {COLAGEM_ATIVA && desktop && comFoco && (
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#15803d' }}>✓ Pronto para colar</div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={btnSec}>
            Selecionar arquivos
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple onChange={(e) => onPick(e, 'file-picker')} style={{ display: 'none' }} />
          </label>
          {!desktop && (
            <>
              <label style={btnSec}>
                Tirar foto
                <input type="file" accept="image/*" capture="environment" onChange={(e) => onPick(e, 'camera')} style={{ display: 'none' }} />
              </label>
              <label style={btnSec}>
                Galeria
                <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={(e) => onPick(e, 'gallery')} style={{ display: 'none' }} />
              </label>
            </>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 10 }}>
          PDF, JPG, PNG ou WEBP · até {MAX_DOCUMENT_FILES} arquivos · máx. {Math.round(MAX_DOCUMENT_FILE_SIZE_BYTES / 1048576)} MB cada
        </div>
      </div>

      {/* Pré-visualização */}
      {docs.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map((d) => (
            <li key={d.localId} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e5e7eb', borderRadius: 10, padding: 8, background: d.status === 'error' ? '#fef2f2' : '#fff' }}>
              {d.previewUrl
                ? <img src={d.previewUrl} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 7, border: '1px solid #e5e7eb', flexShrink: 0 }} />
                : <span aria-hidden style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: 7, fontSize: 22, flexShrink: 0 }}>📄</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#111', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.source === 'paste' ? 'Imagem colada' : d.file.name}
                </div>
                <div style={{ fontSize: 11.5, color: '#6b7280' }}>
                  {SOURCE_LABEL[d.source]} · {formatBytes(d.file.size)}
                  {d.status === 'uploading' && ' · enviando…'}
                  {d.status === 'uploaded' && ' · enviado'}
                </div>
                {d.error && <div role="alert" style={{ fontSize: 11.5, color: '#b91c1c' }}>{d.error}</div>}
              </div>
              <button type="button" onClick={() => remove(d.localId)} disabled={loading}
                aria-label={`Remover ${d.source === 'paste' ? 'imagem colada' : d.file.name}`}
                style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 15, cursor: 'pointer' }}>×</button>
            </li>
          ))}
        </ul>
      )}

      {erro && <div role="alert" style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#b91c1c', fontSize: 13 }}>⚠️ {erro}</div>}
      {ok && <div role="status" style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', color: '#15803d', fontSize: 13 }}>{ok}</div>}
      {anexados > 0 && <div style={{ marginTop: 8, fontSize: 12.5, color: '#6b7280' }}>📎 {anexados} documento(s) anexado(s) — serão enviados junto com a proposta.</div>}

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14, fontSize: 12.5, color: '#374151', cursor: 'pointer', lineHeight: 1.5 }}>
        <input type="checkbox" checked={consentido} onChange={(e) => setConsentido(e.target.checked)} style={{ marginTop: 2, width: 15, height: 15, accentColor: '#E8390E', flexShrink: 0 }} />
        <span>Confirmo que tenho autorização do cliente para enviar e tratar os documentos dele nesta proposta.</span>
      </label>

      <button
        type="button"
        onClick={ler}
        disabled={!podeLer}
        style={{ marginTop: 14, padding: '10px 18px', background: '#E8390E', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: podeLer ? 1 : 0.6 }}
      >
        {loading ? '⏳ Enviando e lendo…' : '🔎 Ler documentos com IA'}
      </button>
    </div>
  )
}

const btnSec: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 14px',
  background: '#fff',
  border: '1px solid #DDD9D3',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
}
