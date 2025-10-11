import Sidebar from '@/components/ui/Sidebar'
import { Card } from '@/components/ui'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Bonjour [Prénom]</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">Martin Delcourt<br/><span className="text-foreground text-xs">martin.delcourt@email.com</span></div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card title="Nouvelles candidatures">
            <div className="text-4xl font-bold">5</div>
            <button className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary text-foreground rounded-md">Ajouter</button>
          </Card>

          <Card title="Candidatures en cours">
            <div className="text-4xl font-bold">5</div>
          </Card>

          <Card title="Demandes de transfert">
            <div className="text-4xl font-bold">5</div>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Taux d'acceptation sur l'année civile">
              <div className="h-48 bg-neutral-100" />
            </Card>
          </div>

          <div>
            <Card title="Répartition des statuts">
              <div className="h-48 bg-neutral-100" />
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
