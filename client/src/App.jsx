const roles = [
  {
    name: 'Customer Portal',
    description: 'Browse services, book appointments, and view history.',
  },
  {
    name: 'Staff Dashboard',
    description: 'View assigned appointments and daily schedule.',
  },
  {
    name: 'Cashier Dashboard',
    description: 'Manage queue, walk-ins, and point-of-sale tasks.',
  },
  {
    name: 'Admin Panel',
    description: 'Manage users, services, staff, reports, and settings.',
  },
]

function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-pink-700">
            Phase 1 Foundation
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Salon Management System
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            A professional full-stack system foundation for salon appointments,
            staff schedules, cashier workflows, inventory, and business reports.
          </p>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-2">
          {roles.map((role) => (
            <article
              key={role.name}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-950">{role.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {role.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-auto rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Backend Status
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Express API foundation is available at{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">
              http://localhost:5050/api/health
            </code>
            .
          </p>
        </section>
      </section>
    </main>
  )
}

export default App