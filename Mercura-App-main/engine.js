(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Mercura = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var TAIL = { skus: 401, healthy: 252, low: 69, risk: 32, dead: 48, riskCapital: 13698 };
  var SALES = 185400;
  var PROFIT = 56200;
  var CHANNEL = { all: 1, shopify: 0.46, pos: 0.38, warehouse: 0.16 };

  var RAW = [
    { id: "TS-088", name: "Cotton Crew T-Shirt", cat: "Essentials", supplier: "Sri Krishna Mills", units: 42, cost: 320, price: 499, vel: 2, age: 12, margin: 0.32, lead: 7, loss: 0, channels: { shopify: 18, pos: 16, warehouse: 8 }, img: "img/ts.jpg" },
    { id: "JN-204", name: "Denim Straight Jeans", cat: "Apparel", supplier: "Indigo Loom", units: 21, cost: 740, price: 1299, vel: 0.84, age: 25, margin: 0.26, lead: 10, loss: 0, channels: { shopify: 6, pos: 10, warehouse: 5 }, img: "img/jeans.jpg" },
    { id: "JKT-409", name: "Winter Heavy Jacket", cat: "Outerwear", supplier: "Nordic Wear Ltd.", units: 47, cost: 38000 / 47, price: 1499, vel: 0.34, age: 63, margin: 0.18, lead: 7, loss: 0, channels: { shopify: 0, pos: 15, warehouse: 32 }, img: "img/jacket.jpg", moq: 25 },
    { id: "SH-102", name: "Sports Running Shoes — AirSprint", cat: "Footwear", supplier: "Apex Footwear Ltd.", units: 14, cost: 1100, price: 2499, vel: 8.4, age: 8, margin: 0.28, lead: 7, loss: 18400, phone: "+91 98201 44821", email: "contact@apexshoes.in", channels: { shopify: 8, pos: 6, warehouse: 0 }, img: "img/shoes.jpg" },
    { id: "SH-312", name: "Linen Casual Shirt", cat: "Apparel", supplier: "Coastal Loom", units: 35, cost: 410, price: 899, vel: 1.94, age: 18, margin: 0.34, lead: 8, loss: 0, channels: { shopify: 14, pos: 12, warehouse: 9 }, img: "img/linen.jpg" },
    { id: "ACC-091", name: "Woolen Scarf & Gloves Set", cat: "Accessories", supplier: "Hill Thread Co.", units: 29, cost: 210, price: 449, vel: 0.5, age: 58, margin: 0.22, lead: 12, loss: 0, channels: { shopify: 4, pos: 9, warehouse: 16 }, img: "img/scarf.jpg" },
    { id: "TP-505", name: "Athleisure Track Pants", cat: "Activewear", supplier: "Sprint Mills", units: 8, cost: 480, price: 999, vel: 2.4, age: 9, margin: 0.29, lead: 5, loss: 6200, channels: { shopify: 3, pos: 5, warehouse: 0 }, img: "img/pants.jpg" },
    { id: "KT-204", name: "Silk Blend Festive Kurti", cat: "Ethnic Wear", supplier: "Banaras House", units: 5, cost: 640, price: 1899, vel: 3.2, age: 11, margin: 0.22, lead: 6, loss: 9800, channels: { shopify: 2, pos: 3, warehouse: 0 }, img: "img/kurti.jpg" },
    { id: "SD-881", name: "Coastal Sandals", cat: "Footwear", supplier: "Coastal Steps", units: 34, cost: 418, price: 799, vel: 0.6, age: 44, margin: 0.24, lead: 9, loss: 0, channels: { shopify: 10, pos: 8, warehouse: 16 }, img: "img/sandals.jpg" },
    { id: "BW-014", name: "Beach Wrap", cat: "Resort", supplier: "Coastal Steps", units: 9, cost: 260, price: 699, vel: 2.2, age: 16, margin: 0.31, lead: 6, loss: 4200, channels: { shopify: 4, pos: 5, warehouse: 0 }, img: "img/wrap.jpg" },
    { id: "CP-330", name: "Cotton Polo", cat: "Essentials", supplier: "Sri Krishna Mills", units: 10, cost: 300, price: 799, vel: 2.6, age: 14, margin: 0.3, lead: 5, loss: 4000, channels: { shopify: 4, pos: 4, warehouse: 2 }, img: "img/polo.jpg" }
  ];

  var HERO = {};
  RAW.forEach(function (p) { HERO[p.id] = 1; });

  // ponytail: the other 401 rows reuse the 10 product photos. A real catalog would have one shot per SKU.
  (function fillBook() {
    var plan = [];
    var n;
    for (n = 0; n < 252; n++) plan.push("healthy");
    for (n = 0; n < 69; n++) plan.push("low");
    for (n = 0; n < 32; n++) plan.push("risk");
    for (n = 0; n < 48; n++) plan.push("dead");
    var stems = ["Crew Tee", "Oxford Shirt", "Slim Chino", "Knit Polo", "Denim Jacket", "Runner", "Wool Scarf", "Festive Kurti", "Beach Wrap", "Track Pant", "Hoodie", "Formal Shirt", "Legging", "Blazer", "Sneaker", "Belt", "Cap", "Day Dress", "Shorts", "Cardigan"];
    var colors = ["Navy", "Olive", "Black", "Ivory", "Rust", "Sage", "Stone", "Maroon"];
    var photos = {
      healthy: ["img/ts.jpg", "img/linen.jpg", "img/polo.jpg", "img/jeans.jpg"],
      low: ["img/pants.jpg", "img/shoes.jpg", "img/wrap.jpg"],
      risk: ["img/scarf.jpg", "img/sandals.jpg", "img/kurti.jpg"],
      dead: ["img/jacket.jpg", "img/kurti.jpg", "img/scarf.jpg"]
    };
    var cats = { healthy: "Essentials", low: "Activewear", risk: "Accessories", dead: "Outerwear" };
    var suppliers = ["Sri Krishna Mills", "Indigo Loom", "Nordic Wear Ltd.", "Apex Footwear Ltd.", "Coastal Loom", "Hill Thread Co."];
    plan.forEach(function (kind, i) {
      var units = kind === "low" ? 8 : kind === "dead" ? 12 : kind === "risk" ? 24 : 30;
      var vel = kind === "low" ? 2 : kind === "healthy" ? 2 : 0.4;
      var age = kind === "dead" ? 70 : kind === "risk" ? 48 : kind === "low" ? 12 : 14;
      var shop = Math.max(1, Math.floor(units / 3));
      var pos = Math.max(1, Math.floor((units - shop) / 2));
      RAW.push({
        id: "CT-" + (1000 + i),
        name: colors[i % colors.length] + " " + stems[i % stems.length],
        cat: cats[kind],
        supplier: suppliers[i % suppliers.length],
        units: units,
        cost: 120,
        price: 399,
        vel: vel,
        age: age,
        margin: 0.28,
        lead: 7,
        loss: 0,
        channels: { shopify: shop, pos: pos, warehouse: units - shop - pos },
        img: photos[kind][i % photos[kind].length]
      });
    });
  })();

  function inr(n) {
    var sign = n < 0 ? "-" : "";
    var x = String(Math.round(Math.abs(n)));
    if (x.length <= 3) return sign + "₹" + x;
    var last = x.slice(-3);
    var rest = x.slice(0, -3);
    var out = "";
    while (rest.length > 2) {
      out = "," + rest.slice(-2) + out;
      rest = rest.slice(0, -2);
    }
    return sign + "₹" + rest + out + "," + last;
  }

  function money(units, cost) {
    return Math.round(units * cost);
  }

  function statusOf(s) {
    var days = s.units / Math.max(s.vel, 0.05);
    if (s.age >= 60 && s.vel < 1) return "dead";
    if (s.age >= 40 && days > 45) return "risk";
    if (days < 2) return "critical";
    if (days < 5) return "low";
    return "healthy";
  }

  function applyOne(raw, actions) {
    var clearance = (actions.clearance && actions.clearance[raw.id]) || 0;
    var vel = raw.vel * (clearance ? 1 + clearance * 3 : 1);
    var price = Math.round(raw.price * (1 - clearance));
    var days = raw.units / Math.max(vel, 0.05);
    var draft = {
      id: raw.id, name: raw.name, cat: raw.cat, supplier: raw.supplier,
      units: raw.units, cost: raw.cost, price: price, vel: vel, age: raw.age,
      margin: clearance ? raw.margin * (1 - clearance) : raw.margin,
      lead: raw.lead, loss: raw.loss, channels: raw.channels, img: raw.img,
      moq: raw.moq, phone: raw.phone, email: raw.email, clearance: clearance,
      locked: !!(actions.locked && actions.locked[raw.id])
    };
    var status = statusOf(draft);
    // ponytail: a planned clearance flips dead stock to watched risk immediately. Real sell-through would wait for POS sales before the status moves.
    if (clearance >= 0.1 && status === "dead") status = "risk";
    draft.status = status;
    draft.days = days;
    draft.value = money(raw.units, raw.cost);
    draft.reviewed = !!(actions.reviewed && actions.reviewed[raw.id]);
    draft.snoozed = (actions.snooze && actions.snooze[raw.id] || 0) > Date.now();
    return draft;
  }

  function catalog(actions) {
    var list = RAW.map(function (raw) { return applyOne(raw, actions || {}); });
    (actions && actions.added || []).forEach(function (raw) {
      list.push(applyOne(raw, actions));
    });
    return list;
  }

  function exposure(s) {
    var v = s.value;
    if (s.status === "dead") return v;
    if (s.status === "risk") return s.clearance ? Math.round(v * 0.4) : v;
    return 0;
  }

  function visible(skus, channel) {
    if (!channel || channel === "all") return skus;
    return skus.filter(function (s) { return (s.channels[channel] || 0) > 0; });
  }

  function tally(skus) {
    var c = { healthy: 0, low: 0, critical: 0, risk: 0, dead: 0 };
    skus.forEach(function (s) { c[s.status] += 1; });
    return c;
  }

  function kpis(skus, channel) {
    var share = CHANNEL[channel] || 1;
    var shown = visible(skus, channel);
    var featuredValue = 0;
    skus.forEach(function (s) { featuredValue += s.value; });
    var baseValue = 0;
    RAW.forEach(function (s) { baseValue += money(s.units, s.cost); });
    var counts = tally(skus);
    var capital = TAIL.riskCapital;
    skus.forEach(function (s) { if (HERO[s.id]) capital += exposure(s); });
    var deadCapital = 0;
    skus.forEach(function (s) { if (s.id === "JKT-409" && s.status === "dead") deadCapital += s.value; });
    return {
      inventoryValue: Math.round((485000 - baseValue + featuredValue) * (channel === "all" ? 1 : share)),
      sales: Math.round(SALES * share),
      profit: Math.round(PROFIT * share),
      capital: Math.round(capital * share),
      deadCapital: deadCapital,
      total: skus.length,
      healthy: counts.healthy,
      low: counts.low + counts.critical,
      risk: counts.risk,
      dead: counts.dead,
      shown: shown
    };
  }

  function alerts(skus) {
    return skus.filter(function (s) {
      return (s.status === "critical" || s.status === "low") && !s.reviewed && !s.snoozed && s.loss > 0;
    }).sort(function (a, b) { return a.days - b.days; });
  }

  function recommendations(skus, actions) {
    var dismissed = (actions && actions.dismissed) || {};
    var out = [];
    skus.forEach(function (s) {
      if (dismissed[s.id]) return;
      if (s.id === "JKT-409" && s.status === "dead") {
        out.push({ id: s.id, kind: "risk", title: "Reduce Purchase — Jacket", supplier: s.supplier, exposure: s.value, note: "47 jackets unsold for 63 days. Do not send the pending 30-unit PO.", action: "Plan 15% clearance and lock reorders" });
      } else if (s.id === "JKT-409" && s.clearance) {
        out.push({ id: s.id, kind: "cash", title: "Clearance live — Jacket", supplier: s.supplier, exposure: exposure(s), note: "15% off is planned. Reorders stay locked until stock is under 10.", action: "Watch sell-through" });
      } else if (s.id === "SH-102" && !s.reviewed && s.days < 5) {
        out.push({ id: s.id, kind: "stock", title: "Review Stock — Sports Shoes", supplier: s.supplier, exposure: s.loss, note: "AirSprint covers about " + s.days.toFixed(1) + " days. Lead time is " + s.lead + " days. Mercura will not order.", action: "Copy a supplier note and call Apex" });
      } else if (s.id === "SD-881" && !s.clearance) {
        out.push({ id: s.id, kind: "cash", title: "Consider Promotion — Sandals", supplier: s.supplier, exposure: s.value, note: "Velocity is soft. A 15% clearance can unlock about ₹14,200.", action: "Simulate 15% clearance" });
      } else if (s.id === "TS-088") {
        out.push({ id: s.id, kind: "ok", title: "Maintain Stock — T-Shirts", supplier: s.supplier, exposure: 0, note: "21-day cycle is on target. No buy or discount.", action: "Leave the reorder cadence" });
      }
    });
    return out;
  }

  function orderNote(s) {
    var batch = Math.max(s.moq || 20, Math.ceil(s.vel * 30 - s.units));
    return "Sharma Apparels — reorder request, not an order. SKU " + s.id + " " + s.name + ". On hand " + s.units + ". Suggested batch " + batch + " units. Please confirm lead time. We will place the PO ourselves.";
  }

  return {
    RAW: RAW,
    inr: inr,
    catalog: catalog,
    kpis: kpis,
    alerts: alerts,
    recommendations: recommendations,
    orderNote: orderNote,
    statusOf: statusOf,
    emptyActions: function () {
      return { clearance: {}, locked: {}, reviewed: {}, snooze: {}, dismissed: {}, accepted: {}, added: [], log: [] };
    }
  };
});
