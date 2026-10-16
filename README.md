# Full-Stack Pizza Delivery Demo Sandbox

An interactive full-stack web application featuring decoupled architecture, asynchronous server-side state persistence, and real-time bi-directional pipeline communication. This system functions as a portfolio engineering demonstration and does not process actual financial payments or retain real-world courier tracking.

🔗 **Live Production Deployment:** [https://pizza.jpwillenborg.com/](https://pizza.jpwillenborg.com/)

🏗️ System Architecture & Engineering
The application is structured into two entirely separate modules to preserve structural boundary isolation:

* **Frontend Client (pizza-client):** A Single Page Application (SPA) built with React and compiled via Vite. Rendered assets are hosted on an Apache production server utilizing an absolute base path model (/). Internal layouts rely on Tailwind CSS for fluid, mobile-first breakpoints.
* **Backend Server (pizza-server):** A RESTful Node.js environment utilizing the Express framework. The API manages pricing calculations server-side to prevent client-side intercept tampering, interfaces directly with a remote relational database or an adaptive in-memory datastore, and exposes structured endpoints over CORS-whitelisted routes.

⚡ Core Technical Features
* **Real-Time Subsystem Updates:** Employs Socket.IO to open a live websocket communication pipe between client layouts and the server environment, driving instantaneous kitchen workflow transitions without polling overhead.
* **Decoupled State Isolation:** Leverages localized browser session cache namespaces (pizza-demo-sandbox) to sandbox state management, ensuring application runtime tokens remain unaffected during domain transitions.
* **Server-Side Validation Security:** All order computations, price checking, and product parameter assertions are handled within isolated backend controllers prior to persistence layers.
* **Adaptive Datastore Engine:** Built-in structural runtime switch that transparently hooks into live relational tables or handles mock records safely using virtual memory buffers based on environmental configurations.

🛠️ Stack Configuration & Primitives
* **Frontend UI:** React, Vite, Tailwind CSS, JavaScript (ES6+)
* **Backend API:** Node.js, Express API Engine, Socket.IO WebSockets
* **Database / Persistence Layer:** MySQL Relational Storage Engine (Production) / V8 In-Memory Object Datastores (Sandbox Mode)
* **Live Infrastructure Hosting:** Apache Linux Server (Static Frontend Assets), Render Web Service Containers (Backend Node Service)

---

## 💻 Local Development Setup

The application features a hybrid data architecture. By default, it operates in **Sandbox Mode** using virtualized database arrays, allowing reviewers to evaluate runtime engines immediately without configuring a local SQL instance. To see the live pipeline connected to the production database cluster, visit [https://pizza.jpwillenborg.com/](https://pizza.jpwillenborg.com/).

### 1. Backend API Setup
Navigate to the server directory, install dependencies, map local keys, and execute the runtime listener:

```bash
cd pizza-server
npm install
```

Configure a `.env` resource sheet within the server root directory. To run using the instant local memory datastore, set `DB_MODE` to `mock`:

```env
DB_MODE=mock
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

*(Optional)* To connect to a live relational database cluster, switch `DB_MODE` to `mysql` and supply target credentials:

```env
DB_MODE=mysql
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_DATABASE=pizza_sandbox
```

Start the local server pipeline:

```bash
npm run dev
```

### 2. Frontend Client Setup
Navigate to the client directory, install assets, bind development variables, and execute Vite:

```bash
cd ../pizza-client
npm install
```

Configure a local environment layout inside a `.env` file at the client root:

```env
VITE_PORTFOLIO_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:5000
```

Launch the development web server:

```bash
npm run dev
```
