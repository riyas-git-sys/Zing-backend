# Zing Chat - Backend

A robust Node.js backend with Express and MongoDB that powers the Zing chat application, providing real-time messaging capabilities with Socket.io.

---

## Click Here For View [Backend](https://zing-backend-orpin.vercel.app) Deployment

## 🏗️ Architecture

The backend is built with a modular architecture that separates concerns and ensures scalability:  
zing-chat-backend/  
├── controllers/  
│ ├── auth.controller.js  
│ ├── chat.controller.js  
│ ├── message.controller.js  
│ └── user.controller.js  
├── middlewares/  
│ ├── auth.js  
│ ├── upload.js  
│ └── validate.js  
├── models/  
│ ├── chat.model.js  
│ ├── message.model.js  
│ └── user.model.js  
├── routes/  
│ ├── authRoutes.js  
│ ├── chats.js  
│ ├── message.routes.js  
│ └── userRoutes.js  
├── services/  
│ └── email.service.js  
├── utils/  
│ └── cloudinary.js  
├── validations/  
│ └── auth.validation.js  
├── uploads/  
├── .env  
├── .gitignore  
├── app.js  
├── package.json  
├── package-lock.json  
├── server.js  
└── vercel.json  

---

## ✨ Features

- 🔐 **JWT Authentication** - Secure user authentication with tokens  
- 💬 **Real-time Messaging** - Powered by Socket.io for instant delivery  
- 👥 **Group Management** - Create, update, and delete group chats  
- 👮 **Admin Controls** - Role-based access control for group administration  
- 📧 **Email Service** - Password reset and notifications  
- 🛡️ **Security Middleware** - Rate limiting, CORS, and input validation  
- 📊 **Database Management** - MongoDB with Mongoose ODM  
- 🔍 **API Documentation** - Comprehensive API docs with examples  

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)  
- MongoDB (v4.4 or higher)  
- npm or yarn  

### Installation
1. Clone the repository:
```bash
git clone <your-repo-url>
cd zing-chat-backend

npm install
# or
yarn install

cp .env.example .env
# Edit .env with your configuration:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zing-chat
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:3000

# Start the development server:
npm run dev
# or
yarn dev

```
### The server will run on http://localhost:5000

## 📦 API Endpoints

### Authentication
Method	Endpoint	Description  
POST	/api/auth/register	User registration  
POST	/api/auth/login	User login  
POST	/api/auth/forgot-password	Request password reset  
POST	/api/auth/reset-password	Reset password with token  

### Users
Method	Endpoint	Description  
GET	/api/users	Get all users (admin only)  
GET	/api/users/:id	Get user by ID  
PUT	/api/users/:id	Update user profile  
DELETE	/api/users/:id	Delete user account  

### Chats
Method	Endpoint	Description  
GET	/api/chats	Get user's chats  
POST	/api/chats	Create new chat  
GET	/api/chats/:id	Get specific chat  
PUT	/api/chats/:id	Update chat  
DELETE	/api/chats/:id	Delete chat  

### Messages
Method	Endpoint	Description  
GET	/api/messages/:chatId	Get messages for a chat  
POST	/api/messages	Send a message  
DELETE	/api/messages/:id	Delete a message  

### Groups
Method	Endpoint	Description  
POST	/api/groups	Create a group  
GET	/api/groups/:id	Get group details  
PUT	/api/groups/:id	Update group  
DELETE	/api/groups/:id	Delete group  
POST	/api/groups/:id/members	Add member to group  
DELETE	/api/groups/:id/members/:userId	Remove member from group  

## 🔌 Real-time Events (Socket.io)

## Emitted Events  

newMessage - Send a new message  

typing - User is typing  

stopTyping - User stopped typing  

joinChat - Join a chat room  

leaveChat - Leave a chat room  

## Listened Events

setup - Set up user connection  

newMessage - Receive a new message  

typing - Someone is typing  

stopTyping - Someone stopped typing  

## 🗃️ Database Models

### User Model
```
{
  name: String,
  email: String,
  password: String,
  avatar: String,
  isOnline: Boolean,
  lastSeen: Date
}
```

### Chat Model
```
{
  chatName: String,
  isGroupChat: Boolean,
  users: [ObjectId],
  groupAdmin: ObjectId,
  latestMessage: ObjectId
}
```

### Message Model
```
{
  sender: ObjectId,
  content: String,
  chat: ObjectId,
  readBy: [ObjectId]
}
```

## 🛡️ Security Features

Password hashing with bcrypt

JWT token authentication

Rate limiting on authentication endpoints

CORS configuration

Input validation and sanitization

MongoDB injection prevention

## 🧪 Testing
```
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🚀 Deployment
### Environment Setup

Set up production environment variables

Ensure MongoDB connection string is correct

Configure email service for production

### With PM2
```
npm install -g pm2
pm2 start server.js --name zing-backend
pm2 save
pm2 startup
```
### With Docker
```
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📊 Monitoring

### Health check endpoints:

GET /health → API health status

GET /health/db → Database connection status

## 🤝 Contributing

Fork the project

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE
 file for details.

## 🆘 Support

If you have any questions or issues, please create an issue in the GitHub repository or contact the development team.

```
---

✅ Now your README uses your **real project structure** instead of the placeholder image.  

Do you also want me to **add a “Tech Stack” section** (like Node.js, Express, MongoDB, Socket.io, etc.) for better presentation?
```
