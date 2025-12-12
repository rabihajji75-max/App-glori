/**
 * Free Fire Glory Pro Server
 * خادم تطبيقي كامل بقاعدة بيانات حقيقية
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const clanRoutes = require('./routes/clans');
const gloryRoutes = require('./routes/glory');
const syncRoutes = require('./routes/sync');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorMiddleware = require('./middleware/error');
const validationMiddleware = require('./middleware/validation');

// Import database
const { connectDB, sequelize } = require('./database');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.freefire.com"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'لقد تجاوزت عدد الطلبات المسموح به. الرجاء المحاولة لاحقاً.'
    }
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'https://freefire-glory-pro.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Static files
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', authMiddleware, accountRoutes);
app.use('/api/clans', authMiddleware, clanRoutes);
app.use('/api/glory', authMiddleware, gloryRoutes);
app.use('/api/sync', authMiddleware, syncRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'الخادم يعمل بشكل طبيعي',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: sequelize.authenticated ? 'متصل' : 'غير متصل'
    });
});

// Error handling middleware
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'الصفحة غير موجودة'
    });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Connect to database
        await connectDB();
        console.log('✅ تم الاتصال بقاعدة البيانات');
        
        // Sync database models
        await sequelize.sync({ alter: true });
        console.log('✅ تم مزامنة قاعدة البيانات');
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
            console.log(`🌐 عنوان التطبيق: http://localhost:${PORT}`);
            console.log(`📊 لوحة الإدارة: http://localhost:${PORT}/admin`);
        });
        
    } catch (error) {
        console.error('❌ فشل تشغيل الخادم:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ خطأ غير متوقع:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ وعد مرفوض غير معالج:', reason);
});

// Start the server
startServer();

// Export for testing
module.exports = app;
