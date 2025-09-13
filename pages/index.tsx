import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../src/components/ui/card'
import { Button } from '../src/components/ui/button'
import { Input } from '../src/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../src/components/ui/select'
import { Badge } from '../src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../src/components/ui/dialog'
import { Label } from '../src/components/ui/label'
import { Textarea } from '../src/components/ui/textarea'
import { Alert, AlertDescription } from '../src/components/ui/alert'
import { Crown, Trophy, Lock, Clock, Heart, Plus, X, Check, Trash, UserPlus } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  is_admin: boolean
  score: number
}

interface Criteria {
  id: string
  question: string
  description?: string
  winners: string[] // user IDs
}

interface Prediction {
  id: string
  user_id: string
  criteria_id: string
  answer: string
  timestamp: number
}

const PREDEFINED_USERS: Omit<User, 'score'>[] = [
  { id: 'pete', name: 'Sexy Peter', is_admin: true },
  { id: 'penny', name: 'Penny', is_admin: false },
  { id: 'hannah', name: 'HanTwat', is_admin: false },
  { id: 'charlotte', name: 'Charlotte', is_admin: false },
  { id: 'jack', name: 'Jack', is_admin: false },
  { id: 'jess', name: 'Jess', is_admin: false },
  { id: 'bromley', name: 'Bromley', is_admin: false },
  { id: 'lucy', name: 'Lucy', is_admin: false },
  { id: 'eddie', name: 'Eddie', is_admin: false },
  { id: 'ben', name: 'Ben', is_admin: false },
  { id: 'sophie', name: 'Sophie', is_admin: false }
]

// API helper functions
const api = {
  async getUsers(): Promise<User[]> {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error('Failed to fetch users')
    return response.json()
  },

  async createUser(id: string, name: string, isAdmin: boolean = false): Promise<User[]> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, isAdmin })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create user')
    }
    return response.json()
  },

  async deleteUser(userId: string): Promise<User[]> {
    const response = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete user')
    }
    return response.json()
  },

  async getCriteria(): Promise<Criteria[]> {
    const response = await fetch('/api/criteria')
    if (!response.ok) throw new Error('Failed to fetch criteria')
    return response.json()
  },

  async getPredictions(): Promise<Prediction[]> {
    const response = await fetch('/api/predictions')
    if (!response.ok) throw new Error('Failed to fetch predictions')
    return response.json()
  },

  async addCriteria(question: string, description: string): Promise<Criteria[]> {
    const response = await fetch('/api/criteria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, description })
    })
    if (!response.ok) throw new Error('Failed to add criteria')
    return response.json()
  },

  async submitPrediction(userId: string, criteriaId: string, answer: string): Promise<Prediction[]> {
    const response = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, criteriaId, answer })
    })
    if (!response.ok) throw new Error('Failed to submit prediction')
    return response.json()
  },

  async toggleWinner(criteriaId: string, userId: string): Promise<User[]> {
    const response = await fetch('/api/winners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criteriaId, userId })
    })
    if (!response.ok) throw new Error('Failed to toggle winner')
    return response.json()
  },

  async getGameSetting(key: string): Promise<{ key: string; value: string }> {
    const response = await fetch(`/api/settings?key=${key}`)
    if (!response.ok) throw new Error('Failed to fetch setting')
    return response.json()
  },

  async setGameSetting(key: string, value: string): Promise<{ key: string; value: string }> {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    })
    if (!response.ok) throw new Error('Failed to set setting')
    return response.json()
  }
}

export default function Home() {
  // Personal user state (per-device) - stored in localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  
  // Shared game state from database
  const [users, setUsers] = useState<User[]>([])
  const [criteria, setCriteria] = useState<Criteria[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [answersLocked, setAnswersLocked] = useState<boolean>(false)
  
  const [dataLoaded, setDataLoaded] = useState(false)
  const [newCriteria, setNewCriteria] = useState({ question: '', description: '' })
  const [newPredictions, setNewPredictions] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ id: '', name: '', isAdmin: false })
  const [adminPassword, setAdminPassword] = useState('')
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [tempAdminUser, setTempAdminUser] = useState<User | null>(null)

  // Load current user from localStorage on app start
  useEffect(() => {
    const savedUserId = localStorage.getItem('wedding-current-user-id')
    const savedIsAdmin = localStorage.getItem('wedding-current-user-admin') === 'true'
    
    if (savedUserId) {
      // Auto-login the saved user
      const loadSavedUser = async () => {
        try {
          const allUsers = await api.getUsers()
          const savedUser = allUsers.find(u => u.id === savedUserId)
          if (savedUser) {
            setCurrentUser(savedUser)
          } else {
            // User not found in database, clear localStorage
            localStorage.removeItem('wedding-current-user-id')
            localStorage.removeItem('wedding-current-user-admin')
          }
        } catch (error) {
          console.error('Error loading saved user:', error)
          // Clear localStorage on error
          localStorage.removeItem('wedding-current-user-id')
          localStorage.removeItem('wedding-current-user-admin')
        }
      }
      
      if (dataLoaded) {
        loadSavedUser()
      }
    }
  }, [dataLoaded])

  // Save current user to localStorage when user changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('wedding-current-user-id', currentUser.id)
      localStorage.setItem('wedding-current-user-admin', currentUser.is_admin.toString())
    }
  }, [currentUser])

  // Clear localStorage when user explicitly switches
  const clearCurrentUser = () => {
    localStorage.removeItem('wedding-current-user-id')
    localStorage.removeItem('wedding-current-user-admin')
    setCurrentUser(null)
  }

  const handleUserSelection = async (userId: string) => {
    try {
      const allUsers = await api.getUsers()
      const user = allUsers.find(u => u.id === userId)
      
      if (user) {
        if (user.is_admin) {
          // For admin users, show password prompt
          setShowPasswordPrompt(true)
          // Store the user temporarily for after password verification
          setTempAdminUser(user)
        } else {
          // For regular users, log them in immediately
          setCurrentUser(user)
          toast.success(`Welcome back, ${user.name}!`)
        }
      }
    } catch (error) {
      console.error('Error selecting user:', error)
      toast.error('Failed to select user')
    }
  }

  const handleAdminLogin = async () => {
    if (adminPassword === 'password1994') {
      try {
        if (tempAdminUser) {
          setCurrentUser(tempAdminUser)
          setShowPasswordPrompt(false)
          setAdminPassword('')
          setTempAdminUser(null)
          toast.success(`Welcome back, ${tempAdminUser.name}!`)
        } else {
          toast.error('Admin user not found')
        }
      } catch (error) {
        console.error('Error logging in admin:', error)
        toast.error('Failed to login admin')
      }
    } else {
      toast.error('Incorrect password')
      setAdminPassword('')
    }
  }

  // Load all data from API
  const loadData = async () => {
    try {
      const [usersData, criteriaData, predictionsData, settingData] = await Promise.all([
        api.getUsers(),
        api.getCriteria(),
        api.getPredictions(),
        api.getGameSetting('answers_locked').catch(() => ({ value: 'false' }))
      ])

      setUsers(usersData)
      setCriteria(criteriaData)
      setPredictions(predictionsData)
      setAnswersLocked(settingData.value === 'true')
      setDataLoaded(true)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
      setDataLoaded(true)
    }
  }

  // Initial data load
  useEffect(() => {
    loadData()
  }, [])

  // Periodic data refresh to keep devices in sync
  useEffect(() => {
    if (!dataLoaded) return
    
    const refreshInterval = setInterval(() => {
      loadData()
    }, 5000) // Refresh every 5 seconds
    
    return () => clearInterval(refreshInterval)
  }, [dataLoaded])

  // Ensure current user has latest score data
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const updatedUser = users.find(u => u.id === currentUser.id)
      if (updatedUser && updatedUser.score !== currentUser.score) {
        setCurrentUser(updatedUser)
      }
    }
  }, [users, currentUser])

  // Show loading state while data is syncing
  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Heart weight="fill" className="text-accent mx-auto mb-4" size={48} />
            <p className="text-muted-foreground font-body">Loading wedding predictions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password prompt dialog for admin
  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl text-primary flex items-center justify-center gap-2">
              <Crown className="text-accent" />
              Admin Access
            </CardTitle>
            <p className="text-muted-foreground font-body">Enter the admin password</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body">Password</Label>
              <Input
                type="password"
                placeholder="Enter password..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="font-body"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordPrompt(false)
                  setAdminPassword('')
                  setTempAdminUser(null)
                }}
                className="flex-1 font-body"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAdminLogin}
                disabled={!adminPassword.trim()}
                className="flex-1 font-body"
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User selection for non-authenticated users
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-3xl text-primary flex items-center justify-center gap-2">
              <Heart weight="fill" className="text-accent" />
              Wedding Predictions
            </CardTitle>
            <p className="text-muted-foreground font-body">Choose your name to join the game</p>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleUserSelection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your name..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} {user.is_admin && <Crown className="inline ml-1" size={16} />}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    )
  }

  const addCriteria = async () => {
    if (!newCriteria.question.trim()) return
    
    try {
      const updatedCriteria = await api.addCriteria(newCriteria.question, newCriteria.description)
      setCriteria(updatedCriteria)
      setNewCriteria({ question: '', description: '' })
      setDialogOpen(false)
      toast.success('New prediction added!')
    } catch (error) {
      console.error('Error adding criteria:', error)
      toast.error('Failed to add prediction')
    }
  }

  const submitPrediction = async (criteriaId: string) => {
    const answer = newPredictions[criteriaId]?.trim()
    if (!answer) return

    try {
      const updatedPredictions = await api.submitPrediction(currentUser.id, criteriaId, answer)
      setPredictions(updatedPredictions)
      setNewPredictions(prev => ({ ...prev, [criteriaId]: '' }))
      toast.success('Prediction submitted!')
    } catch (error) {
      console.error('Error submitting prediction:', error)
      toast.error('Failed to submit prediction')
    }
  }

  const toggleWinner = async (criteriaId: string, userId: string) => {
    try {
      const updatedUsers = await api.toggleWinner(criteriaId, userId)
      setUsers(updatedUsers)
      
      // Update criteria winners in local state
      const updatedCriteria = criteria.map(c => {
        if (c.id === criteriaId) {
          const isCurrentlyWinner = c.winners.includes(userId)
          const newWinners = isCurrentlyWinner 
            ? c.winners.filter(id => id !== userId)
            : [...c.winners, userId]
          return { ...c, winners: newWinners }
        }
        return c
      })
      setCriteria(updatedCriteria)
      
      toast.success('Score updated!')
    } catch (error) {
      console.error('Error toggling winner:', error)
      toast.error('Failed to update score')
    }
  }

  const toggleAnswerLock = async () => {
    const newLockState = !answersLocked
    try {
      await api.setGameSetting('answers_locked', newLockState.toString())
      setAnswersLocked(newLockState)
      toast.success(newLockState ? 'Answers locked!' : 'Answers unlocked!')
    } catch (error) {
      console.error('Error toggling answer lock:', error)
      toast.error('Failed to toggle answer lock')
    }
  }

  const createUser = async () => {
    if (!newUser.id.trim() || !newUser.name.trim()) {
      toast.error('Please fill in both ID and name')
      return
    }

    // Create a valid ID (lowercase, no spaces)
    const userId = newUser.id.toLowerCase().replace(/\s+/g, '')
    
    try {
      const updatedUsers = await api.createUser(userId, newUser.name, newUser.isAdmin)
      setUsers(updatedUsers)
      setNewUser({ id: '', name: '', isAdmin: false })
      setUserDialogOpen(false)
      toast.success('User created successfully!')
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete this user? This will also delete all their predictions.`)) {
      return
    }

    try {
      const updatedUsers = await api.deleteUser(userId)
      setUsers(updatedUsers)
      
      // If the current user was deleted, log them out
      if (currentUser && currentUser.id === userId) {
        clearCurrentUser()
      }
      
      toast.success('User deleted successfully!')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  const getUserPrediction = (criteriaId: string) => {
    return predictions.find(p => p.user_id === currentUser.id && p.criteria_id === criteriaId)
  }

  const getCriteriaPredictions = (criteriaId: string) => {
    return predictions.filter(p => p.criteria_id === criteriaId)
  }

  const sortedUsers = [...users].sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-heading text-2xl font-bold text-primary flex items-center gap-2">
            <Heart weight="fill" className="text-accent" />
            Wedding Predictions
          </h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="font-body">
              {currentUser.name} {currentUser.is_admin && <Crown className="ml-1" size={14} />}
            </Badge>
            <Badge variant="outline" className="font-body">
              Score: {currentUser.score}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearCurrentUser}
            >
              Switch User
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={currentUser.is_admin ? "admin" : "predictions"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            {currentUser.is_admin && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="predictions" className="space-y-6">
            {answersLocked && (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Predictions are now locked! The wedding has begun.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {criteria.map(criterion => {
                const userPrediction = getUserPrediction(criterion.id)
                const isWinner = criterion.winners.includes(currentUser.id)
                
                return (
                  <Card key={criterion.id} className={`${isWinner ? 'ring-2 ring-accent bg-accent/5' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="font-body text-lg">{criterion.question}</CardTitle>
                        <div className="flex gap-1">
                          {answersLocked && <Lock className="text-muted-foreground" size={16} />}
                        </div>
                      </div>
                      {criterion.description && (
                        <p className="text-sm text-muted-foreground font-body">{criterion.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {userPrediction ? (
                        <div className="space-y-2">
                          <Label className="font-body">Your prediction:</Label>
                          <div className={`p-3 rounded-lg font-body ${isWinner ? 'bg-accent/20 border border-accent' : 'bg-muted'}`}>
                            {userPrediction.answer}
                            {isWinner && <Badge className="ml-2">Winner!</Badge>}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="font-body">Your prediction:</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter your prediction..."
                              value={newPredictions[criterion.id] || ''}
                              onChange={(e) => setNewPredictions(prev => ({ ...prev, [criterion.id]: e.target.value }))}
                              disabled={answersLocked}
                              className="font-body"
                            />
                            <Button 
                              onClick={() => submitPrediction(criterion.id)}
                              disabled={!newPredictions[criterion.id]?.trim() || answersLocked}
                              size="sm"
                            >
                              Submit
                            </Button>
                          </div>
                        </div>
                      )}

                      {currentUser.is_admin && (
                        <div className="space-y-2">
                          <Label className="font-body">All predictions:</Label>
                          <div className="space-y-1">
                            {getCriteriaPredictions(criterion.id).map(pred => {
                              const user = users.find(u => u.id === pred.user_id)
                              const isWinner = criterion.winners.includes(pred.user_id)
                              return (
                                <div key={pred.id} className={`flex justify-between p-2 rounded text-sm font-body ${isWinner ? 'bg-accent/20' : 'bg-muted'}`}>
                                  <span>{user?.name}: {pred.answer}</span>
                                  <Trophy className={`${isWinner ? 'text-accent' : 'text-transparent'}`} size={16} />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}

              {criteria.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Clock className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-muted-foreground font-body">No predictions available yet. The admin will add them soon!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Trophy className="text-accent" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-accent text-accent-foreground' : 
                          index === 1 ? 'bg-primary text-primary-foreground' : 
                          index === 2 ? 'bg-secondary text-secondary-foreground' : 
                          'bg-muted-foreground text-background'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-body font-medium">{user.name}</span>
                        {user.is_admin && <Crown className="text-primary" size={16} />}
                      </div>
                      <Badge variant="outline" className="font-body">{user.score} points</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {currentUser.is_admin && (
            <TabsContent value="admin" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-heading text-xl">Admin Controls</h2>
                <div className="flex gap-2">
                  <Button 
                    variant={answersLocked ? "destructive" : "outline"}
                    onClick={toggleAnswerLock}
                    className="font-body"
                  >
                    <Lock className="mr-2" size={16} />
                    {answersLocked ? 'Unlock Answers' : 'Lock Answers'}
                  </Button>
                  <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="font-body">
                        <UserPlus className="mr-2" size={16} />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-heading">Add New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="font-body">User ID</Label>
                          <Input
                            placeholder="e.g., john"
                            value={newUser.id}
                            onChange={(e) => setNewUser(prev => ({ ...prev, id: e.target.value }))}
                            className="font-body"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Will be converted to lowercase with no spaces
                          </p>
                        </div>
                        <div>
                          <Label className="font-body">Display Name</Label>
                          <Input
                            placeholder="e.g., John Smith"
                            value={newUser.name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                            className="font-body"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isAdmin"
                            checked={newUser.isAdmin}
                            onChange={(e) => setNewUser(prev => ({ ...prev, isAdmin: e.target.checked }))}
                          />
                          <Label htmlFor="isAdmin" className="font-body">Make this user an admin</Label>
                        </div>
                        <Button onClick={createUser} className="w-full font-body">
                          Create User
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="font-body">
                        <Plus className="mr-2" size={16} />
                        Add Prediction
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-heading">Add New Prediction</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="font-body">Question</Label>
                          <Input
                            placeholder="e.g., What time will Jac cry at the wedding?"
                            value={newCriteria.question}
                            onChange={(e) => setNewCriteria(prev => ({ ...prev, question: e.target.value }))}
                            className="font-body"
                          />
                        </div>
                        <div>
                          <Label className="font-body">Description (optional)</Label>
                          <Textarea
                            placeholder="Additional details or hints..."
                            value={newCriteria.description}
                            onChange={(e) => setNewCriteria(prev => ({ ...prev, description: e.target.value }))}
                            className="font-body"
                          />
                        </div>
                        <Button onClick={addCriteria} className="w-full font-body">
                          Add Prediction
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* User Management Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-body text-lg">User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <span className="font-body font-medium">{user.name}</span>
                          <Badge variant="outline" className="font-body text-xs">
                            ID: {user.id}
                          </Badge>
                          {user.is_admin && <Crown className="text-primary" size={16} />}
                          <Badge variant="secondary" className="font-body text-xs">
                            {user.score} points
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {!user.is_admin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteUser(user.id)}
                              className="font-body"
                            >
                              <Trash className="mr-1" size={14} />
                              Delete
                            </Button>
                          )}
                          {user.is_admin && (
                            <Badge variant="outline" className="font-body text-xs">
                              Protected
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Debug info for admin */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-body text-lg">Database Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm font-body">
                    <p><strong>Total Questions:</strong> {criteria.length}</p>
                    <p><strong>Total Predictions:</strong> {predictions.length}</p>
                    <p><strong>Answers Locked:</strong> {answersLocked ? 'Yes' : 'No'}</p>
                    <p><strong>Total Users:</strong> {users.length}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {criteria.map(criterion => {
                  const criterionPredictions = getCriteriaPredictions(criterion.id)
                  
                  return (
                    <Card key={criterion.id}>
                      <CardHeader>
                        <CardTitle className="font-body text-lg">{criterion.question}</CardTitle>
                        {criterion.description && (
                          <p className="text-sm text-muted-foreground font-body">{criterion.description}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-body">Predictions ({criterionPredictions.length}):</Label>
                          <div className="space-y-2">
                            {criterionPredictions.map(pred => {
                              const user = users.find(u => u.id === pred.user_id)
                              const isWinner = criterion.winners.includes(pred.user_id)
                              
                              return (
                                <div key={pred.id} className="flex items-center justify-between p-3 border rounded">
                                  <span className="font-body">
                                    <strong>{user?.name}:</strong> {pred.answer}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant={isWinner ? "default" : "outline"}
                                      onClick={() => toggleWinner(criterion.id, pred.user_id)}
                                      className="font-body"
                                    >
                                      {isWinner ? <Check className="mr-1" size={14} /> : <X className="mr-1" size={14} />}
                                      {isWinner ? 'Winner' : 'Mark Winner'}
                                    </Button>
                                    {isWinner && <Trophy className="text-accent" size={16} />}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}