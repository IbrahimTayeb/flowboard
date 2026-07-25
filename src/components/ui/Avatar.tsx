interface AvatarProps {
  name: string
  color?: string
  size?: number
  ring?: boolean
}

export function Avatar({ name, color = '#6e4bfa', size = 24, ring = true }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${ring ? 'ring-2 ring-(--color-surface)' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: color }}
      title={name}
    >
      {initials || '?'}
    </div>
  )
}

export function AvatarStack({ people, size = 22 }: { people: { id: string; name: string; color: string }[]; size?: number }) {
  const shown = people.slice(0, 3)
  const overflow = people.length - shown.length

  if (!people.length) return null

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} color={p.color} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className="flex shrink-0 items-center justify-center rounded-full bg-(--color-surface-sunken) font-semibold text-(--color-ink-muted) ring-2 ring-(--color-surface)"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
