let growthChartInstance = null;
let currentMode = 'growth'; // 'growth', 'goal', 'compare'

// ==========================
// 1. MODE SWITCHER TABS
// ==========================
function switchMode(mode) {
    currentMode = mode;
    
    const tabGrowth = document.getElementById('tabGrowth');
    const tabGoal = document.getElementById('tabGoal');
    const tabCompare = document.getElementById('tabCompare');
    
    if (tabGrowth) tabGrowth.classList.remove('active');
    if (tabGoal) tabGoal.classList.remove('active');
    if (tabCompare) tabCompare.classList.remove('active');

    const standardInputs = document.getElementById('standardInputs');
    const goalInputs = document.getElementById('goalInputs');
    const compareInputs = document.getElementById('compareInputs');
    const scenarioBBox = document.getElementById('scenarioBBox');
    const goalOutputDesc = document.getElementById('goalOutputDesc');
    const resultHeading = document.getElementById('resultHeading');
    const inputCardTitle = document.getElementById('inputCardTitle');
    const stat1Label = document.getElementById('stat1Label');

    if (mode === 'growth') {
        if (tabGrowth) tabGrowth.classList.add('active');
        if (standardInputs) standardInputs.style.display = 'block';
        if (goalInputs) goalInputs.style.display = 'none';
        if (compareInputs) compareInputs.style.display = 'none';
        if (scenarioBBox) scenarioBBox.style.display = 'none';
        if (goalOutputDesc) goalOutputDesc.style.display = 'none';
        if (resultHeading) resultHeading.innerText = 'Future Investment Value';
        if (inputCardTitle) inputCardTitle.innerText = 'Investment Details';
        if (stat1Label) stat1Label.innerText = 'Total Invested';
    } else if (mode === 'goal') {
        if (tabGoal) tabGoal.classList.add('active');
        if (standardInputs) standardInputs.style.display = 'block';
        if (goalInputs) goalInputs.style.display = 'block';
        if (compareInputs) compareInputs.style.display = 'none';
        if (scenarioBBox) scenarioBBox.style.display = 'none';
        if (goalOutputDesc) goalOutputDesc.style.display = 'block';
        if (resultHeading) resultHeading.innerText = 'Required Monthly Savings';
        if (inputCardTitle) inputCardTitle.innerText = 'Target Goal Details';
        if (stat1Label) stat1Label.innerText = 'Total Principal Needed';
    } else if (mode === 'compare') {
        if (tabCompare) tabCompare.classList.add('active');
        if (standardInputs) standardInputs.style.display = 'block';
        if (goalInputs) goalInputs.style.display = 'none';
        if (compareInputs) compareInputs.style.display = 'block';
        if (scenarioBBox) scenarioBBox.style.display = 'block';
        if (goalOutputDesc) goalOutputDesc.style.display = 'none';
        if (resultHeading) resultHeading.innerText = 'Scenario A Future Value';
        if (inputCardTitle) inputCardTitle.innerText = 'Scenario Comparison';
        if (stat1Label) stat1Label.innerText = 'Total Invested (A)';
    }

    runCalculator();
}

// ==========================
// 2. MAIN CALCULATION ENGINE
// ==========================
function runCalculator() {
    const currencyEl = document.getElementById('currency');
    const currency = currencyEl ? currencyEl.value : 'KSh';
    
    const principal = parseFloat(document.getElementById('principal')?.value) || 0;
    const annualRate = (parseFloat(document.getElementById('rate')?.value) || 0) / 100;
    const years = parseFloat(document.getElementById('years')?.value) || 0;
    const frequency = parseInt(document.getElementById('frequency')?.value) || 12;
    let monthlyContribution = parseFloat(document.getElementById('monthly')?.value) || 0;

    const inflationToggle = document.getElementById('inflationToggle');
    const isInflationChecked = inflationToggle ? inflationToggle.checked : false;
    const inflationField = document.getElementById('inflationField');
    if (inflationField) inflationField.style.display = isInflationChecked ? 'block' : 'none';
    
    const inflationRateInput = document.getElementById('inflationRate');
    const inflationRate = (isInflationChecked && inflationRateInput) ? (parseFloat(inflationRateInput.value) || 0) / 100 : 0;

    let chartLabels = [];
    let chartData = [];

    if (currentMode === 'goal') {
        const targetGoal = parseFloat(document.getElementById('targetGoal')?.value) || 0;
        monthlyContribution = calculateRequiredMonthly(principal, annualRate, years, frequency, targetGoal);
        
        const monthlyInput = document.getElementById('monthly');
        if (monthlyInput) monthlyInput.value = Math.round(monthlyContribution);
        
        let calculationResult = simulateGrowth(principal, annualRate, years, frequency, monthlyContribution, inflationRate);
        chartLabels = calculationResult.labels;
        chartData = calculationResult.data;

        setElementText('future', `${currency} ${monthlyContribution.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setElementText('goalOutputDesc', `To reach ${currency} ${targetGoal.toLocaleString()} in ${years} yrs.`);
        setElementText('invested', `${currency} ${calculationResult.totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setElementText('interest', `${currency} ${calculationResult.interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

        updateChart(chartLabels, chartData, currency);

    } else if (currentMode === 'compare') {
        let calcA = simulateGrowth(principal, annualRate, years, frequency, monthlyContribution, inflationRate);
        
        const rateB = (parseFloat(document.getElementById('rateB')?.value) || 0) / 100;
        const monthlyB = parseFloat(document.getElementById('monthlyB')?.value) || 0;
        let calcB = simulateGrowth(principal, rateB, years, frequency, monthlyB, inflationRate);

        setElementText('future', `${currency} ${calcA.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setElementText('futureB', `${currency} ${calcB.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setElementText('invested', `${currency} ${calcA.totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setElementText('interest', `${currency} ${calcA.interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

        updateCompareChart(calcA.labels, calcA.data, calcB.data, currency);

    } else {
        let calc = simulateGrowth(principal, annualRate, years, frequency, monthlyContribution, inflationRate);
        
        setElementText('future', `${currency} ${calc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setElementText('invested', `${currency} ${calc.totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setElementText('interest', `${currency} ${calc.interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

        updateChart(calc.labels, calc.data, currency);
    }
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// ==========================
// 3. CORE SIMULATION ENGINE
// ==========================
function simulateGrowth(principal, annualRate, years, frequency, monthlyContribution, inflationRate) {
    let totalPrincipal = principal;
    let balance = principal;
    const totalMonths = Math.round(years * 12);
    const periodsPerYear = frequency;
    const ratePerPeriod = annualRate / periodsPerYear;
    
    let chartLabels = ['Start'];
    let chartData = [principal];

    for (let m = 1; m <= totalMonths; m++) {
        balance += monthlyContribution;
        totalPrincipal += monthlyContribution;

        let periodInterest = 0;
        if (frequency === 365) {
            let dailyRate = annualRate / 365;
            periodInterest = balance * dailyRate * (365 / 12);
        } else if (m % (12 / periodsPerYear) === 0) {
            periodInterest = balance * ratePerPeriod;
        }
        balance += periodInterest;

        if (m % 12 === 0 || m === totalMonths) {
            let yearNum = Math.round(m / 12);
            
            let adjustedBalance = balance;
            if (inflationRate > 0) {
                let timeInYears = m / 12;
                adjustedBalance = balance / Math.pow(1 + inflationRate, timeInYears);
            }

            chartLabels.push(`Yr ${yearNum}`);
            chartData.push(Math.round(adjustedBalance));
        }
    }

    const interestEarned = balance - totalPrincipal;
    let finalBalance = balance;
    if (inflationRate > 0) {
        finalBalance = balance / Math.pow(1 + inflationRate, years);
    }

    return {
        balance: finalBalance,
        totalPrincipal: totalPrincipal,
        interestEarned: interestEarned,
        labels: chartLabels,
        data: chartData
    };
}

function calculateRequiredMonthly(principal, annualRate, years, frequency, targetGoal) {
    let low = 0;
    let high = targetGoal;
    let monthlyGuess = 0;

    for (let i = 0; i < 50; i++) {
        monthlyGuess = (low + high) / 2;
        let res = simulateGrowth(principal, annualRate, years, frequency, monthlyGuess, 0);
        if (res.balance < targetGoal) {
            low = monthlyGuess;
        } else {
            high = monthlyGuess;
        }
    }
    return monthlyGuess;
}

// ==========================
// 4. CHART.JS RENDERING
// ==========================
function updateChart(labels, data, currency = 'KSh') {
    const canvas = document.getElementById('growthChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (growthChartInstance) {
        growthChartInstance.destroy();
    }

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDarkMode ? '#2a3958' : '#e5eaf2';
    const textColor = isDarkMode ? '#94a3b8' : '#68738a';

    growthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Growth (${currency})`,
                data: data,
                borderColor: '#315efb',
                backgroundColor: 'rgba(49, 94, 251, 0.1)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            }
        }
    });
}

function updateCompareChart(labels, dataA, dataB, currency = 'KSh') {
    const canvas = document.getElementById('growthChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (growthChartInstance) {
        growthChartInstance.destroy();
    }

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDarkMode ? '#2a3958' : '#e5eaf2';
    const textColor = isDarkMode ? '#94a3b8' : '#68738a';

    growthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Scenario A (${currency})`,
                    data: dataA,
                    borderColor: '#315efb',
                    backgroundColor: 'rgba(49, 94, 251, 0.05)',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.3
                },
                {
                    label: `Scenario B (${currency})`,
                    data: dataB,
                    borderColor: '#19a879',
                    backgroundColor: 'rgba(25, 168, 121, 0.05)',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } },
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            }
        }
    });
}

// ==========================
// 5. MOBILE MENU & DARK MODE
// ==========================
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.toggle('active');
}

function closeMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.classList.remove('active');
}

const themeToggleBtn = document.getElementById('themeToggle');

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerText = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerText = '☀️';
        }
        runCalculator();
    });
}

window.onload = function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' && themeToggleBtn) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerText = '☀️';
    }
    runCalculator();
};