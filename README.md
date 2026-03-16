# Toetsen - Test Management for Dutch Secondary Schools

A comprehensive web application for Dutch secondary school teachers to manage the entire lifecycle of tests, from creation and planning to grading and discussion.

## Features

### Class Management
- Create and manage classes with name, subject, and school year
- Add students to classes with names and student numbers
- Archive classes when the school year ends
- View class overview with test counts and pending actions

### Test Management
- Create tests with title, class, subject, scheduled date/time, and description
- Four-stage workflow: Gepland → Klaar voor Nakijken → Nagekeken → Afgerond
- Automatic grade entry creation for all students in a class
- Soft-delete tests to trash with restore functionality

### Multiple Views
- **Dashboard**: Overview of all classes and upcoming tests
- **Toetsenlijst**: Sortable table view with filtering by class and date
- **Kalender**: Monthly calendar view showing scheduled tests
- **Kanban**: Drag-and-drop board organized by test status
- **Archief**: Manage archived classes and deleted tests

### Grading Interface
- Track grading progress for each test
- Mark individual students as graded
- Visual progress bars showing completion (e.g., 4/8 students)
- View test details with student list

### Additional Features
- Global search across tests and classes
- Status-based workflow tracking
- Secure authentication with Supabase
- Row-level security ensuring data isolation per teacher
- Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Database Schema

- `classes`: Teacher's classes with subject and school year
- `students`: Students belonging to classes
- `tests`: Tests with scheduling, status, and soft-delete
- `grades`: Individual student grades linked to tests

All tables have Row Level Security enabled to ensure teachers can only access their own data.

## Getting Started

1. Set up your Supabase project and add credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Usage

1. **Sign up/Login**: Create an account or log in with your email
2. **Create Classes**: Click "Nieuwe Klas" to add your classes
3. **Add Students**: Click on a class to add student names
4. **Create Tests**: Click "Nieuwe Toets" to schedule a test
5. **Track Progress**: Use the Kanban or Dashboard to see what needs attention
6. **Mark as Graded**: Click on a test to mark students as graded
7. **Archive**: Archive old classes at the end of the school year

## Key Workflows

### Creating a Test
1. Click "Nieuwe Toets" button
2. Enter test details (title, class, subject, date/time)
3. Test is automatically created with status "gepland"
4. Grade entries are created for all students in the class

### Grading Workflow
1. Test appears in "Gepland" column on Kanban board
2. After test date, drag to "Klaar voor Nakijken"
3. Click test to open detail view
4. Mark students as graded one by one
5. Move to "Nagekeken" when all students are graded
6. Finally move to "Afgerond" when complete

### Managing Classes
1. Click on a class card in Dashboard
2. Add students using the form
3. Students automatically appear in all new tests for that class
4. Archive class when school year ends

## Security

- All data is isolated per user using Row Level Security
- Authentication required for all operations
- Passwords are securely hashed by Supabase Auth
- Users can only view and modify their own data
