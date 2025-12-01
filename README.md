# Expense Tracker Application

A modern, feature-rich expense tracking application built with Angular 20, Angular Material, and Bootstrap 5. Easily track your expenses and earnings, manage budgets, and visualize your financial data with intuitive dashboards and analytics.

## 🌟 Features

### Core Features

- **Transaction Management**: Add, edit, and delete expense and earning transactions
- **Category Management**: Organize transactions by custom categories with color coding
- **Search & Filter**: Search transactions by title and filter by date range
- **Dashboard Analytics**: View comprehensive financial statistics and trends
- **Date Range Filtering**: Auto-apply filters when selecting date ranges
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### User Interface

- **Material Design**: Integrated Angular Material components for a polished look
- **Material Date Pickers**: Easy date selection with Material Design date pickers
- **Smooth Animations**: Page transition animations for better UX
- **Bootstrap 5 Integration**: Utility-first CSS framework for responsive layouts
- **Glassmorphic Design**: Modern semi-transparent card designs with blur effects
- **Intuitive Icons**: SVG icons for better visual communication

### Financial Tracking

- **Transaction Types**: Separate tracking for expenses and earnings
- **Amount Highlighting**: Red for expenses, green for earnings at a glance
- **Net Income Calculation**: Automatic calculation of net income
- **Statistics Cards**: Visual display of total earnings, expenses, and transaction count
- **Category Tags**: Visual category indicators for easy identification

### Data Management

- **Local Storage**: All data is persisted in browser storage
- **Transaction Details**: Track title, category, quantity, unit price, and total amount
- **Date Tracking**: Record transaction dates for better organization
- **Edit Mode**: Update existing transactions easily
- **Delete Confirmation**: Confirmation dialog before deleting transactions

## 🛠️ Technology Stack

- **Frontend Framework**: Angular 20.3.0
- **Component Architecture**: Standalone components
- **Material UI**: Angular Material 21.0.1 + Angular CDK 21.0.1
- **Animations**: Angular Animations 21.0.1
- **Forms**: Reactive Forms with Form Validation
- **Styling**: Bootstrap 5.3.0 + Custom CSS with CSS Variables
- **Routing**: Angular Router with Lazy Loading
- **State Management**: RxJS Observables
- **HTTP Client**: Angular HTTP Client for API calls

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── add-expense/          # Add/Edit transaction component
│   │   ├── list-expense/         # Transaction list with filters
│   │   └── dashboard/            # Analytics and statistics
│   ├── services/
│   │   ├── expense.ts            # Expense service with API calls
│   │   └── category.ts           # Category service
│   ├── app.ts                    # Root component
│   ├── app-module.ts             # Module configuration
│   └── app-routing-module.ts     # Routing configuration
├── styles.css                    # Global styles (1846+ lines)
├── index.html                    # Entry point with Bootstrap CDN
└── main.ts                       # Angular bootstrap
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Angular CLI (optional but recommended)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd expense-tracker-frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm start
```

4. **Open in browser**

```
http://localhost:4200/
```

The application will automatically reload when you make changes to the source files.

## 📖 Usage Guide

### Adding a Transaction

1. Click "Add Transaction" button
2. Enter transaction details:
   - Type: Expense or Earning
   - Title: Transaction name
   - Category: Select or create a category
   - Quantity: Number of items
   - Unit: Measurement unit
   - Price: Price per unit
   - Date: Transaction date
3. Click "Add Expense" to save

### Editing a Transaction

1. Navigate to the Transactions list
2. Hover over a transaction to reveal action buttons
3. Click the edit (pencil) icon
4. Modify the transaction details
5. Click "Update Expense" to save changes

### Deleting a Transaction

1. Hover over a transaction in the list
2. Click the delete (trash) icon
3. Confirm the deletion when prompted

### Filtering Transactions

1. Use the search box to find transactions by title
2. Select a date range using the date picker
3. Filters auto-apply as you select
4. Click the refresh button to reset filters

### Viewing Dashboard

1. Click "Dashboard" button from the transaction list
2. View key metrics:
   - Total Earnings
   - Total Expenses
   - Net Income
   - Transaction breakdown by category
   - Visual charts and statistics

## 🎨 Design Features

### Color Scheme

- **Primary**: Blue (#2563eb)
- **Accent**: Purple (#a78bfa)
- **Success/Earning**: Green (#16a34a)
- **Danger/Expense**: Red (#dc2626)
- **Background**: Glassmorphic white with blur effect

### Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 768px
- **Desktop**: > 768px

### Accessibility

- ARIA labels on interactive elements
- Semantic HTML structure
- Keyboard navigation support
- High contrast color scheme

## 📦 Available Scripts

### Development

```bash
npm start          # Start development server
npm run watch      # Build with watch mode
npm run build      # Production build
npm test           # Run unit tests
```

### Build

```bash
npm run build      # Create production bundle
```

## 🔒 Data Storage

All transaction data is stored in the browser's localStorage. This means:

- Data persists between sessions
- No backend server required for basic functionality
- Data is private to your device
- Clearing browser data will delete all transactions

## 🎯 Key Components

### Add Expense Component

- Reactive form with validation
- Dynamic category selection
- Real-time total calculation
- Edit mode detection via route params

### List Expense Component

- Filterable transaction list
- Search functionality
- Date range picker
- Hover-reveal action buttons
- Statistics grid
- Empty state handling

### Dashboard Component

- Financial summary cards
- Category-wise breakdown
- Date range filtering
- Responsive statistics grid
- Visual analytics (ready for charts)

### Services

- **ExpenseService**: CRUD operations for transactions
- **CategoryService**: Category management for expenses and earnings

## 🚧 Future Enhancements

- [ ] Backend API integration
- [ ] User authentication
- [ ] Data export (CSV, PDF)
- [ ] Advanced charts and graphs
- [ ] Budget planning and alerts
- [ ] Recurring transactions
- [ ] Multi-currency support
- [ ] Dark mode theme
- [ ] Mobile app (React Native)

## 🐛 Troubleshooting

### Transactions not saving

- Check browser's localStorage is enabled
- Clear browser cache and try again

### Date picker not working

- Ensure Angular Material is properly imported
- Check browser console for errors

### Styling issues

- Clear browser cache
- Verify Bootstrap CDN is loaded
- Check CSS specificity conflicts

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Development

This project uses:

- **Angular CLI**: 20.3.3
- **TypeScript**: Strict mode enabled
- **ESBuild**: Fast bundling and compilation

For more information on Angular development, visit [Angular Documentation](https://angular.io/docs)

## 📞 Support

For issues, feature requests, or documentation improvements, please open an issue in the repository.

---

**Happy tracking! 💰📊**
