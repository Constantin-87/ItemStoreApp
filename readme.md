# **Item Store Management System** _(Insecure Version)_

This branch contains the **insecure implementation** of the **Item Store Management System**. It is designed to demonstrate common vulnerabilities, including **SQL Injection**, **XSS (Cross-Site Scripting)**, and **Sensitive Data Exposure**, as part of my secure application development project.

---

## **Table of Contents**

- [📋 Features](#-features)
- [⚙️ Setup Instructions](#%EF%B8%8F-setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Clone and Install](#clone-and-install)
- [🚀 Running the Application](#-running-the-application)
- [⚠️ Known Vulnerabilities](#️-known-vulnerabilities)
- [❗ Disclaimer](#-disclaimer)

---

## 📋 **Features**

### **User Management**

- User registration and login.
- Account locking after 5 failed login attempts.

### **Inventory Management**

- Add, edit, delete, and search for items in inventory.

### **Administrator Features**

- Lock, unlock, or delete user accounts.

---

## ⚙️ **Setup Instructions**

### **Prerequisites**

Ensure you have the following installed:

- **Node.js** (v16 or later)
- **SQLite3**
- **Git**

### **Clone and Install**

1. Clone the repository:

   ```bash
   git clone https://github.com/Constantin-87/ItemStoreApp.git
   ```

2. Navigate to the project directory:

   ```bash
   cd ItemStoreApp
   ```

3. Switch to the insecure branch:

   ```bash
   git checkout Insecure
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

### **Note on .env File**

The `.env` file is included in this branch for demonstration purposes, but **this is not a good security practice**. In a secure implementation, sensitive files like `.env` should be excluded from version control (e.g., using `.gitignore`).

---

## 🚀 **Running the Application**

1. Start the application:

   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```arduino
   http://localhost:3000
   ```

---

## ⚠️ **Known Vulnerabilities**

This branch intentionally includes the following vulnerabilities:

- **SQL Injection:** Unsanitized input in database queries.
- **Cross-Site Scripting (XSS):** User input is rendered without proper encoding.
- **Sensitive Data Exposure:** Passwords are stored in plaintext.
- **No Security Headers:** Missing headers to prevent web-based attacks.

---

## ❗ **Disclaimer**

This branch is intentionally insecure and should only be used for **educational purposes**. DO NOT deploy this branch in production. For a secure implementation, switch to the **secure branch**.
