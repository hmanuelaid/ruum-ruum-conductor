import Link from 'next/link'

export default function SinAccesoPage() {
  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <div className="brand-mark">R</div>
        <h1 className="onboarding-title">Acceso restringido</h1>
        <p className="onboarding-sub">
          Tu cuenta no tiene permisos para abrir esta seccion.
        </p>
        <Link className="btn-primary" href="/login" style={{ textDecoration: 'none' }}>
          Iniciar sesion con otra cuenta
        </Link>
        <Link className="btn-ghost" href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
