// Deadline Alerts Manager
const DeadlineAlerts = {
    loadNotifications: async function() {
        try {
            const response = await fetch('/api/tasks/notifications');
            const data = await response.json();
            if (data.status === 'success') {
                this.renderNotifications(data.notifications, data.total);
            }
        } catch (error) {
            console.error('Error loading deadline notifications:', error);
        }
    },
    
    renderNotifications: function(notifications, total) {
        // רינדור התראות בדשבורד או בחלון נפרד
        const urgentCount = notifications.urgent.length;
        const warningCount = notifications.warning.length;
        const approachingCount = notifications.approaching.length;
        
        // עדכן באדג' בכפתור התראות (אם קיים)
        const alertBadge = document.getElementById('deadlineAlertBadge');
        if (alertBadge) {
            alertBadge.textContent = total > 99 ? '99+' : total;
            alertBadge.style.display = total > 0 ? 'flex' : 'none';
        }
        
        // אם יש התראות דחופות, הצג התראה בדשבורד - כרגע מושבת
        // if (urgentCount > 0) {
        //     this.showUrgentAlert(notifications.urgent);
        // }
    },
    
    showUrgentAlert: function(urgentTasks) {
        // יצירת התראה פופ-אפ או באנר
        const alertContainer = document.createElement('div');
        alertContainer.id = 'deadlineUrgentAlert';
        alertContainer.style.cssText = 'position: fixed; top: 80px; left: 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 12px; padding: 15px 20px; z-index: 10001; max-width: 400px; box-shadow: 0 4px 12px rgba(239,68,68,0.3);';
        // יצירת כפתור הקישור - כפתור שנראה כמו קישור עם onclick מפורש
        const dashboardLink = document.createElement('span');
        dashboardLink.textContent = 'צפה בדשבורד';
        dashboardLink.style.cssText = 'color: #0073ea; text-decoration: underline; font-size: 0.85rem; margin-top: 8px; display: inline-block; cursor: pointer; font-weight: 600;';
        dashboardLink.addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.href = '/';
        });
        
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;';
        
        const textDiv = document.createElement('div');
        textDiv.style.flex = '1';
        
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = 'font-weight: bold; color: #ef4444; margin-bottom: 8px; font-size: 1.1rem;';
        titleDiv.textContent = '⚠️ התראות דחופות';
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = 'color: #292f4c; font-size: 0.9rem; margin-bottom: 8px;';
        messageDiv.textContent = `יש ${urgentTasks.length} משימות עם deadline דחוף או שעבר`;
        
        textDiv.appendChild(titleDiv);
        textDiv.appendChild(messageDiv);
        textDiv.appendChild(dashboardLink);
        
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = 'background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; padding: 0; line-height: 1;';
        closeButton.addEventListener('click', function() {
            alertContainer.remove();
        });
        
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(closeButton);
        alertContainer.appendChild(contentDiv);
        document.body.appendChild(alertContainer);
        
        // הסר אוטומטית אחרי 10 שניות
        setTimeout(() => {
            if (alertContainer.parentElement) {
                alertContainer.remove();
            }
        }, 10000);
    }
};

// טען התראות בעת טעינת הדף
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DeadlineAlerts.loadNotifications());
} else {
    DeadlineAlerts.loadNotifications();
}

// עדכן כל 5 דקות
setInterval(() => DeadlineAlerts.loadNotifications(), 5 * 60 * 1000);

