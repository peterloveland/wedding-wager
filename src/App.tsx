import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Trophy, Lock, Clock, Heart, Plus, X, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  isAdmin: boolean
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
  userId: string
  criteriaId: string
  answer: string
  timestamp: number
}

const PREDEFINED_USERS: Omit<User, 'score'>[] = [
  { id: 'pete', name: 'Sexy Peter', isAdmin: true },
  { id: 'penny', name: 'Penny', isAdmin: false },
  { id: 'hannah', name: 'HanTwat', isAdmin: false },
  { id: 'charlotte', name: 'Charlotte', isAdmin: false },
  { id: 'jack', name: 'Jack', isAdmin: false },
  { id: 'jess', name: 'Jess', isAdmin: false },
  { id: 'bromley', name: 'Bromley', isAdmin: false },
  { id: 'lucy', name: 'Lucy', isAdmin: false },
  { id: 'eddie', name: 'Eddie', isAdmin: false },
  { id: 'ben', name: 'Ben', isAdmin: false },
  { id: 'sophie', name: 'Sophie', isAdmin: false }
]

function App() {
  // Use localStorage for current user to persist across sessions
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('wedding-current-user')
    return saved ? JSON.parse(saved) : null
  })
  const [users, setUsers] = useKV<User[]>('users', [])
  const [criteria, setCriteria] = useKV<Criteria[]>('criteria', [])
  const [predictions, setPredictions] = useKV<Prediction[]>('predictions', [])
  const [answersLocked, setAnswersLocked] = useKV<boolean>('answers-locked', false)
  
  const [newCriteria, setNewCriteria] = useState({ question: '', description: '' })
  const [newPredictions, setNewPredictions] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

  const handleUserSelection = (userId: string) => {
    const selectedUser = PREDEFINED_USERS.find(u => u.id === userId)
    if (!selectedUser) return
    
    if (selectedUser.isAdmin) {
      setShowPasswordPrompt(true)
    } else {
      const user = (users || []).find(u => u.id === userId)
      if (user) {
        setCurrentUser(user)
        toast.success(`Welcome, ${user.name}!`)
      }
    }
  }

  const handleAdminLogin = () => {
    if (adminPassword === 'password1994') {
      // Find admin from predefined users first, then look in stored users
      const predefinedAdmin = PREDEFINED_USERS.find(u => u.isAdmin)
      const adminUser = (users || []).find(u => u.isAdmin) || (predefinedAdmin && { ...predefinedAdmin, score: 0 })
      
      if (adminUser) {
        setCurrentUser(adminUser)
        setShowPasswordPrompt(false)
        setAdminPassword('')
        toast.success(`Welcome, ${adminUser.name}!`)
      } else {
        toast.error('Admin user not found')
      }
    } else {
      toast.error('Incorrect password')
      setAdminPassword('')
    }
  }

  // Save current user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('wedding-current-user', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('wedding-current-user')
    }
  }, [currentUser])

  // Initialize users if empty
  useEffect(() => {
    if (!users || users.length === 0) {
      const initialUsers = PREDEFINED_USERS.map(user => ({ ...user, score: 0 }))
      setUsers(initialUsers)
    }
  }, [users, setUsers])

  // Ensure current user has latest score data
  useEffect(() => {
    if (currentUser && users && users.length > 0) {
      const updatedUser = users.find(u => u.id === currentUser.id)
      if (updatedUser && updatedUser.score !== currentUser.score) {
        setCurrentUser(updatedUser)
      }
    }
  }, [users, currentUser])

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
                {PREDEFINED_USERS.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} {user.isAdmin && <Crown className="inline ml-1" size={16} />}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    )
  }

  const addCriteria = () => {
    if (!newCriteria.question.trim()) return
    
    const criteria = {
      id: Date.now().toString(),
      question: newCriteria.question,
      description: newCriteria.description,
      winners: []
    }
    
    setCriteria(prev => [...(prev || []), criteria])
    setNewCriteria({ question: '', description: '' })
    setDialogOpen(false)
    toast.success('New prediction added!')
  }

  const submitPrediction = (criteriaId: string) => {
    const answer = newPredictions[criteriaId]?.trim()
    if (!answer) return

    const prediction = {
      id: `${currentUser.id}-${criteriaId}`,
      userId: currentUser.id,
      criteriaId,
      answer,
      timestamp: Date.now()
    }

    setPredictions(prev => (prev || []).filter(p => !(p.userId === currentUser.id && p.criteriaId === criteriaId)).concat(prediction))
    setNewPredictions(prev => ({ ...prev, [criteriaId]: '' }))
    toast.success('Prediction submitted!')
  }

  const toggleWinner = (criteriaId: string, userId: string) => {
    setCriteria(prev => (prev || []).map(c => {
      if (c.id === criteriaId) {
        const isCurrentlyWinner = c.winners.includes(userId)
        const newWinners = isCurrentlyWinner 
          ? c.winners.filter(id => id !== userId)
          : [...c.winners, userId]
        return { ...c, winners: newWinners }
      }
      return c
    }))

    // Update scores
    const criterion = (criteria || []).find(c => c.id === criteriaId)
    if (criterion) {
      const isCurrentlyWinner = criterion.winners.includes(userId)
      setUsers(prev => (prev || []).map(user => ({
        ...user,
        score: user.id === userId 
          ? user.score + (isCurrentlyWinner ? -1 : 1)
          : user.score
      })))
    }

    toast.success('Score updated!')
  }

  const toggleAnswerLock = () => {
    setAnswersLocked(prev => !prev)
    toast.success(answersLocked ? 'Answers unlocked!' : 'Answers locked!')
  }

  const getUserPrediction = (criteriaId: string) => {
    return (predictions || []).find(p => p.userId === currentUser.id && p.criteriaId === criteriaId)
  }

  const getCriteriaPredictions = (criteriaId: string) => {
    return (predictions || []).filter(p => p.criteriaId === criteriaId)
  }

  const sortedUsers = [...(users || [])].sort((a, b) => b.score - a.score)

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
              {currentUser.name} {currentUser.isAdmin && <Crown className="ml-1" size={14} />}
            </Badge>
            <Badge variant="outline" className="font-body">
              Score: {currentUser.score}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentUser(null)}
            >
              Switch User
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={currentUser.isAdmin ? "admin" : "predictions"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            {currentUser.isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
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
              {(criteria || []).map(criterion => {
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

                      {currentUser.isAdmin && (
                        <div className="space-y-2">
                          <Label className="font-body">All predictions:</Label>
                          <div className="space-y-1">
                            {getCriteriaPredictions(criterion.id).map(pred => {
                              const user = (users || []).find(u => u.id === pred.userId)
                              const isWinner = criterion.winners.includes(pred.userId)
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

              {(criteria || []).length === 0 && (
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
                        {user.isAdmin && <Crown className="text-primary" size={16} />}
                      </div>
                      <Badge variant="outline" className="font-body">{user.score} points</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {currentUser.isAdmin && (
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

              <div className="grid gap-4">
                {(criteria || []).map(criterion => {
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
                              const user = (users || []).find(u => u.id === pred.userId)
                              const isWinner = criterion.winners.includes(pred.userId)
                              
                              return (
                                <div key={pred.id} className="flex items-center justify-between p-3 border rounded">
                                  <span className="font-body">
                                    <strong>{user?.name}:</strong> {pred.answer}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant={isWinner ? "default" : "outline"}
                                      onClick={() => toggleWinner(criterion.id, pred.userId)}
                                      className="font-body"
                                    >
                                      {isWinner ? <Check className="mr-1" size={14} /> : <X className="mr-1" size={14} />}
                                      {isWinner ? 'Give Point' : 'No Point'}
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

export default App
