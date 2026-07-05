// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update time every minute
});

// Update Date & Time
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateTime').textContent = now.toLocaleDateString('ar-EG', options);
}

// Add Task function
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const daySelect = document.getElementById('daySelect');
    
    const taskText = taskInput.value.trim();
    const day = daySelect.value;
    
    if (taskText === '') {
        // Trigger shake animation safely
        taskInput.closest('.input-group').style.animation = 'none';
        taskInput.offsetHeight; /* trigger reflow */
        taskInput.closest('.input-group').style.animation = 'shake 0.4s';
        showToast('يرجى كتابة المهمة أولاً!', 'danger', 'fa-circle-exclamation');
        return;
    }
    
    const task = {
        id: 'task_' + Date.now().toString(),
        text: taskText,
        day: day,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    saveTaskToLocal(task);
    renderTask(task);
    updateStats();
    
    // Reset and focus
    taskInput.value = '';
    taskInput.focus();
    
    showToast('تمت إضافة المهمة بنجاح', 'success', 'fa-check-circle');
}

// Render Task to UI
function renderTask(task) {
    const taskList = document.querySelector(`#${task.day} .task-list`);
    
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;
    
    li.innerHTML = `
        <div class="task-content" onclick="toggleTask('${task.id}')">
            <div class="checkbox">
                <i class="fa-solid fa-check"></i>
            </div>
            <span class="task-text">${escapeHTML(task.text)}</span>
        </div>
        <button class="btn-delete" onclick="deleteTask(event, '${task.id}')" title="حذف المهمة">
            <i class="fa-solid fa-trash-can"></i>
        </button>
    `;
    
    taskList.appendChild(li);
    updateDayCounter(task.day);
}

// Toggle task completion
function toggleTask(id) {
    const tasks = getTasksFromLocal();
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex > -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        localStorage.setItem('tyoka_0_tasks_v2', JSON.stringify(tasks));
        
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.toggle('completed');
            
            if (tasks[taskIndex].completed) {
                // Add pop effect on completion
                const checkbox = taskElement.querySelector('.checkbox');
                checkbox.style.transform = 'scale(1.2)';
                setTimeout(() => checkbox.style.transform = '', 200);
                showToast('عاش! أنجزت المهمة 🚀', 'success', 'fa-trophy');
            }
        }
        updateStats();
    }
}

// Delete task
function deleteTask(event, id) {
    // Stop propagation so it doesn't trigger toggleTask
    event.stopPropagation();
    
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        // Find task day to update counter later
        const tasks = getTasksFromLocal();
        const task = tasks.find(t => t.id === id);
        
        // Add fade out/slide animation before removing
        taskElement.style.transform = 'translateX(-30px)';
        taskElement.style.opacity = '0';
        
        setTimeout(() => {
            const newTasks = tasks.filter(t => t.id !== id);
            localStorage.setItem('tyoka_0_tasks_v2', JSON.stringify(newTasks));
            taskElement.remove();
            
            if (task) updateDayCounter(task.day);
            updateStats();
        }, 300);
        
        showToast('تم حذف المهمة', 'info', 'fa-info-circle');
    }
}

// Local Storage operations
function getTasksFromLocal() {
    // We use a new key _v2 so it's clean, or migrate old ones if needed
    let tasks = JSON.parse(localStorage.getItem('tyoka_0_tasks_v2'));
    if (!tasks) {
        // Try getting v1 tasks for backward compatibility
        const oldTasks = JSON.parse(localStorage.getItem('tyoka_0_tasks') || '[]');
        tasks = oldTasks;
        localStorage.setItem('tyoka_0_tasks_v2', JSON.stringify(tasks));
    }
    return tasks;
}

function saveTaskToLocal(task) {
    const tasks = getTasksFromLocal();
    tasks.push(task);
    localStorage.setItem('tyoka_0_tasks_v2', JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = getTasksFromLocal();
    
    // Clear existing lists to prevent duplicates on reload
    document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');
    
    tasks.forEach(task => renderTask(task));
    
    // Update all counters
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].forEach(updateDayCounter);
    updateStats();
}

// Update counters
function updateDayCounter(dayId) {
    const tasks = getTasksFromLocal();
    const dayTasks = tasks.filter(t => t.day === dayId);
    
    const counterElement = document.querySelector(`#${dayId} .task-count`);
    if (counterElement) {
        counterElement.textContent = dayTasks.length;
    }
}

function updateStats() {
    const tasks = getTasksFromLocal();
    const completedTasks = tasks.filter(t => t.completed).length;
    
    // Animate numbers
    animateNumber('totalTasks', tasks.length);
    animateNumber('completedTasks', completedTasks);
}

function animateNumber(elementId, newValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent);
    if (currentValue === newValue) return;
    
    // Simple pop animation
    element.style.transform = 'scale(1.3)';
    element.style.color = 'var(--primary-light)';
    setTimeout(() => {
        element.textContent = newValue;
        element.style.transform = '';
        element.style.color = '';
    }, 150);
}

// Toast Notification System
function showToast(message, type = 'info', iconClass = 'fa-info-circle') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400); // Wait for animation to finish
    }, 3000);
}

// Event Listeners
document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Helper function to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
