/* ========================================
   FocusFlow — Goal Setting (goals.js)
   ======================================== */

(function () {
    'use strict';

    const { getData, setData, todayKey, confetti } = window.FocusFlow;

    // DOM
    const goalInput = document.getElementById('goal-hours');
    const goalSetBtn = document.getElementById('goal-set-btn');
    const goalCurrent = document.getElementById('goal-current');
    const goalTarget = document.getElementById('goal-target');
    const goalProgressFill = document.getElementById('goal-progress-fill');
    const goalPercent = document.getElementById('goal-percent');
    const goalCelebrate = document.getElementById('goal-celebrate');
    const dashGoalProgress = document.getElementById('dash-goal-progress');

    // State
    let goalHours = getData('ff-goal-' + todayKey(), 2);
    let celebrated = getData('ff-goal-celebrated-' + todayKey(), false);

    if (goalInput) goalInput.value = goalHours;

    function updateGoalProgress() {
        const focusMin = getData('ff-focus-' + todayKey(), 0);
        const goalMin = goalHours * 60;

        const h = Math.floor(focusMin / 60);
        const m = focusMin % 60;
        const pct = goalMin > 0 ? Math.min(100, Math.round((focusMin / goalMin) * 100)) : 0;

        if (goalCurrent) goalCurrent.textContent = `${h}h ${m}m`;
        if (goalTarget) goalTarget.textContent = `/ ${goalHours}h`;
        if (goalProgressFill) goalProgressFill.style.width = pct + '%';
        if (goalPercent) goalPercent.textContent = pct + '% complete';
        if (dashGoalProgress) dashGoalProgress.textContent = pct + '%';

        // Celebration
        if (pct >= 100 && !celebrated) {
            celebrated = true;
            setData('ff-goal-celebrated-' + todayKey(), true);
            if (goalCelebrate) goalCelebrate.style.display = 'block';
            confetti();
        } else if (pct < 100) {
            if (goalCelebrate) goalCelebrate.style.display = 'none';
        }
    }

    // Set goal
    if (goalSetBtn) {
        goalSetBtn.addEventListener('click', () => {
            const val = parseFloat(goalInput.value);
            if (val && val > 0) {
                goalHours = val;
                setData('ff-goal-' + todayKey(), goalHours);
                celebrated = false;
                setData('ff-goal-celebrated-' + todayKey(), false);
                updateGoalProgress();
                goalSetBtn.textContent = 'Updated ✓';
                setTimeout(() => { goalSetBtn.textContent = 'Set Goal'; }, 2000);
            }
        });
    }

    // Update when a session completes
    window.addEventListener('session-complete', () => {
        updateGoalProgress();
    });

    // Init
    updateGoalProgress();

})();
