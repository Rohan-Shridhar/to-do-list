const SUBJECTS = [
  { id: "General", icon: "⌂" },
  { id: "AIN", icon: "✧" },
  { id: "CON", icon: "⌘" },
  { id: "DEV", icon: "\u25A4" },
  { id: "OOM", icon: "▱" },
  { id: "RPA", icon: "\u2699" },
  { id: "CC", icon: "</>" },
  { id: "BIS", icon: "\u223f" },
  { id: "MIP", icon: "\u2692" }
];

const STORAGE_KEY = "study-ladder-tasks-v1";

const nav = document.getElementById("subjectNav");
const sidebar = document.getElementById("sidebar");
const taskList = document.getElementById("taskList");
const pageTitle = document.getElementById("pageTitle");
const taskCount = document.getElementById("taskCount");
const doneCount = document.getElementById("doneCount");
const emptyState = document.getElementById("emptyState");

const modalBackdrop = document.getElementById("modalBackdrop");
const taskForm = document.getElementById("taskForm");
const taskName = document.getElementById("taskName");
const taskDeadline = document.getElementById("taskDeadline");
const modalTitle = document.getElementById("modalTitle");
const modalEyebrow = document.getElementById("modalEyebrow");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const undoBtn = document.getElementById("undoBtn");

let activeSubject = "General";
let editingTaskId = null;
let undoSnapshot = null;
let toastTimer = null;

let tasks = loadTasks();

// Load saved tasks from browser storage
function loadTasks() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Save tasks to browser storage
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Prevent task names from being interpreted as HTML
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// Render the nine sidebar subjects
function buildNav() {
  nav.innerHTML = SUBJECTS.map(subject => `
    <button
      class="subject-button ${
        subject.id === activeSubject ? "active" : ""
      }"
      data-subject="${subject.id}"
      title="${subject.id}"
    >
      <span class="subject-icon">
        ${escapeHTML(subject.icon)}
      </span>
      <span class="subject-label">${subject.id}</span>
    </button>
  `).join("");
}

// Get tasks for the selected subject and sort by deadline
function getVisibleTasks() {
  return tasks
    .filter(task => task.subject === activeSubject)
    .sort((a, b) => {
      // Pending tasks appear before completed tasks
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed);
      }

      // Tasks without deadlines appear after dated tasks
      if (!a.deadline && !b.deadline) {
        return a.createdAt - b.createdAt;
      }

      if (!a.deadline) return 1;
      if (!b.deadline) return -1;

      // Earlier deadlines appear first
      return (
        a.deadline.localeCompare(b.deadline) ||
        a.createdAt - b.createdAt
      );
    });
}

// Format deadline dates
function prettyDate(dateString) {
  if (!dateString) return "No deadline";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short"
  });
}

// Check whether a task deadline has passed
function isOverdue(dateString) {
  if (!dateString) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(`${dateString}T00:00:00`) < today;
}

// Render task cards and counters
function render() {
  buildNav();

  pageTitle.textContent = activeSubject;

  const visible = getVisibleTasks();

  const completed = visible.filter(
    task => task.completed
  ).length;

  taskCount.textContent =
    `${visible.length} ${
      visible.length === 1 ? "task" : "tasks"
    }`;

  doneCount.textContent = `${completed} completed`;

  emptyState.hidden = visible.length > 0;

  taskList.innerHTML = visible.map((task, index) => {
    const deadlineClass = !task.deadline
      ? "no-date"
      : (
          isOverdue(task.deadline) && !task.completed
            ? "overdue"
            : ""
        );

    const deadline = task.deadline
      ? `${prettyDate(task.deadline)}`
      : "No deadline";

    return `
      ${
        index
          ? '<div class="step-connector" aria-hidden="true"></div>'
          : ""
      }

      <article
        class="task-card ${task.completed ? "completed" : ""}"
        data-id="${task.id}"
        aria-label="${escapeHTML(task.title)}"
      >

        <div class="task-content">
          <div class="task-title">
            ${escapeHTML(task.title)}
          </div>

          <div class="task-meta">
            <span class="task-category">
              ◆ ${task.subject}
            </span>
            <span>·</span>
            <span>
              ${task.completed ? "Completed" : "In progress"}
            </span>
          </div>
        </div>

        <div class="task-deadline ${deadlineClass}">
          ${deadline}
        </div>
      </article>
    `;
  }).join("");

  attachSwipeHandlers();
}

// Open the add/edit task modal
function openModal(task = null) {
  editingTaskId = task ? task.id : null;

  taskForm.reset();

  modalTitle.textContent = task
    ? "Edit this step"
    : "What's the next task?";

  modalEyebrow.textContent = task
    ? "UPDATE YOUR STEP"
    : "ADD A NEW STEP";

  saveTaskBtn.textContent = task
    ? "Save changes"
    : "Add task";

  if (task) {
    taskName.value = task.title;
    taskDeadline.value = task.deadline || "";
  }

  modalBackdrop.hidden = false;

  setTimeout(() => taskName.focus(), 30);
}

// Close the task modal
function closeModal() {
  modalBackdrop.hidden = true;
  editingTaskId = null;
}

// Display a notification toast
function showToast(message, allowUndo = true) {
  clearTimeout(toastTimer);

  toastMessage.textContent = message;
  undoBtn.hidden = !allowUndo;

  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 5200);
}

// Mark a task as completed
function completeTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task || task.completed) return;

  // Save a snapshot so the action can be undone
  undoSnapshot = JSON.parse(JSON.stringify(tasks));

  task.completed = true;
  task.completedAt = Date.now();

  saveTasks();
  render();

  showToast("Task marked as completed");
}

// Open the editor for a task
function editTask(id) {
  const task = tasks.find(item => item.id === id);

  if (task) {
    openModal(task);
  }
}

// Add swipe interactions to every task card
function attachSwipeHandlers() {
  taskList.querySelectorAll(".task-card").forEach(card => {
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let active = false;

    card.addEventListener("pointerdown", event => {
      if (
        event.pointerType === "mouse" &&
        event.button !== 0
      ) {
        return;
      }

      startX = event.clientX;
      startY = event.clientY;
      deltaX = 0;
      active = true;

      card.classList.add("dragging");

      if (card.setPointerCapture) {
        card.setPointerCapture(event.pointerId);
      }
    });

    card.addEventListener("pointermove", event => {
      if (!active) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      // Don't interfere with normal vertical scrolling
      if (
        Math.abs(dy) > Math.abs(dx) &&
        Math.abs(dx) < 15
      ) {
        return;
      }

      deltaX = dx;

      const movement = Math.max(
        -110,
        Math.min(110, dx)
      );

      card.style.transform =
        `translateX(${movement}px)`;

      card.style.opacity = String(
        Math.max(0.55, 1 - Math.abs(dx) / 300)
      );
    });

    function finishSwipe() {
      if (!active) return;

      active = false;

      card.classList.remove("dragging");
      card.style.transform = "";
      card.style.opacity = "";

      // Swipe right: complete
      if (deltaX > 75) {
        completeTask(card.dataset.id);
      }

      // Swipe left: edit
      else if (deltaX < -75) {
        editTask(card.dataset.id);
      }
    }

    card.addEventListener("pointerup", finishSwipe);
    card.addEventListener("pointercancel", finishSwipe);

    // Double-click also opens the editor on desktop
    card.addEventListener("dblclick", () => {
      editTask(card.dataset.id);
    });
  });
}

// Switch between subjects
nav.addEventListener("click", event => {
  const button = event.target.closest("[data-subject]");

  if (!button) return;

  activeSubject = button.dataset.subject;

  sidebar.classList.remove("mobile-open");

  render();
});

// Collapse sidebar on desktop
document
  .getElementById("collapseBtn")
  .addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

// Open sidebar on mobile
document
  .getElementById("mobileMenuBtn")
  .addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
  });

// Add task buttons
document
  .getElementById("addTaskBtn")
  .addEventListener("click", () => openModal());

document
  .getElementById("emptyAddBtn")
  .addEventListener("click", () => openModal());

// Modal controls
document
  .getElementById("closeModalBtn")
  .addEventListener("click", closeModal);

document
  .getElementById("cancelModalBtn")
  .addEventListener("click", closeModal);

modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) {
    closeModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
  }
});

// Create a new task or save edits
taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskName.value.trim();

  if (!title) {
    taskName.focus();
    return;
  }

  if (editingTaskId) {
    const task = tasks.find(
      item => item.id === editingTaskId
    );

    if (task) {
      task.title = title;
      task.deadline = taskDeadline.value || "";
      task.updatedAt = Date.now();
    }

    showToast("Task updated", false);
  } else {
    tasks.push({
      id: (
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      ),
      title,
      deadline: taskDeadline.value || "",
      subject: activeSubject,
      completed: false,
      createdAt: Date.now()
    });

    showToast("Task added", false);
  }

  saveTasks();
  closeModal();
  render();
});

// Undo task completion
undoBtn.addEventListener("click", () => {
  if (!undoSnapshot) return;

  tasks = undoSnapshot;
  undoSnapshot = null;

  saveTasks();
  render();

  toast.classList.remove("show");

  showToast("Completion undone", false);
});

// Dismiss the toast
document
  .getElementById("toastClose")
  .addEventListener("click", () => {
    toast.classList.remove("show");
  });

// Initial page render
render();