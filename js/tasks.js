/* ========================================
   FocusFlow — Task Planner (tasks.js)
   ======================================== */

(function () {
    'use strict';

    const { getData, setData, todayKey, emit } = window.FocusFlow;

    const STORAGE_KEY = 'ff-tasks-' + todayKey();

    // DOM
    const form = document.getElementById('task-input-form');
    const input = document.getElementById('task-input');
    const list = document.getElementById('tasks-list');
    const countEl = document.getElementById('tasks-count');
    const progressFill = document.getElementById('tasks-progress-fill');
    const emptyState = document.getElementById('tasks-empty');
    const completeMsg = document.getElementById('tasks-complete-msg');

    // State
    let tasks = getData(STORAGE_KEY, []);

    // ---- Render ----
    function render() {
        list.innerHTML = '';
        const total = tasks.length;
        const done = tasks.filter(t => t.done).length;

        // Count + progress
        countEl.textContent = `${done} / ${total} completed`;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        progressFill.style.width = pct + '%';

        // Dashboard update
        const dashTasksDone = document.getElementById('dash-tasks-done');
        if (dashTasksDone) dashTasksDone.textContent = `${done}/${total}`;

        // Empty state
        if (total === 0) {
            emptyState.style.display = 'block';
            completeMsg.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';

        // All done message
        if (done === total && total > 0) {
            completeMsg.style.display = 'block';

            // Only notify if we just completed the last task (prevent repeated notifications on re-render)
            const previouslyDone = completeMsg.dataset.notified === 'true';
            if (!previouslyDone) {
                window.FocusFlow.notify('All Tasks Completed!', 'You crushed today\'s goals 🔥 Amazing work!');
                completeMsg.dataset.notified = 'true';
            }
        } else {
            completeMsg.style.display = 'none';
            completeMsg.dataset.notified = 'false';
        }

        // Render tasks
        tasks.forEach((task, i) => {
            const el = document.createElement('div');
            el.className = 'task-item';
            el.dataset.id = i;

            if (task.editing) {
                el.innerHTML = `
                    <input class="task-edit-input" value="${escapeHtml(task.text)}" data-index="${i}" autofocus>
                    <button class="btn btn-primary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" data-save="${i}">Save</button>
                    <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" data-cancel="${i}">Cancel</button>
                `;
            } else {
                el.innerHTML = `
                    <button class="task-checkbox ${task.done ? 'checked' : ''}" data-toggle="${i}" aria-label="Toggle task">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <span class="task-text ${task.done ? 'completed' : ''}">${escapeHtml(task.text)}</span>
                    <div class="task-actions">
                        <button class="btn btn-danger" data-edit="${i}" aria-label="Edit task">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn-danger" data-delete="${i}" aria-label="Delete task">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                `;
            }

            list.appendChild(el);
        });

        save();
        emit('tasks-update', { total, done });
    }

    // ---- Actions ----
    function addTask(text) {
        if (!text.trim()) return;
        tasks.push({ text: text.trim(), done: false, editing: false });
        render();
    }

    function toggleTask(index) {
        tasks[index].done = !tasks[index].done;
        render();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        render();
    }

    function startEdit(index) {
        tasks.forEach((t, i) => t.editing = (i === index));
        render();
        // Focus input
        const inp = list.querySelector(`input[data-index="${index}"]`);
        if (inp) { inp.focus(); inp.select(); }
    }

    function saveEdit(index) {
        const inp = list.querySelector(`input[data-index="${index}"]`);
        if (inp && inp.value.trim()) {
            tasks[index].text = inp.value.trim();
        }
        tasks[index].editing = false;
        render();
    }

    function cancelEdit(index) {
        tasks[index].editing = false;
        render();
    }

    function save() {
        setData(STORAGE_KEY, tasks.map(t => ({ text: t.text, done: t.done, editing: false })));
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Events ----
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(input.value);
        input.value = '';
        input.focus();
    });

    list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-toggle], [data-edit], [data-delete], [data-save], [data-cancel]');
        if (!btn) return;

        if (btn.dataset.toggle !== undefined) toggleTask(parseInt(btn.dataset.toggle));
        if (btn.dataset.edit !== undefined) startEdit(parseInt(btn.dataset.edit));
        if (btn.dataset.delete !== undefined) deleteTask(parseInt(btn.dataset.delete));
        if (btn.dataset.save !== undefined) saveEdit(parseInt(btn.dataset.save));
        if (btn.dataset.cancel !== undefined) cancelEdit(parseInt(btn.dataset.cancel));
    });

    list.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('task-edit-input')) {
            saveEdit(parseInt(e.target.dataset.index));
        }
        if (e.key === 'Escape' && e.target.classList.contains('task-edit-input')) {
            cancelEdit(parseInt(e.target.dataset.index));
        }
    });

    // Initial render
    render();

})();
