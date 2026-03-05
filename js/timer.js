/* ========================================
   FocusFlow — Pomodoro Timer (timer.js)
   ======================================== */

(function () {
    'use strict';

    const { getData, setData, todayKey, emit } = window.FocusFlow;

    // DOM
    const timeDisplay = document.getElementById('timer-time');
    const messageDisplay = document.getElementById('timer-message');
    const startBtn = document.getElementById('timer-start');
    const resetBtn = document.getElementById('timer-reset');
    const skipBtn = document.getElementById('timer-skip');
    const startText = document.getElementById('timer-start-text');
    const playIcon = startBtn.querySelector('.play-icon');
    const pauseIcon = startBtn.querySelector('.pause-icon');
    const progressCircle = document.getElementById('timer-progress');
    const statusEl = document.getElementById('timer-status');
    const statusText = document.getElementById('timer-status-text');
    const sessionCountEl = document.getElementById('timer-session-count');
    const focusInput = document.getElementById('focus-duration');
    const breakInput = document.getElementById('break-duration');
    const soundToggle = document.getElementById('sound-toggle');
    const miniTime = document.getElementById('dash-mini-time');

    // State
    let focusDuration = 25 * 60; // seconds
    let breakDuration = 5 * 60;
    let timeLeft = focusDuration;
    let isRunning = false;
    let isBreak = false;
    let intervalId = null;
    let totalCircumference = 2 * Math.PI * 120; // r=120

    // Initialize progress circle
    if (progressCircle) {
        progressCircle.style.strokeDasharray = totalCircumference;
        progressCircle.style.strokeDashoffset = 0;
    }

    // Load sessions
    let todaySessions = getData('ff-sessions-' + todayKey(), 0);
    if (sessionCountEl) sessionCountEl.textContent = todaySessions;

    // ---- Core Functions ----
    function formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateDisplay() {
        const str = formatTime(timeLeft);
        if (timeDisplay) timeDisplay.textContent = str;
        if (miniTime) miniTime.textContent = str;

        // Progress
        const total = isBreak ? breakDuration : focusDuration;
        const progress = 1 - (timeLeft / total);
        const offset = totalCircumference * (1 - progress);
        if (progressCircle) progressCircle.style.strokeDashoffset = offset;
    }

    function start() {
        if (isRunning) return;
        isRunning = true;

        startText.textContent = 'Pause';
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';

        statusEl.className = 'timer-status ' + (isBreak ? 'break' : 'focus');
        statusText.textContent = isBreak ? 'Break time' : 'Focusing...';
        messageDisplay.textContent = isBreak ? 'Take a Break 🌿' : 'Stay Focused 💪';

        // Update progress circle color
        if (progressCircle) {
            progressCircle.style.stroke = isBreak ? 'var(--accent)' : 'var(--primary)';
        }

        intervalId = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                clearInterval(intervalId);
                intervalId = null;
                isRunning = false;
                onTimerEnd();
            }
        }, 1000);

        // Prevent page leave
        window.addEventListener('beforeunload', warnBeforeLeave);

        emit('timer-state', { running: true, isBreak });
    }

    function pause() {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(intervalId);
        intervalId = null;

        startText.textContent = 'Resume';
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';

        statusText.textContent = 'Paused';

        emit('timer-state', { running: false, isBreak });
    }

    function reset() {
        isRunning = false;
        clearInterval(intervalId);
        intervalId = null;

        isBreak = false;
        focusDuration = (parseInt(focusInput.value) || 25) * 60;
        breakDuration = (parseInt(breakInput.value) || 5) * 60;
        timeLeft = focusDuration;

        startText.textContent = 'Start';
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';

        statusEl.className = 'timer-status';
        statusText.textContent = 'Ready to focus';
        messageDisplay.textContent = 'Stay Focused 💪';

        if (progressCircle) {
            progressCircle.style.strokeDashoffset = 0;
            progressCircle.style.stroke = 'var(--primary)';
        }

        updateDisplay();
        window.removeEventListener('beforeunload', warnBeforeLeave);

        emit('timer-state', { running: false, isBreak: false });
    }

    function skip() {
        clearInterval(intervalId);
        intervalId = null;
        isRunning = false;
        onTimerEnd();
    }

    function onTimerEnd() {
        if (soundToggle.checked) playSound();

        if (!isBreak) {
            // Focus session completed
            todaySessions++;
            setData('ff-sessions-' + todayKey(), todaySessions);
            sessionCountEl.textContent = todaySessions;

            // Track focus minutes
            const focusMin = Math.round(focusDuration / 60);
            const todayFocus = getData('ff-focus-' + todayKey(), 0);
            setData('ff-focus-' + todayKey(), todayFocus + focusMin);

            // Track weekly data
            trackWeekly(focusMin);

            emit('session-complete', { focusMin, sessions: todaySessions });

            // Switch to break
            isBreak = true;
            timeLeft = breakDuration;
            messageDisplay.textContent = 'Take a Break 🌿';
            statusEl.className = 'timer-status break';
            statusText.textContent = 'Break time!';
            if (progressCircle) progressCircle.style.stroke = 'var(--accent)';

            window.FocusFlow.notify('Focus Complete!', `Great job! You focused for ${focusMin} minutes. Time for a break.`);
        } else {
            // Break ended -> back to focus
            isBreak = false;
            timeLeft = focusDuration;
            messageDisplay.textContent = 'Stay Focused 💪';
            statusEl.className = 'timer-status';
            statusText.textContent = 'Ready to focus';
            if (progressCircle) progressCircle.style.stroke = 'var(--primary)';

            window.FocusFlow.notify('Break Complete!', 'Ready to jump back in? Let\'s go!');
        }

        startText.textContent = 'Start';
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';

        if (progressCircle) progressCircle.style.strokeDashoffset = 0;
        updateDisplay();

        window.removeEventListener('beforeunload', warnBeforeLeave);
    }

    function trackWeekly(minutes) {
        const weekData = getData('ff-weekly', {});
        const day = todayKey();
        weekData[day] = (weekData[day] || 0) + minutes;
        setData('ff-weekly', weekData);
    }

    // Sound
    function playSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
            osc.stop(ctx.currentTime + 0.8);

            // Second beep
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 1100;
                osc2.type = 'sine';
                gain2.gain.value = 0.3;
                osc2.start();
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                osc2.stop(ctx.currentTime + 0.6);
            }, 300);
        } catch (e) { /* Audio not supported */ }
    }

    function warnBeforeLeave(e) {
        e.preventDefault();
        e.returnValue = '';
    }

    // ---- Event Listeners ----
    startBtn.addEventListener('click', () => {
        isRunning ? pause() : start();
    });

    resetBtn.addEventListener('click', reset);
    skipBtn.addEventListener('click', skip);

    focusInput.addEventListener('change', () => {
        if (!isRunning && !isBreak) {
            focusDuration = (parseInt(focusInput.value) || 25) * 60;
            timeLeft = focusDuration;
            updateDisplay();
        }
    });

    breakInput.addEventListener('change', () => {
        if (!isRunning && isBreak) {
            breakDuration = (parseInt(breakInput.value) || 5) * 60;
            timeLeft = breakDuration;
            updateDisplay();
        }
    });

    // Expose state for other modules
    window.FocusFlow.getTimerState = function () {
        return { isRunning, isBreak };
    };

    // Init display
    updateDisplay();

})();
