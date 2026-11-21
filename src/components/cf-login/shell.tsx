// Tela de login padrão Casa Forte — mesma em todos os sistemas internos
// (Portal, Compras, Contratos, Obras, Tabelas, Financeiro).
// Vidro escuro, aura laranja/azul, logo claro, campos com 16px (sem zoom no
// iPhone), foco visível e movimento reduzido. Não depende de Tailwind.
import type { InputHTMLAttributes, ReactNode } from 'react'

const CSS = `
.cfl{position:relative;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;background:#0E1014;color:#F4F6FB;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden;-webkit-font-smoothing:antialiased}
.cfl *,.cfl *::before,.cfl *::after{box-sizing:border-box}
.cfl-aura{position:absolute;inset:0;pointer-events:none;background:radial-gradient(45% 55% at 20% 15%,rgba(255,107,61,.28),transparent 70%),radial-gradient(40% 50% at 85% 85%,rgba(59,107,255,.22),transparent 70%),radial-gradient(30% 40% at 70% 20%,rgba(45,212,255,.12),transparent 70%)}
.cfl-card{position:relative;width:100%;max-width:400px;padding:32px 28px;border-radius:28px;background:linear-gradient(180deg,rgba(28,31,44,.82),rgba(14,16,24,.9));border:1px solid rgba(255,255,255,.12);box-shadow:0 1px 0 rgba(255,255,255,.12) inset,0 40px 120px -20px rgba(0,0,0,.65);backdrop-filter:blur(30px) saturate(170%);-webkit-backdrop-filter:blur(30px) saturate(170%);animation:cflEntra .5s cubic-bezier(.32,.72,0,1) both}
@keyframes cflEntra{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
.cfl-logo{display:block;width:120px;height:auto;margin:0 auto 18px}
.cfl .cfl-tit{margin:0;text-align:center;font-size:1.6rem;line-height:1.2;font-weight:700;letter-spacing:-.025em;color:#fff}
.cfl .cfl-sub{margin:6px 0 24px;text-align:center;font-size:.9rem;line-height:1.4;color:rgba(235,240,255,.6)}
.cfl .cfl-texto{margin:0 0 16px;font-size:.9rem;line-height:1.45;color:rgba(235,240,255,.72)}
.cfl-campo{display:block;margin-bottom:14px}
.cfl-campo>span{display:block;font-size:.8rem;font-weight:600;color:rgba(235,240,255,.7);margin-bottom:6px}
.cfl .cfl-in,.cfl .cfl-senha{display:block;width:100%;font:inherit;font-size:16px;color:#fff;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px 14px;outline:none;transition:border-color .15s,box-shadow .15s}
.cfl .cfl-in::placeholder{color:rgba(235,240,255,.35)}
.cfl .cfl-in:focus,.cfl .cfl-senha:focus-within{border-color:rgba(255,107,61,.7);box-shadow:0 0 0 4px rgba(255,107,61,.18)}
.cfl .cfl-senha{display:flex;align-items:center;padding:0 6px 0 0}
.cfl .cfl-senha .cfl-in{border:0;background:transparent;box-shadow:none;flex:1;min-width:0}
.cfl .cfl-ver{flex-shrink:0;border:0;background:rgba(255,255,255,.08);color:rgba(235,240,255,.8);font:inherit;font-size:.78rem;font-weight:600;border-radius:10px;padding:6px 10px;cursor:pointer}
.cfl .cfl-erro{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:rgba(255,99,71,.12);border:1px solid rgba(255,99,71,.3);color:#FFC2B4;font-size:.88rem}
.cfl .cfl-ok{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:rgba(52,199,89,.12);border:1px solid rgba(52,199,89,.3);color:#B6F2C6;font-size:.88rem}
.cfl .cfl-btn{display:block;width:100%;min-height:50px;border:0;border-radius:14px;font:inherit;font-size:1rem;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(135deg,#FF6B3D,#E8390E);box-shadow:0 10px 28px -10px rgba(232,57,14,.8);transition:transform .1s,opacity .2s}
.cfl .cfl-btn:active:not(:disabled){transform:scale(.97)}
.cfl .cfl-btn:disabled{opacity:.5;cursor:default}
.cfl .cfl-btn2{display:block;width:100%;min-height:46px;margin-top:10px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:transparent;font:inherit;font-size:.92rem;font-weight:600;color:rgba(235,240,255,.85);cursor:pointer}
.cfl .cfl-link{display:inline-block;border:0;background:none;padding:4px 0;font:inherit;font-size:.85rem;font-weight:600;color:#FF8A63;cursor:pointer;text-decoration:none}
.cfl .cfl-link:hover{text-decoration:underline}
.cfl-acoes{display:flex;justify-content:flex-end;margin:-4px 0 16px}
.cfl .cfl-rodape{margin:18px 0 0;text-align:center;font-size:.75rem;color:rgba(235,240,255,.45)}
.cfl-extra{margin-top:14px;text-align:center}
.cfl .cfl-copy{position:relative;margin-top:22px;font-size:.72rem;color:rgba(235,240,255,.35);text-align:center}
@media(max-width:380px){.cfl-card{padding:26px 18px}}
@media(prefers-reduced-motion:reduce){.cfl-card{animation:none}}
`

export function LoginShell({ sistema, descricao, children, extra }: { sistema: string; descricao: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="cfl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cfl-aura" aria-hidden="true" />
      <main className="cfl-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cfl-logo" src="/marca/logo-claro.png" alt="Casa Forte Construtora" width={600} height={421} />
        <h1 className="cfl-tit">{sistema}</h1>
        <p className="cfl-sub">{descricao}</p>
        {children}
        {extra ? <div className="cfl-extra">{extra}</div> : null}
        <p className="cfl-rodape">Sistema interno de uso restrito · acessos são registrados.</p>
      </main>
      <footer className="cfl-copy">© {new Date().getFullYear()} Construções e Empreendimentos Casa Forte Ltda.</footer>
    </div>
  )
}

export function Campo({ rotulo, ...input }: { rotulo: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="cfl-campo">
      <span>{rotulo}</span>
      <input className="cfl-in" {...input} />
    </label>
  )
}

export function Erro({ children }: { children: ReactNode }) {
  return children ? <p className="cfl-erro" role="alert">{children}</p> : null
}
