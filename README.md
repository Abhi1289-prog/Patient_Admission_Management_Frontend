# Patient Admission Management App – Backend

REST API for managing hospital patient admissions, ward/department/doctor assignments, search, filtering, and discharges.

## Live Links
- **Live Frontend App:** `<YOUR_VERCEL_OR_NETLIFY_URL>`
- **Live Backend API:** `<YOUR_RENDER_URL>/api/patients`

> **Note:** The backend is hosted on Render's free tier, so the first request after inactivity may take ~30–50 seconds to wake up.

## Tech Stack
- **Language & Framework:** Java 21, Spring Boot 3
- **Web & Validation:** Spring Web, Spring Boot Starter Validation (`jakarta.validation`)
- **Data Access:** Spring Data JPA (Hibernate, `JpaSpecificationExecutor`, `@EntityGraph`)
- **Database:** PostgreSQL (Supabase)
- **Containerization:** Docker (Multi-stage build)

## Project Structure (Package-by-Feature)
```text
src/main/java/com/dscribe/admission/
├── config/          # CORS configuration
├── exception/       # GlobalExceptionHandler & custom exceptions
├── lookup/          # Ward, Department, Doctor master tables, Enums & DataSeeder
└── patient/         # Patient entity, DTOs, Specifications, Repository, Service & Controller