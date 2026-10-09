# GuideMeThrough

**A guided digital platform designed to help users navigate their journey with clarity, structure, and confidence.**

## Overview

GuideMeThrough is a web application focused on making information and guidance easier to access through a user-friendly digital experience. The project combines modern frontend technologies with backend services to support an interactive, scalable, and maintainable platform.

**Live Website:** https://www.guidemethrough.org
**GitHub Repository:** https://github.com/sddeshai-cpu/guidemethrough

## Features

* **User-friendly interface** — A modern, responsive experience designed for easy navigation.
* **Interactive components** — Reusable UI elements for a consistent user experience.
* **Modern web architecture** — Built with React, TypeScript, and TanStack tools.
* **Backend integration** — Supabase integration for supported backend and data services.
* **AI integration support** — AI SDK dependencies are available for AI-powered functionality.
* **Scalable development** — A modular codebase designed to support future improvements.

*Note: The features listed above describe the project's technology and intended capabilities. Actual functionality depends on the implementation in the source code.*

## Tech Stack

| Technology         | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| React 19           | Building interactive user interfaces               |
| TypeScript         | Type-safe JavaScript development                   |
| Vite 7             | Development server and build tooling               |
| TanStack Start     | Application framework and server-side capabilities |
| TanStack Router    | Type-safe application routing                      |
| TanStack Query     | Server-state and data-fetching management          |
| Tailwind CSS 4     | Utility-first styling                              |
| Radix UI           | Accessible UI primitives                           |
| Supabase           | Backend services and data integration              |
| AI SDK             | AI application integration                         |
| Bun                | Dependency management and project scripts          |
| ESLint             | Code quality and linting                           |
| Prettier           | Code formatting                                    |
| Cloudflare tooling | Deployment and platform integration support        |

## Prerequisites

Before running the project locally, install:

* [Git](https://git-scm.com/)
* [Bun](https://bun.sh/)
* A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

You may also need Supabase credentials and AI service credentials, depending on the features you want to run.

## Project Setup

### 1. Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/sddeshai-cpu/guidemethrough.git
cd guidemethrough
```

### 2. Install dependencies

Install Bun if you have not already done so, then run:

```bash
bun install
```

This installs the dependencies defined in `package.json` using the project's Bun lockfile.

### 3. Configure environment variables

Create a local `.env` file if one is not already present. Add the environment variables required by the application.

For example, a Supabase integration may require:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_key
```

These names are examples; confirm the exact variable names used by the project's source code before running the application. AI integrations may also require provider-specific credentials.

**Security:** Never commit real API keys, private credentials, or service-role keys to GitHub. Keep secrets out of client-side environment variables and use server-side configuration for private credentials.

### 4. Start the development server

Run:

```bash
bun run dev
```

Open the local URL displayed in the terminal to access the application.

### 5. Build for production

To create a production build, run:

```bash
bun run build
```

To preview the production build locally, run:

```bash
bun run preview
```

## Available Commands

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `bun install`       | Install project dependencies         |
| `bun run dev`       | Start the development server         |
| `bun run build`     | Build the application for production |
| `bun run build:dev` | Create a development-mode build      |
| `bun run preview`   | Preview the production build         |
| `bun run lint`      | Check code using ESLint              |
| `bun run format`    | Format project files using Prettier  |

## Project Structure

The repository contains the following main directories and configuration files:

```text
guidemethrough/
├── public/           # Static assets
├── src/              # Application source code
├── supabase/         # Supabase-related files
├── .lovable/         # Lovable-related configuration
├── package.json      # Dependencies and scripts
├── bun.lock          # Locked dependency versions
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript configuration
├── eslint.config.js  # ESLint configuration
└── wrangler.jsonc    # Cloudflare Wrangler configuration
```

The structure above highlights the main repository entries; additional files and subdirectories may exist.

## Backend and External Services

GuideMeThrough includes Supabase and AI SDK dependencies. To run functionality that relies on external services:

1. Configure the required service credentials.
2. Set up the corresponding backend resources.
3. Verify database access policies and authentication settings, where applicable.
4. Configure any required AI provider or deployment settings.
5. Test the relevant functionality locally before deploying.

Refer to the source code and service configuration for the exact setup required by each integration.

## Development Guidelines

Contributions and improvements should follow these practices:

* Use TypeScript for application code.
* Keep components modular and reusable.
* Follow the existing project structure and coding conventions.
* Run linting before submitting changes.
* Avoid committing credentials or other sensitive configuration.
* Test important user flows after making changes.

Before submitting a pull request, run:

```bash
bun run lint
bun run build
```

## Future Improvements

Potential areas for future development include:

* Enhancing personalization and guided user journeys.
* Expanding AI-powered guidance where appropriate.
* Improving accessibility and mobile responsiveness.
* Strengthening error handling and application security.
* Adding automated tests and continuous integration.
* Improving deployment monitoring and performance.

## License

No license information has been confirmed in this README. Specify the project's license after adding the appropriate `LICENSE` file to the repository.

---

**Built with modern web technologies to make guided digital experiences more accessible and intuitive.**
