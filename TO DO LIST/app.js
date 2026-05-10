const STORAGE_KEY = 'todo_tasks';

// ── State ──
let tasks = loadTasks();
let currentFilter = 'all';
let editingId = null;

// ── DOM refs ──
const taskForm       = document.getElementById('task-form');
const taskInput      = document.getElementById('task-input');
const taskList       = document.getElementById('task-list');
const emptyMsg       = document.getElementById('empty-msg');
const taskCount      = document.getElementById('task-count');
const clearBtn       = document.getElementById('clear-completed-btn');
const filterBtns     = document.querySelectorAll('.filter-btn');
const editModal      = document.getElementById('edit-modal');
const editInput      = document.getElementById('edit-input');
const saveEditBtn    = document.getElementById('save-edit-btn');
const cancelEditBtn  = document.getElementById('cancel-edit-btn');

// ── Persistence ──
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ── CRUD ──
function addTask(text) {
  const task = {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(task);
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
  }
}

function updateTask(id, newText) {
  const task = tasks.find(t => t.id === id);
  if (task && newText.trim()) {
    task.text = newText.trim();
    saveTasks();
    render();
  }
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
}

// ── Render ──
function getFilteredTasks() {
  if (currentFilter === 'active')    return tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') return tasks.filter(t =>  t.completed);
  return tasks;
}

function render() {
  const filtered = getFilteredTasks();
  taskList.innerHTML = '';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    li.innerHTML = `
      <input
        type="checkbox"
        class="task-checkbox"
        ${task.completed ? 'checked' : ''}
        aria-label="Mark task complete"
      />
      <span class="task-text">${escapeHTML(task.text)}</span>
      <div class="task-actions">
        <button class="btn-edit" title="Edit task" aria-label="Edit task">&#9998;</button>
        <button class="btn-delete" title="Delete task" aria-label="Delete task">&#128465;</button>
      </div>
    `;

    taskList.appendChild(li);
  });

  const activeTasks = tasks.filter(t => !t.completed).length;
  taskCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} remaining`;
  emptyMsg.style.display = filtered.length === 0 ? 'block' : 'none';
}

// ── Events ──
taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  addTask(text);
  taskInput.value = '';
  taskInput.focus();
});

taskList.addEventListener('click', e => {
  const li = e.target.closest('.task-item');
  if (!li) return;
  const id = Number(li.dataset.id);

  if (e.target.classList.contains('task-checkbox')) {
    toggleTask(id);
  } else if (e.target.classList.contains('btn-delete')) {
    li.style.animation = 'none';
    li.style.transition = 'opacity 0.2s, transform 0.2s';
    li.style.opacity = '0';
    li.style.transform = 'translateX(30px)';
    setTimeout(() => deleteTask(id), 200);
  } else if (e.target.classList.contains('btn-edit')) {
    const task = tasks.find(t => t.id === id);
    if (task) openEditModal(id, task.text);
  }
});

clearBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ── Edit Modal ──
function openEditModal(id, text) {
  editingId = id;
  editInput.value = text;
  editModal.classList.remove('hidden');
  editInput.focus();
  editInput.select();
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editingId = null;
}

saveEditBtn.addEventListener('click', () => {
  if (editingId !== null) {
    const newText = editInput.value.trim();
    if (newText) {
      updateTask(editingId, newText);
      closeEditModal();
    }
  }
});

cancelEditBtn.addEventListener('click', closeEditModal);

editInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveEditBtn.click();
  if (e.key === 'Escape') closeEditModal();
});

editModal.addEventListener('click', e => {
  if (e.target === editModal) closeEditModal();
});

// ── Utility ──
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Init ──
render();
