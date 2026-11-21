'use client'
import { useState, type InputHTMLAttributes } from 'react'

export function CampoSenha({ rotulo = 'Senha', ...input }: { rotulo?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [ver, setVer] = useState(false)
  return (
    <label className="cfl-campo">
      <span>{rotulo}</span>
      <div className="cfl-senha">
        <input className="cfl-in" type={ver ? 'text' : 'password'} autoComplete="current-password" {...input} />
        <button type="button" className="cfl-ver" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}>
          {ver ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </label>
  )
}

// Formulários com onSubmit: o estado vem da prop carregando.
export function BotaoEntrar({ carregando, texto = 'Entrar', textoCarregando = 'Entrando…' }: { carregando?: boolean; texto?: string; textoCarregando?: string }) {
  const ocupado = Boolean(carregando)
  return (
    <button className="cfl-btn" type="submit" disabled={ocupado}>
      {ocupado ? textoCarregando : texto}
    </button>
  )
}
