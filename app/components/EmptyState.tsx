import { icons } from 'lucide-react'
import React, { FC } from 'react'

interface EmptyStateProps {
  IconComponent: keyof typeof icons
  message: string
  sm?: boolean
}

const EmptyState: FC<EmptyStateProps> = ({ IconComponent, message, sm = false }) => {
  const SelectedIcon = icons[IconComponent]

  if (!SelectedIcon) {
    // Retourne null si l'icône n'existe pas pour éviter une erreur runtime
    return null
  }

  return (
    <div className={`${sm ? 'my-4' : 'my-40'} w-full h-full flex justify-center items-center flex-col`}>
      {/* Remplace 'wiggle-animation' par 'animate-wiggle' si tu as une animation Tailwind définie */}
      <div className='animate-wiggle'>
        <SelectedIcon
          strokeWidth={1}
          className={`${sm ? 'w-20 h-20' : 'w-40 h-40'} text-accent`}
          aria-hidden="true"
          focusable="false"
        />
      </div>
      <p className='text-sm mt-4 text-center'>{message}</p>
    </div>
  )
}

export default EmptyState
