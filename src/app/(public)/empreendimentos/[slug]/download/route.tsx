import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 10,
  },
  title: { fontSize: 20, color: "#1e3a5f" },
  subtitle: { fontSize: 10, color: "#666", marginTop: 4 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e3a5f",
    paddingVertical: 6,
  },
  cell: { fontSize: 8, flex: 1, paddingHorizontal: 4, color: "#374151" },
  cellBold: { fontSize: 8, flex: 1, paddingHorizontal: 4, color: "#111827" },
  cellHeader: { fontSize: 7, flex: 1, paddingHorizontal: 4, color: "#64748b" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Unidade = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Empreendimento = any;

const PDFDoc = ({
  empreendimento,
  unidades,
}: {
  empreendimento: Empreendimento;
  unidades: Unidade[];
}) => (
  <Document title={`Tabela - ${empreendimento.nome}`}>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{empreendimento.nome}</Text>
        <Text style={styles.subtitle}>
          {empreendimento.cidade}, {empreendimento.estado} ·{" "}
          {new Date().toLocaleDateString("pt-BR")}
        </Text>
      </View>
      <View>
        <View style={styles.tableHeader}>
          <Text style={styles.cellHeader}>Unidade</Text>
          <Text style={styles.cellHeader}>Pavimento</Text>
          <Text style={styles.cellHeader}>Área</Text>
          <Text style={styles.cellHeader}>Quartos</Text>
          <Text style={styles.cellHeader}>Valor</Text>
          <Text style={styles.cellHeader}>Entrada</Text>
          <Text style={styles.cellHeader}>Parcelas</Text>
          <Text style={styles.cellHeader}>Status</Text>
        </View>
        {unidades
          .filter(
            (u) => u.status !== "bloqueada" && u.status !== "indisponivel",
          )
          .map((u) => (
            <View key={u.id} style={styles.tableRow}>
              <Text style={styles.cellBold}>{u.unidade ?? ""}</Text>
              <Text style={styles.cell}>{u.pavimento ?? ""}</Text>
              <Text style={styles.cell}>
                {u.area_total ? `${u.area_total}m²` : ""}
              </Text>
              <Text style={styles.cell}>{u.quartos ?? ""}</Text>
              <Text style={styles.cellBold}>
                {u.valor_imovel
                  ? `R$ ${Number(u.valor_imovel).toLocaleString("pt-BR")}`
                  : ""}
              </Text>
              <Text style={styles.cell}>
                {u.valor_sinal
                  ? `R$ ${Number(u.valor_sinal).toLocaleString("pt-BR")}`
                  : ""}
              </Text>
              <Text style={styles.cell}>
                {u.quantidade_parcelas && u.valor_parcela
                  ? `${u.quantidade_parcelas}x R$ ${Number(u.valor_parcela).toLocaleString("pt-BR")}`
                  : ""}
              </Text>
              <Text style={styles.cell}>{u.status ?? ""}</Text>
            </View>
          ))}
      </View>
      <Text style={styles.footer}>
        Os valores podem sofrer alteração sem aviso prévio. Casa Forte
        Construtora e Incorporadora.
      </Text>
    </Page>
  </Document>
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: empreendimento } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("slug", slug)
    .eq("ativo_publico", true)
    .single();
  if (!empreendimento)
    return new NextResponse("Não encontrado", { status: 404 });
  const { data: unidades } = await supabase
    .from("unidades")
    .select("*")
    .eq("empreendimento_id", empreendimento.id)
    .order("pavimento")
    .order("unidade");
  try {
    const buffer = await renderToBuffer(
      <PDFDoc empreendimento={empreendimento} unidades={unidades ?? []} />,
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tabela-${slug}.pdf"`,
      },
    });
  } catch (error) {
    return new NextResponse("Erro ao gerar PDF", { status: 500 });
  }
}
