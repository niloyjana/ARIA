// tools.js — Form definitions and API endpoint mapping for all 6 tools

const TOOLS = {

  fire: {
    title: "🔥 FIRE Path Planner",
    iconHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="premium-icon"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.292 1.3-3.003l1.2 1.003Z"/></svg>`,
    subtitle: "Build your complete Financial Independence & Early Retirement roadmap",
    endpoint: "/api/fire",
    color: "#FF6B35",
    fields: [
      { key: "age",                  label: "Current Age",               type: "number", placeholder: "28",      col: 1 },
      { key: "retirement_age",       label: "Target Retirement Age",     type: "number", placeholder: "45",      col: 1 },
      { key: "monthly_income",       label: "Monthly Income (₹)",        type: "number", placeholder: "85000",   col: 1 },
      { key: "monthly_expenses",     label: "Monthly Expenses (₹)",      type: "number", placeholder: "45000",   col: 1 },
      { key: "existing_investments", label: "Existing Investments (₹)",  type: "number", placeholder: "200000",  col: 1 },
      { key: "goals",                label: "Life Goals",                type: "text",   placeholder: "House in 5 yrs, child education, travel...", col: 2, span: true },
    ],
    infoFn: (d) => {
      const s = (d.monthly_income || 0) - (d.monthly_expenses || 0);
      const r = d.monthly_income > 0 ? (s / d.monthly_income * 100).toFixed(0) : 0;
      return `💡 Monthly savings: ₹${s.toLocaleString('en-IN')} (${r}% savings rate) | Years to retire: ${(d.retirement_age||45)-(d.age||28)}`;
    },
    btnText: "🔥 Generate My FIRE Roadmap",
  },

  health: {
    title: "💯 Money Health Score",
    iconHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="premium-icon"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>`,
    subtitle: "6-dimension financial wellness check-up — 2 minutes",
    endpoint: "/api/health",
    color: "#00B894",
    fields: [
      { key: "monthly_income",      label: "Monthly Income (₹)",            type: "number", placeholder: "75000", col: 1 },
      { key: "emergency_fund",      label: "Emergency Fund (₹)",            type: "number", placeholder: "60000", col: 1 },
      { key: "term_insurance_cr",   label: "Term Insurance (₹ Crore)",      type: "number", placeholder: "1",     col: 1 },
      { key: "health_insurance_l",  label: "Health Insurance (₹ Lakh)",     type: "number", placeholder: "5",     col: 1 },
      { key: "total_investments",   label: "Total Investments (₹)",         type: "number", placeholder: "500000",col: 1 },
      { key: "total_debt",          label: "Total Loans / Debt (₹)",        type: "number", placeholder: "150000",col: 1 },
      { key: "annual_tax_saving",   label: "Annual 80C Investments (₹)",    type: "number", placeholder: "80000", col: 1 },
    ],
    infoFn: (d) => {
      const em = d.monthly_income > 0 ? ((d.emergency_fund||0) / (d.monthly_income * 0.6)).toFixed(1) : 0;
      const u  = Math.min(100, ((d.annual_tax_saving||0)/1500)).toFixed(0);
      return `💡 Emergency fund: ${em} months (ideal: 6) | 80C utilisation: ${u}%`;
    },
    btnText: "💯 Calculate Health Score",
  },

  lifeevent: {
    title: "🎯 Life Event Advisor",
    iconHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="premium-icon"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    subtitle: "Personalized financial guidance for your biggest money moments",
    endpoint: "/api/life-event",
    color: "#6C5CE7",
    fields: [
      {
        key: "event", label: "Life Event", type: "select", col: 2,
        options: ["Got a Bonus","Received Inheritance","Getting Married","New Baby",
                  "Job Change / Promotion","Buying a House","Starting a Business","ESOP / RSU Vesting"],
      },
      { key: "amount",            label: "Amount Involved (₹)",    type: "number", placeholder: "500000",  col: 1 },
      { key: "annual_income",     label: "Annual Income (₹)",      type: "number", placeholder: "1200000", col: 1 },
      {
        key: "tax_bracket", label: "Tax Bracket", type: "select", col: 1,
        options: ["5%","10%","15%","20%","30%"],
      },
      {
        key: "risk_profile", label: "Risk Profile", type: "select", col: 1,
        options: ["Conservative","Moderate","Aggressive"],
      },
      { key: "existing_portfolio", label: "Existing Portfolio (₹)", type: "number", placeholder: "800000",  col: 1 },
    ],
    infoFn: (d) => `💡 Getting advice for: ${d.event || '—'} | Amount: ₹${(d.amount||0).toLocaleString('en-IN')}`,
    btnText: "🎯 Get My Action Plan",
  },

  tax: {
    title: "🧾 Tax Wizard",
    iconHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="premium-icon"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5V6.5"/></svg>`,
    subtitle: "Find every missed deduction. Old vs new regime with your numbers.",
    endpoint: "/api/tax",
    color: "#FDCB6E",
    fields: [
      { key: "basic_salary_monthly", label: "Basic Salary (₹/month)",    type: "number", placeholder: "50000", col: 1 },
      { key: "hra_monthly",          label: "HRA Received (₹/month)",    type: "number", placeholder: "20000", col: 1 },
      { key: "rent_paid_monthly",    label: "Rent Paid (₹/month)",       type: "number", placeholder: "15000", col: 1 },
      {
        key: "city_type", label: "City Type", type: "select", col: 1,
        options: ["Metro (Mumbai/Delhi/Kolkata/Chennai)","Non-Metro"],
      },
      { key: "existing_80c",         label: "80C Investments (₹/year)",  type: "number", placeholder: "50000", col: 1 },
      { key: "home_loan_interest",   label: "Home Loan Interest (₹/yr)", type: "number", placeholder: "0",     col: 1 },
      { key: "nps_contribution",     label: "NPS Contribution (₹/year)", type: "number", placeholder: "0",     col: 1 },
    ],
    infoFn: (d) => {
      const annual = (d.basic_salary_monthly||0) * 12;
      const gap = Math.max(0, 150000 - (d.existing_80c||0));
      return `💡 Annual Basic: ₹${annual.toLocaleString('en-IN')} | 80C gap: ₹${gap.toLocaleString('en-IN')} | NPS extra deduction: ₹50,000 available`;
    },
    btnText: "🧾 Run Tax Optimisation",
  },

  couple: {
    title: "💑 Couple's Money Planner",
    iconHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="premium-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    subtitle: "Optimize finances across both partners' incomes",
    endpoint: "/api/couple",
    color: "#E84393",
    fields: [
      { key: "p1_monthly_income", label: "Partner 1 Monthly Income (₹)", type: "number", placeholder: "90000", col: 1 },
      { key: "p2_monthly_income", label: "Partner 2 Monthly Income (₹)", type: "number", placeholder: "70000", col: 1 },
      { key: "p1_hra_monthly",    label: "Partner 1 HRA (₹/month)",      type: "number", placeholder: "30000", col: 1 },
      { key: "p2_hra_monthly",    label: "Partner 2 HRA (₹/month)",      type: "number", placeholder: "20000", col: 1 },
      { key: "rent_paid_monthly", label: "Rent Paid (₹/month)",          type: "number", placeholder: "30000", col: 1 },
      { key: "combined_investments", label: "Combined Investments (₹)",  type: "number", placeholder: "800000",col: 1 },
      { key: "joint_goals",       label: "Joint Financial Goals",        type: "textarea", placeholder: "Buy home in 4 yrs, retire at 50, child education...", col: 2, span: true },
    ],
    infoFn: (d) => {
      const c = (d.p1_monthly_income||0) + (d.p2_monthly_income||0);
      return `💡 Combined income: ₹${c.toLocaleString('en-IN')}/month | Combined 80C capacity: ₹3,00,000/year`;
    },
    btnText: "💑 Generate Joint Plan",
  },

  xray: {
    title: "🔬 Portfolio X-Ray",
    iconHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="premium-icon"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="M16 16 21 21"/></svg>`,
    subtitle: "Deep MF analysis — overlap, expense drag, rebalancing plan",
    endpoint: "/api/xray",
    color: "#00CEC9",
    fields: [
      {
        key: "portfolio_text", label: "Your Mutual Funds (Fund Name — ₹Amount, one per line)",
        type: "textarea", col: 2, span: true,
        placeholder: "Parag Parikh Flexi Cap - ₹2,00,000\nAxis Bluechip Fund - ₹1,50,000\nMirae Asset Large Cap - ₹1,00,000\nQuant Mid Cap - ₹75,000",
      },
      {
        key: "investment_horizon", label: "Investment Horizon", type: "select", col: 1,
        options: ["1-3 years","3-5 years","5-10 years","10+ years"],
      },
      {
        key: "risk_profile", label: "Risk Profile", type: "select", col: 1,
        options: ["Conservative","Moderate","Aggressive"],
      },
      { key: "monthly_sip",    label: "Total Monthly SIP (₹)", type: "number",  placeholder: "25000",                         col: 1 },
      { key: "primary_goal",   label: "Primary Goal",          type: "text",    placeholder: "Retirement / Wealth Creation",  col: 1 },
    ],
    infoFn: (d) => {
      const lines = (d.portfolio_text||"").split("\n").filter(l => l.trim()).length;
      return `💡 Detected ${lines} fund(s) in portfolio`;
    },
    btnText: "🔬 Run Portfolio X-Ray",
  },
};
