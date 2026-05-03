import { getInitials, getAvatarColor } from '../../lib/utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  id: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-12 h-12 text-sm',
};

export function Avatar({ firstName, lastName, id, size = 'md' }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const color = getAvatarColor(id);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ring-2 ring-white/20`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
