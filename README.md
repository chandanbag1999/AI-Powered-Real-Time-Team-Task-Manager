# TaskMate - AI-Powered Real-Time Team Task Manager

<div align="center">
  <img src="https://github.com/user-attachments/assets/your-demo-image.png" alt="TaskMate Demo" width="800"/>
  
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge)](https://ai-powered-real-time-team-task-mana.vercel.app)
  [![Backend API](https://img.shields.io/badge/Backend%20API-Render-green?style=for-the-badge)](https://ai-powered-real-time-team-task-manager.onrender.com)
  
  **AI-powered, real-time task manager built to make teams faster and projects smarter.**
</div>

## 🚀 Overview

TaskMate is a modern, full-stack task management application that combines the power of artificial intelligence with real-time collaboration features. Built with cutting-edge technologies, it provides teams with an intuitive platform to manage projects, track tasks, and collaborate seamlessly in real-time.

### ✨ Key Features

- **🤖 AI-Powered Task Management** - Intelligent task suggestions and automation
- **⚡ Real-Time Collaboration** - Live updates across all connected clients
- **🔐 Secure Authentication** - JWT-based authentication with refresh tokens
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices
- **🎯 Drag & Drop Interface** - Intuitive task management with visual feedback
- **👥 Team Management** - Role-based access control and user administration
- **📊 Project Analytics** - Comprehensive insights and reporting
- **🔔 Real-Time Notifications** - Instant updates on task changes
- **🌙 Modern UI/UX** - Clean, professional interface with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management with RTK Query
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **Sonner** - Toast notifications
- **DnD Kit** - Drag and drop functionality

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Image and file management
- **Nodemailer** - Email functionality

### DevOps & Deployment
- **Vercel** - Frontend deployment
- **Render** - Backend deployment
- **MongoDB Atlas** - Cloud database
- **Git** - Version control

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Vercel        │    │   Render        │    │   Atlas         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Socket.IO
           (Real-time sync)
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-powered-real-time-team-task-manager.git
   cd ai-powered-real-time-team-task-manager
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Configure your environment variables
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Configure your environment variables
   ```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 📱 Features in Detail

### Authentication & Security
- Secure user registration and login
- JWT-based authentication with refresh tokens
- Password reset functionality
- Role-based access control (Admin, User)
- Protected routes and API endpoints

### Task Management
- Create, edit, and delete tasks
- Drag and drop task organization
- Task status tracking (Todo, In Progress, Done)
- Task assignment to team members
- Due date management
- File attachments support

### Real-Time Collaboration
- Live task updates across all clients
- Real-time notifications
- Socket.IO integration for instant sync
- Connection status indicators

### Project Management
- Create and manage multiple projects
- Project-based task organization
- Team member management
- Project analytics and insights

### Admin Panel
- User management
- System monitoring
- Email configuration
- Maintenance mode control

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Configure environment variables
3. Set build and start commands
4. Deploy automatically on push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Socket.IO for real-time capabilities
- Tailwind CSS for the utility-first approach
- MongoDB for the flexible database solution
- All contributors and supporters

## 📞 Support

For support, email support@taskmate.com or join our Slack channel.

## 🔗 Links

- **Live Application**: [https://ai-powered-real-time-team-task-mana.vercel.app](https://ai-powered-real-time-team-task-mana.vercel.app)
- **Backend API**: [https://ai-powered-real-time-team-task-manager.onrender.com](https://ai-powered-real-time-team-task-manager.onrender.com)
- **Documentation**: [Coming Soon]
- **Bug Reports**: [GitHub Issues](https://github.com/yourusername/ai-powered-real-time-team-task-manager/issues)

---

<div align="center">
  Made with ❤️ by the TaskMate Team
  
  ⭐ Star us on GitHub if you find this project helpful!
</div>
