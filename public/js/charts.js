/**
 * Chart helpers using Chart.js (loaded via CDN on pages that need charts).
 * We keep options simple and readable.
 */

function makePieChart(ctx, labels, values) {
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#0ea5a9','#22c55e','#f59e0b','#ef4444','#6366f1','#06b6d4','#84cc16','#eab308','#f97316','#a78bfa'],
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

function makeLineChart(ctx, labels, values) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Spending',
        data: values,
        borderColor: '#0ea5a9',
        backgroundColor: 'rgba(14,165,169,0.15)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function makeBarChart(ctx, labels, values, label='Amount') {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label, data: values, backgroundColor: '#6366f1' }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}