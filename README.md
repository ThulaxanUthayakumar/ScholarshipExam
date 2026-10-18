# Scholarship Exam Platform

A Tamil-medium practice platform for Sri Lankan Grade 5 scholarship students, built with React and ASP.NET Core.

Students can complete timed papers, view their results, and review answer explanations. Parents can follow their children’s progress, while administrators manage exams and payment approvals.

## Features

- Five original practice papers
- 40 multiple-choice questions per paper
- One-hour timer with automatic submission
- Saved answers and resumable active attempts
- Automatic marking out of 100
- Results, answer explanations, and achievement badges
- Separate student, parent, and administrator access
- Manual payment verification and exam access management

## Technology

- Frontend: React, Vite, Tailwind CSS
- Backend: ASP.NET Core Web API, C#
- Authentication: ASP.NET Core Identity
- Database: SQLite for local development; PostgreSQL configuration for deployment
- Testing: xUnit and Vitest

## Run Locally

Install the .NET 10 SDK and Node.js 24.

Run the following commands from the project root.

### Backend

For the first run, set your administrator credentials in PowerShell:

    $env:Bootstrap__Email = Read-Host "Admin email"
    $password = Read-Host "Admin password" -AsSecureString
    $env:Bootstrap__Password = [System.Net.NetworkCredential]::new("", $password).Password

Use a password with at least 10 characters, including uppercase and lowercase letters, a number, and a symbol.

Then start the backend:

    dotnet restore backend/ScholarshipExam.sln
    dotnet run --project backend/ScholarshipExam.Api --launch-profile http

The local database and draft practice papers are created automatically.

### Frontend

Open a second terminal in the project root:

    cd frontend
    npm ci
    npm run dev

Open http://localhost:5173 in your browser.

## Initial Setup

Sign in using the administrator account created during the first run.

Review the questions and publish all five papers before accepting payment requests. Configure the payment instructions in the administration settings.

The practice papers are original drafts and need teacher review before use with students. They are not official examination papers.

## Project Structure

    backend/     API, business logic, database access, and tests
    frontend/    React application
    data/        Exam import data
    papers/      Printable papers and answer sheets
    docs/        Architecture, API, database, and deployment documentation

## Tests

Backend:

    dotnet test backend/ScholarshipExam.sln

Frontend:

    cd frontend
    npm test -- --run

## Project Status

Local development workflows have been tested. Payments require manual administrator approval.

Before a public launch, review the educational content and policies, configure hosting and HTTPS, and validate the PostgreSQL deployment.
