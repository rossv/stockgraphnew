// Change constant parameters to mutable variables
let matchRate = 0.25; // default 25%
let vestingPeriod = 5; // default 5 years

// Historical data arrays (assumed closing prices)
const historicalData = [
  { year: 2012, price: 4.46 },
  { year: 2013, price: 6.52 },
  { year: 2014, price: 9.41 },
  { year: 2015, price: 11.2 },
  { year: 2016, price: 12.13 },
  { year: 2017, price: 13.6 },
  { year: 2018, price: 13.28 },
  { year: 2019, price: 14.76 },
  { year: 2020, price: 19.7 },
  { year: 2021, price: 35.3 },
  { year: 2022, price: 43.72 },
  { year: 2023, price: 51.02 }
];

// S&P500 closing values on April 30 for each year.
const sp500Close = [
  { year: 2012, close: 1397.91 },
  { year: 2013, close: 1597.57 },
  { year: 2014, close: 1883.95 },
  { year: 2015, close: 2085.51 },
  { year: 2016, close: 2065.30 },
  { year: 2017, close: 2384.20 },
  { year: 2018, close: 2648.05 },
  { year: 2019, close: 2945.83 },
  { year: 2020, close: 2912.43 },
  { year: 2021, close: 4181.17 },
  { year: 2022, close: 4131.93 },
  { year: 2023, close: 4169.48 },
  { year: 2024, close: 5035.69 }
];

// Array to hold employee investment inputs for each year
let investmentAmounts = new Array(historicalData.length).fill(0);

// Helper functions for formatting
function formatCurrency(value) {
  return `$${parseInt(value).toLocaleString()}`;
}
function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

// Build the investment input rows in the Overview tab
const sliderTable = document.getElementById("sliderTable");
historicalData.forEach((item, index) => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.year}</td>
    <td>${formatPrice(item.price)}</td>
    <td><input type="range" min="0" max="20000" step="100" value="0" id="slider-${item.year}"></td>
    <td><input type="text" id="number-${item.year}" value="${formatCurrency(0)}"></td>
    <td><button class="btn btn-sm btn-outline-primary" onclick="applyToSubsequentYears(${index})">Apply →</button></td>
  `;
  sliderTable.appendChild(row);

  const slider = document.getElementById(`slider-${item.year}`);
  const numberField = document.getElementById(`number-${item.year}`);

  slider.addEventListener("input", (e) => {
    const value = e.target.value;
    investmentAmounts[index] = parseFloat(value);
    numberField.value = formatCurrency(value);
    updateCalculation();
  });
  numberField.addEventListener("input", (e) => {
    let value = parseFloat(e.target.value.replace(/[^0-9]/g, ""));
    if (isNaN(value)) value = 0;
    investmentAmounts[index] = value;
    slider.value = value;
    e.target.value = formatCurrency(value);
    updateCalculation();
  });
});

function applyToSubsequentYears(startIndex) {
  const value = investmentAmounts[startIndex];
  historicalData.forEach((item, i) => {
    if (i >= startIndex) {
      investmentAmounts[i] = value;
      document.getElementById(`slider-${item.year}`).value = value;
      document.getElementById(`number-${item.year}`).value = formatCurrency(value);
    }
  });
  updateCalculation();
}

// Main simulation function for the Overview tab
function updateCalculation() {
  const simYears = sp500Close.filter(rec => rec.year < 2024).map(rec => rec.year);
  const summaryBody = document.getElementById("summaryBody");
  summaryBody.innerHTML = "";

  let cumulativeEmployeeShares = 0;
  let cumulativeEmployeeInvested = 0;
  let cumulativeMatchingAwarded = 0;
  let cumulativeMatchingShares = 0;
  let sp500Value = 0;

  // Arrays for chart data
  let investedValueArray = [];
  let employeeValueArray = [];
  let totalValueArray = [];
  let sp500ValueArray = [];

  simYears.forEach((simYear, idx) => {
    let dataEntry = historicalData.find(item => item.year === simYear);
    let currentStockPrice = dataEntry ? dataEntry.price : historicalData[historicalData.length - 1].price;
    let invIndex = historicalData.findIndex(item => item.year === simYear);
    let invested = invIndex !== -1 ? investmentAmounts[invIndex] : 0;

    if (invIndex !== -1) {
      let purchasePrice = historicalData[invIndex].price;
      let employeeShares = invested / purchasePrice;
      cumulativeEmployeeShares += employeeShares;
      cumulativeEmployeeInvested += invested;
    }

    // Vesting & matching simulation using dynamic parameters
    let vestThisYear = 0;
    let matchingSharesThisYear = 0;
    historicalData.forEach((entry, idx2) => {
      if (simYear === entry.year + vestingPeriod) {
        let matchingAwarded = investmentAmounts[idx2] * matchRate;
        vestThisYear += matchingAwarded;
        matchingSharesThisYear += matchingAwarded / currentStockPrice;
      }
    });
    cumulativeMatchingAwarded += vestThisYear;
    cumulativeMatchingShares += matchingSharesThisYear;

    let currentValueEmployee = cumulativeEmployeeShares * currentStockPrice;
    let currentValueMatching = cumulativeMatchingShares * currentStockPrice;
    let totalCurrentValue = currentValueEmployee + currentValueMatching;

    // S&P500 simulation logic
    let sp500Record = sp500Close.find(rec => rec.year === simYear);
    let currentClose = sp500Record ? sp500Record.close : null;
    let sp500Index = sp500Close.findIndex(rec => rec.year === simYear);
    if (sp500Index === 0) {
      sp500Value = invested;
    } else {
      let prevClose = sp500Close[sp500Index - 1].close;
      sp500Value = sp500Value === 0 && invested > 0 ? invested : (sp500Value + invested) * (currentClose / prevClose);
    }

    summaryBody.innerHTML += `<tr>
      <td>${simYear}</td>
      <td>${formatPrice(currentStockPrice)}</td>
      <td>${formatCurrency(invested)}</td>
      <td>${formatCurrency(cumulativeEmployeeInvested)}</td>
      <td>${formatCurrency(vestThisYear)}</td>
      <td>${formatCurrency(cumulativeMatchingAwarded)}</td>
      <td>${formatCurrency(currentValueMatching)}</td>
      <td>${formatCurrency(currentValueEmployee)}</td>
      <td>${formatCurrency(totalCurrentValue)}</td>
      <td>${formatCurrency(sp500Value)}</td>
    </tr>`;

    investedValueArray.push(cumulativeEmployeeInvested);
    employeeValueArray.push(currentValueEmployee);
    totalValueArray.push(totalCurrentValue);
    sp500ValueArray.push(sp500Value);
  });

  // Render the main chart using Plotly
  Plotly.newPlot("chart", [
    {
      x: simYears,
      y: totalValueArray,
      name: "Total Value (Emp+Match)",
      fill: "tozeroy",
      fillcolor: "rgba(0,130,186,0.8)",
      line: { color: "rgba(0,130,186,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Total Value</extra>'
    },
    {
      x: simYears,
      y: employeeValueArray,
      name: "Employee Shares Value",
      fill: "tozeroy",
      fillcolor: "rgba(67,176,42,0.8)",
      line: { color: "rgba(67,176,42,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Employee Value</extra>'
    },
    {
      x: simYears,
      y: sp500ValueArray,
      name: "S&P500 Value",
      fill: "tozeroy",
      fillcolor: "rgba(198,54,99,0.8)",
      line: { color: "rgba(198,54,99,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>S&P500</extra>'
    },
    {
      x: simYears,
      y: investedValueArray,
      name: "Cumulative Invested",
      fill: "tozeroy",
      fillcolor: "rgba(99,102,106,0.8)",
      line: { color: "rgba(99,102,106,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Invested</extra>'
    }
  ], {
    xaxis: { dtick: 1, title: 'Year' },
    yaxis: { title: 'Value ($)' },
    legend: { orientation: "h", x: 0, xanchor: "left", y: -0.2 },
    margin: { t: 40 }
  }, { responsive: true });

  // Update advanced metrics in the Detailed Analysis tab
  updateDetailedMetrics(cumulativeEmployeeInvested, totalValueArray[totalValueArray.length - 1], simYears);
}

// Update advanced metrics (ROI, CAGR, etc.) in the Detailed Analysis tab
function updateDetailedMetrics(totalInvested, finalValue, simYears) {
  const years = simYears.length;
  const roi = ((finalValue - totalInvested) / totalInvested) * 100;
  const cagr = totalInvested > 0 ? (Math.pow(finalValue / totalInvested, 1 / years) - 1) * 100 : 0;
  const metricsHTML = `
    <p><strong>Total Invested:</strong> ${formatCurrency(totalInvested)}</p>
    <p><strong>Final Value:</strong> ${formatCurrency(finalValue)}</p>
    <p><strong>ROI:</strong> ${roi.toFixed(2)}%</p>
    <p><strong>CAGR:</strong> ${cagr.toFixed(2)}%</p>
  `;
  document.getElementById("detailedMetrics").innerHTML = metricsHTML;
}

// Scenario Comparison: Project future values using compound growth based on different rates
function updateScenarioComparison() {
  const projectionYears = parseInt(document.getElementById("projectionYears").value);
  const conservativeRate = parseFloat(document.getElementById("conservativeRate").value) / 100;
  const baseRate = parseFloat(document.getElementById("baseRate").value) / 100;
  const aggressiveRate = parseFloat(document.getElementById("aggressiveRate").value) / 100;

  // Use the last known cumulative investment value from Overview simulation
  const lastIndex = historicalData.length - 1;
  const lastInvested = investmentAmounts[lastIndex] || 0;
  const baseCumulative = lastInvested;  // Starting amount for projection

  let years = [];
  let conservative = [];
  let base = [];
  let aggressive = [];
  let currentCon = baseCumulative;
  let currentBase = baseCumulative;
  let currentAgg = baseCumulative;
  const startYear = 2024;
  for (let i = 0; i <= projectionYears; i++) {
    years.push(startYear + i);
    conservative.push(currentCon);
    base.push(currentBase);
    aggressive.push(currentAgg);
    currentCon *= (1 + conservativeRate);
    currentBase *= (1 + baseRate);
    currentAgg *= (1 + aggressiveRate);
  }

  Plotly.newPlot("scenarioChart", [
    {
      x: years,
      y: conservative,
      name: "Conservative",
      fill: "tozeroy",
      fillcolor: "rgba(67,176,42,0.8)",
      line: { color: "rgba(67,176,42,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Conservative</extra>'
    },
    {
      x: years,
      y: base,
      name: "Base",
      fill: "tozeroy",
      fillcolor: "rgba(0,130,186,0.8)",
      line: { color: "rgba(0,130,186,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Base</extra>'
    },
    {
      x: years,
      y: aggressive,
      name: "Aggressive",
      fill: "tozeroy",
      fillcolor: "rgba(198,54,99,0.8)",
      line: { color: "rgba(198,54,99,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Aggressive</extra>'
    }
  ], {
    xaxis: { title: 'Year' },
    yaxis: { title: 'Projected Value ($)' },
    margin: { t: 40 }
  }, { responsive: true });
}

// Apply parameter changes from the Detailed Analysis tab
document.getElementById("applyParams").addEventListener("click", () => {
  const newMatchRate = parseFloat(document.getElementById("matchRateInput").value) / 100;
  const newVesting = parseInt(document.getElementById("vestingInput").value);
  if (!isNaN(newMatchRate)) matchRate = newMatchRate;
  if (!isNaN(newVesting)) vestingPeriod = newVesting;
  updateCalculation();
});

// Update Scenario Comparison chart when button is clicked
document.getElementById("updateScenario").addEventListener("click", updateScenarioComparison);

// Clear All Values functionality for the Overview tab
document.getElementById("clearBtn").addEventListener("click", () => {
  investmentAmounts = new Array(historicalData.length).fill(0);
  historicalData.forEach(item => {
    document.getElementById(`slider-${item.year}`).value = 0;
    document.getElementById(`number-${item.year}`).value = formatCurrency(0);
  });
  document.getElementById("summaryBody").innerHTML = "";
  Plotly.purge("chart");
});

// Theme toggle functionality (improves dark mode by toggling the "dark" class on body)
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Initialize both the Overview and Scenario Comparison on load
updateCalculation();
updateScenarioComparison();
