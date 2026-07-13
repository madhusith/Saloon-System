import { Link, Route, Routes } from 'react-router-dom'

const roles = [
  {
    name: 'Customer Portal',
    path: '/customer',
    description: 'Browse services, book appointments, and view history.',
  },
  {
    name: 'Staff Dashboard',
    path: '/staff',
    description: 'View assigned appointments and daily schedule.',
  },
  {
    name: 'Cashier Dashboard',
    path: '/cashier',
    description: 'Manage queue, walk-ins, and point-of-sale tasks.',
  },
  {
    name: 'Admin Panel',
    path: '/admin',
    description: 'Manage users, services, staff, reports, and settings.',
  },
]

function HomePage() {
  return (
    <>
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
          <Link
            key={role.name}
            to={role.path}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-950">{role.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {role.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Backend Status</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Express API foundation is available at{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">
            http://localhost:5050/api/health
          </code>
          .
        </p>
      </section>
    </>
  )
}

function DashboardPlaceholder({ title, description }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-pink-700">
        Phase 1 Placeholder
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Back to Home
      </Link>
    </section>
  )
}

function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/customer"
            element={
              <DashboardPlaceholder
                title="Customer Portal"
                description="Customer appointment booking and profile features will be added in later phases."
              />
            }
          />
          <Route
            path="/staff"
            element={
              <DashboardPlaceholder
                title="Staff Dashboard"
                description="Staff schedule and assigned appointment features will be added in later phases."
              />
            }
          />
          <Route
            path="/cashier"
            element={
              <DashboardPlaceholder
                title="Cashier Dashboard"
                description="Queue, walk-in, and POS workflows will be added in later phases."
              />
            }
          />
          <Route
            path="/admin"
            element={
              <DashboardPlaceholder
                title="Admin Panel"
                description="Admin user, service, staff, reporting, and settings tools will be added in later phases."
              />
            }
          />
        </Routes>
      </div>
    </main>
  )
}

export default App