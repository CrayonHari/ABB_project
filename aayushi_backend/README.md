
# Intellilnspect: Real-Time Predictive Quality Control - Backend

This repository contains the ASP.NET Core 8 backend for the Intellilnspect application. It is designed as a single-file web API that provides all the necessary endpoints to support the hackathon requirements, including dataset uploading, date range validation, model training, and real-time prediction simulation.

**Author**: Aayushi Gupta **(EC22B1001)**

---

## ⚙️ What is it?

This is the central backend service for the Intellilnspect project. It is responsible for:
- **Handling HTTP Requests**: Exposes a set of API endpoints for the Angular frontend.
- **Data Processing**: Parses an uploaded CSV file, augments it with synthetic timestamps, and stores it in memory.
- **Business Logic**: Validates user-defined date ranges for training, testing, and simulation.
- **Coordination**: Acts as a bridge to a Python ML service for model training and inference (currently mocked).
- **Real-Time Simulation**: Streams prediction results back to the client using a long-lived HTTP connection to simulate a real-time environment.

## How to Use

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

### 1. Install Dependencies
This project has one main external dependency for API documentation (Swagger/OpenAPI). To install it, navigate to the project's root directory in your terminal and run the following command:

```bash
dotnet add package Swashbuckle.AspNetCore
````

### 2. Run the Application

You can run the application using the `dotnet watch` command, which will automatically rebuild and restart the application when you make code changes.

```bash
dotnet watch run
```

Alternatively, you can run it without the watch functionality:

```bash
dotnet run
```

Once running, the API will be available at `https://localhost:7123` (the port may vary). You can access the Swagger UI for interactive API documentation at `https://localhost:7123/swagger`.

-----

## 🔮 Placeholders & Assumptions

To allow for standalone development and testing, this backend makes the following assumptions and uses placeholders for external services:

  - **Angular Frontend**: The backend is configured with a CORS policy that allows requests from `http://localhost:4200`, which is the default address for an Angular development server.

  - **Python ML Service**: The `HttpClient` is configured to communicate with a Python service at `http://ml-service-python:8000`. This is a placeholder address that would typically resolve in a Docker container environment.

      - The `/api/train-model` endpoint currently returns **mocked data** to simulate a successful training run without needing the actual Python service.
      - The `/api/simulate` endpoint generates **mocked predictions** and confidence scores.

