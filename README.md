#  Bank Management System

A full-stack banking management web application built with **Django REST Framework** and **React**. Manage customers, process transactions, and visualise financial data through an intuitive dashboard.

---

##  Screenshots

| Dashboard | Customers | Reports |
|-----------|-----------|---------|
| Stat cards, live charts, recent transactions | Full CRUD with deposit/withdraw actions | Monthly & quarterly breakdowns |

---

##  Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | Django 4.x + Django REST Framework |
| Auth | Token Authentication (`rest_framework.authtoken`) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| CORS | `django-cors-headers` |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Bootstrap Icons |
| Styling | Custom CSS (DM Sans + DM Mono) |

---

##  Project Structure

```
bank-system/
├── backend/
│   ├── banking/
│   │   ├── models.py          # User, Customer, Transaction, AccountSettings
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # ViewSets (Auth, User, Customer, Transaction, Settings)
│   │   └── urls.py            # API route registration
│   ├── bank_system/
│   │   ├── settings.py
│   │   └── urls.py
│   └── manage.py
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx   # Stat cards + 2 charts + recent transactions
    │   │   ├── Customers.jsx   # CRUD table + deposit/withdraw + transaction history
    │   │   ├── Reports.jsx     # Bar & line charts, top customers, transaction log
    │   │   ├── Analysis.jsx    # 3-tab deep analytics (Overview / Customers / Trends)
    │   │   ├── Profile.jsx
    │   │   └── Settings.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── CustomerModal.jsx
    │   ├── utils/
    │   │   ├── api.js          # Axios instance + pagination interceptor
    │   │   └── auth.js         # AuthContext + useAuth hook
    │   ├── main.css            # Full design system (CSS variables, components)
    │   └── App.jsx
    ├── index.html
    └── package.json
```

---

##  Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/bank-management-system.git
cd bank-management-system
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create a superuser (admin account)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Install chart library
npm install recharts

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

### 4. Environment / CORS

In `backend/bank_system/settings.py`, ensure CORS is configured to allow the frontend:

```python
INSTALLED_APPS = [
    ...
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'banking',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}
```

---

##  API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Register a new user |
| `POST` | `/api/auth/login/`    | Login and receive token |
| `POST` | `/api/auth/logout/`   | Invalidate token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET / PUT` | `/api/users/profile/` | Get or update current user profile |
| `POST` | `/api/users/change_password/` | Change password |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/customers/`              | List all customers |
| `POST`   | `/api/customers/`              | Create a customer |
| `GET`    | `/api/customers/{id}/`         | Get customer detail |
| `PUT`    | `/api/customers/{id}/`         | Update customer |
| `DELETE` | `/api/customers/{id}/`         | Delete customer |
| `POST`   | `/api/customers/{id}/deposit/`  | Deposit funds |
| `POST`   | `/api/customers/{id}/withdraw/` | Withdraw funds |
| `GET`    | `/api/customers/{id}/transactions/` | Customer transaction history |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions/` | List all transactions (read-only) |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET / PUT` | `/api/settings/account_settings/` | Get or update account settings |

> All endpoints except `/auth/login/` and `/auth/register/` require the `Authorization: Token <token>` header.

---

##  Features

- **Authentication** — Register, login, logout with token-based auth. Role-based access (admin vs staff).
- **Dashboard** — Live stat cards (customers, total balance, transaction count), monthly bar chart, 14-day volume area chart, recent transactions table.
- **Customer Management** — Full CRUD, auto-generated customer ID and account number, deposit/withdraw actions, per-customer transaction history modal.
- **Reports** — Period selector (monthly/quarterly/yearly), KPI summary row, deposit vs withdrawal bar chart, net cash flow line chart, top customers table.
- **Analysis** — Three-tab analytics: transaction type pie chart, balance distribution, account type breakdown, customer status donut, cumulative growth area chart, 30-day daily trend.
- **Responsive UI** — Collapsible sidebar, mobile-first layout, works on all screen sizes.
- **Pagination handled automatically** — Axios interceptor unwraps DRF paginated responses so every component receives a plain array.

---

##  Known Issues Fixed

| Bug | Fix |
|-----|-----|
| `customersRes.data.reduce is not a function` | DRF returns `{ results: [] }` — Axios interceptor in `api.js` now auto-unwraps `.results` |
| `NameError: name 'deposit' is not defined` | f-string referenced undefined variable — changed to string literal `"TXNDEP"` |
| `NameError: name 'withdrawal' is not defined` | Same fix — changed to `"TXNWDR"` |

---

##  Deployment Notes

- Set `DEBUG = False` and configure `ALLOWED_HOSTS` in Django settings for production.
- Use PostgreSQL instead of SQLite for production databases.
- Serve the React build (`npm run build`) via Nginx or a static hosting service (Vercel, Netlify).
- Store the Django secret key and database credentials in environment variables, never in source code.

---

##  License

MIT License — free to use and modify.