# Smart Personal Finance, Budget and Loan Tracker

## Project Overview

The **Smart Personal Finance, Budget and Loan Tracker** is a web-based financial management system developed using Python and ShaktiDB.

The system helps users:

- Track expenses
- Track income
- Plan monthly budgets
- Compare planned and actual spending
- Monitor savings
- Manage loans and loan reminders
- Analyze financial data through reports and analytics

---

## Dashboard

The dashboard acts as the main control center of the application.

### Dashboard Displays

- Total Income
- Total Expenses
- Total Savings
- Current Month Budget Status
- Upcoming Loan Reminders
- Pending Loan Payments
- Recent Transactions

### Main Navigation

- Expense Tracking
- Income Tracking
- Budget Planner
- Budget Comparison
- Reports & Analytics
- Loan Tracking

---

## Expense Tracking Module

This module records the user's actual expenses.

### Default Categories

- Food
- Travel
- Petrol
- Rent
- Shopping

### Custom Categories

Users can create categories such as:

- House Maintenance
- Electricity Bill
- Internet Bill
- Medical Expenses
- Education
- Entertainment

### Adding Expenses

Users enter:

- Category
- Date
- Amount
- Notes *(Optional)*

**Example:**

| Category | Date | Amount |
|----------|------|--------|
| Food | March 1 | ₹200 |
| Food | March 2 | ₹350 |

### Expense Analysis

**Daily Expense** — View expenses for a specific day.

**Monthly Expense** — View expenses for a selected month.

**Yearly Expense** — View expenses for a selected year.

**Category Analysis** — Analyze expenses broken down by category (e.g., Food, Travel) across daily, monthly, and yearly views.

---

## Income Tracking Module

This module records all income sources.

### Salary Income

Users enter:

- Month
- Salary Amount

**Example:** March Salary = ₹30,000

### Other Income

Users can record:

- Bonus
- Freelancing
- Gifts
- Refunds
- Side Business Income

### Income Analysis

Users can view:

- Daily Income
- Monthly Income
- Yearly Income

---

## Budget Planner Module

This module is used to plan future expenses.

### Monthly Budget Setup

Users select a **Month** and **Category**, then set a daily budget.

**Example:**

- Food Daily Budget = ₹200/day
- System calculates: Monthly Budget = Daily Budget × Number of Days in Month
- March: ₹200 × 31 = **₹6,200**

### Planned Budget Levels

| Level | Example |
|-------|---------|
| Daily | Food = ₹200/day |
| Weekly | Food ≈ ₹1,400/week *(auto-calculated)* |
| Monthly | Food = ₹6,200 |

**Sample Monthly Budget:**

| Category | Planned Amount |
|----------|---------------|
| Food | ₹6,200 |
| Travel | ₹3,100 |
| Petrol | ₹2,500 |
| Rent | ₹10,000 |

The system automatically calculates the **Total Planned Budget** for the selected month.

---

## Budget Comparison Module

This module compares planned expenses with actual expenses.

### Weekly Comparison

| Category | Planned | Actual | Difference |
|----------|---------|--------|------------|
| Food | ₹1,400 | ₹1,650 | +₹250 |

### Monthly Comparison

| Category | Planned | Actual | Difference |
|----------|---------|--------|------------|
| Food | ₹6,200 | ₹7,100 | +₹900 |

### Budget Performance

The system identifies:

- **Over Budget** — Actual spending exceeds plan
- **Under Budget** — Actual spending is below plan
- **Difference Amount** — Exact variance from plan

---

## Financial Summary Module

The system automatically calculates financial data.

### Total Income

- Daily / Monthly / Yearly

### Total Expenses

- Daily / Monthly / Yearly

### Total Savings

> **Savings = Income − Expenses**

### Savings Analysis

- Daily Savings
- Monthly Savings
- Yearly Savings

---

## Reports & Analytics Module

| Report Type | Available Views |
|-------------|----------------|
| Expense Reports | Daily, Monthly, Yearly |
| Income Reports | Daily, Monthly, Yearly |
| Savings Reports | Daily, Monthly, Yearly |
| Category Reports | Daily, Monthly, Yearly per category |
| Planned vs Actual | Weekly, Monthly, Category comparison |
| Trends | Expense, Income, Savings trends |

---

## Loan Tracking Module

This module manages loans, reminders, and loan payment history.

### Add New Loan

Users enter:

- Loan Title
- Start Date
- Default Reminder Date
- Expected End Date *(Optional)*
- Notes *(Optional)*

**Loan Types (Examples):**

- Gold Loan
- Bank Loan
- Vehicle Loan
- Personal Loan

---

### Default Reminder System

Set a **Default Reminder Date** and the system auto-generates monthly reminders.

**Example:** Default Reminder Date = 16th

The system creates reminders for:
- April 16 → May 16 → June 16 → ...

Reminders continue automatically until the loan is marked as completed.

---

### Due Date Modification

**Temporary Change** — Only the specific month uses the new date. Future reminders revert to the default.

**Permanent Change** — The default reminder date is updated. All future reminders use the new date.

---

### Loan Reminder Flow

On the due date, the system prompts:

> **Have you paid this loan?**

---

#### If User Selects **Yes**

The system asks: *How much did you pay?*

Then it:

- Records the payment
- Adds it to Loan History
- Automatically creates an Expense entry under **Loan Payment**
- Updates all financial calculations

#### If User Selects **No**

The payment is marked as **Pending** and appears on the dashboard under **Pending Loan Payments**. Users can return later to complete the payment.

---

### Pending Payment Management

Users can view all pending payments and select **Pay Now** to record them.

**Example:**

| Loan | Due Date | Status |
|------|----------|--------|
| Gold Loan | March 16 | Pending |

---

### Payment Status Tracking

| Status | Description | Example |
|--------|-------------|---------|
| **On Time** | Paid on or before due date | Due: March 16 → Paid: March 16 |
| **Late** | Paid after due date | Due: March 16 → Paid: March 22 |
| **Pending** | Not yet completed | Due: April 16 → Not paid |

---

### Loan Payment History

Each loan maintains its own payment history.

**Example — Gold Loan:**

| Due Date | Payment Date | Amount | Status |
|----------|-------------|--------|--------|
| Jan 16 | Jan 16 | ₹3,000 | On Time |
| Feb 16 | Feb 15 | ₹4,500 | On Time |
| Mar 16 | Mar 22 | ₹5,000 | Late |
| Apr 16 | — | — | Pending |

---

### Loan Summary Page

Each loan displays:

- Loan Title
- Start Date
- Expected End Date
- Default Reminder Date
- Next Due Date
- Total Amount Paid
- Number of Payments
- On-Time Payments
- Late Payments
- Pending Payments

Full payment history is displayed below the summary.

---

### Loan Completion

**Automatic Completion** — Triggered when the expected end date is reached and the user confirms.

**Manual Completion** — Users can manually mark a loan as completed at any time.

Completed loans are moved to **Loan History**.

---

## System Overview

The application consists of four major components:

1. **Expense Management**
2. **Income Management**
3. **Budget Planning and Analysis**
4. **Loan Management**

The system helps users manage personal finances, monitor spending habits, plan budgets, track savings, and manage loan obligations — all from a single platform.
