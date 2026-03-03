QuantEdge 📊

Quantitative Portfolio Intelligence Platform for Indian Equity Investors

🌍 Live Demo:
https://srinivaskoushik3.github.io/indian-quant-hub/

📌 Overview

QuantEdge is a full-stack quantitative portfolio analytics platform designed for Indian equity investors.

It combines:

Algorithmic trading signals

Portfolio risk modeling

Allocation intelligence

Dividend tracking

Capital gains tax estimation

Monte Carlo risk simulation

Weekly performance reporting

The platform bridges quantitative finance with modern fintech UI/UX to deliver institutional-grade analytics in a retail-friendly interface.

🧠 Core Modules
📊 Portfolio Dashboard

Live portfolio valuation

PnL tracking

Interactive performance charts

Strategy signal overview

Sharpe ratio

Volatility

Max drawdown

📈 Asset Allocation & Risk Breakdown

Allocation by stock (donut visualization)

Sector exposure analysis

Market-cap distribution

Risk contribution per asset

Diversification score (0–100)

Concentration alerts (>30% exposure)

🎛 Customizable UX Modes

QuantEdge supports dynamic user modes:

Beginner Mode (simplified analytics)

Pro Mode (advanced quant metrics)

Dark Mode (fintech theme)

Light Mode (minimal layout)

Users can:

Enable/disable widgets

Rearrange dashboard layout

Persist layout preferences

📅 Weekly Intelligence Report

Automated weekly analytics including:

Weekly return %

Best & worst performing assets

Sharpe ratio

Volatility trend

Allocation shifts

Strategy summary

Includes:

Weekly performance chart

Snapshot storage

Historical comparison

PDF export (planned)

💰 Dividend Tracker

Dividend yield per stock

Upcoming dividend dates

Year-to-date dividend income

Expected annual dividend projection

Income growth visualization

🧾 Capital Gains Tax Estimator (India)

Short-term capital gains (STCG)

Long-term capital gains (LTCG)

Net profit after tax

Effective tax rate

Tax impact visualization

Built with Indian equity taxation rules in mind.

🎲 Monte Carlo Risk Lab (Implemented)

QuantEdge now includes a Monte Carlo simulation engine for probabilistic risk modeling.

Features:

Geometric Brownian Motion (GBM) simulation

1,000+ simulation paths

Probability distribution of returns

5th / 50th / 95th percentile projections

Worst-case drawdown estimation

Value at Risk (VaR 95% / 99%)

Conditional VaR (CVaR)

Confidence interval bands

Return histogram visualization

This elevates QuantEdge toward institutional-grade quantitative risk modeling.

⚠ Smart Insights Engine

Automatically detects:

Portfolio concentration risk

Sector overexposure

High volatility positions

Underperforming strategies

Rebalance suggestions

🏗 Architecture
Frontend

React

TypeScript

Vite

Tailwind CSS

shadcn-ui

TanStack Query

Backend

Supabase (PostgreSQL)

Serverless APIs

Risk & simulation utilities

Snapshot storage

Deployment

GitHub Pages (Frontend)

Lovable Cloud

Supabase backend
```
📂 Project Structure
indian-quant-hub/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   ├── utils/
│
├── public/
├── supabase/
├── package.json
└── README.md
```
🛠 Local Development
```
Clone Repository
git clone https://github.com/Srinivaskoushik3/indian-quant-hub
cd indian-quant-hub
Install Dependencies
npm install
Start Development Server
npm run dev
```
🚀 Roadmap

Portfolio risk heatmap

Backend microservices (FastAPI)

Advanced ML prediction engine

Scenario stress testing

PDF report generation

Multi-portfolio support

Custom domain deployment

📈 Vision

QuantEdge aims to democratize quantitative finance tools for retail investors in India.

The goal is to:

Bridge institutional-grade risk modeling with retail accessibility

Combine data science + financial engineering

Provide real-time intelligent portfolio insights

👨‍💻 Author

Srinivas Koushik
Quantitative Developer | Full-Stack Engineer

📄 License

MIT License
