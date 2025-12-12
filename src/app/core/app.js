/**
 * Free Fire Glory Pro - Core Application
 * تطبيق ويب قوي 100% يعمل بكفاءة كاملة
 */

class GloryApp {
    constructor() {
        this.version = '1.0.0';
        this.name = 'Free Fire Glory Pro';
        this.isOnline = true;
        this.isAuthenticated = false;
        this.user = null;
        this.settings = {};
        this.modules = {};
        
        // Initialize core components
        this.store = new AppStore();
        this.router = new AppRouter();
        this.api = new ApiService();
        this.db = new DatabaseService();
        this.notify = new NotificationService();
        
        console.log(`🎮 ${this.name} v${this.version}`);
    }
    
    async init() {
        try {
            // 1. Load settings
            await this.loadSettings();
            
            // 2. Initialize database
            await this.db.init();
            
            // 3. Check authentication
            await this.checkAuth();
            
            // 4. Initialize modules
            await this.initModules();
            
            // 5. Setup event listeners
            this.setupEvents();
            
            // 6. Start background services
            this.startServices();
            
            // 7. Update UI
            this.updateUI();
            
            // 8. Check for updates
            this.checkUpdates();
            
            console.log('✅ التطبيق جاهز للعمل!');
            
            // Notify user
            this.notify.success('تم تحميل التطبيق بنجاح', 'مرحباً بك في Glory Pro');
            
        } catch (error) {
            console.error('❌ فشل تهيئة التطبيق:', error);
            this.notify.error('خطأ في التطبيق', 'حدث خطأ أثناء تحميل التطبيق');
        }
    }
    
    async loadSettings() {
        // Load from localStorage or defaults
        this.settings = {
            theme: localStorage.getItem('theme') || 'dark',
            language: localStorage.getItem('language') || 'ar',
            autoStart: localStorage.getItem('autoStart') === 'true',
            notifications: localStorage.getItem('notifications') !== 'false',
            sound: localStorage.getItem('sound') === 'true',
            maxAccounts: parseInt(localStorage.getItem('maxAccounts')) || 10,
            gloryTarget: parseInt(localStorage.getItem('gloryTarget')) || 100000
        };
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }
    
    async checkAuth() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
            try {
                // Verify token
                const verified = await this.api.verifyToken(token);
                
                if (verified) {
                    this.user = JSON.parse(userData);
                    this.isAuthenticated = true;
                    
                    // Update user status
                    this.api.updateUserStatus(this.user.id, 'online');
                    
                    return true;
                }
            } catch (error) {
                console.warn('Token verification failed:', error);
                this.logout();
            }
        }
        
        // Redirect to login if not authenticated
        if (!this.isAuthenticated && !window.location.hash.includes('login')) {
            this.router.navigate('/login');
        }
        
        return false;
    }
    
    async initModules() {
        // Initialize all modules
        this.modules = {
            auth: new AuthModule(this),
            accounts: new AccountsModule(this),
            clans: new ClanModule(this),
            glory: new GloryModule(this),
            tasks: new TaskModule(this),
            analytics: new AnalyticsModule(this)
        };
        
        // Initialize each module
        for (const [name, module] of Object.entries(this.modules)) {
            try {
                await module.init();
                console.log(`✅ Module ${name} initialized`);
            } catch (error) {
                console.error(`❌ Failed to initialize module ${name}:`, error);
            }
        }
    }
    
    setupEvents() {
        // Online/Offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notify.info('تم استعادة الاتصال', 'أنت الآن متصل بالإنترنت');
            this.updateConnectionStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notify.warning('فقدان الاتصال', 'أنت الآن غير متصل بالإنترنت');
            this.updateConnectionStatus();
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.onAppFocus();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Quick actions
        document.getElementById('quickActionBtn')?.addEventListener('click', () => {
            this.toggleQuickActions();
        });
        
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }
    
    startServices() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000);
        
        // Sync with server every minute
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.syncData();
            }
        }, 60000);
        
        // Check glory farming every 10 seconds
        this.farmingCheckInterval = setInterval(() => {
            this.checkFarmingStatus();
        }, 10000);
        
        // Update UI every 5 seconds
        this.uiUpdateInterval = setInterval(() => {
            this.updateLiveStats();
        }, 5000);
    }
    
    async login(username, password) {
        try {
            this.notify.loading('جاري تسجيل الدخول...');
            
            const result = await this.api.login({
                username: username,
                password: password,
                device: this.getDeviceInfo()
            });
            
            if (result.success) {
                // Store token and user data
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('user_data', JSON.stringify(result.user));
                
                // Update app state
                this.user = result.user;
                this.isAuthenticated = true;
                
                // Update UI
                this.updateUI();
                
                // Redirect to dashboard
                this.router.navigate('/dashboard');
                
                this.notify.success('تم تسجيل الدخول', `مرحباً ${this.user.username}!`);
                
                // Log login
                this.logActivity('user_login', {
                    user_id: this.user.id,
                    timestamp: new Date().toISOString()
                });
                
                return true;
            } else {
                throw new Error(result.message || 'فشل تسجيل الدخول');
            }
        } catch (error) {
            this.notify.error('خطأ في تسجيل الدخول', error.message);
            return false;
        }
    }
    
    logout() {
        if (confirm('هل تريد تسجيل الخروج؟')) {
            // Update user status
            if (this.user) {
                this.api.updateUserStatus(this.user.id, 'offline');
            }
            
            // Clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            
            // Reset app state
            this.user = null;
            this.isAuthenticated = false;
            
            // Stop all services
            this.stopServices();
            
            // Redirect to login
            this.router.navigate('/login');
            
            this.notify.info('تم تسجيل الخروج', 'نراك قريباً!');
            
            // Log logout
            this.logActivity('user_logout', {
                timestamp: new Date().toISOString()
            });
        }
    }
    
    async addAccount(accountData) {
        try {
            // Validate account data
            const validation = this.validateAccountData(accountData);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Add account to database
            const account = await this.db.accounts.add({
                ...accountData,
                user_id: this.user.id,
                status: 'inactive',
                glory: 0,
                created_at: new Date().toISOString(),
                last_active: null,
                is_active: true
            });
            
            // Update UI
            await this.modules.accounts.refreshList();
            
            // Start farming if auto-start enabled
            if (this.settings.autoStart) {
                await this.startFarming(account.id);
            }
            
            this.notify.success('تم إضافة الحساب', `تمت إضافة الحساب ${accountData.uid} بنجاح`);
            
            return account;
        } catch (error) {
            this.notify.error('خطأ في إضافة الحساب', error.message);
            throw error;
        }
    }
    
    async startFarming(accountId) {
        try {
            const account = await this.db.accounts.get(accountId);
            
            if (!account) {
                throw new Error('الحساب غير موجود');
            }
            
            if (account.status === 'active') {
                throw new Error('الحساب يعمل بالفعل');
            }
            
            // Update account status
            await this.db.accounts.update(accountId, {
                status: 'active',
                last_active: new Date().toISOString()
            });
            
            // Start farming process
            await this.modules.glory.startFarming(accountId);
            
            // Update UI
            await this.modules.accounts.refreshList();
            
            this.notify.success('بدأ الجمع', `بدأ جمع القلوري للحساب ${account.uid}`);
            
            return true;
        } catch (error) {
            this.notify.error('خطأ في بدء الجمع', error.message);
            return false;
        }
    }
    
    async stopFarming(accountId) {
        try {
            const account = await this.db.accounts.get(accountId);
            
            if (!account) {
                throw new Error('الحساب غير موجود');
            }
            
            // Update account status
            await this.db.accounts.update(accountId, {
                status: 'inactive'
            });
            
            // Stop farming process
            await this.modules.glory.stopFarming(accountId);
            
            // Update UI
            await this.modules.accounts.refreshList();
            
            this.notify.info('توقف الجمع', `توقف جمع القلوري للحساب ${account.uid}`);
            
            return true;
        } catch (error) {
            this.notify.error('خطأ في إيقاف الجمع', error.message);
            return false;
        }
    }
    
    async sendClanInvites(clanId, count = 10) {
        try {
            this.notify.loading(`جاري إرسال ${count} دعوة...`);
            
            // Get active accounts
            const accounts = await this.db.accounts.getAll();
            const activeAccounts = accounts.filter(a => a.status === 'active');
            
            if (activeAccounts.length === 0) {
                throw new Error('لا توجد حسابات نشطة');
            }
            
            // Send invites through each account
            const results = [];
            for (let i = 0; i < Math.min(count, activeAccounts.length); i++) {
                const account = activeAccounts[i];
                
                try {
                    const result = await this.api.sendClanInvite({
                        account_token: account.token,
                        clan_id: clanId,
                        uid: account.uid
                    });
                    
                    results.push({
                        account: account.uid,
                        success: result.success,
                        message: result.message
                    });
                    
                    // Delay between requests to avoid rate limiting
                    await this.sleep(1000);
                    
                } catch (error) {
                    results.push({
                        account: account.uid,
                        success: false,
                        message: error.message
                    });
                }
            }
            
            // Calculate success rate
            const successful = results.filter(r => r.success).length;
            const successRate = (successful / results.length) * 100;
            
            this.notify.success('تم إرسال الدعوات', 
                `تم إرسال ${successful}/${results.length} دعوة (${successRate.toFixed(1)}%)`);
            
            return results;
        } catch (error) {
            this.notify.error('خطأ في إرسال الدعوات', error.message);
            throw error;
        }
    }
    
    async autoSave() {
        if (!this.isOnline) return;
        
        try {
            const data = {
                accounts: await this.db.accounts.getAll(),
                settings: this.settings,
                timestamp: new Date().toISOString()
            };
            
            await this.api.autoSave(data);
            
            // Update last sync time
            this.lastSync = new Date();
            
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }
    
    async syncData() {
        try {
            const localData = {
                accounts: await this.db.accounts.getAll(),
                last_sync: this.lastSync
            };
            
            const serverData = await this.api.sync(localData);
            
            // Merge changes
            if (serverData.accounts) {
                for (const account of serverData.accounts) {
                    await this.db.accounts.put(account);
                }
            }
            
            this.lastSync = new Date();
            
        } catch (error) {
            console.warn('Sync failed:', error);
        }
    }
    
    updateUI() {
        // Update username
        if (this.user) {
            const usernameEl = document.getElementById('username');
            if (usernameEl) {
                usernameEl.textContent = this.user.username;
            }
        }
        
        // Update connection status
        this.updateConnectionStatus();
        
        // Update stats
        this.updateStats();
        
        // Apply theme
        document.body.classList.toggle('dark-theme', this.settings.theme === 'dark');
        document.body.classList.toggle('light-theme', this.settings.theme === 'light');
    }
    
    updateConnectionStatus() {
        const statusEl = document.querySelector('.connection-status');
        if (statusEl) {
            const indicator = statusEl.querySelector('.status-indicator');
            const text = statusEl.querySelector('small');
            
            if (this.isOnline) {
                indicator.classList.remove('offline');
                indicator.classList.add('online');
                text.textContent = 'متصل';
            } else {
                indicator.classList.remove('online');
                indicator.classList.add('offline');
                text.textContent = 'غير متصل';
            }
        }
    }
    
    async updateStats() {
        try {
            const accounts = await this.db.accounts.getAll();
            const activeAccounts = accounts.filter(a => a.status === 'active');
            const totalGlory = accounts.reduce((sum, acc) => sum + (acc.glory || 0), 0);
            
            // Today's glory (since midnight)
            const today = new Date().toDateString();
            const todayGlory = accounts.reduce((sum, acc) => {
                if (new Date(acc.last_active).toDateString() === today) {
                    return sum + (acc.today_glory || 0);
                }
                return sum;
            }, 0);
            
            // Update UI elements
            document.getElementById('activeAccounts').textContent = activeAccounts.length;
            document.getElementById('todayGlory').textContent = todayGlory.toLocaleString();
            
        } catch (error) {
            console.warn('Failed to update stats:', error);
        }
    }
    
    updateLiveStats() {
        // Update real-time statistics
        this.updateStats();
    }
    
    checkFarmingStatus() {
        // Check if any farming processes need attention
        this.modules.glory.checkStatus();
    }
    
    onAppFocus() {
        // App came to foreground
        if (this.isAuthenticated) {
            this.updateStats();
            this.syncData();
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.autoSave();
            this.notify.info('تم الحفظ', 'تم حفظ البيانات بنجاح');
        }
        
        // Ctrl/Cmd + Q: Quick action
        if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
            e.preventDefault();
            this.toggleQuickActions();
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }
    
    toggleQuickActions() {
        const menu = document.getElementById('quickActionsMenu');
        menu.classList.toggle('show');
    }
    
    handleQuickAction(action) {
        this.toggleQuickActions();
        
        switch (action) {
            case 'addAccount':
                this.showAddAccountModal();
                break;
            case 'startAll':
                this.startAllFarming();
                break;
            case 'sendInvites':
                this.showInviteModal();
                break;
        }
    }
    
    async startAllFarming() {
        try {
            const accounts = await this.db.accounts.getAll();
            const inactiveAccounts = accounts.filter(a => a.status === 'inactive');
            
            if (inactiveAccounts.length === 0) {
                this.notify.info('لا يوجد حسابات', 'جميع الحسابات تعمل بالفعل');
                return;
            }
            
            this.notify.loading(`جاري تشغيل ${inactiveAccounts.length} حساب...`);
            
            // Start all inactive accounts
            for (const account of inactiveAccounts) {
                await this.startFarming(account.id);
                await this.sleep(500); // Delay between starts
            }
            
            this.notify.success('تم التشغيل', `تم تشغيل ${inactiveAccounts.length} حساب`);
            
        } catch (error) {
            this.notify.error('خطأ في التشغيل', error.message);
        }
    }
    
    showAddAccountModal() {
        // Show modal for adding account
        const modalHtml = `
            <div class="modal fade" id="addAccountModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="fas fa-user-plus"></i> إضافة حساب جديد</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="accountForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">UID الحساب *</label>
                                            <input type="text" class="form-control" name="uid" required 
                                                   placeholder="أدخل UID (9 أرقام)">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Token *</label>
                                            <input type="text" class="form-control" name="token" required
                                                   placeholder="أدخل Token الحساب">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Clan ID (اختياري)</label>
                                            <input type="text" class="form-control" name="clan_id"
                                                   placeholder="أدخل Clan ID">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">النوع</label>
                                            <select class="form-select" name="type">
                                                <option value="guest">ضيف</option>
                                                <option value="facebook">فيسبوك</option>
                                                <option value="google">جوجل</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="auto_start" id="autoStart">
                                        <label class="form-check-label" for="autoStart">
                                            بدء الجمع تلقائياً بعد الإضافة
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-primary" id="submitAccountBtn">إضافة</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('addAccountModal'));
        
        // Add submit handler
        document.getElementById('submitAccountBtn').addEventListener('click', async () => {
            const form = document.getElementById('accountForm');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            try {
                await this.addAccount(data);
                modal.hide();
            } catch (error) {
                console.error('Failed to add account:', error);
            }
        });
        
        modal.show();
        
        // Clean up after modal closes
        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
    }
    
    showInviteModal() {
        // Show modal for sending invites
        const modalHtml = `
            <div class="modal fade" id="inviteModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="fas fa-paper-plane"></i> إرسال دعوات كلان</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Clan ID *</label>
                                <input type="text" class="form-control" id="inviteClanId" 
                                       placeholder="أدخل Clan ID" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">عدد الدعوات</label>
                                <input type="number" class="form-control" id="inviteCount" 
                                       value="10" min="1" max="50">
                                <small class="text-muted">الحد الأقصى: 50 دعوة في المرة الواحدة</small>
                            </div>
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i>
                                سيتم إرسال الدعوات من جميع الحسابات النشطة
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-primary" id="sendInvitesBtn">إرسال</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('inviteModal'));
        
        // Add send handler
        document.getElementById('sendInvitesBtn').addEventListener('click', async () => {
            const clanId = document.getElementById('inviteClanId').value;
            const count = parseInt(document.getElementById('inviteCount').value) || 10;
            
            if (!clanId) {
                alert('يرجى إدخال Clan ID');
                return;
            }
            
            try {
                await this.sendClanInvites(clanId, count);
                modal.hide();
            } catch (error) {
                console.error('Failed to send invites:', error);
            }
        });
        
        modal.show();
        
        // Clean up after modal closes
        modal._element.addEventListener('hidden.bs.modal', () => {
            modal._element.remove();
        });
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            bootstrap.Modal.getInstance(modal)?.hide();
        });
    }
    
    stopServices() {
        // Clear all intervals
        clearInterval(this.autoSaveInterval);
        clearInterval(this.syncInterval);
        clearInterval(this.farmingCheckInterval);
        clearInterval(this.uiUpdateInterval);
        
        // Stop all modules
        Object.values(this.modules).forEach(module => {
            if (typeof module.stop === 'function') {
                module.stop();
            }
        });
    }
    
    checkUpdates() {
        // Check for app updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.update();
            });
        }
    }
    
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${window.screen.width}x${window.screen.height}`,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };
    }
    
    validateAccountData(data) {
        const errors = [];
        
        if (!data.uid || data.uid.length < 9) {
            errors.push('UID غير صالح');
        }
        
        if (!data.token || data.token.length < 10) {
            errors.push('Token غير صالح');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
    
    logActivity(type, data) {
        // Log activity to database
        this.db.logs.add({
            type: type,
            user_id: this.user?.id,
            data: data,
            timestamp: new Date().toISOString()
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global instance
window.GloryApp = GloryApp;
