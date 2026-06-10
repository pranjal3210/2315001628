const { Log } = require("../logging_middleware/log");

const API_BASE_URL = process.env.EVALUATION_API_BASE_URL || "http://4.224.186.213/evaluation-service";

function getDepotId(vehicle) {
  return vehicle.DepotID || vehicle.depotId || vehicle.depotID;
}

function maintenanceValue(vehicle) {
  return vehicle.Impact / vehicle.Duration;
}

function scheduleMaintenance(depots, vehicles) {
  const remainingHours = new Map(depots.map((depot) => [depot.ID, depot.MechanicHours]));
  const hasDepotSpecificTasks = vehicles.some((vehicle) => getDepotId(vehicle));
  let sharedHours = depots.reduce((sum, depot) => sum + depot.MechanicHours, 0);
  const selected = [];

  const orderedVehicles = [...vehicles].sort((a, b) => {
    const aRatio = maintenanceValue(a);
    const bRatio = maintenanceValue(b);
    if (bRatio !== aRatio) return bRatio - aRatio;
    return b.Impact - a.Impact;
  });

  for (const vehicle of orderedVehicles) {
    const depotId = getDepotId(vehicle);

    if (!hasDepotSpecificTasks) {
      if (vehicle.Duration > sharedHours) continue;
      selected.push(vehicle);
      sharedHours -= vehicle.Duration;
      continue;
    }

    const hoursLeft = remainingHours.get(depotId);

    if (hoursLeft === undefined || vehicle.Duration > hoursLeft) {
      continue;
    }

    selected.push(vehicle);
    remainingHours.set(depotId, hoursLeft - vehicle.Duration);
  }

  return {
    selectedTasks: selected,
    totalImpact: selected.reduce((sum, vehicle) => sum + vehicle.Impact, 0),
    remainingMechanicHours: hasDepotSpecificTasks
      ? Object.fromEntries(remainingHours.entries())
      : sharedHours,
  };
}

async function fetchJson(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function createMaintenanceSchedule(token) {
  try {
    const [depotsPayload, vehiclesPayload] = await Promise.all([
      fetchJson("/depots", token),
      fetchJson("/vehicles", token),
    ]);

    const result = scheduleMaintenance(depotsPayload.depots || [], vehiclesPayload.vehicles || []);
    await Log("backend", "info", "service", `scheduled ${result.selectedTasks.length} maintenance tasks`, { token });
    return result;
  } catch (error) {
    await Log("backend", "error", "handler", `vehicle scheduling failed: ${error.message}`, { token }).catch(() => {});
    throw error;
  }
}

module.exports = {
  scheduleMaintenance,
  createMaintenanceSchedule,
};
