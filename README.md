# TIMS - Total Inventory Management System

A comprehensive inventory management system built for hackathon demonstration, featuring full-stack TypeScript implementation with React, Node.js, Express, and MySQL.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure JWT-based login/registration with role-based access control
- **Product Management** - CRUD operations, stock tracking, low-stock alerts, categorization
- **Supplier Management** - Supplier profiles, contact management, product associations
- **Transaction Tracking** - Sales, purchases, and stock adjustments with detailed history
- **Real-time Dashboard** - Analytics, charts, and key performance indicators
- **Search & Filtering** - Advanced search capabilities across all data types

### Technical Features
- **TypeScript** - End-to-end type safety
- **Responsive Design** - Mobile-friendly interface with TailwindCSS
- **RESTful API** - Well-documented API with proper error handling
- **Database Optimization** - Indexed queries, stored procedures, and views
- **Security** - Input validation, CORS, rate limiting, SQL injection prevention
- **Docker Support** - Complete containerization for easy deployment
- **Modern UI** - Clean, intuitive interface with smooth interactions

## 📋 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form management
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **Joi** - Input validation
- **Winston** - Logging
- **Helmet** - Security headers

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Docker and Docker Compose
- MySQL client (optional)

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd TIM
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

### Manual Installation

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Build the application**
```bash
npm run build
```

5. **Start the development server**
```bash
npm run dev
```

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API URL
```

4. **Start the development server**
```bash
npm start
```

#### Database Setup

1. **Create MySQL database**
```sql
CREATE DATABASE tims_hackathon;
```

2. **Import the schema**
```bash
mysql -u username -p tims_hackathon < database/schema.sql
```

## 📊 Database Schema

### Core Tables
- **users** - User accounts and authentication
- **suppliers** - Supplier information and contacts
- **products** - Product catalog with stock tracking
- **transactions** - Transaction history and audit trail

### Views & Procedures
- **low_stock_products** - Automated low stock alerts
- **dashboard_stats** - Pre-calculated dashboard metrics
- **GetProductStockStatus** - Stock status procedure
- **GetMonthlySalesSummary** - Sales analytics procedure

## 🔐 Authentication & Authorization

### User Roles
- **Admin** - Full system access and user management
- **Manager** - Product, supplier, and transaction management
- **User** - Read access and basic transaction creation

### API Security
- JWT token-based authentication
- Role-based access control (RBAC)
- Request rate limiting
- Input validation and sanitization
- CORS configuration
- Security headers (Helmet.js)

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
GET  /api/auth/profile      - Get user profile
PUT  /api/auth/profile      - Update profile
PUT  /api/auth/change-password - Change password
```

### Product Endpoints
```
GET    /api/products           - List products (with pagination/filters)
GET    /api/products/:id       - Get single product
POST   /api/products           - Create product
PUT    /api/products/:id       - Update product
DELETE /api/products/:id       - Delete product
POST   /api/products/:id/adjust-stock - Adjust stock
GET    /api/products/low-stock - Get low stock products
```

### Supplier Endpoints
```
GET    /api/suppliers          - List suppliers
GET    /api/suppliers/:id      - Get single supplier
POST   /api/suppliers          - Create supplier
PUT    /api/suppliers/:id      - Update supplier
DELETE /api/suppliers/:id      - Delete supplier
GET    /api/suppliers/stats    - Get supplier statistics
```

### Transaction Endpoints
```
GET    /api/transactions       - List transactions
GET    /api/transactions/:id   - Get single transaction
POST   /api/transactions       - Create transaction
POST   /api/transactions/sale  - Process sale
POST   /api/transactions/purchase - Process purchase
GET    /api/transactions/stats - Get transaction statistics
```

## 🎯 Usage Examples

### Default Login Credentials
- **Email**: admin@tims.com
- **Password**: admin123

### Creating a Product
```javascript
const product = {
  name: "Wireless Mouse",
  description: "Ergonomic wireless mouse",
  sku: "WM-001",
  category: "Electronics",
  price: 29.99,
  quantity: 100,
  minStockLevel: 20,
  supplierId: 1
};
```

### Processing a Sale
```javascript
const sale = {
  productId: 1,
  quantity: 5,
  unitPrice: 29.99,
  customerName: "John Doe",
  notes: "Online order"
};
```

## 🐳 Docker Commands

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Production
```bash
# Start with nginx proxy
docker-compose --profile production up -d

# Scale services
docker-compose up -d --scale backend=2
```

## 🔧 Development

### Code Style
- ESLint and Prettier configured
- TypeScript strict mode enabled
- Consistent naming conventions
- Comprehensive error handling

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## 📈 Performance Optimization

### Database Optimization
- Indexed queries for fast lookups
- Stored procedures for complex operations
- Connection pooling
- Query optimization

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- Caching strategies

### Backend Optimization
- Request caching
- Compression middleware
- Response time monitoring
- Memory usage optimization

## 🚀 Deployment Options

### Vercel (Frontend)
1. Connect GitHub repository to Vercel
2. Configure build settings
3. Set environment variables
4. Deploy automatically on push

### Render (Backend)
1. Connect GitHub repository to Render
2. Configure Node.js service
3. Set up database and environment
4. Deploy backend API

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [API documentation](#-api-documentation)
- Review the [database schema](#-database-schema)

## 🎉 Hackathon Notes

This project was built for a hackathon demonstration and showcases:
- Full-stack TypeScript development
- Modern web development practices
- Database design and optimization
- Containerization and deployment
- Security best practices
- User experience design

**Built with ❤️ by the TIMS Team**