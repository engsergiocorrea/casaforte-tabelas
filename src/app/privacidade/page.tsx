import Link from 'next/link'

export const metadata = { title: 'Política de Privacidade' }

// Minuta técnica — o texto legal deve ser revisado por advogado(a) de proteção
// de dados antes de ser considerado definitivo. Contato do encarregado e a
// razão social/CNPJ estão como placeholders para preenchimento.
const ENCARREGADO_EMAIL = 'privacidade@casaforteinc.com.br'
const ATUALIZADO = '19/07/2026'

const wrap: React.CSSProperties = { maxWidth: 780, margin: '0 auto', padding: '0 20px' }

function H({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '28px 0 8px' }}>{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.65, margin: '0 0 10px' }}>{children}</p>
}
function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, marginBottom: 6 }}>{children}</li>
}

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0' }}>
      <header style={{ background: '#1E1E1E', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png" alt="Casa Forte" style={{ height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Casa Forte</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Política de Privacidade</div>
        </div>
      </header>

      <main style={{ padding: '32px 0 64px' }}>
        <div style={wrap}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Política de Privacidade</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 20px' }}>Atualizada em {ATUALIZADO}</p>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#92400e', marginBottom: 8 }}>
            ⚠️ Minuta em revisão jurídica. Os termos abaixo descrevem como tratamos os dados hoje e serão consolidados com nossa assessoria jurídica.
          </div>

          <P>
            A Casa Forte Construtora e Incorporadora ("Casa Forte", "nós") respeita a sua privacidade e trata dados
            pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Esta política
            explica quais dados coletamos, para quê, com quem compartilhamos e como você pode exercer seus direitos.
          </P>

          <H>1. Quais dados coletamos</H>
          <P>Conforme a sua interação com nossos sistemas, podemos tratar:</P>
          <ul>
            <Li><b>Identificação do corretor/imobiliária:</b> nome, CRECI e o endereço IP e data/hora do acesso às tabelas.</Li>
            <Li><b>Dados do comprador (e cônjuge/segundo comprador), na proposta:</b> nome, CPF, RG, data de nascimento, estado civil, profissão, e-mail e telefone.</Li>
            <Li><b>Documentos enviados:</b> RG/CNH, CPF, comprovante de residência e certidão de casamento, quando anexados para agilizar o preenchimento.</Li>
            <Li><b>Dados de navegação:</b> cookies e armazenamento local necessários ao funcionamento do site.</Li>
          </ul>

          <H>2. Para que usamos e com que base legal</H>
          <ul>
            <Li><b>Elaborar e dar andamento à proposta e ao contrato</b> — base: execução de contrato e procedimentos preliminares (art. 7º, V, da LGPD).</Li>
            <Li><b>Leitura automática dos documentos por inteligência artificial</b> para pré-preencher a proposta — mediante autorização do titular; os documentos são também armazenados de forma privada para instruir o negócio.</Li>
            <Li><b>Registro de acessos de corretores</b> (nome, CRECI, IP, data/hora) para acompanhamento comercial e segurança — base: legítimo interesse (art. 7º, IX).</Li>
            <Li><b>Cumprimento de obrigações legais e regulatórias</b> — base: art. 7º, II.</Li>
          </ul>

          <H>3. Com quem compartilhamos</H>
          <P>
            Utilizamos prestadores de serviço (operadores) que tratam dados em nosso nome, sob contrato e apenas para as
            finalidades acima — por exemplo: provedor de hospedagem e banco de dados, serviço de leitura de documentos por
            IA, plataforma de assinatura eletrônica e serviço de mensageria. Alguns desses prestadores podem processar
            dados fora do Brasil; nesses casos adotamos as salvaguardas exigidas pela LGPD (cláusulas-padrão contratuais e
            demais mecanismos do art. 33).
          </P>

          <H>4. Por quanto tempo guardamos</H>
          <P>
            Mantemos os dados pelo tempo necessário às finalidades informadas e ao cumprimento de obrigações legais. Após
            esse período, os dados são eliminados ou anonimizados. Documentos enviados que não resultem em negócio podem
            ser descartados.
          </P>

          <H>5. Seus direitos</H>
          <P>Você pode, a qualquer tempo, solicitar: confirmação e acesso aos seus dados, correção, anonimização ou eliminação, portabilidade, informação sobre compartilhamentos e revogação de consentimento (art. 18 da LGPD).</P>
          <P>Responderemos às solicitações no prazo legal de 15 dias.</P>

          <H>6. Como exercer seus direitos / falar com o encarregado</H>
          <P>
            Entre em contato com nosso Encarregado pela Proteção de Dados pelo e-mail{' '}
            <a href={`mailto:${ENCARREGADO_EMAIL}`} style={{ color: '#E8390E', fontWeight: 600 }}>{ENCARREGADO_EMAIL}</a>.
          </P>

          <H>7. Cookies</H>
          <P>
            Usamos cookies e armazenamento local estritamente necessários para lembrar a sua identificação de corretor
            durante a navegação e para o funcionamento do site. Você pode limpá-los nas configurações do seu navegador.
          </P>

          <H>8. Segurança</H>
          <P>
            Adotamos medidas técnicas e administrativas para proteger os dados, como acesso restrito por login,
            armazenamento privado de documentos e transmissão criptografada (HTTPS).
          </P>

          <p style={{ marginTop: 28 }}>
            <Link href="/" style={{ color: '#6b7280', fontSize: 14, textDecoration: 'none' }}>← Voltar</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
