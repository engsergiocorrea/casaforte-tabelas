'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const ROLE_LABELS: Record<string, string> = {
  admin_geral: 'Admin Geral',
  admin_comercial: 'Admin Comercial',
  financeiro: 'Financeiro',
  visualizador: 'Visualizador',
}

const ROLE_COLORS: Record<string, {bg:string,color:string}> = {
  admin_geral: {bg:'#fdeee9',color:'#E8390E'},
  admin_comercial: {bg:'#dbeafe',color:'#1e40af'},
  financeiro: {bg:'#dcfce7',color:'#15803d'},
  visualizador: {bg:'#f3f4f6',color:'#6b7280'},
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'visualizador', telefone: '' })

  async function loadUsuarios() {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').order('nome')
    setUsuarios(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadUsuarios() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Criar usuário via SQL direto
      const supabase = createClient()
      
      // Usar signUp para criar o usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: { data: { nome: form.nome } }
      })

      if (authError) throw new Error(authError.message)

      // Atualizar o perfil com role e telefone
      if (authData.user) {
        await supabase.from('profiles').upsert({
          user_id: authData.user.id,
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          role: form.role,
          ativo: true,
        })
      }

      setSuccess(`Usuário ${form.nome} criado com sucesso!`)
      setForm({ nome: '', email: '', senha: '', role: 'visualizador', telefone: '' })
      setShowForm(false)
      loadUsuarios()
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const supabase = createClient()
    await supabase.from('profiles').update({ ativo: !ativo }).eq('id', id)
    loadUsuarios()
  }

  async function updateRole(id: string, role: string) {
    const supabase = createClient()
    await supabase.from('profiles').update({ role }).eq('id', id)
    loadUsuarios()
  }

  const S = { label: { display:'block', fontSize:'13px', fontWeight:'500', color:'#374151', marginBottom:'4px' } as React.CSSProperties }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <div>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Usuários</h1>
          <p style={{fontSize:'0.875rem',color:'#6b7280',marginTop:'0.25rem'}}>{usuarios.length} usuários cadastrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{padding:'8px 16px',background:'#E8390E',color:'white',borderRadius:'8px',fontSize:'14px',fontWeight:'500',border:'none',cursor:'pointer'}}>
          {showForm ? 'Cancelar' : '+ Novo usuário'}
        </button>
      </div>

      {success && <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'12px',marginBottom:'16px',color:'#15803d',fontSize:'14px'}}>{success}</div>}
      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px',marginBottom:'16px',color:'#b91c1c',fontSize:'14px'}}>{error}</div>}

      {showForm && (
        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'16px'}}>Novo usuário</h2>
          <form onSubmit={handleSubmit}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>
              <div>
                <label style={S.label}>Nome *</label>
                <input value={form.nome} onChange={e => setForm(f => ({...f,nome:e.target.value}))} required
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
              </div>
              <div>
                <label style={S.label}>E-mail *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} required
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
              </div>
              <div>
                <label style={S.label}>Senha *</label>
                <input type="password" value={form.senha} onChange={e => setForm(f => ({...f,senha:e.target.value}))} required minLength={6}
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
              </div>
              <div>
                <label style={S.label}>Telefone</label>
                <input value={form.telefone} onChange={e => setForm(f => ({...f,telefone:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
              </div>
              <div>
                <label style={S.label}>Perfil de acesso *</label>
                <select value={form.role} onChange={e => setForm(f => ({...f,role:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',background:'white'}}>
                  <option value="visualizador">Visualizador — só visualiza</option>
                  <option value="financeiro">Financeiro — vê relatórios</option>
                  <option value="admin_comercial">Admin Comercial — cadastra e edita</option>
                  <option value="admin_geral">Admin Geral — acesso total</option>
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{padding:'8px 20px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',background:'white',cursor:'pointer'}}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                style={{padding:'8px 20px',background:'#E8390E',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',cursor:'pointer'}}>
                {saving ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',overflow:'hidden'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'2rem',color:'#6b7280'}}>Carregando...</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
            <thead>
              <tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
                {['Nome','E-mail','Telefone','Perfil','Status','Ações'].map(h => (
                  <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS.visualizador
                return (
                  <tr key={u.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                    <td style={{padding:'12px 16px',fontWeight:'500',color:'#111'}}>{u.nome}</td>
                    <td style={{padding:'12px 16px',color:'#6b7280'}}>{u.email}</td>
                    <td style={{padding:'12px 16px',color:'#6b7280'}}>{u.telefone ?? '—'}</td>
                    <td style={{padding:'12px 16px'}}>
                      <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}
                        style={{padding:'3px 8px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',background:rc.bg,color:rc.color,fontWeight:'600',outline:'none',cursor:'pointer'}}>
                        <option value="visualizador">Visualizador</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="admin_comercial">Admin Comercial</option>
                        <option value="admin_geral">Admin Geral</option>
                      </select>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:u.ativo?'#dcfce7':'#f3f4f6',color:u.ativo?'#15803d':'#6b7280'}}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <button onClick={() => toggleAtivo(u.id, u.ativo)}
                        style={{padding:'3px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',color:u.ativo?'#b91c1c':'#15803d',background:'white',cursor:'pointer'}}>
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
