# ProjectHub

A modern, intuitive task management application with integrated Pomodoro timer functionality, designed to help you stay focused and productive.

## 🎯 Overview

ProjectHub combines task management with time-tracking capabilities, featuring a sleek, glassmorphism-inspired UI and intelligent drag-and-drop task organization. Built with modern web technologies, it offers both online and offline functionality with automatic sync.

## ✨ Features

### Task Management
- **Trello-Style Drag & Drop**: Intuitive task reordering with position-aware placeholders
- **Three-Column Kanban Board**:
  - **To Do**: Tasks waiting to be started
  - **In Focus**: Active tasks with the hero task highlighted
  - **Completed**: Finished tasks ready for archiving
- **Auto-Scroll**: Smooth scrolling when dragging tasks near column edges
- **Visual Feedback**: Tilted drag preview with dynamic placeholder sizing
- **Persistent Positioning**: Task order maintained across sessions

### Time Tracking
- **Pomodoro Timer**: 25-minute focus sessions with customizable breaks
- **Hero Task Integration**: Timer automatically tracks the first task in "In Focus"
- **Progress Visualization**: Real-time progress bars showing time spent vs. estimated time
- **Session History**: Complete timeline of all completed Pomodoro sessions
- **Statistics Dashboard**:
  - Focus activity heatmap
  - Session timeline with calendar integration
  - Task completion metrics

### User Experience
- **Double-Click Details**: Quick access to task details and editing
- **Glassmorphism Design**: Modern, translucent UI with backdrop blur effects
- **Fade-Out Scrolling**: Elegant scroll areas with gradient masks
- **Responsive Layout**: Optimized for various screen sizes
- **Toast Notifications**: Non-intrusive feedback for user actions

### Offline Support
- **Progressive Web App**: Works offline with automatic sync when reconnected
- **Local-First**: All changes saved locally first, then synced to cloud
- **Sync Queue**: Failed operations automatically retry when connection restored
- **Status Indicators**: Clear offline/online status with last sync time

## 🔒 Security

### Authentication
- **Email/Password Authentication**: Secure user registration and login via Supabase Auth
- **Session Management**: Persistent sessions with automatic renewal
- **Protected Routes**: Server-side authentication checks

### Data Protection
- **Row-Level Security (RLS)**: Supabase policies ensure users only access their own data
- **Secure API Calls**: All database operations validated through RLS policies
- **No Exposed Credentials**: Environment variables for sensitive configuration
- **HTTPS Only**: Encrypted data transmission in production

### Privacy
- **User Isolation**: Complete data separation between users
- **No Cross-User Access**: Database queries automatically filtered by user ID
- **Audit Trail**: All task operations logged with timestamps

## 🎨 Design System

### Visual Language
- **Color Palette**:
  - Primary: `#ba4949` (Red - for accents and CTAs)
  - Focus: `#ff7675` (Coral - for hero task highlighting)
  - Background: Dark gradient with glassmorphism overlays
- **Typography**: Poppins font family for clean, modern readability
- **Spacing**: Consistent 8px base grid system

### Components
- **Task Cards**:
  - White background with colored left border (priority indicator)
  - Rounded corners (16px border-radius)
  - Hover elevation with shadow transitions
  - Priority badges (Low/Medium/High)
- **Placeholders**:
  - Pulsing animation to indicate drop zones
  - Dynamic sizing to match dragged task
  - Dashed border with semi-transparent background
- **Modals**:
  - Centered overlays with backdrop blur
  - Smooth open/close animations

### Layout
- **Three-Column Grid**: `1fr 1.5fr 1fr` (middle column emphasized)
- **Vertical Rhythm**: Consistent spacing between elements
- **Scroll Containers**: Fade-out effect at bottom for visual polish

## 🛠️ Technology Stack

### Frontend
- **SvelteKit**: Meta-framework for Svelte with SSR and routing
- **Svelte 5**: Component framework with reactive stores
- **Lucide Icons**: Modern icon library
- **CSS3**: Custom styling with advanced features (backdrop-filter, gradients)

### Backend
- **Supabase**: Backend-as-a-Service providing:
  - PostgreSQL database
  - Authentication service
  - Row-level security
  - Real-time subscriptions (ready for future features)

### State Management
- **Svelte Stores**: Reactive state management
- **Local Storage**: Client-side persistence
- **Sync Queue**: Offline operation queue

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier available)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JeffWR/ProjectHub.git
   cd ProjectHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**

   Execute the SQL files in your Supabase SQL Editor:
   - `supabase-add-position.sql` - Adds position column for task ordering
   - `verify-position-column.sql` - Verifies migration success

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open the application**

   Navigate to `http://localhost:5173`

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Environment Setup
- Set environment variables in your hosting platform
- Configure Supabase production URL and keys
- Enable HTTPS for secure authentication

### Recommended Platforms
- **Vercel**: Zero-config deployment for SvelteKit
- **Netlify**: Git-based deployment with automatic builds
- **Cloudflare Pages**: Global edge deployment

## 📖 Usage Guide

### Getting Started
1. **Sign Up**: Create an account with email and password
2. **Create Tasks**: Click the big "Create New Task" button
3. **Set Priorities**: Choose Low, Medium, or High priority
4. **Estimate Time**: Set expected duration in minutes

### Task Management
- **Drag to Reorder**: Click and drag tasks to rearrange within columns
- **Move Between Columns**: Drag tasks across columns to change status
- **Edit Tasks**: Double-click any task to view and edit details
- **Delete Tasks**: Click the trash icon to remove tasks

### Using the Timer
1. **Start Focus**: Drag a task to the "In Focus" column
2. **Begin Session**: Navigate to the Timer page
3. **Work**: Focus on the hero task for 25 minutes
4. **Complete**: Mark session as complete when timer finishes
5. **Review Stats**: Check the Statistics page for insights

### Keyboard Shortcuts
- **Double-click**: Open task details
- **Drag & Drop**: Reorder and move tasks

## 🏗️ Architecture

### Project Structure
```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   │   ├── TaskBoard.svelte
│   │   ├── TaskItem.svelte
│   │   ├── TaskModal.svelte
│   │   └── stats/        # Statistics components
│   ├── stores/           # State management
│   │   ├── tasks.js      # Task store with sync logic
│   │   ├── timer.js      # Timer state and logic
│   │   ├── auth.js       # Authentication state
│   │   └── toast.js      # Notification system
│   └── supabase.js       # Supabase client configuration
├── routes/
│   ├── tasks/            # Task management page
│   ├── timer/            # Pomodoro timer page
│   ├── stats/            # Statistics dashboard
│   └── settings/         # User settings
└── app.html              # HTML template
```

### Data Flow
1. **User Action** → UI Component
2. **Component** → Store Function (e.g., `addTask`, `moveTask`)
3. **Store** → Update Local State (optimistic UI)
4. **Store** → Sync to Supabase (async)
5. **Supabase** → Row-Level Security Check
6. **Success/Error** → Toast Notification

### Offline Strategy
- All mutations saved to localStorage immediately
- Failed server operations queued in sync queue
- Automatic retry when connection restored
- User notified of offline status

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
- Write clean, documented code
- Test changes thoroughly
- Follow existing code style and conventions
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**What this means:**
- ✅ You can use this code for personal or commercial projects
- ✅ You can modify and distribute it
- ✅ Just include the original copyright notice

## 👥 Authors

**ProjectHub** - Built by Jeff Wang

Feel free to reach out for questions or collaboration!
jeffwangrui@gmail.com

## 🙏 Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- Database and auth powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Made with ❤️ for productivity enthusiasts**
