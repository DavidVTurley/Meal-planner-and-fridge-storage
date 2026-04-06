const state = {
  defaultProducts: [],
  inventoryItems: [],
  etagsByItemId: new Map(),
};

const elements = {
  baseUrl: document.getElementById("base-url"),
  userId: document.getElementById("user-id"),
  includeUserId: document.getElementById("include-user-id"),
  respRequest: document.getElementById("resp-request"),
  respStatus: document.getElementById("resp-status"),
  respHeaders: document.getElementById("resp-headers"),
  respBody: document.getElementById("resp-body"),
  defaultTableBody: document.getElementById("default-table-body"),
  defaultListBtn: document.getElementById("default-list-btn"),
  defaultCreateForm: document.getElementById("default-create-form"),
  defaultUpdateForm: document.getElementById("default-update-form"),
  defaultUpdateId: document.getElementById("default-update-id"),
  defaultUpdateName: document.getElementById("default-update-name"),
  defaultUpdateShelf: document.getElementById("default-update-shelf"),
  defaultUpdateAmount: document.getElementById("default-update-amount"),
  defaultUpdateUnit: document.getElementById("default-update-unit"),
  inventoryCreateForm: document.getElementById("inventory-create-form"),
  inventoryName: document.getElementById("inventory-name"),
  inventoryDefaultId: document.getElementById("inventory-default-id"),
  inventoryDateAdded: document.getElementById("inventory-date-added"),
  inventorySellBy: document.getElementById("inventory-sell-by"),
  inventoryTableBody: document.getElementById("inventory-table-body"),
  inventoryListBtn: document.getElementById("inventory-list-btn"),
  inventoryFilterForm: document.getElementById("inventory-filter-form"),
  inventoryGetForm: document.getElementById("inventory-get-form"),
  decrementForm: document.getElementById("inventory-decrement-form"),
  decrementId: document.getElementById("decrement-id"),
  decrementIfMatch: document.getElementById("decrement-if-match"),
  tabDefault: document.getElementById("tab-default"),
  tabActual: document.getElementById("tab-actual"),
  panelDefault: document.getElementById("panel-default"),
  panelActual: document.getElementById("panel-actual"),
};

const tabButtons = [elements.tabDefault, elements.tabActual].filter(Boolean);
const tabPanels = [elements.panelDefault, elements.panelActual].filter(Boolean);

elements.baseUrl.value = window.location.origin;
elements.inventoryDateAdded.valueAsDate = new Date();
setupTabs();

elements.defaultListBtn.addEventListener("click", async () => {
  await listDefaultProducts();
});

elements.defaultCreateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    name: getValue("default-name"),
    defaultShelfLifeDays: toNumber(getValue("default-shelf")),
    amountPerPackage: toNumber(getValue("default-amount")),
    unit: getValue("default-unit"),
  };

  await requestJson("POST", "/api/default-products", payload);
  await listDefaultProducts();
});

elements.defaultUpdateId.addEventListener("change", () => {
  const selected = state.defaultProducts.find((item) => item.id === getValue("default-update-id"));
  if (!selected) {
    return;
  }

  elements.defaultUpdateName.value = selected.name;
  elements.defaultUpdateShelf.value = selected.defaultShelfLifeDays;
  elements.defaultUpdateAmount.value = selected.amountPerPackage;
  elements.defaultUpdateUnit.value = selected.unit;
});

elements.defaultUpdateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = getValue("default-update-id");
  if (!id) {
    return;
  }

  const payload = {
    name: getValue("default-update-name"),
    defaultShelfLifeDays: toNumber(getValue("default-update-shelf")),
    amountPerPackage: toNumber(getValue("default-update-amount")),
    unit: getValue("default-update-unit"),
  };

  await requestJson("PATCH", `/api/default-products/${id}`, payload);
  await listDefaultProducts();
});

elements.inventoryCreateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const sellByDate = getValue("inventory-sell-by");
  const payload = {
    ingredientName: getValue("inventory-name"),
    remainingAmountMetric: toNumber(getValue("inventory-remaining")),
    location: getValue("inventory-location"),
    dateAdded: getValue("inventory-date-added"),
    defaultProductId: getValue("inventory-default-id"),
    sellByDate: sellByDate ? sellByDate : null,
  };

  await requestJson("POST", "/api/inventory-items", payload);
  await listInventoryItems();
});

elements.inventoryDefaultId.addEventListener("change", () => {
  syncInventoryIngredientToSelectedDefault();
  syncSellByFromDateAddedAndShelfLife();
});

elements.inventoryDateAdded.addEventListener("change", () => {
  syncSellByFromDateAddedAndShelfLife();
});

elements.inventoryListBtn.addEventListener("click", async () => {
  await listInventoryItems();
});

elements.inventoryFilterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const location = getValue("inventory-filter-location");
  const search = getValue("inventory-filter-search");

  const query = new URLSearchParams();
  if (location) {
    query.set("location", location);
  }

  if (search) {
    query.set("search", search);
  }

  const suffix = query.toString();
  const path = suffix ? `/api/inventory-items?${suffix}` : "/api/inventory-items";

  const result = await requestJson("GET", path);
  if (Array.isArray(result.body)) {
    state.inventoryItems = result.body;
    captureEtags(result.body, result.headers);
    renderInventoryTable();
  }
});

elements.inventoryGetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = getValue("inventory-get-id");
  if (!id) {
    return;
  }

  const result = await requestJson("GET", `/api/inventory-items/${id}`);
  if (result.ok && result.body && result.body.id) {
    captureEtags(result.body, result.headers);
    setDecrementTarget(result.body.id, toQuotedTag(result.body.etag, result.headers.get("etag")));
  }
});

elements.decrementForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = getValue("decrement-id");
  if (!id) {
    return;
  }

  const payload = {
    amount: toNumber(getValue("decrement-amount")),
  };

  const result = await requestJson(
    "PATCH",
    `/api/inventory-items/${id}/manual-decrement`,
    payload,
    { "If-Match": getValue("decrement-if-match") });

  if (result.ok && result.body && result.body.id) {
    captureEtags(result.body, result.headers);
    setDecrementTarget(result.body.id, toQuotedTag(result.body.etag, result.headers.get("etag")));
    await listInventoryItems();
  }
});

async function listDefaultProducts() {
  const result = await requestJson("GET", "/api/default-products");
  if (!Array.isArray(result.body)) {
    return;
  }

  state.defaultProducts = result.body;
  renderDefaultProducts();
}

async function listInventoryItems() {
  const result = await requestJson("GET", "/api/inventory-items");
  if (!Array.isArray(result.body)) {
    return;
  }

  state.inventoryItems = result.body;
  captureEtags(result.body, result.headers);
  renderInventoryTable();
}

function renderDefaultProducts() {
  elements.defaultTableBody.innerHTML = "";
  elements.defaultUpdateId.innerHTML = "";
  elements.inventoryDefaultId.innerHTML = "";

  state.defaultProducts.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mono">${product.id}</td>
      <td>${product.name}</td>
      <td>${product.defaultShelfLifeDays}</td>
      <td>${product.amountPerPackage}</td>
      <td>${product.unit}</td>
      <td>${product.version}</td>
      <td>${product.isCurrent}</td>
    `;
    elements.defaultTableBody.appendChild(row);

    const updateOption = document.createElement("option");
    updateOption.value = product.id;
    updateOption.textContent = `${product.name} (v${product.version})`;
    elements.defaultUpdateId.appendChild(updateOption);

    const inventoryOption = document.createElement("option");
    inventoryOption.value = product.id;
    inventoryOption.textContent = `${product.name} (${product.unit})`;
    elements.inventoryDefaultId.appendChild(inventoryOption);
  });

  if (state.defaultProducts.length > 0) {
    const current = state.defaultProducts[0];
    elements.defaultUpdateId.value = current.id;
    elements.defaultUpdateName.value = current.name;
    elements.defaultUpdateShelf.value = current.defaultShelfLifeDays;
    elements.defaultUpdateAmount.value = current.amountPerPackage;
    elements.defaultUpdateUnit.value = current.unit;
    if (elements.inventoryDefaultId.value) {
      syncInventoryIngredientToSelectedDefault();
      syncSellByFromDateAddedAndShelfLife();
    }
  }
}

function syncInventoryIngredientToSelectedDefault() {
  const selectedId = elements.inventoryDefaultId.value;
  if (!selectedId) {
    return;
  }

  const selected = state.defaultProducts.find((item) => item.id === selectedId);
  if (!selected) {
    return;
  }

  elements.inventoryName.value = selected.name;
}

function syncSellByFromDateAddedAndShelfLife() {
  const dateAdded = elements.inventoryDateAdded.value;
  const selectedId = elements.inventoryDefaultId.value;
  if (!dateAdded || !selectedId) {
    return;
  }

  const selected = state.defaultProducts.find((item) => item.id === selectedId);
  if (!selected) {
    return;
  }

  const parsed = new Date(`${dateAdded}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return;
  }

  parsed.setDate(parsed.getDate() + selected.defaultShelfLifeDays);
  elements.inventorySellBy.value = toIsoDate(parsed);
}

function renderInventoryTable() {
  elements.inventoryTableBody.innerHTML = "";

  state.inventoryItems.forEach((item) => {
    const etag = toQuotedTag(item.etag, state.etagsByItemId.get(item.id));
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mono">${item.id}</td>
      <td>${item.ingredientName}</td>
      <td>${item.remainingAmountMetric}</td>
      <td>${item.locationDisplay}</td>
      <td>${item.freshness}</td>
      <td class="mono">${etag}</td>
      <td><button type="button" class="inline-btn" data-id="${item.id}">Use For Decrement</button></td>
    `;
    elements.inventoryTableBody.appendChild(row);
  });

  elements.inventoryTableBody.querySelectorAll("button[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-id");
      const quoted = state.etagsByItemId.get(id) ?? "";
      setDecrementTarget(id, quoted);
    });
  });
}

function setDecrementTarget(id, quotedEtag) {
  elements.decrementId.value = id ?? "";
  elements.decrementIfMatch.value = quotedEtag ?? "";
  const getIdInput = document.getElementById("inventory-get-id");
  getIdInput.value = id ?? "";
}

function captureEtags(body, headers) {
  const fromHeader = headers.get("etag");

  if (Array.isArray(body)) {
    body.forEach((item) => {
      if (item && item.id && item.etag) {
        state.etagsByItemId.set(item.id, quote(item.etag));
      }
    });
    return;
  }

  if (body && body.id) {
    const quoted = toQuotedTag(body.etag, fromHeader);
    if (quoted) {
      state.etagsByItemId.set(body.id, quoted);
    }
  }
}

async function requestJson(method, path, body, extraHeaders = {}) {
  const url = buildUrl(path);
  const headers = {
    Accept: "application/json",
    ...extraHeaders,
  };

  if (elements.includeUserId.checked && path.startsWith("/api/")) {
    headers["X-User-Id"] = elements.userId.value.trim();
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const parsedBody = await parseResponseBody(response);
  renderResponseInspector(method, url, response, parsedBody);

  return {
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    body: parsedBody,
  };
}

function renderResponseInspector(method, url, response, body) {
  elements.respRequest.textContent = `${method} ${url}`;
  elements.respStatus.textContent = `${response.status} ${response.statusText}`;

  const headerObject = {};
  response.headers.forEach((value, key) => {
    headerObject[key] = value;
  });

  elements.respHeaders.textContent = JSON.stringify(headerObject, null, 2);
  elements.respBody.textContent = JSON.stringify(body, null, 2);
}

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();
  if (!text) {
    return {};
  }

  return { text };
}

function buildUrl(path) {
  const base = elements.baseUrl.value.trim() || window.location.origin;
  return new URL(path, base).toString();
}

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toQuotedTag(bodyTag, headerTag) {
  if (headerTag) {
    return headerTag;
  }

  if (bodyTag) {
    return quote(bodyTag);
  }

  return "";
}

function quote(tag) {
  const trimmed = String(tag).trim();
  if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
    return trimmed;
  }

  return `"${trimmed}"`;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setupTabs() {
  if (tabButtons.length === 0 || tabPanels.length === 0) {
    return;
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(button);
    });

    button.addEventListener("keydown", (event) => {
      const currentIndex = tabButtons.indexOf(button);
      if (currentIndex < 0) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + tabButtons.length) % tabButtons.length;
        tabButtons[nextIndex].focus();
      }

      if (event.key === "Home") {
        event.preventDefault();
        tabButtons[0].focus();
      }

      if (event.key === "End") {
        event.preventDefault();
        tabButtons[tabButtons.length - 1].focus();
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateTab(button);
      }
    });
  });

  activateTab(elements.tabDefault);
}

function activateTab(activeButton) {
  if (!activeButton) {
    return;
  }

  tabButtons.forEach((button) => {
    const selected = button === activeButton;
    button.setAttribute("aria-selected", selected ? "true" : "false");
    button.tabIndex = selected ? 0 : -1;
  });

  const activePanelId = activeButton.getAttribute("data-tab-target");
  tabPanels.forEach((panel) => {
    panel.hidden = panel.id !== activePanelId;
  });
}

void listDefaultProducts();
void listInventoryItems();
