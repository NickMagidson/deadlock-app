interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section aria-label={title} className="empty-state" role="status">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  )
}
