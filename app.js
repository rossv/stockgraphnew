// Fixed parameters
const matchRate = 0.25; // 25%
const vestingPeriod = 5; // 5 years

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

// Global variable to store final simulation total (used for projections)
let finalTotalValue = 0;

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

// Main simulation function for the Overview and Detailed Analysis tabs
function updateCalculation() {
  // Use the historical years (e.g., 2012–2023)
  const simYears = historicalData.map(item => item.year);
  const summaryBody = document.getElementById("summaryBody");
  const detailedBody = document.getElementById("detailedBody");
  summaryBody.innerHTML = "";
  detailedBody.innerHTML = "";

  let cumulativeEmployeeShares = 0;
  let cumulativeEmployeeInvested = 0;
  let cumulativeMatchingAwarded = 0;
  let cumulativeMatchingShares = 0;
  let sp500Value = 0;

  // Arrays for chart data (ordered for clarity)
  let investedValueArray = [];
  let employeeValueArray = [];
  let totalValueArray = [];
  let sp500ValueArray = [];

  simYears.forEach((simYear, idx) => {
    // Get current stock price from historicalData
    const dataEntry = historicalData.find(item => item.year === simYear);
    const currentStockPrice = dataEntry ? dataEntry.price : historicalData[historicalData.length - 1].price;
    const invIndex = historicalData.findIndex(item => item.year === simYear);
    const invested = invIndex !== -1 ? investmentAmounts[invIndex] : 0;
    
    // Calculate employee shares purchased this year
    const employeeSharesThisYear = invIndex !== -1 && invested > 0 ? invested / dataEntry.price : 0;
    cumulativeEmployeeShares += employeeSharesThisYear;
    cumulativeEmployeeInvested += invested;
    
    // Calculate matching award for this year (vesting occurs after vestingPeriod)
    let matchAwardedThisYear = 0;
    let matchingSharesThisYear = 0;
    historicalData.forEach((entry, idx2) => {
      if (simYear === entry.year + vestingPeriod) {
        const awarded = investmentAmounts[idx2] * matchRate;
        matchAwardedThisYear += awarded;
        matchingSharesThisYear += awarded / currentStockPrice;
      }
    });
    cumulativeMatchingAwarded += matchAwardedThisYear;
    cumulativeMatchingShares += matchingSharesThisYear;
    
    // Compute current values
    const currentValueEmployee = cumulativeEmployeeShares * currentStockPrice;
    const currentValueMatching = cumulativeMatchingShares * currentStockPrice;
    const totalCurrentValue = currentValueEmployee + currentValueMatching;
    
    // S&P500 simulation logic
    const sp500Record = sp500Close.find(rec => rec.year === simYear);
    const currentClose = sp500Record ? sp500Record.close : null;
    const sp500Index = sp500Close.findIndex(rec => rec.year === simYear);
    if (sp500Index === 0) {
      sp500Value = invested;
    } else {
      const prevClose = sp500Close[sp500Index - 1].close;
      sp500Value = sp500Value === 0 && invested > 0 ? invested : (sp500Value + invested) * (currentClose / prevClose);
    }
    
    // Append row to Overview summary table
    summaryBody.innerHTML += `
      <tr>
        <td>${simYear}</td>
        <td>${formatPrice(currentStockPrice)}</td>
        <td>${formatCurrency(invested)}</td>
        <td>${formatCurrency(cumulativeEmployeeInvested)}</td>
        <td>${formatCurrency(matchAwardedThisYear)}</td>
        <td>${formatCurrency(cumulativeMatchingAwarded)}</td>
        <td>${formatCurrency(currentValueMatching)}</td>
        <td>${formatCurrency(currentValueEmployee)}</td>
        <td>${formatCurrency(totalCurrentValue)}</td>
        <td>${formatCurrency(sp500Value)}</td>
      </tr>
    `;
    
    // Append row to Detailed Analysis table with extra breakdowns
    detailedBody.innerHTML += `
      <tr>
        <td>${simYear}</td>
        <td>${formatPrice(currentStockPrice)}</td>
        <td>${formatCurrency(invested)}</td>
        <td>${formatCurrency(cumulativeEmployeeInvested)}</td>
        <td>${employeeSharesThisYear.toFixed(2)}</td>
        <td>${cumulativeEmployeeShares.toFixed(2)}</td>
        <td>${formatCurrency(matchAwardedThisYear)}</td>
        <td>${formatCurrency(cumulativeMatchingAwarded)}</td>
        <td>${formatCurrency(currentValueEmployee)}</td>
        <td>${formatCurrency(currentValueMatching)}</td>
        <td>${formatCurrency(totalCurrentValue)}</td>
        <td>${formatCurrency(sp500Value)}</td>
      </tr>
    `;
    
    investedValueArray.push(cumulativeEmployeeInvested);
    employeeValueArray.push(currentValueEmployee);
    totalValueArray.push(totalCurrentValue);
    sp500ValueArray.push(sp500Value);
    
    // Update final total value (starting point for scenario projections)
    finalTotalValue = totalCurrentValue;
  });
  
  // Render the Overview chart with reordered traces for clarity
  Plotly.newPlot("chart", [
    {
      x: simYears,
      y: investedValueArray,
      name: "Cumulative Invested",
      fill: "tozeroy",
      fillcolor: "rgba(99,102,106,0.5)",
      line: { color: "rgba(99,102,106,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Cumulative Invested</extra>'
    },
    {
      x: simYears,
      y: employeeValueArray,
      name: "Employee Shares Value",
      fill: "tonexty",
      fillcolor: "rgba(67,176,42,0.5)",
      line: { color: "rgba(67,176,42,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Employee Value</extra>'
    },
    {
      x: simYears,
      y: totalValueArray,
      name: "Total Value (Emp+Match)",
      fill: "tonexty",
      fillcolor: "rgba(0,130,186,0.5)",
      line: { color: "rgba(0,130,186,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Total Value</extra>'
    },
    {
      x: simYears,
      y: sp500ValueArray,
      name: "S&P500 Value",
      mode: 'lines',
      line: { color: "rgba(198,54,99,1)", width: 2 },
      hovertemplate: '$%{y:,.0f}<extra>S&P500</extra>'
    }
  ], {
    xaxis: { dtick: 1, title: 'Year' },
    yaxis: { title: 'Value ($)' },
    legend: { orientation: "h", x: 0, xanchor: "left", y: -0.2 },
    margin: { t: 40 }
  }, { responsive: true });
  
  // Update scenario projections after recalculating
  updateScenarioComparison();
}

// Scenario Comparison: Project future values from the last historical year
function updateScenarioComparison() {
  const projectionYears = parseInt(document.getElementById("projectionYears").value);
  const conservativeRate = parseFloat(document.getElementById("conservativeRate").value) / 100;
  const baseRate = parseFloat(document.getElementById("baseRate").value) / 100;
  const aggressiveRate = parseFloat(document.getElementById("aggressiveRate").value) / 100;
  
  // Start projections from the last historical year and final simulation total
  const startYear = historicalData[historicalData.length - 1].year;
  const startingValue = finalTotalValue;
  
  let years = [];
  let conservative = [];
  let base = [];
  let aggressive = [];
  
  let currentCon = startingValue;
  let currentBase = startingValue;
  let currentAgg = startingValue;
  
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
      fillcolor: "rgba(67,176,42,0.5)",
      line: { color: "rgba(67,176,42,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Conservative</extra>'
    },
    {
      x: years,
      y: base,
      name: "Base",
      fill: "tozeroy",
      fillcolor: "rgba(0,130,186,0.5)",
      line: { color: "rgba(0,130,186,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Base</extra>'
    },
    {
      x: years,
      y: aggressive,
      name: "Aggressive",
      fill: "tozeroy",
      fillcolor: "rgba(198,54,99,0.5)",
      line: { color: "rgba(198,54,99,0.8)" },
      hovertemplate: '$%{y:,.0f}<extra>Aggressive</extra>'
    }
  ], {
    xaxis: { title: 'Year' },
    yaxis: { title: 'Projected Value ($)' },
    margin: { t: 40 }
  }, { responsive: true });
}

// Clear All Values functionality for the Overview tab
document.getElementById("clearBtn").addEventListener("click", () => {
  investmentAmounts = new Array(historicalData.length).fill(0);
  historicalData.forEach(item => {
    document.getElementById(`slider-${item.year}`).value = 0;
    document.getElementById(`number-${item.year}`).value = formatCurrency(0);
  });
  document.getElementById("summaryBody").innerHTML = "";
  document.getElementById("detailedBody").innerHTML = "";
  Plotly.purge("chart");
  updateCalculation();
});

// Update Scenario Comparison chart when button is clicked
document.getElementById("updateScenario").addEventListener("click", updateScenarioComparison);

// Initialize simulation and scenario chart on load
updateCalculation();
