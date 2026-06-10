const { getAccessToken } = require("../logging_middleware/auth");
const { fetchTopPriorityNotifications } = require("./priority_inbox");

async function main() {
  const token = process.env.EVALUATION_ACCESS_TOKEN || await getAccessToken();
  const notifications = await fetchTopPriorityNotifications(token, 10);
  console.log(JSON.stringify({ notifications }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
