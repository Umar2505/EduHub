# EduHub Frontend - Modern React + Vite Implementation

## 🎨 Design Philosophy

The frontend has been completely redesigned with a **modern, bright, teacher-friendly UI** that is:
- **Mobile responsive** - Works seamlessly on all devices
- **Bilingual** - Supports Uzbek (Latin) and Russian, plus English
- **Education-focused** - Clean, intuitive interface designed for teachers and students
- **Animated** - Smooth transitions using Framer Motion
- **Accessible** - Clear visual hierarchy and user feedback

## 🛠️ Tech Stack

- **React 18** - Latest React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **i18next** - Internationalization
- **Framer Motion** - Animation library
- **react-hot-toast** - Toast notifications
- **Recharts** - Chart library for data visualization
- **Lucide React** - Modern icon library
- **Inter Font** - Clean, readable typography

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx       # Top navigation bar
│   │   ├── Sidebar.jsx      # Side navigation menu
│   │   ├── Card.jsx         # Card container component
│   │   └── Button.jsx       # Button component with variants
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Login page
│   │   ├── TeacherDashboard.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── StudentDashboard.jsx
│   ├── context/
│   │   └── AuthContext.jsx   # Authentication context
│   ├── utils/
│   │   └── api.js           # API client functions
│   ├── i18n/                # Translation files
│   │   ├── en.json
│   │   ├── uz.json
│   │   └── ru.json
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🎯 Key Features

### 1. Login Page
- Centered card design with EduHub branding
- Language selector (EN/UZ/RU)
- Form validation and error handling
- Smooth animations on load

### 2. Teacher Dashboard
- Grid layout showing all assigned classes
- Class cards with:
  - Class name and center
  - Student count
  - Quick action to mark attendance
- Click to navigate to attendance page

### 3. Attendance Page
- Date picker for selecting attendance date
- Student list with status buttons:
  - ✅ Present (green)
  - ❌ Absent (red)
  - ⏰ Late (yellow)
- Visual feedback on status selection
- Bulk save functionality

### 4. Admin Dashboard
- Tabbed interface for:
  - Centers
  - Classes
  - Teachers
  - Students
- Create modals for each entity
- Grid/table views for data display

### 5. Student Dashboard
- Attendance summary cards:
  - Present percentage
  - Absent count
  - Late count
  - Total records
- Pie chart showing attendance distribution
- Bar chart by class
- Timeline of recent attendance records

## 🎨 Design System

### Colors
- **Primary**: Blue (#2563eb) - Main actions and branding
- **Success**: Green (#10b981) - Present status
- **Danger**: Red (#ef4444) - Absent status
- **Warning**: Yellow (#f59e0b) - Late status
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold, larger sizes
- **Body**: Regular weight, readable sizes

### Components
- **Cards**: Rounded corners (rounded-2xl), soft shadows
- **Buttons**: Rounded (rounded-lg), hover effects
- **Spacing**: Consistent padding (p-6) and gaps
- **Animations**: Subtle scale and fade effects

## 🌐 Internationalization

All text is translatable via i18next:
- English (en) - Default
- Uzbek Latin (uz)
- Russian (ru)

Language switcher available in:
- Login page
- Navbar (when logged in)

## 📱 Responsive Design

- **Mobile**: Single column, stacked layout
- **Tablet**: 2-column grid
- **Desktop**: 3-column grid, sidebar navigation

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Docker
```bash
docker-compose up frontend
```

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```
VITE_API_URL=http://localhost:8000/api
```

### API Client
All API calls are centralized in `src/utils/api.js`:
- Automatic JWT token injection
- Token refresh on 401 errors
- Error handling

## 🎭 Animations

Framer Motion is used for:
- Page transitions
- Card hover effects
- Button interactions
- List item animations

## 📊 Charts

Recharts is used in Student Dashboard:
- Pie chart for attendance distribution
- Bar chart for attendance by class
- Responsive and interactive

## 🔔 Notifications

react-hot-toast provides:
- Success messages
- Error messages
- Loading states
- Positioned at top-right

## 🎯 Best Practices

1. **Component Reusability**: Card, Button components used throughout
2. **State Management**: React Context for auth state
3. **Error Handling**: Try-catch with user-friendly messages
4. **Loading States**: Loading indicators for async operations
5. **Accessibility**: Semantic HTML, ARIA labels where needed

## 🐛 Troubleshooting

### Vite not starting
- Check if port 3000 is available
- Verify node_modules are installed: `npm install`

### API connection issues
- Verify `VITE_API_URL` in `.env`
- Check backend is running on port 8000
- Verify CORS settings in backend

### Translations not working
- Check i18n files are in `src/i18n/`
- Verify language codes match (en, uz, ru)
- Clear browser cache

## 📝 Notes

- All pages are mobile-responsive
- Dark mode not implemented (light theme only)
- Charts require data to display properly
- Toast notifications auto-dismiss after 3 seconds

