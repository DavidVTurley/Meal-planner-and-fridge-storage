function setupDrawer() {
  const drawer = document.querySelector("[data-drawer]");
  const backdrop = document.querySelector("[data-drawer-backdrop]");
  const openButton = document.querySelector("[data-drawer-open]");
  const closeButtons = document.querySelectorAll("[data-drawer-close]");

  if (!drawer || !backdrop || !openButton) {
    return;
  }

  const open = () => {
    drawer.hidden = false;
    backdrop.hidden = false;
    drawer.classList.add("open");
    openButton.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    drawer.classList.remove("open");
    drawer.hidden = true;
    backdrop.hidden = true;
    openButton.setAttribute("aria-expanded", "false");
  };

  openButton.addEventListener("click", open);
  closeButtons.forEach((button) => {
    button.addEventListener("click", close);
  });
}

function setupStateToggles() {
  const switchers = document.querySelectorAll("[data-state-target]");
  switchers.forEach((switcher) => {
    const groupName = switcher.getAttribute("data-state-target");
    if (!groupName) {
      return;
    }

    const group = document.querySelector(`[data-state-group="${groupName}"]`);
    if (!group) {
      return;
    }

    const buttons = switcher.querySelectorAll("[data-state]");
    const panels = group.querySelectorAll("[data-state-panel]");

    const setState = (stateName) => {
      buttons.forEach((button) => {
        const pressed = button.getAttribute("data-state") === stateName;
        button.setAttribute("aria-pressed", pressed ? "true" : "false");
      });

      panels.forEach((panel) => {
        const visible = panel.getAttribute("data-state-panel") === stateName;
        panel.hidden = !visible;
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextState = button.getAttribute("data-state");
        if (!nextState) {
          return;
        }

        setState(nextState);
      });
    });

    const defaultButton = buttons[0];
    if (defaultButton) {
      setState(defaultButton.getAttribute("data-state"));
    }
  });
}

function setupTabs() {
  const switchers = document.querySelectorAll("[data-tab-target]");
  switchers.forEach((switcher) => {
    const groupName = switcher.getAttribute("data-tab-target");
    if (!groupName) {
      return;
    }

    const group = document.querySelector(`[data-tab-group="${groupName}"]`);
    if (!group) {
      return;
    }

    const buttons = switcher.querySelectorAll("[data-tab]");
    const panels = group.querySelectorAll("[data-tab-panel]");

    const setTab = (tabName) => {
      buttons.forEach((button) => {
        const pressed = button.getAttribute("data-tab") === tabName;
        button.setAttribute("aria-pressed", pressed ? "true" : "false");
      });

      panels.forEach((panel) => {
        const visible = panel.getAttribute("data-tab-panel") === tabName;
        panel.hidden = !visible;
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextTab = button.getAttribute("data-tab");
        if (!nextTab) {
          return;
        }

        setTab(nextTab);
      });
    });

    const defaultButton = buttons[0];
    if (defaultButton) {
      setTab(defaultButton.getAttribute("data-tab"));
    }
  });
}

function formatAmount(value) {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readStore(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures in the wireframe prototype.
  }
}

function buildCatalogCardMarkup(product) {
  const slug = slugify(product.name || "product");
  const cardId = `catalog-card-${slug}-${product.version}`;
  const safeName = product.name || "New product";
  const safeLocation = product.location || "Pantry";
  const safeAmount = product.amount || "1";
  const safeUnit = product.unit || "piece";
  const safeShelfLife = product.shelfLife || "7";

  return `
    <div class="item" data-catalog-item data-name="${safeName.toLowerCase()}" data-location="${safeLocation.toLowerCase()}">
      <button
        class="card-toggle"
        type="button"
        data-card-toggle
        aria-expanded="false"
        aria-controls="${cardId}">
        <div class="item-head">
          <div>
            <p class="item-title">${safeName}</p>
            <p class="item-meta">${safeLocation} - ${safeAmount} ${safeUnit} per package</p>
          </div>
          <div class="card-summary-end">
            <span class="tag">v${product.version}</span>
            <span class="item-chevron" aria-hidden="true">v</span>
          </div>
        </div>
      </button>
      <div class="card-panel" id="${cardId}" data-card-panel hidden>
        <p class="item-meta">Shelf life: ${safeShelfLife} days from add date</p>
        <p class="item-meta">Current version: v${product.version} active for future stock entries</p>
        <div class="btn-row">
          <button
            class="btn"
            type="button"
            data-product-dialog-open="version"
            data-dialog-context="catalog"
            data-dialog-success-target="catalog"
            data-dialog-success-message="Next product version saved."
            data-prefill-name="${safeName}"
            data-prefill-location="${safeLocation}"
            data-prefill-amount="${safeAmount}"
            data-prefill-unit="${safeUnit}"
            data-prefill-shelf-life="${safeShelfLife}">Manage Version</button>
        </div>
      </div>
    </div>
  `;
}

function addCatalogProductToList(product) {
  const list = document.querySelector("[data-catalog-list]");
  if (!list) {
    return;
  }

  list.insertAdjacentHTML("beforeend", buildCatalogCardMarkup(product));
  const newToggle = list.lastElementChild?.querySelector("[data-card-toggle]");
  bindCardToggle(newToggle);

  const stateButtons = document.querySelectorAll('[data-state-target="catalog-state"] [data-state]');
  const statePanels = document.querySelectorAll('[data-state-group="catalog-state"] [data-state-panel]');
  if (stateButtons.length > 0 && statePanels.length > 0) {
    stateButtons.forEach((button) => {
      button.setAttribute("aria-pressed", button.getAttribute("data-state") === "default" ? "true" : "false");
    });
    statePanels.forEach((panel) => {
      panel.hidden = panel.getAttribute("data-state-panel") !== "default";
    });
  }
}

function hydrateCreatedCatalogProducts() {
  const list = document.querySelector("[data-catalog-list]");
  if (!list) {
    return;
  }

  const createdProducts = readStore("wireframe-created-products");
  createdProducts.forEach((product) => {
    addCatalogProductToList(product);
  });
}

function removeSelectedUnknownItems() {
  const selectedItems = getUnknownSelection();
  if (selectedItems.length === 0) {
    return [];
  }

  const removedIds = selectedItems
    .map((item) => item.getAttribute("data-unknown-id"))
    .filter((value) => Boolean(value));

  selectedItems.forEach((item) => {
    item.remove();
  });

  const removedStore = readStore("wireframe-removed-unknowns");
  const merged = [...new Set([...removedStore, ...removedIds])];
  writeStore("wireframe-removed-unknowns", merged);
  return removedIds;
}

function hydrateUnknownItems() {
  const removedIds = new Set(readStore("wireframe-removed-unknowns"));
  const items = Array.from(document.querySelectorAll("[data-unknown-item]"));
  if (items.length === 0) {
    return;
  }

  items.forEach((item) => {
    const id = item.getAttribute("data-unknown-id");
    if (id && removedIds.has(id)) {
      item.remove();
    }
  });
}

function syncUnknownStatePanels() {
  const items = Array.from(document.querySelectorAll("[data-unknown-item]"));
  const defaultPanel = document.querySelector('[data-state-group="unknowns-state"] [data-state-panel="default"]');
  const emptyPanel = document.querySelector('[data-state-group="unknowns-state"] [data-state-panel="empty"]');
  const buttons = document.querySelectorAll('[data-state-target="unknowns-state"] [data-state]');

  if (!defaultPanel || !emptyPanel || buttons.length === 0) {
    return;
  }

  const hasItems = items.length > 0;
  defaultPanel.hidden = !hasItems;
  emptyPanel.hidden = hasItems;

  buttons.forEach((button) => {
    const wantsDefault = button.getAttribute("data-state") === "default";
    button.setAttribute("aria-pressed", hasItems === wantsDefault ? "true" : "false");
  });
}

function setupAdvancedPanels() {
  const toggles = document.querySelectorAll("[data-panel-toggle]");

  const getPanel = (name) => document.querySelector(`[data-panel="${name}"]`);
  const getToggle = (name) => document.querySelector(`[data-panel-toggle="${name}"]`);

  const closePanel = (name) => {
    const panel = getPanel(name);
    const toggle = getToggle(name);
    if (!panel || !toggle) {
      return;
    }

    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };

  toggles.forEach((toggle) => {
    const name = toggle.getAttribute("data-panel-toggle");
    if (!name) {
      return;
    }

    const panel = getPanel(name);
    if (!panel) {
      return;
    }

    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");

    toggle.addEventListener("click", () => {
      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  });

  const applyButtons = document.querySelectorAll("[data-panel-apply]");
  applyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const panelName = button.getAttribute("data-panel-apply");
      if (!panelName) {
        return;
      }

      closePanel(panelName);
    });
  });
}

function bindCardToggle(toggle) {
  if (!toggle || toggle.hasAttribute("data-card-toggle-bound")) {
    return;
  }

  const item = toggle.closest(".item");
  const panelId = toggle.getAttribute("aria-controls");
  if (!item || !panelId) {
    return;
  }

  const panel = document.getElementById(panelId);
  if (!panel || panel.getAttribute("data-card-panel") === null) {
    return;
  }

  panel.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  item.removeAttribute("data-card-expanded");
  toggle.setAttribute("data-card-toggle-bound", "true");

  toggle.addEventListener("click", () => {
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");

    if (isOpen) {
      item.removeAttribute("data-card-expanded");
    } else {
      item.setAttribute("data-card-expanded", "true");
    }
  });
}

function setupCardExpansion() {
  const toggles = document.querySelectorAll("[data-card-toggle]");
  toggles.forEach((toggle) => {
    bindCardToggle(toggle);
  });
}

function getUnknownSelection() {
  return Array.from(document.querySelectorAll("[data-unknown-item]")).filter((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    return checkbox?.checked;
  });
}

function setupUnknownSelection() {
  const items = Array.from(document.querySelectorAll("[data-unknown-item]"));
  const countLabel = document.querySelector("[data-unknown-selected-count]");
  const actionButtons = document.querySelectorAll("[data-unknown-requires-selection]");

  if (items.length === 0) {
    return;
  }

  const syncSelectionState = () => {
    const selectedItems = getUnknownSelection();

    items.forEach((item) => {
      const checkbox = item.querySelector('input[type="checkbox"]');
      const isSelected = checkbox?.checked === true;
      if (isSelected) {
        item.setAttribute("data-selected", "true");
      } else {
        item.removeAttribute("data-selected");
      }
    });

    if (countLabel) {
      const count = selectedItems.length;
      countLabel.textContent = `${count} selected line${count === 1 ? "" : "s"} will map to one Product Catalog item.`;
    }

    actionButtons.forEach((button) => {
      button.disabled = selectedItems.length === 0;
    });
  };

  items.forEach((item) => {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox) {
      return;
    }

    checkbox.addEventListener("change", syncSelectionState);
  });

  const clearButton = document.querySelector("[data-unknown-clear-selection]");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      items.forEach((item) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = false;
        }
      });
      syncSelectionState();
    });
  }

  syncSelectionState();
}

function createSharedDialog() {
  const backdrop = document.createElement("div");
  backdrop.className = "dialog-backdrop";
  backdrop.hidden = true;

  const dialog = document.createElement("section");
  dialog.className = "overlay-dialog";
  dialog.hidden = true;
  dialog.innerHTML = `
    <div class="dialog-head">
      <div>
        <h2 data-shared-dialog-title>Create Product</h2>
        <p class="muted" data-shared-dialog-subtitle>Set up a new reusable Product Catalog item.</p>
      </div>
      <button class="btn btn-small" type="button" data-shared-dialog-close>Close</button>
    </div>
    <div class="source-summary" data-shared-dialog-source hidden>
      <p class="item-title">Source Unknowns</p>
      <div class="list compact-list" data-shared-dialog-source-list></div>
    </div>
    <div class="form-grid">
      <label>
        Product Name
        <input type="text" data-shared-dialog-name />
      </label>
      <label>
        Default Location
        <input type="text" data-shared-dialog-location />
      </label>
      <label>
        Amount Per Package
        <input type="number" data-shared-dialog-amount />
      </label>
      <label>
        Unit
        <select data-shared-dialog-unit>
          <option>g</option>
          <option>ml</option>
          <option>piece</option>
        </select>
      </label>
      <label>
        Shelf Life (days)
        <input type="number" data-shared-dialog-shelf-life />
      </label>
      <div class="btn-row">
        <button class="btn btn-success" type="button" data-shared-dialog-save>Save</button>
        <button class="btn" type="button" data-shared-dialog-close>Cancel</button>
      </div>
    </div>
  `;

  document.body.append(backdrop, dialog);
  return { backdrop, dialog };
}

function setupSharedProductDialog() {
  const openButtons = Array.from(document.querySelectorAll("[data-product-dialog-open]"));
  const successMessages = Array.from(document.querySelectorAll("[data-dialog-success]"));

  if (openButtons.length === 0) {
    return;
  }

  const { backdrop, dialog } = createSharedDialog();
  const title = dialog.querySelector("[data-shared-dialog-title]");
  const subtitle = dialog.querySelector("[data-shared-dialog-subtitle]");
  const sourceSummary = dialog.querySelector("[data-shared-dialog-source]");
  const sourceList = dialog.querySelector("[data-shared-dialog-source-list]");
  const nameInput = dialog.querySelector("[data-shared-dialog-name]");
  const locationInput = dialog.querySelector("[data-shared-dialog-location]");
  const amountInput = dialog.querySelector("[data-shared-dialog-amount]");
  const unitInput = dialog.querySelector("[data-shared-dialog-unit]");
  const shelfLifeInput = dialog.querySelector("[data-shared-dialog-shelf-life]");
  const saveButton = dialog.querySelector("[data-shared-dialog-save]");
  const closeButtons = dialog.querySelectorAll("[data-shared-dialog-close]");

  let activeConfig = null;

  const clearSuccess = () => {
    successMessages.forEach((message) => {
      message.hidden = true;
    });
  };

  const showSuccess = (target, messageText) => {
    successMessages.forEach((message) => {
      const visible = message.getAttribute("data-dialog-success") === target;
      message.hidden = !visible;
      if (visible && messageText) {
        const label = message.querySelector(".success-text");
        if (label) {
          label.textContent = messageText;
        }
      }
    });
  };

  const closeDialog = () => {
    dialog.hidden = true;
    backdrop.hidden = true;
  };

  const setFields = (config) => {
    nameInput.value = config.prefill.name ?? "";
    locationInput.value = config.prefill.location ?? "";
    amountInput.value = config.prefill.amount ?? "";
    unitInput.value = config.prefill.unit ?? "piece";
    shelfLifeInput.value = config.prefill.shelfLife ?? "";
  };

  const setSources = (sources) => {
    if (!sources || sources.length === 0) {
      sourceSummary.hidden = true;
      sourceList.innerHTML = "";
      return;
    }

    sourceSummary.hidden = false;
    sourceList.innerHTML = "";

    sources.forEach((source) => {
      const row = document.createElement("div");
      row.className = "item item-body compact-item";
      row.textContent = source;
      sourceList.appendChild(row);
    });
  };

  const buildConfig = (button) => {
    const mode = button.getAttribute("data-product-dialog-open") ?? "create";
    const context = button.getAttribute("data-dialog-context") ?? "catalog";
    const successTarget = button.getAttribute("data-dialog-success-target") ?? context;

    if (mode === "version") {
      return {
        mode,
        context,
        successTarget,
        successMessage: button.getAttribute("data-dialog-success-message") ?? "Next product version saved.",
        title: "Create Next Version",
        subtitle: "Editing this template creates a new version for future entries only.",
        saveLabel: "Save As Next Version",
        prefill: {
          name: button.getAttribute("data-prefill-name") ?? "",
          location: button.getAttribute("data-prefill-location") ?? "",
          amount: button.getAttribute("data-prefill-amount") ?? "",
          unit: button.getAttribute("data-prefill-unit") ?? "piece",
          shelfLife: button.getAttribute("data-prefill-shelf-life") ?? "",
        },
        sources: [],
      };
    }

    if (context === "unknowns") {
      const selectedItems = getUnknownSelection();
      const firstSelected = selectedItems[0];
      const prefillName = firstSelected?.getAttribute("data-unknown-name") ?? "";
      const prefillUnit = firstSelected?.getAttribute("data-unknown-unit") ?? "piece";
      const sources = selectedItems.map((item) => item.getAttribute("data-create-source-item") ?? "");

      return {
        mode,
        context,
        successTarget,
        successMessage: button.getAttribute("data-dialog-success-message") ?? "Product created from selected unknowns.",
        title: "Create Product",
        subtitle: "Create a reusable Product Catalog item from selected unknowns.",
        saveLabel: "Create Product",
        prefill: {
          name: prefillName,
          location: "",
          amount: "",
          unit: prefillUnit,
          shelfLife: "",
        },
        sources,
      };
    }

    return {
      mode,
      context,
      successTarget,
      successMessage: button.getAttribute("data-dialog-success-message") ?? "Product created.",
      title: "Create Product",
      subtitle: "Set up a new reusable Product Catalog item.",
      saveLabel: "Create Product",
      prefill: {
        name: "",
        location: "",
        amount: "",
        unit: "piece",
        shelfLife: "",
      },
      sources: [],
    };
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeConfig = buildConfig(button);
      clearSuccess();
      title.textContent = activeConfig.title;
      subtitle.textContent = activeConfig.subtitle;
      saveButton.textContent = activeConfig.saveLabel;
      setFields(activeConfig);
      setSources(activeConfig.sources);
      dialog.hidden = false;
      backdrop.hidden = false;
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeDialog);
  });

  backdrop.addEventListener("click", closeDialog);

  saveButton.addEventListener("click", () => {
    closeDialog();
    if (activeConfig) {
      const product = {
        name: nameInput.value.trim() || activeConfig.prefill.name || "New product",
        location: locationInput.value.trim() || activeConfig.prefill.location || "Pantry",
        amount: amountInput.value.trim() || activeConfig.prefill.amount || "1",
        unit: unitInput.value || activeConfig.prefill.unit || "piece",
        shelfLife: shelfLifeInput.value.trim() || activeConfig.prefill.shelfLife || "7",
        version: activeConfig.mode === "version" ? "next" : 1,
      };

      if (activeConfig.mode === "create") {
        const createdProducts = readStore("wireframe-created-products");
        createdProducts.push(product);
        writeStore("wireframe-created-products", createdProducts);
      }

      if (activeConfig.mode === "create" && activeConfig.context === "catalog") {
        addCatalogProductToList(product);
      }

      if (activeConfig.mode === "create" && activeConfig.context === "unknowns") {
        removeSelectedUnknownItems();
        setupUnknownSelection();
        syncUnknownStatePanels();
      }

      showSuccess(activeConfig.successTarget, activeConfig.successMessage);
    }
  });
}

function setupCatalogFilters() {
  const list = document.querySelector("[data-catalog-list]");
  const nameInput = document.querySelector("[data-catalog-filter-name]");
  const locationInput = document.querySelector("[data-catalog-filter-location]");
  const applyButtons = document.querySelectorAll("[data-catalog-apply]");
  const clearButtons = document.querySelectorAll("[data-catalog-clear]");
  const items = list ? Array.from(list.querySelectorAll("[data-catalog-item]")) : [];
  const stateButtons = document.querySelectorAll('[data-state-target="catalog-state"] [data-state]');
  const statePanels = document.querySelectorAll('[data-state-group="catalog-state"] [data-state-panel]');

  if (!list || !nameInput || !locationInput || items.length === 0 || stateButtons.length === 0 || statePanels.length === 0) {
    return;
  }

  const setCatalogState = (stateName) => {
    stateButtons.forEach((button) => {
      const pressed = button.getAttribute("data-state") === stateName;
      button.setAttribute("aria-pressed", pressed ? "true" : "false");
    });

    statePanels.forEach((panel) => {
      const visible = panel.getAttribute("data-state-panel") === stateName;
      panel.hidden = !visible;
    });
  };

  const applyFilters = () => {
    const nameQuery = nameInput.value.trim().toLowerCase();
    const locationQuery = locationInput.value.trim().toLowerCase();

    let visibleCount = 0;
    items.forEach((item) => {
      const name = item.getAttribute("data-name") ?? "";
      const location = item.getAttribute("data-location") ?? "";
      const matchesName = !nameQuery || name.includes(nameQuery);
      const matchesLocation = !locationQuery || location.includes(locationQuery);
      const show = matchesName && matchesLocation;
      item.hidden = !show;
      if (show) {
        visibleCount += 1;
      }
    });

    setCatalogState(visibleCount === 0 ? "empty" : "default");
  };

  applyButtons.forEach((button) => {
    button.addEventListener("click", applyFilters);
  });

  clearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      nameInput.value = "";
      locationInput.value = "";
      items.forEach((item) => {
        item.hidden = false;
      });
      setCatalogState("default");
    });
  });
}

function setupUrgentFilters() {
  const list = document.querySelector("[data-urgent-list]");
  const buttons = document.querySelectorAll("[data-urgent-filter]");
  if (!list || buttons.length === 0) {
    return;
  }

  const items = Array.from(list.querySelectorAll("[data-urgent-status]"));
  const emptyMessage = document.querySelector("[data-urgent-empty]");
  let activeFilter = "all";

  const updateCounts = () => {
    const activeItems = items.filter((item) => !item.hidden);
    const counts = {
      all: activeItems.length,
      "use-soon": activeItems.filter((item) => item.getAttribute("data-urgent-status") === "use-soon").length,
      expired: activeItems.filter((item) => item.getAttribute("data-urgent-status") === "expired").length,
    };

    Object.entries(counts).forEach(([key, value]) => {
      const label = document.querySelector(`[data-urgent-count="${key}"]`);
      if (label) {
        label.textContent = String(value);
      }
    });
  };

  const applyFilter = (filter) => {
    activeFilter = filter;
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", button.getAttribute("data-urgent-filter") === filter ? "true" : "false");
    });

    let visible = 0;
    items.forEach((item) => {
      if (item.hidden) {
        item.classList.remove("is-filter-hidden");
        return;
      }

      const status = item.getAttribute("data-urgent-status");
      const show = filter === "all" || status === filter;
      item.classList.toggle("is-filter-hidden", !show);
      if (show) {
        visible += 1;
      }
    });

    if (emptyMessage) {
      emptyMessage.hidden = visible > 0;
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-urgent-filter");
      if (!filter) {
        return;
      }

      applyFilter(filter);
      updateCounts();
    });
  });

  document.addEventListener("urgent:list-changed", () => {
    updateCounts();
    applyFilter(activeFilter);
  });

  updateCounts();
  applyFilter(activeFilter);
}

function setupQuickDecrement() {
  const undoRegion = document.querySelector("[data-undo-region]");
  const undoText = document.querySelector("[data-undo-text]");
  const undoAction = document.querySelector("[data-undo-action]");

  if (!undoRegion || !undoText || !undoAction) {
    return;
  }

  let undoHandler = null;

  const clearUndo = () => {
    undoHandler = null;
    undoRegion.hidden = true;
    undoText.textContent = "Item updated.";
  };

  const showUndo = (message, callback) => {
    undoHandler = callback;
    undoText.textContent = message;
    undoRegion.hidden = false;
  };

  undoAction.addEventListener("click", () => {
    if (!undoHandler) {
      return;
    }

    undoHandler();
    clearUndo();
  });

  const quickButtons = document.querySelectorAll("[data-quick-decrement]");
  quickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest("[data-item-id]");
      if (!item) {
        return;
      }

      const itemLabel = item.getAttribute("data-item-label") ?? "Item";
      const context = item.getAttribute("data-context") ?? "inventory";
      const unit = item.getAttribute("data-unit") ?? "piece";
      const previousHidden = item.hidden;
      const previousAmount = item.getAttribute("data-amount") ?? "0";
      const amountLabel = item.querySelector("[data-amount-label]");
      const previousAmountLabel = amountLabel ? amountLabel.textContent : "";

      if (context === "urgent") {
        item.hidden = true;
        document.dispatchEvent(new Event("urgent:list-changed"));
        showUndo(`Removed 1 unit from ${itemLabel}.`, () => {
          item.hidden = previousHidden;
          document.dispatchEvent(new Event("urgent:list-changed"));
        });
        return;
      }

      const currentAmount = Number(previousAmount);
      if (!Number.isFinite(currentAmount)) {
        return;
      }

      const step = unit === "piece" ? 1 : 50;
      const nextAmount = Math.max(0, currentAmount - step);

      item.setAttribute("data-amount", String(nextAmount));
      if (amountLabel) {
        amountLabel.textContent = `${formatAmount(nextAmount)} ${unit}`;
      }

      showUndo(`-${step} ${unit} from ${itemLabel}.`, () => {
        item.setAttribute("data-amount", previousAmount);
        if (amountLabel) {
          amountLabel.textContent = previousAmountLabel;
        }
      });
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  hydrateCreatedCatalogProducts();
  hydrateUnknownItems();
  setupDrawer();
  setupStateToggles();
  setupTabs();
  setupAdvancedPanels();
  setupCardExpansion();
  setupUnknownSelection();
  syncUnknownStatePanels();
  setupSharedProductDialog();
  setupCatalogFilters();
  setupUrgentFilters();
  setupQuickDecrement();
});
