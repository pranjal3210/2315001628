# Submission Notes

## Logging Middleware

I created a reusable logging function named `Log(stack, level, packageName, message)` inside the `logging_middleware` folder.

The function checks whether the stack, level, and package name are valid before sending the log request. This helps prevent invalid log entries.

To keep credentials secure, the access token is taken from the environment variable instead of hardcoding it in the code.

---

## Notification Priority Inbox

For the notification priority system, I assigned different weights to different notification types.

* Placement notifications have the highest priority.
* Result notifications have medium priority.
* Event notifications have lower priority.

I also considered how recent a notification is. Newer notifications get a slightly higher score than older ones.

The final priority score is calculated using both type and recency, and then notifications are sorted based on that score.

After sorting, the top 10 unread notifications are returned.

---

## Vehicle Maintenance Scheduler

For the vehicle maintenance problem, I considered two factors:

* Maintenance duration
* Impact score

The goal is to complete the most useful maintenance tasks within the available mechanic hours.

I used the impact-to-duration ratio to decide which tasks should be selected first. This allows the scheduler to choose tasks that provide higher value while staying within the available time limit.

The same approach can be extended if separate depot limits are provided.

---

## Testing

After generating the access token using the authentication API, I stored it as an environment variable and tested the application using the provided APIs.

Commands used:

```powershell
$env:EVALUATION_ACCESS_TOKEN="access_token"

npm run priority

npm run scheduler
```

The application successfully fetched data from the protected APIs and returned the expected output.
