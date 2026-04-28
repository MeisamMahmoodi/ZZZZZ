import { getInitials, getAvatarColor } from '../../lib/utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  id: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ firstName, lastName, id, size = 'md' }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const color = getAvatarColor(id);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
