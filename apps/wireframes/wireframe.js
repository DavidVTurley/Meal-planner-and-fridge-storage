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
  setupAdvancedPanels();
  setupCardExpansion();
  setupUrgentFilters();
  setupQuickDecrement();
});
