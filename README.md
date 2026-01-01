# CollegeWayfarer 🎓



CollegeWayfarer is a full-stack web application designed to streamline the college application process. It provides a comprehensive platform for students, parents, and counselors, leveraging modern web technologies to offer robust tools and resources for managing college exploration, applications, and guidance.

~~**Live Application:** [https://collegewayfarer.replit.app](https://collegewayfarer.replit.app)~~

> **Update:** CollegeWayfarer has been sunsetted. A museum of it is deployed here:
> # [→ Open Demo Site](https://maximilianromer.github.io/CollegeWayfarer)

## Project Overview

The college application process presents numerous data management, workflow, and communication challenges. CollegeWayfarer addresses these by providing a centralized, feature-rich platform. It's architected to support various user roles (students, parents, counselors) with distinct functionalities, aiming to enhance organization, data accessibility, and efficiency throughout the application lifecycle.

Key technical goals and solutions include:
* **College Data Aggregation & Search:** Implements efficient data retrieval and filtering mechanisms for an extensive college database.
* **User-Specific Data Management:** Features a personalized dashboard for tracking application progress, deadlines, and tasks, backed by a robust relational data model.
* **Integrated AI Chatbot:** Leverages the **Google Gemini API**, primarily using the **Gemini 2.0 Flash** model for real-time query resolution and guidance. When the Extended Reasoning feature is enabled, **Gemini 2.5 Flash** is used. When the Search feature is enabled, **Google Gemini's Search Grounding API** is used for information retrieval.
* **Advisor Interaction Module:** Users can create sharable UUID links to give advisors access to their current application status.
* **Security & Data Integrity:** Employs industry-standard security practices, input validation, and ORM-level safeguards to ensure user privacy and data accuracy.

## Tech Stack

CollegeWayfarer is architected using a modern, scalable, and type-safe technology stack:

* **Frontend:**
    * [React](https://reactjs.org/): Core library for building the component-based user interface.
    * [Vite](https://vitejs.dev/): High-performance build tool and development server.
    * [TypeScript](https://www.typescriptlang.org/): Enforces static typing for improved code quality and maintainability.
    * [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework for rapid and consistent styling.
    * [shadcn/ui](https://ui.shadcn.com/): Collection of re-usable, accessible UI components built on Radix UI and Tailwind CSS.
    * [Tanstack Query](https://tanstack.com/query/latest): Handles server-state management, including data fetching, caching, and synchronization.
    * [React Router](https://reactrouter.com/): Manages client-side routing and navigation.

* **Backend:**
    * [Node.js](https://nodejs.org/): JavaScript runtime environment for the server.
    * [TypeScript](https://www.typescriptlang.org/): Ensures type safety and improves developer experience on the backend.
    * [Drizzle ORM](https://orm.drizzle.team/): A TypeScript-first ORM for interacting with the SQL database, providing type-safe queries.
    * [PostgreSQL](https://www.postgresql.org/): Robust and scalable SQL database. The live application uses Neon Postgres.
    * **Google Gemini API:**
        * **Gemini 2.0 Flash:** Primary model for standard chat interactions and AI assistance.
        * **Gemini 2.5 Flash:** Utilized for Extended thinking mode.
        * **Search Grounding API:** Powers the Search mode for grounded, factual responses.

* **Database Schema Management:**
    * [Drizzle Kit](https://orm.drizzle.team/kit/overview): Utilized for database schema migrations and management, as indicated by `drizzle.config.ts`.

## Project Structure

The monorepo is organized to separate concerns and facilitate independent development where possible:

* `client/`: Frontend React application (Vite + TypeScript).
    * `src/`:
        * `components/`: Shared and atomic UI components.
            * `ui/`: Components sourced or adapted from `shadcn/ui`.
        * `hooks/`: Custom React hooks encapsulating reusable logic.
        * `lib/`: Client-side utility functions, API client instances (`advisorApi.ts`, `chatApi.ts`), and `queryClient.ts` for React Query.
        * `pages/`: Top-level route components representing distinct views of the application.
        * `App.tsx`: Root application component orchestrating layout and routing.
        * `main.tsx`: Client application entry point.
* `server/`: Backend API (Node.js + Hono/Express + TypeScript).
    * `auth.ts`: Authentication middleware and strategy.
    * `db.ts`: Database connection setup and Drizzle ORM instance.
    * `index.ts`: Backend server entry point and middleware configuration.
    * `routes.ts`: API route definitions and handlers.
    * `storage.ts`: File storage service integration.
* `shared/`: TypeScript types, interfaces, and Zod schemas (`schema.ts`) used by both client and server to ensure data consistency.
* `public/`: Static assets served by the client application.

## Getting Started

To set up a local development environment:

### Prerequisites

* Node.js (v18 or newer recommended)
* npm (v8 or newer recommended, bundled with Node.js)
* A running PostgreSQL instance.
* Git

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/maximilianromer/CollegeWayfarer.git](https://github.com/maximilianromer/CollegeWayfarer.git)
    cd CollegeWayfarer
    ```

2.  **Install dependencies:**
    The project appears to use a single root `package.json`.
    ```sh
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `server/` directory. Populate it with necessary credentials and configuration:
    * `DATABASE_URL`: Connection string for your PostgreSQL instance.
    * Cloud storage service (e.g., S3, R2) credentials and bucket information.
    * **`GEMINI_API_KEY`**: Your API key for the Google Gemini API.
    * Any other relevant API keys or service endpoints.

4.  **Database Migration:**
    Apply database schema migrations using Drizzle Kit. Scripts are typically defined in `package.json`:
    ```sh
    npm run db:migrate
    ```

5.  **Run Development Servers:**
    Execute the development script from `package.json` to start both frontend and backend servers concurrently.
    ```sh
    npm run dev
    ```
    This will typically launch:
    * Backend API server (e.g., on `http://localhost:3000`)
    * Frontend Vite development server (e.g., on `http://localhost:5173`)

*Note: This app is built using the Replit IDE, and contains files instructing Replit how to run it.*

## Core Technical Features

* **User Authentication & Authorization:** Robust system for user registration, login, and session management, supporting distinct roles (student, parent, counselor) with appropriate permissions.
* **Onboarding Workflow:** Multi-step, guided process for new user registration, collecting essential profile data and preferences, persisted to the PostgreSQL database via Drizzle ORM.
* **Interactive Dashboard:** Centralized, role-specific dashboard providing data visualization and management tools for the college application process.
    * **Profile Sub-System:** Comprehensive module for CRUD operations on user profiles, including academic records, extracurriculars, and personal tastes.
    * **College List Management:** Dynamic creation and management of college lists, with features for tracking application plan.
* **Chat System:**
    * **AI-Powered Assistance:** Integration with the **Google Gemini API**.
        * **Gemini 2.0 Flash:** Used for standard automated responses to common queries and personalized guidance.
        * **Gemini 2.5 Flash:** Utilized for Extended thinking mode.
        * **Search Grounding API:** Powers the Search mode for grounded, factual responses.
    * **Transcript Management:** Features for saving, reviewing, or sharing chat interactions.
* **Dynamic Information Rendering:** Data-driven pages for displaying detailed college and advisor profiles, fetched from the backend API.
* **Secure File Handling:** System for uploading, storing, and managing application-related documents with appropriate access controls.
* **Data Sharing & Permissions:** Granular control over sharing user profiles or specific data points with other users or roles.
* **Responsive UI/UX:** Frontend architected with React and styled with Tailwind CSS for a fully responsive and accessible experience. Utilizes `shadcn/ui` for a consistent and modern component library, ensuring adaptability across devices.

## Contributing

Contributions are pivotal to the open-source ecosystem. We encourage and appreciate any contributions to enhance CollegeWayfarer.

To contribute:
1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/YourAmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add YourAmazingFeature'`).
4.  Push to the Branch (`git push origin feature/YourAmazingFeature`).
5.  Open a Pull Request against the `main` or `develop` branch.

Please ensure your code adheres to the existing style and all tests pass. For significant changes, please open an issue first to discuss what you would like to change.

## License

Distributed under the MIT License. See the `LICENSE` file for more information.

## Acknowledgements 
We would like to thank:

 1. **Replit** for their wonderful AI agent
 2. **Google** for their generous free Gemini API for developers
 3. **Neon** for their Postgres database solution
 4. **Anthropic** for their Claude models, which significantly helped with the debugging process.

---

We hope CollegeWayfarer serves as a valuable tool and a solid foundation for the future of AI-enabled personal software!
