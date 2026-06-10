# Notification System Design

## Stage 1

### API Design

For the notification system, I would create the following APIs:

| Method | Endpoint                                                  | Purpose                         |
| ------ | --------------------------------------------------------- | ------------------------------- |
| POST   | /notifications                                            | Create a new notification       |
| GET    | /students/{studentId}/notifications                       | Get notifications of a student  |
| PATCH  | /students/{studentId}/notifications/{notificationId}/read | Mark notification as read       |
| PATCH  | /students/{studentId}/notifications/read-all              | Mark all notifications as read  |
| DELETE | /students/{studentId}/notifications/{notificationId}      | Delete a notification           |
| GET    | /students/{studentId}/notifications/stream                | Receive real-time notifications |

Example request:

```json
{
  "type": "Placement",
  "title": "Interview Schedule",
  "message": "Interview schedule has been released",
  "studentIds": ["S101", "S102"]
}
```

Example response:

```json
{
  "id": "N1001",
  "message": "Notification created successfully"
}
```

For real-time updates, I would use Server Sent Events (SSE) because notifications mostly flow from server to client and SSE is simple to implement.

---

## Stage 2

### Database Design

I would use PostgreSQL because it is reliable and works well for structured data.

Tables:

#### Students

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY,
    roll_no VARCHAR(50),
    email VARCHAR(255)
);
```

#### Notifications

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    notification_type VARCHAR(30),
    title VARCHAR(200),
    message TEXT,
    created_at TIMESTAMP
);
```

#### Student Notifications

```sql
CREATE TABLE student_notifications (
    student_id UUID,
    notification_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(student_id, notification_id)
);
```

Some possible challenges are duplicate notifications and slow queries when the number of notifications becomes large. These can be handled using indexes and proper constraints.

---

## Stage 3

### Query Optimization

Given query:

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC;
```

This query may become slow when the table size increases.

To improve performance, I would create an index:

```sql
CREATE INDEX idx_notifications_student_read
ON notifications(studentID, isRead, createdAt DESC);
```

This helps the database find unread notifications faster and also supports sorting by creation date.

Adding too many indexes is not recommended because it increases storage and slows down insert operations.

---

## Stage 4

### Handling Database Overload

If many students keep refreshing the notification page, database load can increase significantly.

To reduce load:

1. Use Redis caching for frequently accessed data.
2. Use pagination instead of loading all notifications.
3. Push new notifications using SSE instead of continuous polling.
4. Apply rate limiting to avoid excessive requests.

This will reduce database traffic and improve response time.

---

## Stage 5

### Reliable Notification Delivery

The given approach is not reliable because if sending fails in the middle, some users may never receive the notification.

My approach would be:

1. Save notification data in the database first.
2. Push notification jobs into a queue.
3. Workers process the queue and send notifications.
4. Retry failed jobs automatically.
5. Use unique identifiers to avoid duplicate notifications.

This approach is more reliable and scalable.

---

## Stage 6

### Priority Inbox

Notifications should be ranked based on type and recency.

Weights:

* Placement = 50
* Result = 30
* Event = 10

Recency score:

```text
20 - ageInHours
```

Priority Score:

```text
Priority Score = Type Weight + Recency Weight
```

After calculating the score for all unread notifications:

1. Sort notifications in descending order of score.
2. Return top 10 notifications.

This ensures important and recent notifications appear first in the inbox.
