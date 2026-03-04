/* ========================================
   FocusFlow — Study Stats (stats.js)
   ======================================== */

(function () {
    'use strict';

    const { getData, todayKey } = window.FocusFlow;

    let weeklyChart = null;

    function getWeekDays() {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().slice(0, 10));
        }
        return days;
    }

    function getDayLabel(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }

    function updateStats() {
        const today = todayKey();
        const focusMin = getData('ff-focus-' + today, 0);
        const sessions = getData('ff-sessions-' + today, 0);
        const streakData = getData('ff-streak', { count: 0, lastDate: '' });

        // Productivity: sessions * focus per session / 8 hours max (capped at 100%)
        const productivity = Math.min(100, Math.round((focusMin / 480) * 100));

        // Focus time display
        const h = Math.floor(focusMin / 60);
        const m = focusMin % 60;
        const focusStr = h > 0 ? `${h}h ${m}m` : `${m} min`;

        // Update stat cards
        updateEl('stats-focus-time', focusStr);
        updateEl('stats-sessions', sessions);
        updateEl('stats-productivity', productivity + '%');
        updateEl('stats-streak', streakData.count + ' days');

        // Dashboard cards
        updateEl('dash-focus-time', focusStr);
        updateEl('dash-sessions', sessions);

        // Weekly chart
        renderWeeklyChart();
    }

    function updateEl(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function renderWeeklyChart() {
        const canvas = document.getElementById('weekly-chart');
        if (!canvas) return;

        const weekData = getData('ff-weekly', {});
        const days = getWeekDays();
        const labels = days.map(getDayLabel);
        const values = days.map(d => Math.round((weekData[d] || 0) / 60 * 10) / 10); // hours

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)';
        const textColor = isDark ? '#94A3B8' : '#64748B';

        if (weeklyChart) {
            weeklyChart.data.labels = labels;
            weeklyChart.data.datasets[0].data = values;
            weeklyChart.options.scales.x.ticks.color = textColor;
            weeklyChart.options.scales.y.ticks.color = textColor;
            weeklyChart.options.scales.x.grid.color = gridColor;
            weeklyChart.options.scales.y.grid.color = gridColor;
            weeklyChart.update();
            return;
        }

        weeklyChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Study Hours',
                    data: values,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: '#2563EB',
                    borderWidth: 1,
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#1E293B' : '#fff',
                        titleColor: isDark ? '#F1F5F9' : '#0F172A',
                        bodyColor: isDark ? '#94A3B8' : '#64748B',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 10,
                        displayColors: false,
                        callbacks: {
                            label: ctx => `${ctx.parsed.y} hours`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor, drawBorder: false },
                        ticks: { color: textColor, font: { family: "'Inter', sans-serif", weight: '500' } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor, drawBorder: false },
                        ticks: {
                            color: textColor,
                            font: { family: "'Inter', sans-serif", weight: '500' },
                            callback: v => v + 'h'
                        }
                    }
                }
            }
        });
    }

    // Listen for session completions
    window.addEventListener('session-complete', () => {
        updateStats();
    });

    // Listen for theme changes to update chart colors
    const observer = new MutationObserver(() => {
        if (weeklyChart) renderWeeklyChart();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Init
    updateStats();

    // Expose for goal module
    window.FocusFlow.updateStats = updateStats;

})();
