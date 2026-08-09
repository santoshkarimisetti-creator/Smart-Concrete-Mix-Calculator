export default function FormSection({ title, children, description }) {
  return (
    <section className="section-card">
      <header className="section-card__header">
        <div>
          <h2>{title}</h2>
          {description ? <p className="section-card__description">{description}</p> : null}
        </div>
      </header>
      <div className="section-grid">{children}</div>
    </section>
  )
}