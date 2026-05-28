'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ImportarUnidadesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{inseridas:number, erros:string[]} | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResultado(null)

    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''))
    
    const unidades = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/"/g,''))
      const obj: any = { empreendimento_id: params.id }
      headers.forEach((h, i) => {
        const v = vals[i] ?? ''
        const numFields = ['area_construida','area_privativa_externa','area_total','area_terreno','quartos','suites','banheiros','vagas','valor_imovel','percentual_sinal','valor_sinal','quantidade_parcelas','valor_parcela','quantidade_intercaladas','valor_intercalada','percentual_chaves','valor_chaves']
        if (numFields.includes(h)) {
          obj[h] = v !== '' ? Number(v) : null
        } else {
          obj[h] = v !== '' ? v : null
        }
      })
      return obj
    }).filter(u => u.unidade)

    const supabase = createClient()
    const erros: string[] = []
    let inseridas = 0

    // Inserir em lotes de 10
    for (let i = 0; i < unidades.length; i += 10) {
      const lote = unidades.slice(i, i + 10)
      const { error } = await supabase.from('unidades').insert(lote)
      if (error) {
        erros.push(`Lote ${i}-${i+10}: ${error.message}`)
      } else {
        inseridas += lote.length
      }
    }

    setResultado({ inseridas, erros })
    setLoading(false)
  }

  return (
    <div>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Importar Unidades via CSV</h1>
        <p style={{fontSize:'0.875rem',color:'#6b7280',marginTop:'0.25rem'}}>Selecione o arquivo CSV para importar todas as unidades de uma vez</p>
      </div>

      <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'32px',maxWidth:'600px'}}>
        <div style={{marginBottom:'24px',padding:'16px',background:'#f9fafb',borderRadius:'8px',border:'1px solid #e5e7eb'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#374151',marginBottom:'8px'}}>Formato esperado do CSV:</p>
          <p style={{fontSize:'12px',color:'#6b7280',lineHeight:'1.6'}}>
            unidade, pavimento, posicao, area_construida, area_privativa_externa, quartos, valor_imovel, percentual_sinal, valor_sinal, quantidade_parcelas, valor_parcela, quantidade_intercaladas, periodicidade_intercaladas, valor_intercalada, percentual_chaves, valor_chaves, status
          </p>
        </div>

        <div style={{marginBottom:'24px'}}>
          <label style={{display:'block',fontSize:'13px',fontWeight:'500',color:'#374151',marginBottom:'8px'}}>
            Selecionar arquivo CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            disabled={loading}
            style={{width:'100%',padding:'8px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px'}}
          />
        </div>

        {loading && (
          <div style={{textAlign:'center',padding:'20px',color:'#6b7280'}}>
            <p>Importando unidades...</p>
          </div>
        )}

        {resultado && (
          <div style={{padding:'16px',background: resultado.erros.length === 0 ? '#f0fdf4' : '#fef2f2',border:`1px solid ${resultado.erros.length === 0 ? '#bbf7d0' : '#fecaca'}`,borderRadius:'8px'}}>
            <p style={{fontWeight:'600',color: resultado.erros.length === 0 ? '#15803d' : '#b91c1c',marginBottom:'8px'}}>
              {resultado.inseridas} unidades importadas com sucesso!
            </p>
            {resultado.erros.map((e, i) => (
              <p key={i} style={{fontSize:'12px',color:'#b91c1c'}}>{e}</p>
            ))}
            {resultado.erros.length === 0 && (
              <button
                onClick={() => router.push(`/admin/empreendimentos/${params.id}/unidades`)}
                style={{marginTop:'12px',padding:'8px 16px',background:'#15803d',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',cursor:'pointer'}}
              >
                Ver unidades →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
