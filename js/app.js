/* ========================================
   FocusFlow — App Controller (app.js)
   Main initialization, navigation, dark mode, keyboard shortcuts
   ======================================== */

(function () {
    'use strict';

    // ---- Navigation ----
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const navOverlay = document.getElementById('nav-overlay');

    const sectionMeta = {
        dashboard: { title: 'Dashboard', subtitle: 'Welcome back! Let\'s crush it today.' },
        timer: { title: 'Focus Timer', subtitle: 'Stay in the zone. One session at a time.' },
        tasks: { title: 'Daily Tasks', subtitle: 'Plan your day. Check them off.' },
        stats: { title: 'Study Stats', subtitle: 'Track your progress and keep growing.' },
        goals: { title: 'Goals', subtitle: 'Set your target and go after it.' },
        motivation: { title: 'Motivation', subtitle: 'Fuel your fire and stay inspired.' }
    };

    function navigateTo(sectionId) {
        navBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        const targetBtn = document.querySelector(`[data-section="${sectionId}"]`);
        const targetSection = document.getElementById(`section-${sectionId}`);

        if (targetBtn) targetBtn.classList.add('active');
        if (targetSection) targetSection.classList.add('active');

        const meta = sectionMeta[sectionId] || {};
        pageTitle.textContent = meta.title || 'Dashboard';
        pageSubtitle.textContent = meta.subtitle || '';

        closeMobileNav();
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo(btn.dataset.section);
        });
    });

    // ---- Mobile Nav ----
    function openMobileNav() {
        sidebar.classList.add('open');
        hamburger.classList.add('open');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileNav() {
        sidebar.classList.remove('open');
        hamburger.classList.remove('open');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileNav);
    }

    // ---- Dark Mode ----
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('ff-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('ff-theme', next);
        });
    }

    // ---- Keyboard Shortcuts ----
    document.addEventListener('keydown', (e) => {
        // Space: start/pause timer (only when not typing in input)
        if (e.code === 'Space' && !isInputFocused()) {
            e.preventDefault();
            const timerBtn = document.getElementById('timer-start');
            if (timerBtn) timerBtn.click();
        }
        // Escape: reset timer
        if (e.code === 'Escape') {
            const resetBtn = document.getElementById('timer-reset');
            if (resetBtn) resetBtn.click();
        }
    });

    function isInputFocused() {
        const tag = document.activeElement?.tagName?.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable;
    }

    // ---- Utility: Today's date key ----
    window.FocusFlow = window.FocusFlow || {};
    window.FocusFlow.todayKey = function () {
        return new Date().toISOString().slice(0, 10);
    };

    // ---- Utility: Get stored data ----
    window.FocusFlow.getData = function (key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : fallback;
        } catch {
            return fallback;
        }
    };

    window.FocusFlow.setData = function (key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    };

    // ---- Utility: Dispatch custom event for cross-module updates ----
    window.FocusFlow.emit = function (name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    };

    // ---- Confetti ----
    window.FocusFlow.confetti = function () {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#2563EB', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899'];

        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                vy: Math.random() * 3 + 2,
                vx: (Math.random() - 0.5) * 2,
                rot: Math.random() * 360,
                vr: (Math.random() - 0.5) * 6
            });
        }

        let frame = 0;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;
            pieces.forEach(p => {
                if (p.y < canvas.height + 20) active = true;
                p.y += p.vy;
                p.x += p.vx;
                p.rot += p.vr;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rot * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            frame++;
            if (active && frame < 200) requestAnimationFrame(draw);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        draw();
    };

    // ---- Browser Notifications ----
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    window.FocusFlow.notify = function (title, body) {
        // In-app toast
        showToast(title, body);

        // OS-level notification
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: body,
                    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">⏱️</text></svg>',
                    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">⏱️</text></svg>',
                    silent: false
                });
            } catch (e) { /* Notification not supported in this context */ }
        }
    };

    // ---- In-App Toast Notification ----
    function showToast(title, body) {
        const existing = document.getElementById('ff-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'ff-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <strong>${title}</strong>
                <p>${body}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;
        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
    }

    // ---- Expose navigateTo globally ----
    window.FocusFlow.navigateTo = navigateTo;

})();
