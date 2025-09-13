# Wedding Prediction Game

A collaborative prediction game for wedding guests to compete by guessing various wedding moments and outcomes.

**Experience Qualities**:
1. **Competitive** - Clear scoring system and real-time leaderboard creates friendly competition
2. **Social** - Real-time updates allow everyone to see predictions and results as they happen
3. **Intuitive** - Simple interface where guests pick their name and submit predictions easily

**Complexity Level**: Light Application (multiple features with basic state)
- Multiple user management with role-based permissions, real-time scoring system, and admin controls for managing game flow

## Essential Features

**User Selection & Authentication**
- Functionality: Guests select their name from a predefined list to identify themselves
- Purpose: Simple authentication without passwords while ensuring predictions are tied to specific people
- Trigger: Landing page visit
- Progression: Visit URL → Select name from dropdown → Enter game dashboard
- Success criteria: User name persists across sessions and all predictions are attributed correctly

**Admin Criteria Management**
- Functionality: Admin can create, edit, and manage prediction categories/questions
- Purpose: Allows wedding host to customize game based on their specific wedding
- Trigger: Admin user accesses admin panel
- Progression: Admin login → View criteria list → Add/edit questions → Set scoring rules
- Success criteria: Criteria appear immediately for all users to make predictions

**Prediction Submission**
- Functionality: Users submit their predictions for each active criteria
- Purpose: Core game mechanic where competition happens
- Trigger: User views available criteria
- Progression: View criteria → Enter prediction → Submit → See confirmation → Lock prediction when admin enables
- Success criteria: Predictions are saved, visible to admin, and cannot be changed when locked

**Real-time Scoring & Results**
- Functionality: Admin declares winners for each round, scores update automatically
- Purpose: Maintains engagement and shows competitive standings
- Trigger: Admin marks criteria as complete and selects winners
- Progression: Admin selects winners → Scores update → Leaderboard refreshes → Users see new standings
- Success criteria: All users see score updates immediately without refresh

**Answer Locking System**
- Functionality: Admin can prevent further prediction changes when wedding begins
- Purpose: Ensures fair play by preventing last-minute changes
- Trigger: Admin clicks "Lock Answers" button
- Progression: Admin locks answers → All edit forms become read-only → Users see locked status
- Success criteria: No user can modify predictions once locked

## Edge Case Handling

- **Simultaneous Submissions**: Last submission wins for duplicate predictions from same user
- **Admin Disconnect**: Game state persists, admin can rejoin and continue managing
- **Invalid Predictions**: Form validation prevents empty or malformed submissions
- **Multiple Winners**: Admin can select multiple winners per round for tied results
- **Late Arrivals**: New users can join mid-game but only participate in future rounds

## Design Direction

The design should feel celebratory and elegant like a wedding celebration - sophisticated yet playful, with warm colors that evoke joy and festivity rather than harsh competition.

## Color Selection

Complementary (opposite colors) - Using warm gold/champagne as primary with deep navy as complement to create elegant contrast reminiscent of wedding colors.

- **Primary Color**: Warm Champagne Gold (oklch(0.85 0.08 85)) - Communicates celebration and elegance
- **Secondary Colors**: Soft Cream (oklch(0.95 0.02 85)) for backgrounds, Deep Navy (oklch(0.25 0.12 265)) for contrast
- **Accent Color**: Rose Gold (oklch(0.75 0.15 35)) for CTAs and celebration moments
- **Foreground/Background Pairings**: 
  - Background Cream (oklch(0.95 0.02 85)): Deep Navy text (oklch(0.25 0.12 265)) - Ratio 8.2:1 ✓
  - Primary Gold (oklch(0.85 0.08 85)): Deep Navy text (oklch(0.25 0.12 265)) - Ratio 5.1:1 ✓
  - Accent Rose Gold (oklch(0.75 0.15 35)): White text (oklch(1 0 0)) - Ratio 4.8:1 ✓
  - Navy Background (oklch(0.25 0.12 265)): Cream text (oklch(0.95 0.02 85)) - Ratio 8.2:1 ✓

## Font Selection

Typography should convey elegance and celebration while maintaining excellent readability for quick prediction entry.

- **Primary Font**: Playfair Display for headings - elegant serif that feels wedding-appropriate
- **Secondary Font**: Inter for body text - clean sans-serif for excellent form readability

**Typographic Hierarchy**:
- H1 (App Title): Playfair Display Bold/32px/tight letter spacing
- H2 (Section Headers): Playfair Display SemiBold/24px/normal spacing  
- H3 (Criteria Questions): Inter SemiBold/18px/normal spacing
- Body (Predictions, Forms): Inter Regular/16px/relaxed line height
- Small (Scores, Meta): Inter Medium/14px/normal spacing

## Animations

Subtle celebratory animations that enhance the wedding theme without being distracting during active gameplay.

**Purposeful Meaning**: Gentle transitions and success celebrations reinforce the joyful wedding atmosphere
**Hierarchy of Movement**: Score updates and winner announcements get the most animation attention, form interactions remain subtle

## Component Selection

**Components**: 
- Card components for criteria display and user panels
- Form components with Input, Button, and Select for predictions
- Badge components for winner indicators and scores
- Alert components for admin notifications
- Tabs for organizing admin vs user views
- Dialog for admin criteria management

**Customizations**: 
- Custom leaderboard component showing real-time scores
- Prediction timeline component showing locked vs open predictions
- Winner celebration component with subtle animations

**States**: 
- Buttons show loading states during submissions
- Inputs have clear focus states and validation feedback
- Locked predictions show disabled styling with lock icons
- Winner badges have gentle glow effects

**Icon Selection**: 
- Trophy icons for winners and leaderboard
- Lock icons for secured predictions  
- Clock icons for time-based predictions
- Crown icon for admin features
- Heart icons for wedding theme touches

**Spacing**: Consistent 4/6/8/12/16px spacing using Tailwind scale, generous padding around prediction cards

**Mobile**: 
- Stack prediction cards vertically on mobile
- Collapsible admin panel for smaller screens
- Touch-friendly button sizes (min 44px)
- Simplified leaderboard layout for narrow screens