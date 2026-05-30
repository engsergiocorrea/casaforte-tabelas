'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function generateSlug(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function NovoEmpreendimentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nome: '', slug: '', cidade: '', estado: 'AL', localizacao: '',
    descricao_curta: '', status: 'lancamento', tipo: 'apartamentos',
    indice_ate_entrega: 'INCC-M', indice_apos_entrega: '1_mais_igpm',
    parcelas_padrao: 60, percentual_sinal_padrao: 20,
    percentual_chaves_padrao: 20, ativo_publico: true,
    observacoes_publicas: '', data_prevista_entrega: ''
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    if (name === 'nome') {
      setForm(f => ({ ...f, nome: value, slug: generateSlug(value) }))
    } else {
      setForm(f => ({ ...f, [name]: val }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const data = {
      ...form,
      data_prevista_entrega: form.data_prevista_entrega || null,
      parcelas_padrao: Number(form.parcelas_padrao) || null,
      percentual_sinal_padrao: Number(form.percentual_sinal_padrao) || null,
      percentual_chaves_padrao: Number(form.percentual_chaves_padrao) || null,
    }
    const { error: err } = await supabase.from('empreendimentos').insert([data])
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/admin/empreendimentos')
  }

  const lbl = (text: string) => (
    <label style={{display:'block',fontSize:'13px',fontWeight:'500',color:'#374151',marginBottom:'4px'}}>{text}</label>
  )
  const inp = (name: string, type = 'text', placeholder = '') => (
    <input name={name} type={type} placeholder={placeholder}
      value={String((form as any)[name])} onChange={handleChange}
      style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
  )
  const sel = (name: string, options: {value:string,label:string}[]) => (
    <select name={name} value={String((form as any)[name])} onChange={handleChange}
      style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',background:'white'}}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <div>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Novo Empreendimento</h1>
        <p style={{fontSize:'0.875rem',color:'#6b7280',marginTop:'0.25rem'}}>Preencha os dados do empreendimento</p>
      </div>

      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px',marginBottom:'16px',color:'#b91c1c',fontSize:'14px'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'16px'}}>Informações básicas</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div style={{gridColumn:'1/-1'}}>
              {lbl('Nome do empreendimento *')}
              {inp('nome','text','Ex: UMÁ Milagres')}
            </div>
            <div>
              {lbl('Slug (URL pública)')}
              {inp('slug','text')}
            </div>
            <div>
              {lbl('Cidade *')}
              {inp('cidade','text','Ex: Maceió')}
            </div>
            <div>
              {lbl('Estado')}
              {sel('estado',[{value:'AL',label:'AL'},{value:'PE',label:'PE'},{value:'BA',label:'BA'},{value:'SE',label:'SE'},{value:'CE',label:'CE'},{value:'RN',label:'RN'},{value:'PB',label:'PB'},{value:'PI',label:'PI'},{value:'MA',label:'MA'}])}
            </div>
            <div>
              {lbl('Localização')}
              {inp('localizacao','text','Ex: Porto de Pedras - Patacho')}
            </div>
            <div>
              {lbl('Status')}
              {sel('status',[{value:'pre_lancamento',label:'Pré-lançamento'},{value:'lancamento',label:'Lançamento'},{value:'em_obras',label:'Em obras'},{value:'entregue',label:'Entregue'},{value:'encerrado',label:'Encerrado'}])}
            </div>
            <div>
              {lbl('Tipo')}
              {sel('tipo',[{value:'apartamentos',label:'Apartamentos'},{value:'casas',label:'Casas'},{value:'studios',label:'Studios'},{value:'lotes',label:'Lotes'},{value:'misto',label:'Misto'}])}
            </div>
            <div style={{gridColumn:'1/-1'}}>
              {lbl('Descrição curta')}
              <textarea name="descricao_curta" value={form.descricao_curta} onChange={handleChange} rows={2}
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',resize:'vertical'}} />
            </div>
          </div>
        </div>

        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'16px'}}>Condições comerciais</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div>
              {lbl('Índice até a entrega')}
              {sel('indice_ate_entrega',[{value:'INCC',label:'INCC'},{value:'INCC-M',label:'INCC-M'},{value:'IPCA',label:'IPCA'},{value:'IGP-M',label:'IGP-M'},{value:'outro',label:'Outro'}])}
            </div>
            <div>
              {lbl('Índice após entrega')}
              {sel('indice_apos_entrega',[{value:'1_mais_igpm',label:'1% + IGP-M'},{value:'1_mais_ipca',label:'1% + IPCA'},{value:'IPCA',label:'IPCA'},{value:'IGP-M',label:'IGP-M'},{value:'outro',label:'Outro'}])}
            </div>
            <div>
              {lbl('Parcelas padrão')}
              <input name="parcelas_padrao" type="number" value={form.parcelas_padrao} onChange={handleChange}
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
            </div>
            <div>
              {lbl('% Sinal padrão')}
              <input name="percentual_sinal_padrao" type="number" value={form.percentual_sinal_padrao} onChange={handleChange}
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
            </div>
            <div>
              {lbl('% Chaves padrão')}
              <input name="percentual_chaves_padrao" type="number" value={form.percentual_chaves_padrao} onChange={handleChange}
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
            </div>
            <div>
              {lbl('Data prevista de entrega')}
              {inp('data_prevista_entrega','date')}
            </div>
            <div style={{gridColumn:'1/-1'}}>
              {lbl('Observações públicas')}
              <textarea name="observacoes_publicas" value={form.observacoes_publicas} onChange={handleChange} rows={3}
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',resize:'vertical'}}
                placeholder="Ex: Até a entrega incide INCC-M. Após a entrega: 1% + IGP-M." />
            </div>
            <div>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'14px',color:'#374151'}}>
                <input type="checkbox" name="ativo_publico" checked={form.ativo_publico} onChange={handleChange}
                  style={{width:'16px',height:'16px',accentColor:'#E8390E'}} />
                Exibir no site público
              </label>
            </div>
          </div>
        </div>

        <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
          <button type="button" onClick={() => router.back()}
            style={{padding:'10px 20px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',background:'white',cursor:'pointer',color:'#374151'}}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            style={{padding:'10px 20px',background:'#E8390E',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
            {loading ? 'Salvando...' : 'Salvar empreendimento'}
          </button>
        </div>
      </form>
    </div>
  )
}
