import request from 'supertest';
import app from '../../../server.js';
import prisma from '../../../src/config/db.js';
import { createUser } from '../../factories/factories.js';
import { getAuthHeaders } from '../../helpers/test-auth.js';
import * as notificationService from '../../../src/modules/notification/notification.service.js';

describe('Notifications API Tests', () => {
  it('should retrieve list of notifications for authenticated user', async () => {
    const user = await createUser();
    
    // Create direct mock notifications
    await notificationService.createNotification(user.id, 'LIKE', 'Alice liked your post.');
    await notificationService.createNotification(user.id, 'COMMENT', 'Bob commented on your post.');

    const response = await request(app)
      .get('/api/notifications')
      .set(getAuthHeaders(user));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.notifications.length).toBe(2);
    expect(response.body.notifications[0].type).toBe('COMMENT');
  });

  it('should mark a notification as read', async () => {
    const user = await createUser();
    const notification = await notificationService.createNotification(user.id, 'LIKE', 'Alice liked your post.');

    const response = await request(app)
      .put(`/api/notifications/${notification.id}/read`)
      .set(getAuthHeaders(user));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.notification.isRead).toBe(true);
  });

  it('should retrieve unread notifications count', async () => {
    const user = await createUser();
    
    await notificationService.createNotification(user.id, 'LIKE', 'Alice liked your post.');
    const secondNotif = await notificationService.createNotification(user.id, 'COMMENT', 'Bob commented on your post.');
    
    // Mark one as read
    await notificationService.markAsRead(secondNotif.id, user.id);

    const response = await request(app)
      .get('/api/notifications/unread-count')
      .set(getAuthHeaders(user));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
  });
});
