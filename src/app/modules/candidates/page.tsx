import Sidebar from '@/components/ui/Sidebar'
import { Card } from '@/components/ui'

export default function CandidatesList() {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Candidatures</h1>
          <div>
            <input placeholder="Rechercher" className="px-3 py-2 border rounded-md" />
          </div>
        </header>

        <section>
          <table className="w-full bg-white rounded-md shadow-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3">Nom</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">Candidat {i + 1}</td>
                  <td className="p-3">En attente</td>
                  <td className="p-3">2025-10-09</td>
                  <td className="p-3">Voir</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}
