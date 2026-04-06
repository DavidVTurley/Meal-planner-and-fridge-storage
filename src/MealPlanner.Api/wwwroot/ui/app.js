const state = {
  defaultProducts: [],
  inventoryItems: [],
  meals: [],
  unknownIngredients: [],
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

  mealsListBtn: document.getElementById("meals-list-btn"),
  mealCreateForm: document.getElementById("meal-create-form"),
  mealCreateName: document.getElementById("meal-create-name"),
  mealCreateLines: document.getElementById("meal-create-lines"),
  mealCreateAddLine: document.getElementById("meal-create-add-line"),
  mealGetForm: document.getElementById("meal-get-form"),
  mealUpdateForm: document.getElementById("meal-update-form"),
  mealUpdateId: document.getElementById("meal-update-id"),
  mealUpdateName: document.getElementById("meal-update-name"),
  mealUpdateLines: document.getElementById("meal-update-lines"),
  mealUpdateAddLine: document.getElementById("meal-update-add-line"),
  mealsTableBody: document.getElementById("meals-table-body"),
  unknownListBtn: document.getElementById("unknown-list-btn"),
  unknownTableBody: document.getElementById("unknown-table-body"),
  unknownConvertForm: document.getElementById("unknown-convert-form"),
  unknownConvertId: document.getElementById("unknown-convert-id"),
  unknownConvertDefaultId: document.getElementById("unknown-convert-default-id"),

  tabDefault: document.getElementById("tab-default"),
  tabActual: document.getElementById("tab-actual"),
  tabMeals: document.getElementById("tab-meals"),
  panelDefault: document.getElementById("panel-default"),
  panelActual: document.getElementById("panel-actual"),
  panelMeals: document.getElementById("panel-meals"),
};

const tabButtons = [elements.tabDefault, elements.tabActual, elements.tabMeals].filter(Boolean);
const tabPanels = [elements.panelDefault, elements.panelActual, elements.panelMeals].filter(Boolean);

elements.baseUrl.value = window.location.origin;
elements.inventoryDateAdded.valueAsDate = new Date();
setupTabs();
setupEventHandlers();

function setupEventHandlers() {
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
      setDecrementTarget(result.body.id, toQuotedTag(getItemEtag(result.body), result.headers.get("etag")));
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
      { "If-Match": getValue("decrement-if-match") },
    );

    if (result.ok && result.body && result.body.id) {
      captureEtags(result.body, result.headers);
      setDecrementTarget(result.body.id, toQuotedTag(getItemEtag(result.body), result.headers.get("etag")));
      await listInventoryItems();
    }
  });

  elements.mealsListBtn.addEventListener("click", async () => {
    await listMeals();
  });

  elements.mealCreateAddLine.addEventListener("click", () => {
    appendIngredientLine(elements.mealCreateLines, "create");
  });

  elements.mealUpdateAddLine.addEventListener("click", () => {
    appendIngredientLine(elements.mealUpdateLines, "update");
  });

  elements.mealCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      name: elements.mealCreateName.value.trim(),
      ingredientLines: collectIngredientLinesPayload(elements.mealCreateLines),
    };

    await requestJson("POST", "/api/meals", payload);
    elements.mealCreateName.value = "";
    resetIngredientLines(elements.mealCreateLines, "create");
    await listMeals();
    await listUnknownIngredients();
  });

  elements.mealGetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = getValue("meal-get-id");
    if (!id) {
      return;
    }

    const result = await requestJson("GET", `/api/meals/${id}`);
    if (result.ok && result.body && result.body.id) {
      hydrateUpdateFormFromMeal(result.body);
    }
  });

  elements.mealUpdateId.addEventListener("change", () => {
    const selected = state.meals.find((meal) => meal.id === elements.mealUpdateId.value);
    if (!selected) {
      return;
    }

    hydrateUpdateFormFromMeal(selected);
  });

  elements.mealUpdateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = elements.mealUpdateId.value;
    if (!id) {
      return;
    }

    const payload = {
      name: elements.mealUpdateName.value.trim(),
      ingredientLines: collectIngredientLinesPayload(elements.mealUpdateLines),
    };

    await requestJson("PATCH", `/api/meals/${id}`, payload);
    await listMeals();
    await listUnknownIngredients();
  });

  elements.unknownListBtn.addEventListener("click", async () => {
    await listUnknownIngredients();
  });

  elements.unknownConvertForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const unknownIngredientId = elements.unknownConvertId.value;
    const defaultProductId = elements.unknownConvertDefaultId.value;
    if (!unknownIngredientId || !defaultProductId) {
      return;
    }

    await requestJson("POST", "/api/unknown-ingredients/convert", {
      unknownIngredientId,
      defaultProductId,
    });

    await listUnknownIngredients();
    await listMeals();
  });
}

async function listDefaultProducts() {
  const result = await requestJson("GET", "/api/default-products");
  if (!Array.isArray(result.body)) {
    return;
  }

  state.defaultProducts = result.body;
  renderDefaultProducts();
  refreshIngredientLineOptions();
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

async function listMeals() {
  const result = await requestJson("GET", "/api/meals");
  if (!Array.isArray(result.body)) {
    return;
  }

  state.meals = result.body;
  renderMeals();
}

async function listUnknownIngredients() {
  const result = await requestJson("GET", "/api/unknown-ingredients");
  if (!Array.isArray(result.body)) {
    return;
  }

  state.unknownIngredients = result.body;
  renderUnknownIngredients();
  refreshIngredientLineOptions();
}

function renderDefaultProducts() {
  elements.defaultTableBody.innerHTML = "";
  elements.defaultUpdateId.innerHTML = "";
  elements.inventoryDefaultId.innerHTML = "";
  elements.unknownConvertDefaultId.innerHTML = "";

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

    const convertOption = document.createElement("option");
    convertOption.value = product.id;
    convertOption.textContent = `${product.name} (${product.unit})`;
    elements.unknownConvertDefaultId.appendChild(convertOption);
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

function renderInventoryTable() {
  elements.inventoryTableBody.innerHTML = "";

  state.inventoryItems.forEach((item) => {
    const etag = toQuotedTag(getItemEtag(item), state.etagsByItemId.get(item.id));
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

function renderMeals() {
  elements.mealsTableBody.innerHTML = "";
  elements.mealUpdateId.innerHTML = "";

  state.meals.forEach((meal) => {
    const updateOption = document.createElement("option");
    updateOption.value = meal.id;
    updateOption.textContent = meal.name;
    elements.mealUpdateId.appendChild(updateOption);

    const lineSummary = meal.ingredientLines
      .map((line) => `${line.displayName}: ${line.amount} ${line.unit} (${line.ingredientKind})`)
      .join("\n");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mono">${meal.id}</td>
      <td>${meal.name}</td>
      <td><pre class="inline-pre">${lineSummary}</pre></td>
      <td><button type="button" class="inline-btn" data-id="${meal.id}">Use For Update</button></td>
    `;
    elements.mealsTableBody.appendChild(row);
  });

  elements.mealsTableBody.querySelectorAll("button[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-id");
      const selected = state.meals.find((meal) => meal.id === id);
      if (!selected) {
        return;
      }

      elements.mealUpdateId.value = selected.id;
      hydrateUpdateFormFromMeal(selected);
    });
  });

  if (state.meals.length > 0 && !elements.mealUpdateId.value) {
    elements.mealUpdateId.value = state.meals[0].id;
    hydrateUpdateFormFromMeal(state.meals[0]);
  }
}

function renderUnknownIngredients() {
  elements.unknownTableBody.innerHTML = "";
  elements.unknownConvertId.innerHTML = "";

  state.unknownIngredients.forEach((unknown) => {
    const references = (unknown.mealReferences ?? [])
      .map((reference) => `${reference.mealName} (${reference.mealId})`)
      .join("\n");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mono">${unknown.id}</td>
      <td>${unknown.displayName}</td>
      <td>${unknown.normalizedName}</td>
      <td>${unknown.unit}</td>
      <td><pre class="inline-pre">${references || "-"}</pre></td>
    `;
    elements.unknownTableBody.appendChild(row);

    const option = document.createElement("option");
    option.value = unknown.id;
    option.textContent = `${unknown.displayName} (${unknown.unit})`;
    elements.unknownConvertId.appendChild(option);
  });
}

function hydrateUpdateFormFromMeal(meal) {
  elements.mealUpdateId.value = meal.id;
  elements.mealUpdateName.value = meal.name;
  resetIngredientLines(elements.mealUpdateLines, "update");
  elements.mealUpdateLines.innerHTML = "";
  meal.ingredientLines.forEach((line) => {
    appendIngredientLine(elements.mealUpdateLines, "update", {
      ingredientKind: line.ingredientKind,
      defaultProductId: line.defaultProductId,
      unknownIngredientId: line.unknownIngredientId,
      unknownDisplayName: line.ingredientKind === "unknown" ? line.displayName : "",
      unknownUnit: line.unit,
      amount: line.amount,
    });
  });

  ensureAtLeastOneIngredientLine(elements.mealUpdateLines, "update");
}

function resetIngredientLines(container, mode) {
  container.innerHTML = "";
  appendIngredientLine(container, mode);
}

function ensureAtLeastOneIngredientLine(container, mode) {
  if (container.children.length === 0) {
    appendIngredientLine(container, mode);
  }
}

function appendIngredientLine(container, mode, initialValue = null) {
  const row = document.createElement("div");
  row.className = "ingredient-line";

  row.innerHTML = `
    <label>
      Kind
      <select class="line-kind">
        <option value="known">known</option>
        <option value="unknown">unknown</option>
      </select>
    </label>
    <label>
      Amount
      <input class="line-amount" type="number" min="0.001" step="0.001" value="100" />
    </label>
    <label class="line-known-field">
      Default Product
      <select class="line-default-id"></select>
    </label>
    <label class="line-unknown-id-field">
      Existing Unknown (optional)
      <select class="line-unknown-id">
        <option value="">Create/Use by name</option>
      </select>
    </label>
    <label class="line-unknown-name-field">
      Unknown Display Name
      <input class="line-unknown-display-name" type="text" placeholder="Homemade Stock" />
    </label>
    <label class="line-unknown-unit-field">
      Unknown Unit
      <select class="line-unknown-unit">
        <option value="g">g</option>
        <option value="ml">ml</option>
      </select>
    </label>
    <div class="line-actions">
      <button type="button" class="line-remove-btn">Remove</button>
    </div>
  `;

  container.appendChild(row);

  const kindSelect = row.querySelector(".line-kind");
  const amountInput = row.querySelector(".line-amount");
  const defaultSelect = row.querySelector(".line-default-id");
  const unknownIdSelect = row.querySelector(".line-unknown-id");
  const unknownNameInput = row.querySelector(".line-unknown-display-name");
  const unknownUnitSelect = row.querySelector(".line-unknown-unit");
  const removeButton = row.querySelector(".line-remove-btn");

  populateDefaultProductOptions(defaultSelect);
  populateUnknownOptions(unknownIdSelect);

  if (initialValue) {
    kindSelect.value = initialValue.ingredientKind ?? "known";
    amountInput.value = String(initialValue.amount ?? 100);

    if (initialValue.defaultProductId) {
      defaultSelect.value = initialValue.defaultProductId;
    }

    if (initialValue.unknownIngredientId) {
      unknownIdSelect.value = initialValue.unknownIngredientId;
    }

    if (initialValue.unknownDisplayName) {
      unknownNameInput.value = initialValue.unknownDisplayName;
    }

    if (initialValue.unknownUnit) {
      unknownUnitSelect.value = initialValue.unknownUnit;
    }
  }

  kindSelect.addEventListener("change", () => {
    toggleIngredientLineKind(row, kindSelect.value);
  });

  unknownIdSelect.addEventListener("change", () => {
    const selected = state.unknownIngredients.find((item) => item.id === unknownIdSelect.value);
    if (!selected) {
      return;
    }

    unknownNameInput.value = selected.displayName;
    unknownUnitSelect.value = selected.unit;
  });

  removeButton.addEventListener("click", () => {
    row.remove();
    ensureAtLeastOneIngredientLine(container, mode);
  });

  toggleIngredientLineKind(row, kindSelect.value);
}

function toggleIngredientLineKind(row, kind) {
  const knownField = row.querySelector(".line-known-field");
  const unknownIdField = row.querySelector(".line-unknown-id-field");
  const unknownNameField = row.querySelector(".line-unknown-name-field");
  const unknownUnitField = row.querySelector(".line-unknown-unit-field");

  const isKnown = kind === "known";
  knownField.hidden = !isKnown;
  unknownIdField.hidden = isKnown;
  unknownNameField.hidden = isKnown;
  unknownUnitField.hidden = isKnown;
}

function collectIngredientLinesPayload(container) {
  const rows = Array.from(container.querySelectorAll(".ingredient-line"));
  if (rows.length === 0) {
    throw new Error("At least one ingredient line is required.");
  }

  return rows.map((row) => {
    const ingredientKind = row.querySelector(".line-kind").value;
    const amount = toNumber(row.querySelector(".line-amount").value);

    if (ingredientKind === "known") {
      return {
        ingredientKind: "known",
        defaultProductId: row.querySelector(".line-default-id").value || null,
        unknownIngredientId: null,
        unknownDisplayName: null,
        unknownUnit: null,
        amount,
      };
    }

    const unknownIngredientId = row.querySelector(".line-unknown-id").value || null;
    const payload = {
      ingredientKind: "unknown",
      defaultProductId: null,
      unknownIngredientId,
      unknownDisplayName: null,
      unknownUnit: null,
      amount,
    };

    if (!unknownIngredientId) {
      payload.unknownDisplayName = row.querySelector(".line-unknown-display-name").value.trim() || null;
      payload.unknownUnit = row.querySelector(".line-unknown-unit").value || null;
    }

    return payload;
  });
}

function populateDefaultProductOptions(selectElement) {
  selectElement.innerHTML = "";
  state.defaultProducts.forEach((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.name} (${product.unit})`;
    selectElement.appendChild(option);
  });
}

function populateUnknownOptions(selectElement) {
  const previous = selectElement.value;
  selectElement.innerHTML = "";

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Create/Use by name";
  selectElement.appendChild(blank);

  state.unknownIngredients.forEach((unknown) => {
    const option = document.createElement("option");
    option.value = unknown.id;
    option.textContent = `${unknown.displayName} (${unknown.unit})`;
    selectElement.appendChild(option);
  });

  if (previous) {
    selectElement.value = previous;
  }
}

function refreshIngredientLineOptions() {
  document.querySelectorAll(".line-default-id").forEach((element) => {
    const previous = element.value;
    populateDefaultProductOptions(element);
    if (previous) {
      element.value = previous;
    }
  });

  document.querySelectorAll(".line-unknown-id").forEach((element) => {
    populateUnknownOptions(element);
  });
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
      const itemEtag = getItemEtag(item);
      if (item && item.id && itemEtag) {
        state.etagsByItemId.set(item.id, quote(itemEtag));
      }
    });
    return;
  }

  if (body && body.id) {
    const quoted = toQuotedTag(getItemEtag(body), fromHeader);
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

function getItemEtag(item) {
  return item?.etag ?? item?.eTag ?? "";
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

resetIngredientLines(elements.mealCreateLines, "create");
resetIngredientLines(elements.mealUpdateLines, "update");

void listDefaultProducts();
void listInventoryItems();
void listMeals();
void listUnknownIngredients();
