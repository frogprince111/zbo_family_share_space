export type ThemeColor = 'pink' | 'purple' | 'blue' | 'yellow' | 'green' | 'orange'

export type FamilyMember = {
  id: string
  name: string
  role: string
  birthday?: string
  avatar?: string
  themeColor: ThemeColor
  createdAt: string
}

export type FamilyProfile = {
  spaceName: string
  address: string
  currentMemberId: string
}

export type HarmonyTip = {
  id: string
  title: string
  description: string
  icon: 'message' | 'utensils' | 'broom' | 'heart'
  theme: 'purple' | 'yellow' | 'blue' | 'pink'
}
