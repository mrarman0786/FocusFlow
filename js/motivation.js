/* ========================================
   FocusFlow — Motivation System (motivation.js)
   ======================================== */

(function () {
    'use strict';

    const { getData, setData, todayKey } = window.FocusFlow;

    // ---- Quotes ----
    const quotes = [
        "Discipline beats motivation.",
        "Small progress is still progress.",
        "Future you will thank you.",
        "Success is the sum of small efforts repeated daily.",
        "Don't watch the clock; do what it does — keep going.",
        "The secret of getting ahead is getting started.",
        "Focus on being productive instead of busy.",
        "You don't have to be great to start, but you have to start to be great.",
        "It's not about having time, it's about making time.",
        "The pain of studying is temporary. The pain of not knowing is forever.",
        "Believe you can and you're halfway there.",
        "Push yourself because no one else is going to do it for you.",
        "Dream big. Start small. Act now.",
        "Hustle in silence, let your success make the noise.",
        "Your limitation — it's only your imagination.",
        "Wake up with determination. Go to bed with satisfaction.",
        "Great things never come from comfort zones.",
        "The harder you work for something, the greater you'll feel when you achieve it.",
        "Don't stop when you're tired. Stop when you're done.",
        "It always seems impossible until it's done."
    ];

    // ---- Tips ----
    const tips = [
        "Break tasks into smaller chunks for better focus.",
        "Use the 2-minute rule: if it takes less than 2 minutes, do it now.",
        "Take regular breaks to maintain peak performance.",
        "Keep your workspace clean and distraction-free.",
        "Set specific goals rather than vague ones.",
        "Review your progress at the end of each day.",
        "Drink water regularly — hydration boosts brain power.",
        "Start with your hardest task when your energy is highest.",
        "Limit social media during study sessions.",
        "Use the Pomodoro technique to maintain focus.",
        "Reward yourself after completing challenging tasks.",
        "Write down your goals — you're 42% more likely to achieve them.",
        "Sleep 7-8 hours for optimal cognitive function.",
        "Teach what you learn to understand it better.",
        "Block distracting websites during focus time."
    ];

    let quoteIndex = Math.floor(Math.random() * quotes.length);
    let tipIndex = Math.floor(Math.random() * tips.length);

    // DOM
    const quoteTextMain = document.getElementById('motivation-quote-text');
    const dashQuoteText = document.getElementById('dash-quote-text');
    const newQuoteBtn = document.getElementById('new-quote-btn');
    const tipText = document.getElementById('tip-text');
    const nextTipBtn = document.getElementById('next-tip-btn');
    const personalNote = document.getElementById('personal-note');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const streakNumEl = document.getElementById('motivation-streak-num');
    const streakMsgEl = document.getElementById('streak-msg');
    const streakCountEl = document.getElementById('streak-count');
    const streakCountMobileEl = document.getElementById('streak-count-mobile');

    // ---- Quotes ----
    function showQuote() {
        const q = `"${quotes[quoteIndex]}"`;
        if (quoteTextMain) quoteTextMain.textContent = q;
        if (dashQuoteText) dashQuoteText.textContent = q;
    }

    function nextQuote() {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        showQuote();
    }

    if (newQuoteBtn) newQuoteBtn.addEventListener('click', nextQuote);

    // Auto-rotate quotes every 30 seconds
    setInterval(nextQuote, 30000);

    // ---- Tips ----
    function showTip() {
        if (tipText) tipText.textContent = tips[tipIndex];
    }

    function nextTip() {
        tipIndex = (tipIndex + 1) % tips.length;
        showTip();
    }

    if (nextTipBtn) nextTipBtn.addEventListener('click', nextTip);

    // ---- Personal Note ----
    const savedNote = getData('ff-personal-note', '');
    if (personalNote) personalNote.value = savedNote;

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', () => {
            setData('ff-personal-note', personalNote.value);
            saveNoteBtn.textContent = 'Saved ✓';
            setTimeout(() => { saveNoteBtn.textContent = 'Save Note'; }, 2000);
        });
    }

    // ---- Streak ----
    function updateStreak() {
        const streak = getData('ff-streak', { count: 0, lastDate: '' });
        const today = todayKey();

        // Check if already updated today
        if (streak.lastDate === today) {
            // Already tracked today
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().slice(0, 10);

            if (streak.lastDate === yesterdayKey) {
                // Consecutive day
                streak.count++;
            } else if (streak.lastDate !== today) {
                // Streak broken (or first time)
                streak.count = streak.count > 0 && streak.lastDate === '' ? 0 : 0;
            }
        }

        displayStreak(streak);
    }

    function incrementStreak() {
        const streak = getData('ff-streak', { count: 0, lastDate: '' });
        const today = todayKey();

        if (streak.lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().slice(0, 10);

            if (streak.lastDate === yesterdayKey) {
                streak.count++;
            } else {
                streak.count = 1;
            }
            streak.lastDate = today;
            setData('ff-streak', streak);

            // Update longest streak
            const longest = getData('ff-longest-streak', 0);
            if (streak.count > longest) {
                setData('ff-longest-streak', streak.count);
            }
        }

        displayStreak(streak);
    }

    function displayStreak(streak) {
        if (streakNumEl) streakNumEl.textContent = streak.count;
        if (streakCountEl) streakCountEl.textContent = streak.count;
        if (streakCountMobileEl) streakCountMobileEl.textContent = streak.count;

        if (streakMsgEl) {
            if (streak.count === 0) {
                streakMsgEl.textContent = 'Start a focus session to begin your streak!';
            } else if (streak.count < 3) {
                streakMsgEl.textContent = 'Good start! Keep it going!';
            } else if (streak.count < 7) {
                streakMsgEl.textContent = 'You\'re on fire! Don\'t break the chain!';
            } else {
                streakMsgEl.textContent = 'Incredible dedication! You\'re unstoppable!';
            }
        }
    }

    // Listen for session completions to update streak
    window.addEventListener('session-complete', () => {
        incrementStreak();
    });

    // Init
    showQuote();
    showTip();
    updateStreak();

})();
