/**
 * API Service for Free Fire Glory
 * Handles all server communication
 */

class ApiService {
    constructor() {
        this.baseURL = window.location.hostname.includes('localhost') 
            ? 'http://localhost:3000/api'
            : 'https://api.freefire-glory.com';
        
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('auth_token');
        
        const config = {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers,
                'Authorization': token ? `Bearer ${token}` : ''
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }
    
    // Authentication
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }
    
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    async verifyToken(token) {
        return this.request('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }
    
    async updateUserStatus(userId, status) {
        return this.request('/users/status', {
            method: 'PUT',
            body: JSON.stringify({ user_id: userId, status })
        });
    }
    
    // Accounts
    async getAccounts() {
        return this.request('/accounts');
    }
    
    async addAccount(accountData) {
        return this.request('/accounts', {
            method: 'POST',
            body: JSON.stringify(accountData)
        });
    }
    
    async updateAccount(accountId, data) {
        return this.request(`/accounts/${accountId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async deleteAccount(accountId) {
        return this.request(`/accounts/${accountId}`, {
            method: 'DELETE'
        });
    }
    
    // Clans
    async getClans() {
        return this.request('/clans');
    }
    
    async sendClanInvite(inviteData) {
        return this.request('/clans/invite', {
            method: 'POST',
            body: JSON.stringify(inviteData)
        });
    }
    
    async getClanMembers(clanId) {
        return this.request(`/clans/${clanId}/members`);
    }
    
    // Glory Farming
    async startFarming(accountId) {
        return this.request(`/farming/start/${accountId}`, {
            method: 'POST'
        });
    }
    
    async stopFarming(accountId) {
        return this.request(`/farming/stop/${accountId}`, {
            method: 'POST'
        });
    }
    
    async getFarmingStats() {
        return this.request('/farming/stats');
    }
    
    // Sync
    async autoSave(data) {
        return this.request('/sync/save', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async sync(localData) {
        return this.request('/sync', {
            method: 'POST',
            body: JSON.stringify(localData)
        });
    }
    
    // Game API (Free Fire)
    async getGameData(uid) {
        return this.request(`/game/player/${uid}`);
    }
    
    async getClanInfo(clanId) {
        return this.request(`/game/clan/${clanId}`);
    }
    
    // Notifications
    async sendNotification(notification) {
        return this.request('/notifications', {
            method: 'POST',
            body: JSON.stringify(notification)
        });
    }
    
    // Analytics
    async getAnalytics(period = 'today') {
        return this.request(`/analytics/${period}`);
    }
}

window.ApiService = ApiService;
