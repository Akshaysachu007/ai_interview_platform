import express from 'express';
import Notification from '../models/Notification.js';
import NotificationService from '../services/notificationService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for logged-in candidate
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { recipientId: req.candidate.id };
    
    // Filter for unread only if requested
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('interviewId', 'stream difficulty applicationStatus status')
      .populate('recruiterId', 'name company')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.candidate.id);
    res.json({ count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Verify notification belongs to this candidate
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipientId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await NotificationService.markAsRead(notificationId);

    if (result.success) {
      res.json({ message: 'Notification marked as read', notification: result.notification });
    } else {
      res.status(500).json({ message: 'Error marking as read', error: result.error });
    }

  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.candidate.id);

    if (result.success) {
      res.json({ 
        message: 'All notifications marked as read', 
        modifiedCount: result.modifiedCount 
      });
    } else {
      res.status(500).json({ message: 'Error marking all as read', error: result.error });
    }

  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Verify notification belongs to this candidate
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipientId.toString() !== req.candidate.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const result = await NotificationService.deleteNotification(notificationId);

    if (result.success) {
      res.json({ message: 'Notification deleted successfully' });
    } else {
      res.status(500).json({ message: 'Error deleting notification', error: result.error });
    }

  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete all notifications
router.delete('/', auth, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipientId: req.candidate.id });
    res.json({ 
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Delete all notifications error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
