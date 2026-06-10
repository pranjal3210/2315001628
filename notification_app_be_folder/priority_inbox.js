const { Log } = require("../logging_middleware/log");

const API_BASE_URL = process.env.EVALUATION_API_BASE_URL || "http://4.224.186.213/evaluation-service";

const TYPE_WEIGHT = {
  Placement: 50,
  Result: 30,
  Event: 10,
};

function byLowestPriority(a, b) {
  if (a.priorityScore !== b.priorityScore) return a.priorityScore - b.priorityScore;
  return new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime();
}

function byHighestPriority(a, b) {
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
  return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
}

function priorityScore(notification, now = new Date()) {
  const typeScore = TYPE_WEIGHT[notification.Type] || 0;
  const createdAt = new Date(notification.Timestamp);
  const ageHours = Math.max(0, (now.getTime() - createdAt.getTime()) / 36e5);
  const recencyScore = Math.max(0, 20 - ageHours);
  return typeScore + recencyScore;
}

function topPriorityNotifications(notifications, limit = 10) {
  const heap = [];

  for (const notification of notifications) {
    const candidate = {
      ...notification,
      priorityScore: priorityScore(notification),
    };

    heap.push(candidate);
    heap.sort(byLowestPriority);

    if (heap.length > limit) {
      heap.shift();
    }
  }

  return heap.sort(byHighestPriority);
}

async function fetchTopPriorityNotifications(token, limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Notification API failed with ${response.status}: ${JSON.stringify(payload)}`);
    }

    const result = topPriorityNotifications(payload.notifications || [], limit);
    await Log("backend", "info", "service", `computed top ${result.length} priority notifications`, { token });
    return result;
  } catch (error) {
    await Log("backend", "error", "handler", `priority inbox failed: ${error.message}`, { token }).catch(() => {});
    throw error;
  }
}

module.exports = {
  priorityScore,
  topPriorityNotifications,
  fetchTopPriorityNotifications,
};
