/* ========================================
   FocusFlow — Distraction Detection (distraction.js)
   ======================================== */

(function () {
    'use strict';

    const { getData, setData, todayKey } = window.FocusFlow;

    const popup = document.getElementById('distraction-popup');
    const dismissBtn = document.getElementById('distraction-dismiss');
    const distractionCountEl = document.getElementById('distraction-count');

    let distractionCount = getData('ff-distractions-' + todayKey(), 0);
    if (distractionCountEl) distractionCountEl.textContent = distractionCount;

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) return; // Tab is now hidden — user left

        // Tab is visible again — user came back
        const timerState = window.FocusFlow.getTimerState ? window.FocusFlow.getTimerState() : {};
        if (timerState.isRunning && !timerState.isBreak) {
            // User left during a focus session
            distractionCount++;
            setData('ff-distractions-' + todayKey(), distractionCount);
            if (distractionCountEl) distractionCountEl.textContent = distractionCount;

            showPopup();
        }
    });

    function showPopup() {
        if (popup) popup.style.display = 'flex';
    }

    function hidePopup() {
        if (popup) popup.style.display = 'none';
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', hidePopup);
    }

    // Also close popup on clicking overlay
    if (popup) {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) hidePopup();
        });
    }

})();
