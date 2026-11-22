import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UnidadesTable } from "./UnidadesTable";

export default async function UnidadesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: emp } = await supabase
    .from("empreendimentos")
    .select("id, nome, slug")
    .eq("id", id)
    .single();

  if (!emp) notFound();

  const { data: unidades } = await supabase
    .from("unidades")
    .select("*")
    .eq("empreendimento_id", id)
    .order("pavimento")
    .order("unidade");

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
        <div>
          <div style={{fontSize:"13px",color:"#6E6E73",marginBottom:"4px"}}>
            <Link href="/admin/empreendimentos" style={{color:"#6E6E73",textDecoration:"none"}}>
              Empreendimentos
            </Link>
            {" → "}{emp.nome}
          </div>
          <h1 style={{fontSize:"1.5rem",fontWeight:"700",color:"#111"}}>Unidades</h1>
          <p style={{fontSize:"0.875rem",color:"#6E6E73",marginTop:"0.25rem"}}>
            {unidades?.length ?? 0} unidades cadastradas
          </p>
        </div>
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
          <Link href={`/empreendimentos/${emp.slug}`} target="_blank"
            style={{padding:"8px 16px",border:"1px solid rgba(0,0,0,.1)",borderRadius:"8px",fontSize:"14px",color:"#3A3A3C",textDecoration:"none",background:"white"}}>
            Ver tabela pública
          </Link>
          <Link href={`/admin/empreendimentos/${id}/reajuste`}
            style={{padding:"8px 16px",border:"1px solid rgba(0,0,0,.1)",borderRadius:"8px",fontSize:"14px",color:"#3A3A3C",textDecoration:"none",background:"white"}}>
            📈 Reajuste
          </Link>
          <Link href={`/admin/empreendimentos/${id}/unidades/importar`}
            style={{padding:"8px 16px",border:"1px solid rgba(0,0,0,.1)",borderRadius:"8px",fontSize:"14px",color:"#3A3A3C",textDecoration:"none",background:"white"}}>
            📂 Importar CSV
          </Link>
          <Link href={`/admin/empreendimentos/${id}/unidades/nova`}
            style={{padding:"8px 16px",background:"#E8390E",color:"white",borderRadius:"8px",fontSize:"14px",fontWeight:"500",textDecoration:"none"}}>
            + Nova unidade
          </Link>
        </div>
      </div>

      {!unidades || unidades.length === 0 ? (
        <div style={{background:"white",borderRadius:"12px",border:"1px solid rgba(0,0,0,.1)",textAlign:"center",padding:"4rem 2rem",color:"#8E8E93"}}>
          <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🏠</div>
          <p style={{fontSize:"1rem",marginBottom:"0.5rem",color:"#3A3A3C",fontWeight:"500"}}>
            Nenhuma unidade cadastrada
          </p>
          <p style={{fontSize:"0.875rem"}}>Clique em "Nova unidade" para começar</p>
        </div>
      ) : (
        <UnidadesTable unidades={unidades as any} empreendimentoId={id} />
      )}
    </div>
  );
}
