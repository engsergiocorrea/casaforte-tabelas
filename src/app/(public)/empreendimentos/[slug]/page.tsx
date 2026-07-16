// src/app/(public)/empreendimentos/[slug]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TabelaPublica } from "@/components/public/TabelaPublica";
import { formatDate } from "@/lib/utils";
import { INDICE_LABELS, EMPREENDIMENTO_STATUS_LABELS } from "@/types";

export const revalidate = 30;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("empreendimentos")
    .select("nome, descricao_curta, cidade, estado")
    .eq("slug", slug)
    .eq("ativo_publico", true)
    .single();

  if (!data) return { title: "Empreendimento não encontrado" };

  return {
    title: `${data.nome} | Casa Forte Tabelas de Vendas`,
    description:
      data.descricao_curta ??
      `Tabela de vendas de ${data.nome} em ${data.cidade}, ${data.estado}`,
  };
}

export default async function EmpreendimentoPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: empreendimento } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("slug", slug)
    .eq("ativo_publico", true)
    .single();

  if (!empreendimento) notFound();

  const { data: unidades } = await supabase
    .from("unidades")
    .select("*")
    .eq("empreendimento_id", empreendimento.id)
    .order("pavimento", { ascending: true })
    .order("unidade", { ascending: true });

  const { data: configuracao } = await supabase
    .from("configuracoes_tabela")
    .select("*")
    .eq("empreendimento_id", empreendimento.id)
    .single();

  return (
    <div style={{minHeight:'100vh',background:'#F5F3F0'}}>
      {/* Header */}
      <header style={{background:'white',borderBottom:'1px solid #e5e7eb',position:'sticky',top:0,zIndex:40,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <div style={{maxWidth:'80rem',margin:'0 auto',padding:'0 1.5rem'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:'56px'}}>
            <Link href="/" style={{display:'flex',alignItems:'center',gap:'8px',textDecoration:'none'}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.png" alt="Casa Forte" style={{width:'28px',height:'28px',objectFit:'contain'}} />
              <span style={{fontSize:'14px',color:'#6b7280'}}>← Todos os empreendimentos</span>
            </Link>
<a href={`/empreendimentos/${slug}/download`} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 16px',background:'#1e293b',color:'white',fontSize:'14px',fontWeight:'500',borderRadius:'8px',textDecoration:'none'}}>              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1v9m0 0l-3-3m3 3l3-3M1 11v1a2 2 0 002 2h9a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Baixar PDF
            </a>
          </div>
        </div>
      </header>

      <main style={{maxWidth:'80rem',margin:'0 auto',padding:'24px 1.5rem'}}>
        {/* Hero do empreendimento */}
        <div style={{background:'white',borderRadius:'16px',border:'1px solid #e5e7eb',overflow:'hidden',marginBottom:'24px'}}>

          {/* Imagem de capa */}
          {empreendimento.imagem_capa_url && (
            <div style={{height:'420px',position:'relative'}}>
              <Image
                src={empreendimento.imagem_capa_url}
                alt={empreendimento.nome}
                fill
                style={{objectFit:'cover',objectPosition:'center'}}
                priority
              />
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)'}} />
              <div style={{position:'absolute',bottom:'16px',left:'24px',right:'24px'}}>
                {empreendimento.logo_url && (
                  <Image
                    src={empreendimento.logo_url}
                    alt={`Logo ${empreendimento.nome}`}
                    width={120}
                    height={40}
                    style={{objectFit:'contain',marginBottom:'8px'}}
                  />
                )}
              </div>
            </div>
          )}

          {/* Info do empreendimento */}
          <div style={{padding:'24px'}}>
            <div style={{display:'flex',flexWrap:'wrap',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',marginBottom:'16px'}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
                  <span style={{fontSize:'11px',fontWeight:'600',padding:'2px 8px',borderRadius:'9999px',background:'#dbeafe',color:'#1d4ed8'}}>
                    {EMPREENDIMENTO_STATUS_LABELS[empreendimento.status as keyof typeof EMPREENDIMENTO_STATUS_LABELS]}
                  </span>
                  <span style={{fontSize:'12px',color:'#9ca3af',textTransform:'capitalize'}}>
                    {empreendimento.tipo}
                  </span>
                </div>
                <h1 style={{fontSize:'28px',fontWeight:'700',color:'#111827',margin:0}}>
                  {empreendimento.nome}
                </h1>
                <p style={{color:'#6b7280',marginTop:'4px',margin:'4px 0 0'}}>
                  {[empreendimento.localizacao, empreendimento.cidade, empreendimento.estado]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              {empreendimento.data_prevista_entrega && (
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'12px',color:'#9ca3af'}}>Previsão de entrega</div>
                  <div style={{fontWeight:'600',color:'#374151'}}>
                    {formatDate(empreendimento.data_prevista_entrega)}
                  </div>
                </div>
              )}
            </div>

            {empreendimento.descricao_curta && (
              <p style={{color:'#4b5563',fontSize:'14px',marginBottom:'16px'}}>
                {empreendimento.descricao_curta}
              </p>
            )}

            {/* Condições comerciais */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',padding:'16px',background:'#f8fafc',borderRadius:'12px'}}>
              <div>
                <div style={{fontSize:'12px',color:'#9ca3af',marginBottom:'2px'}}>Correção até a entrega</div>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#374151'}}>
                  {INDICE_LABELS[empreendimento.indice_ate_entrega as keyof typeof INDICE_LABELS]}
                </div>
              </div>
              <div>
                <div style={{fontSize:'12px',color:'#9ca3af',marginBottom:'2px'}}>Correção após entrega</div>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#374151'}}>
                  {INDICE_LABELS[empreendimento.indice_apos_entrega as keyof typeof INDICE_LABELS]}
                </div>
              </div>
              {empreendimento.parcelas_padrao > 0 && (
                <div>
                  <div style={{fontSize:'12px',color:'#9ca3af',marginBottom:'2px'}}>Parcelamento padrão</div>
                  <div style={{fontSize:'14px',fontWeight:'600',color:'#374151'}}>
                    Até {empreendimento.parcelas_padrao}x mensais
                  </div>
                </div>
              )}
            </div>

            {empreendimento.observacoes_publicas && (
              <div style={{marginTop:'16px',padding:'12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'8px'}}>
                <p style={{fontSize:'14px',color:'#92400e',margin:0}}>
                  <span style={{fontWeight:'600'}}>Observações: </span>
                  {empreendimento.observacoes_publicas}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabela de vendas */}
        <TabelaPublica
          empreendimento={empreendimento}
          unidades={unidades ?? []}
          configuracao={configuracao}
        />

        {/* Aviso legal */}
        <div style={{marginTop:'24px',padding:'16px',background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',textAlign:'center'}}>
          <p style={{fontSize:'12px',color:'#9ca3af',margin:0}}>
            ⚠️ Os valores e condições apresentados são de referência e podem
            sofrer alteração sem aviso prévio. • Última atualização:{" "}
            {formatDate(empreendimento.updated_at)} • Casa Forte Construtora e
            Incorporadora
          </p>
        </div>
      </main>
    </div>
  );
}
