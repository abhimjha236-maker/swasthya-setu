import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get notifications for current user / role
router.get('/', authenticateToken, (req, res) => {
  const user = req.user;
  let notifications = db.getCollection('notifications');

  // Filter by user ID or role target
  notifications = notifications.filter(n => 
    n.user_id === user.id || 
    n.role_target === user.role ||
    n.role_target === 'all'
  );

  notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    success: true,
    total: notifications.length,
    unread_count: notifications.filter(n => !n.is_read).length,
    data: notifications
  });
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const { id } = req.params;
  const notif = db.findById('notifications', id);
  if (!notif) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  const updated = db.update('notifications', notif.id, { is_read: true });
  res.json({ success: true, data: updated });
});

// Mark all as read
router.post('/mark-all-read', authenticateToken, (req, res) => {
  const user = req.user;
  const notifications = db.getCollection('notifications');
  
  notifications.forEach(n => {
    if (n.user_id === user.id || n.role_target === user.role) {
      n.is_read = true;
    }
  });

  db.save();
  res.json({ success: true, message: 'All notifications marked as read' });
});

export default router;
