import {
  Apple,
  CarFront,
  Coffee,
  Cookie,
  CupSoda,
  Droplets,
  Dumbbell,
  PersonStanding,
  Sparkles,
  Toilet,
  Utensils,
} from 'lucide-react'
import type { ActivityIcon as ActivityIconName, ActivityTone } from '../domain/models'

const iconMap = {
  water: Droplets,
  toilet: Toilet,
  soda: CupSoda,
  coffee: Coffee,
  meal: Utensils,
  snack: Cookie,
  fruit: Apple,
  exercise: Dumbbell,
  walk: PersonStanding,
  drive: CarFront,
  custom: Sparkles,
}

interface ActivityIconProps {
  icon: ActivityIconName
  tone?: ActivityTone
  size?: number
  className?: string
}

export function ActivityIcon({
  icon,
  tone = 'neutral',
  size = 22,
  className = '',
}: ActivityIconProps) {
  const Icon = iconMap[icon] ?? Sparkles
  return (
    <span className={`activity-icon tone-${tone} ${className}`} aria-hidden="true">
      <Icon size={size} strokeWidth={2} />
    </span>
  )
}
