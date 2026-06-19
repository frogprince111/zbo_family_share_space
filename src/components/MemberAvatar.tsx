import { Pencil } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { FamilyMember } from '../types/member'
import { getInitial, themeColorMap } from '../utils/avatar'

type MemberAvatarProps = {
  member: FamilyMember
  editable?: boolean
  isOnline?: boolean
  size?: 'sm' | 'md' | 'lg'
  statusPosition?: 'left' | 'right'
  showStatusDot?: boolean
  onEdit?: () => void
}

export function MemberAvatar({
  member,
  editable = false,
  isOnline = true,
  size = 'lg',
  statusPosition = 'left',
  showStatusDot = true,
  onEdit,
}: MemberAvatarProps) {
  const colors = themeColorMap[member.themeColor]
  const shellSize =
    size === 'lg' ? 'h-[112px] w-[112px] sm:h-[136px] sm:w-[136px]' : size === 'md' ? 'h-[66px] w-[66px]' : 'h-11 w-11'
  const avatarSize = size === 'lg' ? 'h-24 w-24 sm:h-32 sm:w-32' : size === 'md' ? 'h-14 w-14' : 'h-9 w-9'
  const statusDotSize = size === 'lg' ? 'h-5 w-5 sm:h-6 sm:w-6' : size === 'md' ? 'h-4 w-4' : 'h-3 w-3'
  const editButtonSize = size === 'lg' ? 'h-9 w-9' : 'h-8 w-8'
  const ringPadding = size === 'sm' ? 'p-0.5' : 'p-1'
  const textSize = size === 'sm' ? 'text-base' : 'text-3xl'
  const avatarStyle = {
    background: isOnline ? colors.bg : '#F1F2F5',
    color: isOnline ? colors.text : '#8A909C',
  } as CSSProperties
  const shellStyle = {
    background: isOnline ? colors.ring : '#D8DCE5',
  } as CSSProperties

  return (
    <div className={`relative inline-flex ${shellSize} items-center justify-center`}>
      <div className={`flex h-full w-full items-center justify-center rounded-full ${ringPadding} shadow-sm`} style={shellStyle}>
        <div
          className={`${avatarSize} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ${textSize} font-bold transition duration-300 ${
            isOnline ? '' : 'grayscale'
          }`}
          style={avatarStyle}
        >
          {member.avatar ? (
            <img src={member.avatar} alt={`${member.name}头像`} className={`h-full w-full object-cover ${isOnline ? '' : 'opacity-55'}`} />
          ) : (
            <span>{getInitial(member.name)}</span>
          )}
        </div>
      </div>
      {showStatusDot && (
        <span
          className={`absolute bottom-3 rounded-full border-2 border-white shadow-sm ${statusDotSize} ${
            statusPosition === 'right' ? 'right-3' : 'left-3'
          } ${
            isOnline ? 'bg-emerald-400' : 'bg-slate-300'
          }`}
          aria-label={isOnline ? `${member.name}在线` : `${member.name}离线`}
          title={isOnline ? '在线' : '离线'}
        />
      )}
      {editable && (
        <button
          type="button"
          aria-label={`编辑${member.name}`}
          className={`absolute bottom-2 right-2 flex ${editButtonSize} cursor-pointer items-center justify-center rounded-full border border-family-border bg-white text-family-muted shadow-sm hover:text-family-primary active:scale-95`}
          onClick={onEdit}
        >
          <Pencil size={17} />
        </button>
      )}
    </div>
  )
}
