// COS MATE Frontend Application
class COSMateApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkHealth();
    }

    setupEventListeners() {
        // Start Studying button
        const startBtn = document.getElementById('startStudying');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.showNotification('Opening chat...', 'info');
                // TODO: Open chat interface
            });
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Contact buttons
        document.querySelectorAll('.btn-whatsapp, .btn-telegram').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = btn.classList.contains('btn-whatsapp') ? 'WhatsApp' : 'Telegram';
                this.showNotification(`Connecting to ${platform}...`, 'info');
                // TODO: Connect to platform
            });
        });
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            console.log('COS MATE Health Check:', data);
            
            if (data.status === 'online') {
                this.showNotification('COS MATE is online', 'success');
            }
        } catch (error) {
            console.error('Health check failed:', error);
            this.showNotification('Connection issue - some features may be unavailable', 'warning');
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#4f46e5'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new COSMateApp();
});