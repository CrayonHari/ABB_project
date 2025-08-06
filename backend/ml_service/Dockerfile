# Use the official Python slim image as a base
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Install curl so the healthcheck command in docker-compose.yml can run.
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy your application code into the container
COPY ./app ./app

# Expose the port the app runs on
EXPOSE 8000

# The command to run when the container starts
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]