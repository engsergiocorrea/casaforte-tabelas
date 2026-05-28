import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{display:'flex', height:'100vh', overflow:'hidden', background:'#F5F3F0'}}>
      <AdminSidebar profile={{nome:'Sergio', email:'sergiofilho@live.com', role:'admin_geral'}} />
      <main style={{flex:1, overflowY:'auto'}}>
        <div style={{maxWidth:'80rem', margin:'0 auto', padding:'2rem 1.5rem'}}>
          {children}
        </div>
      </main>
    </div>
  )
}
