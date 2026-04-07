const state = {
  defaultProducts: [],
  inventoryItems: [],
  knownLocations: [],
  meals: [],
  unknownIngredients: [],
  etagsByItemId: new Map(),
};

const UNKNOWN_SOURCE_VALUE = "__unknown__";
const THEME_STORAGE_KEY = "mealplanner.theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

const elements = {
  themeToggle: document.getElementById("theme-toggle"),
  themeToggleLabel: document.getElementById("theme-toggle-label"),
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
  defaultLocation: document.getElementById("default-location"),
  defaultUpdateLocation: document.getElementById("default-update-location"),

  inventoryCreateForm: document.getElementById("inventory-create-form"),
  inventoryName: document.getElementById("inventory-name"),
  inventoryRemaining: document.getElementById("inventory-remaining"),
  inventoryRemainingUnitHint: document.getElementById("inventory-remaining-unit-hint"),
  inventoryDefaultId: document.getElementById("inventory-default-id"),
  inventoryDateAdded: document.getElementById("inventory-date-added"),
  inventorySellBy: document.getElementById("inventory-sell-by"),
  inventoryLocation: document.getElementById("inventory-location"),
  inventoryLocationCombo: document.getElementById("inventory-location-combo"),
  inventoryTableBody: document.getElementById("inventory-table-body"),
  inventoryListBtn: document.getElementById("inventory-list-btn"),
  inventoryFilterForm: document.getElementById("inventory-filter-form"),
  inventoryGetForm: document.getElementById("inventory-get-form"),
  decrementForm: document.getElementById("inventory-decrement-form"),
  decrementId: document.getElementById("decrement-id"),
  decrementAmount: document.getElementById("decrement-amount"),
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
const inventoryLocationCombo = createCombobox(elements.inventoryLocationCombo, {
  emptyText: "Type to create this location",
  allowCustomInput: true,
});

setupThemeToggle();
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
      defaultLocation: getValue("default-location") || null,
    };

    await requestJson("POST", "/api/default-products", payload);
    await listDefaultProducts();
  });

  elements.defaultUpdateId.addEventListener("change", () => {
    if (!getValue("default-update-id")) {
      elements.defaultUpdateName.value = "";
      elements.defaultUpdateShelf.value = "";
      elements.defaultUpdateAmount.value = "";
      elements.defaultUpdateUnit.value = "g";
      elements.defaultUpdateLocation.value = "";
      return;
    }

    const selected = state.defaultProducts.find((item) => item.id === getValue("default-update-id"));
    if (!selected) {
      return;
    }

    elements.defaultUpdateName.value = selected.name;
    elements.defaultUpdateShelf.value = selected.defaultShelfLifeDays;
    elements.defaultUpdateAmount.value = selected.amountPerPackage;
    elements.defaultUpdateUnit.value = selected.unit;
    elements.defaultUpdateLocation.value = selected.defaultLocation ?? "";
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
      defaultLocation: getValue("default-update-location") || null,
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
      location: inventoryLocationCombo.getSubmissionValue(),
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
      setDecrementTarget(
        result.body.id,
        toQuotedTag(getItemEtag(result.body), result.headers.get("etag")),
        result.body.remainingAmountMetric);
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
      setDecrementTarget(
        result.body.id,
        toQuotedTag(getItemEtag(result.body), result.headers.get("etag")),
        result.body.remainingAmountMetric);
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
    if (!elements.mealUpdateId.value) {
      elements.mealUpdateName.value = "";
      resetIngredientLines(elements.mealUpdateLines, "update");
      return;
    }

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
    const selected = state.meals.find((meal) => meal.id === elements.mealUpdateId.value);
    if (selected) {
      hydrateUpdateFormFromMeal(selected);
    }
  });
}

function setupThemeToggle() {
  if (!elements.themeToggle || !elements.themeToggleLabel) {
    return;
  }

  const storedTheme = readStoredTheme();
  const initialTheme = getCurrentTheme() ?? resolveSystemTheme();
  applyTheme(initialTheme, { persist: false });

  const colorSchemeMedia = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

  if (!storedTheme && colorSchemeMedia) {
    colorSchemeMedia.addEventListener("change", (event) => {
      if (readStoredTheme()) {
        return;
      }

      applyTheme(event.matches ? THEME_DARK : THEME_LIGHT, { persist: false });
    });
  }

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = getCurrentTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyTheme(nextTheme, { persist: true });
  });
}

function applyTheme(theme, options = {}) {
  const normalizedTheme = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  document.documentElement.setAttribute("data-theme", normalizedTheme);

  const isDark = normalizedTheme === THEME_DARK;
  elements.themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  elements.themeToggleLabel.textContent = isDark ? "Switch to light mode" : "Switch to dark mode";
  elements.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");

  if (options.persist) {
    writeStoredTheme(normalizedTheme);
  }
}

function getCurrentTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === THEME_DARK || currentTheme === THEME_LIGHT) {
    return currentTheme;
  }

  return null;
}

function resolveSystemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEME_DARK
    : THEME_LIGHT;
}

function readStoredTheme() {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    if (theme === THEME_DARK || theme === THEME_LIGHT) {
      return theme;
    }
  } catch (_) {
    return null;
  }

  return null;
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (_) {
    // Ignore storage failures and keep in-memory theme applied.
  }
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
  refreshKnownLocations();
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

  appendPlaceholderOption(elements.defaultUpdateId, "Select Default Product");
  appendPlaceholderOption(elements.inventoryDefaultId, "Select Ingredient");
  appendPlaceholderOption(elements.unknownConvertDefaultId, "Select Ingredient");

  state.defaultProducts.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mono">${product.id}</td>
      <td>${product.name}</td>
      <td>${product.defaultShelfLifeDays}</td>
      <td>${product.amountPerPackage}</td>
      <td>${product.unit}</td>
      <td>${product.defaultLocation ?? "-"}</td>
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

  elements.defaultUpdateId.value = "";
  elements.inventoryDefaultId.value = "";
  elements.unknownConvertDefaultId.value = "";

  elements.defaultUpdateName.value = "";
  elements.defaultUpdateShelf.value = "";
  elements.defaultUpdateAmount.value = "";
  elements.defaultUpdateUnit.value = "g";
  elements.defaultUpdateLocation.value = "";
  syncInventoryIngredientToSelectedDefault();

  if (!elements.defaultLocation.value) {
    elements.defaultLocation.value = "";
  }
}

function renderInventoryTable() {
  elements.inventoryTableBody.innerHTML = "";

  state.inventoryItems.forEach((item) => {
    const etag = toQuotedTag(getItemEtag(item), state.etagsByItemId.get(item.id));
    const defaultProduct = state.defaultProducts.find((product) => product.id === item.defaultProductId);
    const defaultProductDisplay = defaultProduct
      ? `${defaultProduct.name} (${defaultProduct.unit})`
      : `Unknown (${item.defaultProductId})`;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="mono">${item.id}</td>
      <td>${defaultProductDisplay}</td>
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
      const selected = state.inventoryItems.find((item) => item.id === id);
      setDecrementTarget(id, quoted, selected?.remainingAmountMetric ?? null);
    });
  });
}

function renderMeals() {
  const previousSelection = elements.mealUpdateId.value;
  elements.mealsTableBody.innerHTML = "";
  elements.mealUpdateId.innerHTML = "";
  appendPlaceholderOption(elements.mealUpdateId, "Select Meal");

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

  const selected = state.meals.find((meal) => meal.id === previousSelection);
  if (selected) {
    elements.mealUpdateId.value = selected.id;
    hydrateUpdateFormFromMeal(selected);
    return;
  }

  elements.mealUpdateId.value = "";
}

function renderUnknownIngredients() {
  elements.unknownTableBody.innerHTML = "";
  elements.unknownConvertId.innerHTML = "";
  appendPlaceholderOption(elements.unknownConvertId, "Select Ingredient");

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

  elements.unknownConvertId.value = "";
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
    <label class="line-source-field">
      Ingredient
      <div class="combobox line-source-combo">
        <input class="combobox-input line-source-input" type="text" placeholder="Select Ingredient" autocomplete="off" />
        <div class="combobox-list" hidden></div>
      </div>
    </label>
    <label class="line-amount-field">
      Amount
      <input class="line-amount" type="number" min="0.001" step="0.001" value="100" />
    </label>
    <label class="line-unknown-name-field">
      Display Name
      <input class="line-unknown-display-name" type="text" placeholder="display name" />
    </label>
    <label class="line-unknown-unit-field">
      Unit
      <select class="line-unknown-unit">
        <option value="g">g</option>
        <option value="ml">ml</option>
        <option value="piece">piece</option>
      </select>
    </label>
    <div class="line-actions">
      <button type="button" class="line-remove-btn">Remove</button>
    </div>
  `;

  container.appendChild(row);

  const sourceCombo = createCombobox(row.querySelector(".line-source-combo"), {
    emptyText: "No sources match",
    defaultPlaceholder: "Select Ingredient",
  });

  row._sourceCombo = sourceCombo;

  const amountInput = row.querySelector(".line-amount");
  const unknownNameInput = row.querySelector(".line-unknown-display-name");
  const unknownUnitSelect = row.querySelector(".line-unknown-unit");
  const removeButton = row.querySelector(".line-remove-btn");

  populateLineSourceOptions(sourceCombo);

  const initialAmount = initialValue?.amount ?? 100;
  amountInput.value = String(initialAmount);

  if (initialValue) {
    if (initialValue.defaultProductId) {
      sourceCombo.setValue(toKnownSourceValue(initialValue.defaultProductId), { notify: false });
    }

    if (initialValue.ingredientKind === "unknown") {
      sourceCombo.setValue(UNKNOWN_SOURCE_VALUE, { notify: false });
    }

    if (initialValue.ingredientKind === "unknown" && initialValue.unknownDisplayName) {
      unknownNameInput.value = initialValue.unknownDisplayName;
    }

    if (initialValue.ingredientKind === "unknown" && initialValue.unknownUnit) {
      unknownUnitSelect.value = initialValue.unknownUnit;
    }
  } else {
    sourceCombo.clearValue({ notify: false });
  }

  sourceCombo.onChange(() => {
    applyIngredientLineMode(row, { resetKnownAmount: true });
  });

  removeButton.addEventListener("click", () => {
    row.remove();
    ensureAtLeastOneIngredientLine(container, mode);
  });

  applyIngredientLineMode(row, {
    resetKnownAmount: !initialValue || initialValue.ingredientKind !== "known",
  });
}

function applyIngredientLineMode(row, options = {}) {
  const sourceCombo = row._sourceCombo;
  const sourceValue = sourceCombo?.getValue() ?? "";
  const amountInput = row.querySelector(".line-amount");
  const unknownNameInput = row.querySelector(".line-unknown-display-name");
  const unknownUnitSelect = row.querySelector(".line-unknown-unit");
  const unknownNameField = row.querySelector(".line-unknown-name-field");
  const unknownUnitField = row.querySelector(".line-unknown-unit-field");

  const selectedProduct = getDefaultProductFromSource(sourceValue);
  const isUnknown = sourceValue === UNKNOWN_SOURCE_VALUE;
  const isKnown = !isUnknown;

  row.classList.toggle("line-mode-known", isKnown);
  row.classList.toggle("line-mode-unknown", isUnknown);
  unknownNameField.hidden = !isUnknown;
  unknownUnitField.hidden = !isUnknown;

  if (isKnown && selectedProduct) {
    if (options.resetKnownAmount) {
      amountInput.value = String(selectedProduct.amountPerPackage);
    }

    unknownNameInput.value = "";
    unknownUnitSelect.value = "g";
    return;
  }

  if (!isUnknown) {
    unknownNameInput.value = "";
    unknownUnitSelect.value = "g";
  }
}

function collectIngredientLinesPayload(container) {
  const rows = Array.from(container.querySelectorAll(".ingredient-line"));
  if (rows.length === 0) {
    throw new Error("At least one ingredient line is required.");
  }

  return rows.map((row) => {
    const sourceValue = row._sourceCombo?.getValue() ?? "";
    const amount = toNumber(row.querySelector(".line-amount").value);
    const selectedProduct = getDefaultProductFromSource(sourceValue);

    if (selectedProduct) {
      return {
        ingredientKind: "known",
        defaultProductId: selectedProduct.id,
        unknownIngredientId: null,
        unknownDisplayName: null,
        unknownUnit: null,
        amount,
      };
    }

    if (sourceValue !== UNKNOWN_SOURCE_VALUE) {
      throw new Error("Each ingredient line must select an ingredient source.");
    }

    const payload = {
      ingredientKind: "unknown",
      defaultProductId: null,
      unknownIngredientId: null,
      unknownDisplayName: null,
      unknownUnit: null,
      amount,
    };

    payload.unknownDisplayName = row.querySelector(".line-unknown-display-name").value.trim() || null;
    payload.unknownUnit = row.querySelector(".line-unknown-unit").value || null;

    if (!payload.unknownDisplayName) {
      throw new Error("Unknown ingredient lines require a display name.");
    }

    return payload;
  });
}

function populateLineSourceOptions(sourceCombo) {
  const options = [
    { value: UNKNOWN_SOURCE_VALUE, label: "Unknown ingredient" },
    ...state.defaultProducts.map((product) => ({
      value: toKnownSourceValue(product.id),
      label: `${product.name} (${product.unit})`,
    })),
  ];
  sourceCombo.setOptions(options);
}

function refreshIngredientLineOptions() {
  document.querySelectorAll(".ingredient-line").forEach((row) => {
    if (!row._sourceCombo) {
      return;
    }

    const previousSource = row._sourceCombo.getValue();

    populateLineSourceOptions(row._sourceCombo);

    row._sourceCombo.setValue(previousSource, { notify: false });
    applyIngredientLineMode(row, { resetKnownAmount: false });
  });
}

function toKnownSourceValue(id) {
  return `known:${id}`;
}

function getDefaultProductFromSource(sourceValue) {
  if (!sourceValue || sourceValue === UNKNOWN_SOURCE_VALUE || !sourceValue.startsWith("known:")) {
    return null;
  }

  const id = sourceValue.slice("known:".length);
  return state.defaultProducts.find((item) => item.id === id) ?? null;
}

function createCombobox(container, options = {}) {
  if (!container) {
    return {
      setOptions() {},
      setValue() {},
    clearValue() {},
    setInputValue() {},
    getValue() {
      return "";
    },
      getSubmissionValue() {
        return "";
      },
      onChange() {},
    };
  }

  const input = container.querySelector(".combobox-input");
  const list = container.querySelector(".combobox-list");
  const emptyText = options.emptyText ?? "No matches";
  const allowCustomInput = options.allowCustomInput === true;
  const defaultPlaceholder = options.defaultPlaceholder ?? input.getAttribute("placeholder") ?? "";
  const handlers = [];

  let items = [];
  let selectedValue = "";
  let selectedLabel = "";
  let customValue = "";
  let isOpen = false;

  const normalize = (value) => value.trim().toLowerCase();

  const findByValue = (value) => items.find((item) => item.value === value) ?? null;
  const findVisibleMatches = (filterText) => {
    const query = normalize(filterText);
    return items.filter((item) => !query || normalize(item.label).includes(query));
  };

  const render = (filterText = "") => {
    const visible = findVisibleMatches(filterText);

    list.innerHTML = "";
    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "combobox-empty";
      empty.textContent = emptyText;
      list.appendChild(empty);
      return;
    }

    visible.forEach((item) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "combobox-option";
      option.textContent = item.label;
      option.dataset.value = item.value;
      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
        api.setValue(item.value);
        close();
      });
      list.appendChild(option);
    });
  };

  const open = () => {
    isOpen = true;
    container.classList.add("open");
    list.hidden = false;
    render(input.value === selectedLabel ? "" : input.value);
  };

  const close = () => {
    isOpen = false;
    container.classList.remove("open");
    list.hidden = true;
    if (selectedLabel) {
      input.value = selectedLabel;
      customValue = "";
      return;
    }

    if (!allowCustomInput) {
      input.value = "";
      return;
    }

    customValue = input.value.trim();
    input.value = customValue;
  };

  const notify = () => {
    const selected = findByValue(selectedValue);
    handlers.forEach((handler) => handler(selectedValue, selected));
  };

  const api = {
    setOptions(nextItems) {
      items = Array.isArray(nextItems) ? nextItems : [];
      const selected = findByValue(selectedValue);
      if (!selected && items.length > 0) {
        selectedValue = "";
        selectedLabel = "";
        if (!allowCustomInput) {
          input.value = "";
        }
      } else if (selected) {
        selectedLabel = selected.label;
        input.value = selectedLabel;
      }

      if (isOpen) {
        render(input.value);
      }
    },
    setValue(value, setOptions = {}) {
      const selected = findByValue(value);
      if (!selected) {
        return;
      }

      const previous = selectedValue;
      selectedValue = selected.value;
      selectedLabel = selected.label;
      customValue = "";
      input.value = selected.label;

      if (setOptions.notify !== false && previous !== selectedValue) {
        notify();
      }
    },
    getValue() {
      return selectedValue;
    },
    clearValue(setOptions = {}) {
      const previous = selectedValue;
      selectedValue = "";
      selectedLabel = "";
      customValue = "";
      input.value = "";
      if (setOptions.notify !== false && previous) {
        notify();
      }
    },
    getSubmissionValue() {
      if (selectedLabel) {
        return selectedLabel;
      }

      if (allowCustomInput) {
        return input.value.trim();
      }

      return "";
    },
    setInputValue(value, setOptions = {}) {
      selectedValue = "";
      selectedLabel = "";
      customValue = (value ?? "").trim();
      input.value = customValue;
      if (setOptions.notify) {
        notify();
      }
    },
    onChange(handler) {
      handlers.push(handler);
    },
  };

  input.addEventListener("focus", open);
  input.addEventListener("input", () => {
    if (!isOpen) {
      open();
    }

    if (!allowCustomInput) {
      selectedValue = "";
      selectedLabel = "";
    }

    render(input.value);
    const matches = findVisibleMatches(input.value);
    if (!allowCustomInput && matches.length === 1) {
      api.setValue(matches[0].value);
      close();
    }
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const matches = findVisibleMatches(input.value);
      if (matches.length === 1) {
        api.setValue(matches[0].value);
      } else if (!allowCustomInput) {
        return;
      } else {
        selectedValue = "";
        selectedLabel = "";
        customValue = input.value.trim();
      }
      close();
    }
  });
  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      close();
    }, 80);
  });

  if (defaultPlaceholder) {
    input.setAttribute("placeholder", defaultPlaceholder);
  }

  return api;
}

function syncInventoryIngredientToSelectedDefault() {
  const selectedId = elements.inventoryDefaultId.value;
  if (!selectedId) {
    elements.inventoryName.value = "";
    elements.inventoryRemaining.value = "";
    elements.inventoryRemainingUnitHint.textContent = "(unit: -)";
    inventoryLocationCombo.clearValue({ notify: false });
    return;
  }

  const selected = state.defaultProducts.find((item) => item.id === selectedId);
  if (!selected) {
    elements.inventoryName.value = "";
    elements.inventoryRemaining.value = "";
    elements.inventoryRemainingUnitHint.textContent = "(unit: -)";
    inventoryLocationCombo.clearValue({ notify: false });
    return;
  }

  elements.inventoryName.value = selected.name;
  elements.inventoryRemaining.value = String(selected.amountPerPackage);
  elements.inventoryRemainingUnitHint.textContent = `(unit: ${selected.unit})`;
  if (selected.defaultLocation) {
    inventoryLocationCombo.setInputValue(selected.defaultLocation);
  }
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

function setDecrementTarget(id, quotedEtag, remainingAmount = null) {
  elements.decrementId.value = id ?? "";
  elements.decrementIfMatch.value = quotedEtag ?? "";
  if (remainingAmount !== null && remainingAmount !== undefined) {
    elements.decrementAmount.value = String(remainingAmount);
  }
  const getIdInput = document.getElementById("inventory-get-id");
  getIdInput.value = id ?? "";
}

function refreshKnownLocations() {
  const distinct = new Set();
  state.inventoryItems.forEach((item) => {
    if (item.locationDisplay) {
      distinct.add(item.locationDisplay);
    }
  });

  state.knownLocations = Array.from(distinct).sort((left, right) => left.localeCompare(right));
  inventoryLocationCombo.setOptions(
    state.knownLocations.map((location) => ({
      value: location,
      label: location,
    })),
  );
}

function appendPlaceholderOption(select, label) {
  const option = document.createElement("option");
  option.value = "";
  option.textContent = label;
  option.disabled = true;
  option.selected = true;
  select.appendChild(option);
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
