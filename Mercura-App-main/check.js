const M = require("./engine");
const actions = M.emptyActions();
const skus = M.catalog(actions);
const k = M.kpis(skus, "all");
const alerts = M.alerts(skus);
const recs = M.recommendations(skus, actions);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(skus.length === 412, "rows " + skus.length);
assert(k.total === 412, "sku count " + k.total);
assert(k.inventoryValue === 485000, "value " + k.inventoryValue);
assert(k.sales === 185400, "sales " + k.sales);
assert(k.capital === 72000, "capital " + k.capital);
assert(k.healthy === 255 && k.low === 74 && k.risk === 34 && k.dead === 49, "pills " + [k.healthy, k.low, k.risk, k.dead].join("/"));
assert(alerts.length === 5, "alerts " + alerts.length);
assert(recs.length === 4, "recs " + recs.length);
assert(k.deadCapital === 38000, "dead capital " + k.deadCapital);

actions.clearance["JKT-409"] = 0.15;
actions.locked["JKT-409"] = true;
const after = M.kpis(M.catalog(actions), "all");
const jacket = M.catalog(actions).find((s) => s.id === "JKT-409");
assert(jacket.status === "risk", "jacket status " + jacket.status);
assert(after.dead === 48, "dead after " + after.dead);
assert(after.capital < 72000, "capital did not fall " + after.capital);
assert(M.orderNote(jacket).indexOf("not an order") !== -1, "note must refuse auto-buy");

console.log("ok", { capitalAfter: after.capital, dead: after.dead, alerts: alerts.length });
