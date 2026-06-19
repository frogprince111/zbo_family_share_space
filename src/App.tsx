import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { BottomNavigation } from './components/BottomNavigation'
import { ErrorBoundary } from './components/ErrorBoundary'
import { defaultMembers } from './data/defaultMembers'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useMemberPresence } from './hooks/useMemberPresence'
import AlbumPage from './pages/AlbumPage'
import FinancePage from './pages/FinancePage'
import ChatPage from './pages/ChatPage'
import HomePage from './pages/HomePage'
import MembersPage from './pages/MembersPage'
import SchedulePage from './pages/SchedulePage'
import SettingsPage from './pages/SettingsPage'
import TodoPage from './pages/TodoPage'
import type { FamilyMember, FamilyProfile } from './types/member'

const defaultFamilyProfile: FamilyProfile = {
  spaceName: '家庭共享空间',
  address: '上海市浦东新区幸福路 18 号',
  currentMemberId: 'me',
}

export default function App() {
  const [members, setMembers] = useLocalStorage<FamilyMember[]>('family-members', defaultMembers)
  const [familyProfile, setFamilyProfile] = useLocalStorage<FamilyProfile>('family-profile', defaultFamilyProfile)
  const normalizedFamilyProfile = { ...defaultFamilyProfile, ...familyProfile }
  const memberPresence = useMemberPresence(members, normalizedFamilyProfile.currentMemberId)

  useEffect(() => {
    if (members.length === 0) return
    if (members.some((member) => member.id === normalizedFamilyProfile.currentMemberId)) return
    setFamilyProfile((current) => ({ ...current, currentMemberId: members[0].id }))
  }, [members, normalizedFamilyProfile.currentMemberId, setFamilyProfile])

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route
          path="/home"
          element={<HomePage members={members} setMembers={setMembers} memberPresence={memberPresence} familyProfile={normalizedFamilyProfile} />}
        />
        <Route
          path="/chat"
          element={<ChatPage members={members} memberPresence={memberPresence} familyProfile={normalizedFamilyProfile} />}
        />
        <Route path="/members" element={<MembersPage members={members} setMembers={setMembers} memberPresence={memberPresence} />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/todo" element={<TodoPage />} />
        <Route path="/album" element={<AlbumPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route
          path="/settings"
          element={<SettingsPage members={members} familyProfile={normalizedFamilyProfile} setFamilyProfile={setFamilyProfile} />}
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <BottomNavigation />
    </ErrorBoundary>
  )
}
