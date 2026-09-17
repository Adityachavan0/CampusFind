# 🎓 CampusFind – Campus Lost & Found Portal

CampusFind is a web-based **Lost & Found Management System** designed for colleges and universities. It provides a centralized platform where students and staff can report lost items, register found items, search for items, and request recovery.

The main goal of CampusFind is to make the process of finding and recovering lost belongings inside a campus simple, organized, and secure.

---

## 🚀 Features

### 👤 User Features

* User Registration and Login
* User Profile Management
* Report Lost Items
* Report Found Items
* Upload Item Images
* Search Lost & Found Items
* View Item Details
* Filter Items
* Send Recovery Requests
* Track Recovery Requests
* Mark Items as Recovered
* View Leaderboard

### 👨‍💼 Admin Features

* Admin Dashboard
* Manage Users
* Manage Lost & Found Items
* View Recovery Requests
* Manage Reports
* Approve or Reject Items
* Monitor CampusFind activities

### 🔐 Security

* User authentication
* Role-based access
* Database security using Row Level Security (RLS)
* Protected administrative functionality
* Secure handling of application credentials

---

## 🛠️ Technologies Used

| Technology | Purpose                              |
| ---------- | ------------------------------------ |
| HTML5      | Website structure                    |
| CSS3       | Styling and responsive design        |
| JavaScript | Frontend functionality               |
| Bootstrap  | UI components and responsive layout  |
| Supabase   | Authentication, database and storage |
| PostgreSQL | Database                             |
| Git        | Version control                      |
| GitHub     | Source code hosting                  |

---

## 📂 Project Structure

```text
CampusFind/
│
├── css/
│   └── style.css
│
├── js/
│   ├── admin.js
│   ├── admin-items.js
│   ├── admin-recoveries.js
│   ├── admin-reports.js
│   ├── admin-users.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── found-item.js
│   ├── item-details.js
│   ├── items.js
│   ├── leaderboard.js
│   ├── login.js
│   ├── lost-item.js
│   └── register.js
│
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── items.html
├── lost-item.html
├── found-item.html
├── item-details.html
├── leaderboard.html
│
├── admin.html
├── admin-items.html
├── admin-recoveries.html
├── admin-reports.html
└── admin-users.html
```

---

## 🔄 How CampusFind Works

```text
User
 │
 ├── Register / Login
 │
 ├── Report Lost Item
 │
 ├── Report Found Item
 │
 ├── Search Items
 │
 ├── View Item Details
 │
 └── Request Recovery
          │
          ▼
    Item Owner / Finder
          │
          ▼
    Recovery Process
          │
          ▼
       Recovered
```

---

## 👨‍🎓 Lost Item Process

1. User logs into CampusFind.
2. User reports a lost item.
3. Item details are stored in the database.
4. Other users can view and search the item.
5. If someone finds the item, they can report it.
6. The system helps connect the lost item with the found item.
7. The owner can submit a recovery request.
8. The recovery request is processed.
9. The item can be marked as **Recovered**.

---

## 📦 Found Item Process

1. User logs into CampusFind.
2. User selects **Report Found Item**.
3. User enters item details.
4. User can upload an image.
5. The found item is added to the system.
6. Other users can search for their lost belongings.
7. The owner can request recovery.
8. The finder/admin can process the request.

---

## 👨‍💼 Admin Panel

The admin panel provides management functionality for:

* Users
* Lost Items
* Found Items
* Recovery Requests
* Reports

Admins can monitor the platform and manage inappropriate or invalid records.

---

## 🗄️ Database

CampusFind uses **Supabase PostgreSQL** for storing application data.

The database can contain information such as:

* User profiles
* Lost items
* Found items
* Recovery requests
* Reports
* Item images
* User points / leaderboard information

Row Level Security (**RLS**) policies are used to control which users can access or modify specific records.

---

## 🔐 Environment & Security

Do **not** commit private credentials to GitHub.

Never upload:

```text
.env
.env.local
service-role keys
secret API keys
database passwords
private credentials
```

If credentials are required for deployment, configure them through the deployment platform's environment-variable settings.

> **Note:** Frontend applications should never contain Supabase service-role/secret keys.

---

## 💻 Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Adityachavan0/CampusFind.git
```

### 2. Open the project

```bash
cd CampusFind
```

### 3. Run the project

Because CampusFind is a frontend web application, you can run it using a local development server.

For example, using VS Code:

```text
Right Click → Open with Live Server
```

Then open the local URL provided by Live Server.

---

## 🔧 Future Development

Possible future improvements include:

* 🔔 Real-time notifications
* 📧 Email notifications
* 📱 Mobile application
* 🤖 Smart lost/found item matching
* 📍 Campus map integration
* 💬 User-to-user messaging
* 📊 Advanced admin analytics
* 🏆 Improved reward system
* 🔍 Advanced search and filtering

---

## 🎯 Project Objective

The objective of CampusFind is to provide a **centralized, easy-to-use and organized platform** for managing lost and found items within a college campus.

Instead of depending on notice boards, WhatsApp groups, or word of mouth, users can use one platform to report, search, and recover their belongings.

---

## 👨‍💻 Developer

**Aditya Chavan**

GitHub:
https://github.com/Adityachavan0

---

## 📄 License

This project is created for **educational and academic purposes**.

---

⭐ If you find this project useful, consider giving the repository a star!
