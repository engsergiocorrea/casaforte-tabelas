// Splash de abertura e loading.tsx das rotas: usa a tela de carregamento padrão
// do ecossistema Casa Forte (components/cf-carregando).
import type { CSSProperties } from 'react'
import { TelaCarregando } from './cf-carregando/tela'

export function SplashScreen({ style }: { style?: CSSProperties }) {
  return <TelaCarregando style={style} />
}
