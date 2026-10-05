# Full-Stack Pizza Delivery Demo Sandbox

An interactive full-stack web application featuring decoupled architecture, asynchronous server-side state persistence, and real-time bi-directional pipeline communication. This system functions as a portfolio engineering demonstration and does not process actual financial payments or retain real-world courier tracking.

## 🏗️ System Architecture & Engineering

The application is structured into two entirely separate modules to preserve structural boundary isolation:

*   **Frontend Client (`pizza-client`):** A Single Page Application (SPA) built with React and compiled via Vite. Rendered assets are hosted on an Apache production server utilizing an absolute base path model (`/`). Internal layouts rely on Tailwind CSS for fluid, mobile-first breakpoints.
*   **Backend Server (`pizza-server`):** A RESTful Node.js environment utilizing the Express framework. The API manages pricing calculations server-side to prevent client-side intercept tampering, interfaces directly with a remote relational database, and exposes structured endpoints over CORS-whitelisted routes.

## ⚡ Core Technical Features

*   **Real-Time Subsystem Updates:** Employs Socket.IO to open a live websocket communication pipe between client layouts and the server environment, driving instantaneous kitchen workflow transitions without polling overhead.
*   **Decoupled State Isolation:** Leverages localized browser session cache namespaces (`pizza-demo-sandbox`) to sandbox state management, ensuring application runtime tokens remain unaffected during domain transitions.
*   **Server-Side Validation Security:** All order computations, price checking, and product parameter assertions are handled within isolated backend controllers prior to persistence layers.

## 🛠️ Stack Configuration & Primitives

*   **Frontend UI:** React, Vite, Tailwind CSS, JavaScript (ES6+), WebSocket Clients
*   **Backend API:** Node.js, Express API Engine, Socket.IO WebSockets
*   **Database Persistent Layer:** MySQL Relational Storage Engine
*   **Live Infrastructure Hosting:** Apache Linux Server (Static Frontend Assets), Render Web Service Containers (Backend Node Service)

---

## 💻 Local Development Setup

### 1. Database Initialization
Execute the SQL creation schema inside a running relational database server to instantiate target table constraints:
```sql
CREATE DATABASE IF NOT EXISTS pizza_sandbox;
USE pizza_sandbox;
```

### 2. Backend API Setup
Navigate to the server directory, install dependencies, map local keys, and execute the runtime listener:
```bash
cd pizza-server
npm install
```
Configure a `.env` resource sheet within the server root directory:
```text
PORT=5000
DATABASE_URL=mysql://user:password@localhost:3306/pizza_sandbox
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```
Start the local server pipeline:
```bash
npm run start
```

### 3. Frontend Client Setup
Navigate to the client directory, install assets, bind development variables, and execute Vite:
```bash
cd pizza-client
npm install
```
Configure a local environment layout inside a `.env` file at the client root:
```text
VITE_PORTFOLIO_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000
```
Launch the development web server:
```bash
npm run dev
```
