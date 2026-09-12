# CV Genius

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Python](https://img.shields.io/badge/Python-3.12-yellow?logo=python)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-DB_%26_Auth-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## What the project does

**CV Genius** is a ATS-optimized Resume/CV builder and parser platform. It allows job seekers to upload their existing CVs in PDF format, accurately extracts their experiences and skills using a robust Python-based AWS Lambda backend, and then reconstructs, enhances, and manages the content using AI (Google Gemini) and a sleek React frontend. 

## Why the project is useful

Building an ATS-friendly resume from scratch can be tedious. CV Genius solves this by automating the data extraction and enhancement processes.

### Key Features & Benefits
- **Intelligent PDF Parsing:** Features a custom Python-based parser (`scripts/pdf_parser_improved.py`) leveraging PyMuPDF and heuristics to extract experiences, education, and skills flawlessly in both English and French.
- **AI-Powered Enhancements:** Integrates directly with the Google Gemini API to intelligently rewrite bullet points, suggest keywords, and optimize your CV for applicant tracking systems.
- **Modern, Responsive UI:** Built on Next.js and TailwindCSS, offering a highly responsive and interactive user experience.
- **Secure & Cloud-Ready:** Authentication and PostgreSQL database powered by Supabase, with a backend architecture prepared for AWS Lambda deployments.
- **Extensive Test Coverage:** Comes pre-configured with Jest for unit testing and Playwright for robust end-to-end (E2E) UI testing.

## How users can get started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.9 - v3.12, for local parser testing)
- A [Supabase](https://supabase.com/) account and project
- A [Google Gemini API Key](https://makersuite.google.com/app/apikey)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/cv-genius.git
   cd cv-genius
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Set up the Python Environment (Required for PDF Parsing):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   pip install -r scripts/requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env.local` file in the root directory based on the `.env.test` file and add your actual API keys:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Gemini API Configuration  
   GEMINI_API_KEY=your-gemini-api-key
   
   # Next.js Configuration
   NEXTAUTH_SECRET=your-next-auth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Usage Example

To test the ATS parser locally through the CLI without launching the web app:
```bash
source venv/bin/activate
python scripts/pdf_parser_improved.py path/to/your/cv.pdf --output result.json
```

## Where users can get help

- **Documentation:** Review our [Architecture Guide](docs/guide_archi.md) and [Deployment Plan](docs/deploy-plan.md) in the `docs/` folder.
- **Issues:** If you find a bug or want to request a feature, please [open an issue](../../issues) on GitHub.
- **Discussions:** Have a question or want to share how you're using CV Genius? Join our [GitHub Discussions](../../discussions).

## Who maintains and contributes

**Maintainer:** This project is actively maintained by the owner (@charlottenguyen05)

**Contributing:** We welcome contributions of all kinds—whether it's writing code, fixing typos, adding tests, or improving documentation. 

To start contributing:
1. Fork this repository.
2. Create a new branch: `git checkout -b feature/my-new-feature`
3. Make your changes and commit them: `git commit -m "Add some feature"`
4. Run tests to ensure everything is stable:
   - `npm run test:coverage` (Unit tests)
   - `npm run test:e2e` (Playwright E2E tests)
5. Push to the branch: `git push origin feature/my-new-feature`
6. Open a Pull Request.

Please follow our architectural guidelines detailed in the [docs/](docs/) directory when making significant structural changes.
