# IntelliInspect

A real-time predictive quality control system designed to analyze sensor data and simulate production line performance using machine learning.

---

## Project Overview

IntelliInspect is a full-stack application built for the ABB IntelliInspect Hackathon. It leverages a Dockerized microservice architecture for seamless deployment and communication across components.

---

## Tech Stack

- **Frontend**: Angular v18
- **Backend**: ASP.NET Core 8
- **ML Microservice**: Python + FastAPI (with XGBoost)
- **Data Format**: Apache Parquet
- **Live Updates**: SignalR
- **Deployment**: Docker, Docker Compose

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/CrayonHari/ABB_project
```

### 2. Prerequisites

Ensure you have the following installed:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### 3. Run the Application

```bash
docker-compose up --build
```

This will build and launch:
- The Angular frontend on port `8080`
- The .NET backend on port `8081`
- The Python ML microservice on port `8000`

> Access the app by navigating to `http://localhost:8081`

---

## Folder Structure

```
frontend/         # Angular UI
backend/
    -production-backend # ASP.NET Core 8 API
    -ml-service/       # FastAPI ML Microservice
docker-compose.yml
```

---

## Features

- Upload CSV production data and convert to Parquet
- Validate training/testing/simulation periods
- Train a predictive ML model (XGBoost)
- View real-time simulation results
- Monitor predictions and confidence scores live

---

## License

MIT License © 2025 Team IntelliInspect
