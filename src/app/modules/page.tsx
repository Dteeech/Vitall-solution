import Sidebar from '@/components/ui/Sidebar'
import { Card } from '@/components/ui'

export default function RecruiterHome() {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mes modules</h1>
          <div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md">+ Ajouter un module</button>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-lg shadow-sm flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-secondary rounded-full" />
              <div className="text-sm font-medium">[Nom module]</div>
              <button className="mt-2 px-3 py-1 border border-primary text-primary rounded-md">Ouvrir</button>
            </div>
          ))}
        </section>

        <footer className="mt-8">
          <div className="flex items-center justify-between">
            <div>Résultat par page</div>
            <div>Pagination</div>
          </div>
        </footer>
      </main>
    </div>
  )
}
