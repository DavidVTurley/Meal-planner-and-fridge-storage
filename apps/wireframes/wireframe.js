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

function setupCardExpansion() {
  const toggles = document.querySelectorAll("[data-card-toggle]");
  toggles.forEach((toggle) => {
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
  });
}

function setupInlineDialogs() {
  const getDialogs = (name) => document.querySelectorAll(`[data-inline-dialog="${name}"]`);

  const closeDialog = (name) => {
    getDialogs(name).forEach((dialog) => {
      dialog.hidden = true;
    });
  };

  const openButtons = document.querySelectorAll("[data-inline-dialog-open]");
  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-inline-dialog-open");
      if (!name) {
        return;
      }

      const item = button.closest(".item");
      if (!item) {
        return;
      }

      item.querySelectorAll("[data-inline-dialog]").forEach((dialog) => {
        dialog.hidden = true;
      });

      const dialog = item.querySelector(`[data-inline-dialog="${name}"]`);
      if (!dialog) {
        return;
      }

      dialog.hidden = false;
    });
  });

  const closeButtons = document.querySelectorAll("[data-inline-dialog-close]");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.getAttribute("data-inline-dialog-close");
      if (!name) {
        return;
      }

      closeDialog(name);
    });
  });
}

function setupCreateProductDialog() {
  const dialog = document.querySelector("[data-create-dialog]");
  const backdrop = document.querySelector("[data-create-dialog-backdrop]");
  const openButtons = document.querySelectorAll("[data-create-product-open]");
  const closeButtons = document.querySelectorAll("[data-create-product-close]");
  const saveButton = document.querySelector("[data-create-product-save]");
  const contextText = document.querySelector("[data-create-dialog-context]");
  const sourceSummary = document.querySelector("[data-create-source-summary]");
  const sourceList = document.querySelector("[data-create-source-list]");
  const successMessages = document.querySelectorAll("[data-create-success]");

  if (!dialog || !backdrop || openButtons.length === 0 || !saveButton) {
    return;
  }

  let activeContext = "catalog";

  const setSuccess = (context) => {
    successMessages.forEach((message) => {
      const visible = message.getAttribute("data-create-success") === context;
      message.hidden = !visible;
    });
  };

  const clearSuccess = () => {
    successMessages.forEach((message) => {
      message.hidden = true;
    });
  };

  const closeDialog = () => {
    dialog.hidden = true;
    backdrop.hidden = true;
  };

  const updateDialogContext = (context) => {
    activeContext = context;
    clearSuccess();

    if (context === "unknowns") {
      if (contextText) {
        contextText.textContent = "Create a reusable Product Catalog item from selected unknowns.";
      }

      if (sourceSummary && sourceList) {
        const items = Array.from(document.querySelectorAll('[data-selected="true"][data-create-source-item]'));
        sourceSummary.hidden = false;
        sourceList.innerHTML = "";

        items.forEach((item) => {
          const line = document.createElement("div");
          line.className = "item item-body compact-item";
          line.textContent = item.getAttribute("data-create-source-item") ?? "";
          sourceList.appendChild(line);
        });
      }

      return;
    }

    if (contextText) {
      contextText.textContent = "Set up a new reusable Product Catalog item.";
    }

    if (sourceSummary) {
      sourceSummary.hidden = true;
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const context = button.getAttribute("data-create-product-open") ?? "catalog";
      updateDialogContext(context);
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
    setSuccess(activeContext);
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
  setupDrawer();
  setupStateToggles();
  setupTabs();
  setupAdvancedPanels();
  setupCardExpansion();
  setupInlineDialogs();
  setupCreateProductDialog();
  setupCatalogFilters();
  setupUrgentFilters();
  setupQuickDecrement();
});
