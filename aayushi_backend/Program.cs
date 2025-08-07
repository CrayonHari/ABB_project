// =================================================================================================
// Intellilnspect: Real-Time Predictive Quality Control - ASP.NET Core 8 Backend
//
// This single-file Program.cs contains the entire backend logic for the hackathon.
// It includes:
// - API endpoints for file upload, date range validation, model training, and simulation.
// - In-memory storage for the dataset.
// - Data models for API requests and responses.
// - A service to handle CSV processing and data augmentation.
// - Mocked interactions with the Python ML service.
//
// To run this file:
// 1. Create a new ASP.NET Core Web API project.
// 2. Replace the contents of Program.cs with this code.
// 3. The project will be ready to run.
// =================================================================================================

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

#region Application Setup
var builder = WebApplication.CreateBuilder(args);

// --- Dependency Injection Configuration ---
// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS services to allow the Angular frontend to communicate with this backend.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        builder =>
        {
            builder.WithOrigins("http://localhost:4200") // URL of the Angular development server
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        });
});

// Register the CsvProcessingService as a singleton to hold dataset state throughout the application's lifetime.
builder.Services.AddSingleton<CsvProcessingService>();

// Register HttpClient for communication with the Python ML service.
builder.Services.AddHttpClient("MLServiceClient", client =>
{
    // This would be the base address of the Python FastAPI service in a real Dockerized environment.
    client.BaseAddress = new Uri("http://ml-service-python:8000"); 
});

var app = builder.Build();

// --- Middleware Configuration ---
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp"); // Apply the CORS policy

#endregion

#region API Endpoints

// =================================================
// Endpoint 1: Upload Dataset
// Path: POST /api/upload
// =================================================
app.MapPost("/api/upload", async (HttpRequest req, CsvProcessingService csvService) =>
{
    if (!req.HasFormContentType)
    {
        return Results.BadRequest("Expected a form content type.");
    }

    var form = await req.ReadFormAsync();
    var file = form.Files.GetFile("file");

    if (file is null || file.Length == 0)
    {
        return Results.BadRequest("No file uploaded or file is empty.");
    }
    
    if (Path.GetExtension(file.FileName).ToLower() != ".csv")
    {
        return Results.BadRequest("Invalid file type. Please upload a CSV file.");
    }

    try
    {
        var summary = await csvService.ProcessCsv(file);
        return Results.Ok(summary);
    }
    catch (Exception ex)
    {
        return Results.Problem($"An error occurred while processing the file: {ex.Message}");
    }
})
.DisableAntiforgery() // Disabling antiforgery for simplicity in this context
.Produces<FileUploadSummary>()
.Produces(StatusCodes.Status400BadRequest)
.Produces(StatusCodes.Status500InternalServerError);


// =================================================
// Endpoint 2: Validate Date Ranges
// Path: POST /api/validate-ranges
// =================================================
app.MapPost("/api/validate-ranges", (DateRangeRequest ranges, CsvProcessingService csvService) =>
{
    var validationResult = csvService.ValidateDateRanges(ranges);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult);
    }
    return Results.Ok(validationResult);
})
.Produces<DateRangeValidationResult>()
.Produces(StatusCodes.Status400BadRequest);

// =================================================
// Endpoint 3: Train Model
// Path: POST /api/train-model
// =================================================
app.MapPost("/api/train-model", async (TrainingRequest request, IHttpClientFactory httpClientFactory) =>
{
    // In a real scenario, this endpoint would forward the request to the Python ML service.
    // var client = httpClientFactory.CreateClient("MLServiceClient");
    // var response = await client.PostAsJsonAsync("/train", request);
    // if (!response.IsSuccessStatusCode)
    // {
    //     return Results.Problem("Failed to train model.");
    // }
    // var metrics = await response.Content.ReadFromJsonAsync<ModelMetrics>();
    // return Results.Ok(metrics);

    // --- MOCKED RESPONSE FOR HACKATHON ---
    // Simulate a delay for training.
    await Task.Delay(3000); 

    var mockMetrics = new ModelMetrics
    {
        Accuracy = 94.2,
        Precision = 92.8,
        Recall = 91.5,
        F1Score = 92.15,
        TrainingMetrics = new TrainingChartData
        {
            Labels = new List<string> { "Epoch 1", "Epoch 2", "Epoch 3", "Epoch 4", "Epoch 5" },
            AccuracyData = new List<double> { 85.1, 88.3, 90.5, 92.7, 94.2 },
            LossData = new List<double> { 0.35, 0.28, 0.22, 0.18, 0.15 }
        },
        ConfusionMatrix = new ConfusionMatrixData
        {
            TruePositive = 3200,
            TrueNegative = 5800,
            FalsePositive = 400,
            FalseNegative = 600
        }
    };
    return Results.Ok(mockMetrics);
})
.Produces<ModelMetrics>()
.Produces(StatusCodes.Status500InternalServerError);


// =================================================
// Endpoint 4: Real-Time Prediction Simulation
// Path: GET /api/simulate
// =================================================
// Corrected version
app.MapGet("/api/simulate", (DateTime simulationStart, DateTime simulationEnd, CsvProcessingService csvService, CancellationToken cancellationToken) =>
{
    // This creates a streaming response.
    async IAsyncEnumerable<SimulationDataPoint> StreamSimulationData()
    {
        var simulationData = csvService.GetSimulationData(simulationStart, simulationEnd);
        var random = new Random();

        foreach (var record in simulationData)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                break;
            }

            // --- MOCKED PREDICTION FOR HACKATHON ---
            var prediction = random.NextDouble() > 0.1 ? "Pass" : "Fail"; // 90% pass rate
            var confidence = Math.Round(random.NextDouble() * (99.9 - 70.0) + 70.0, 2);

            yield return new SimulationDataPoint
            {
                Time = record.SyntheticTimestamp,
                SampleId = $"Sample_{record.Id}",
                Prediction = prediction,
                Confidence = confidence,
                // Assuming the dataset has these columns for demonstration
                Temperature = Math.Round(random.NextDouble() * 10 + 20, 2), 
                Pressure = Math.Round(random.NextDouble() * 100 + 950, 2),
                Humidity = Math.Round(random.NextDouble() * 30 + 50, 2)
            };

            // Wait for 1 second to simulate real-time streaming.
            await Task.Delay(1000, cancellationToken);
        }
    }

    return StreamSimulationData();
})
.Produces<IAsyncEnumerable<SimulationDataPoint>>();

#endregion

app.Run();

#region Data Models & DTOs

// Represents a single row of the processed dataset.
public record DataRecord
{
    public int Id { get; set; }
    public DateTime SyntheticTimestamp { get; set; }
    public int Response { get; set; } // The target column
    public Dictionary<string, string> Features { get; set; } = new();
}

// Summary returned after file upload.
public record FileUploadSummary
{
    public string FileName { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int TotalColumns { get; set; }
    public double PassRate { get; set; }
    public DateTime? EarliestTimestamp { get; set; }
    public DateTime? LatestTimestamp { get; set; }
}

// Request body for validating date ranges.
public record DateRangeRequest
{
    public DateTime TrainStart { get; set; }
    public DateTime TrainEnd { get; set; }
    public DateTime TestStart { get; set; }
    public DateTime TestEnd { get; set; }
    public DateTime SimulationStart { get; set; }
    public DateTime SimulationEnd { get; set; }
}

// Result of date range validation.
public record DateRangeValidationResult
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TrainingRecordCount { get; set; }
    public int TestingRecordCount { get; set; }
    public int SimulationRecordCount { get; set; }
    public List<MonthlyRecordCount> MonthlyCounts { get; set; } = new();
}

public record MonthlyRecordCount
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Type { get; set; } = string.Empty; // "Training", "Testing", "Simulation"
}


// Request body for model training.
public record TrainingRequest
{
    public DateTime TrainStart { get; set; }
    public DateTime TrainEnd { get; set; }
    public DateTime TestStart { get; set; }
    public DateTime TestEnd { get; set; }
}

// Metrics returned after model training.
public record ModelMetrics
{
    public double Accuracy { get; set; }
    public double Precision { get; set; }
    public double Recall { get; set; }
    public double F1Score { get; set; }
    public TrainingChartData? TrainingMetrics { get; set; }
    public ConfusionMatrixData? ConfusionMatrix { get; set; }
}

public record TrainingChartData
{
    public List<string> Labels { get; set; } = new();
    public List<double> AccuracyData { get; set; } = new();
    public List<double> LossData { get; set; } = new();
}

public record ConfusionMatrixData
{
    public int TruePositive { get; set; }
    public int TrueNegative { get; set; }
    public int FalsePositive { get; set; }
    public int FalseNegative { get; set; }
}


// Data point for the real-time simulation stream.
public record SimulationDataPoint
{
    public DateTime Time { get; set; }
    public string SampleId { get; set; } = string.Empty;
    public string Prediction { get; set; } = string.Empty; // "Pass" or "Fail"
    public double Confidence { get; set; }
    public double Temperature { get; set; }
    public double Pressure { get; set; }
    public double Humidity { get; set; }
}

#endregion

#region Services

// Service to handle CSV processing and in-memory data storage.
public class CsvProcessingService
{
    // Using ConcurrentDictionary for thread-safe in-memory storage.
    // The key could be a session ID or user ID in a multi-user scenario. For this hackathon, we use a fixed key.
    private readonly ConcurrentDictionary<string, List<DataRecord>> _inMemoryData = new();
    private const string DefaultDataKey = "processed_data";

    public async Task<FileUploadSummary> ProcessCsv(IFormFile file)
    {
        var records = new List<DataRecord>();
        
        using var reader = new StreamReader(file.OpenReadStream());
        
        // Read header
        var headerLine = await reader.ReadLineAsync();
        if (headerLine is null)
        {
            throw new InvalidDataException("CSV file is empty or has no header.");
        }
        var headers = headerLine.Split(',');

        if (!headers.Contains("Response"))
        {
             throw new InvalidDataException("CSV must contain a 'Response' column.");
        }

        // Augment with synthetic timestamps starting from a fixed date.
        var currentTimestamp = new DateTime(2021, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        int recordId = 1;

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if(string.IsNullOrWhiteSpace(line)) continue;

            var values = line.Split(',');
            var features = new Dictionary<string, string>();
            int response = 0;

            for(int i = 0; i < headers.Length; i++)
            {
                if(headers[i].Equals("Response", StringComparison.OrdinalIgnoreCase))
                {
                    int.TryParse(values[i], out response);
                }
                else
                {
                    features[headers[i]] = values[i];
                }
            }

            records.Add(new DataRecord
            {
                Id = recordId++,
                SyntheticTimestamp = currentTimestamp,
                Response = response,
                Features = features
            });

            currentTimestamp = currentTimestamp.AddSeconds(1);
        }

        _inMemoryData[DefaultDataKey] = records;

        var totalRecords = records.Count;
        var passCount = records.Count(r => r.Response == 1);
        var passRate = totalRecords > 0 ? Math.Round((double)passCount / totalRecords * 100, 2) : 0;

        return new FileUploadSummary
        {
            FileName = file.FileName,
            TotalRecords = totalRecords,
            TotalColumns = headers.Length,
            PassRate = passRate,
            EarliestTimestamp = records.FirstOrDefault()?.SyntheticTimestamp,
            LatestTimestamp = records.LastOrDefault()?.SyntheticTimestamp
        };
    }

    public DateRangeValidationResult ValidateDateRanges(DateRangeRequest ranges)
    {
        if (!_inMemoryData.TryGetValue(DefaultDataKey, out var records) || !records.Any())
        {
            return new DateRangeValidationResult { IsValid = false, Message = "No dataset uploaded." };
        }

        var minDate = records.First().SyntheticTimestamp;
        var maxDate = records.Last().SyntheticTimestamp;

        if (ranges.TrainStart < minDate || ranges.SimulationEnd > maxDate)
        {
            return new DateRangeValidationResult { IsValid = false, Message = "Selected dates are outside the dataset's range." };
        }
        if (ranges.TrainStart > ranges.TrainEnd || ranges.TestStart > ranges.TestEnd || ranges.SimulationStart > ranges.SimulationEnd)
        {
            return new DateRangeValidationResult { IsValid = false, Message = "Start date cannot be after end date for a period." };
        }
        if (ranges.TrainEnd >= ranges.TestStart || ranges.TestEnd >= ranges.SimulationStart)
        {
            return new DateRangeValidationResult { IsValid = false, Message = "Date ranges must be sequential and non-overlapping." };
        }

        var trainingCount = records.Count(r => r.SyntheticTimestamp >= ranges.TrainStart && r.SyntheticTimestamp <= ranges.TrainEnd);
        var testingCount = records.Count(r => r.SyntheticTimestamp >= ranges.TestStart && r.SyntheticTimestamp <= ranges.TestEnd);
        var simulationCount = records.Count(r => r.SyntheticTimestamp >= ranges.SimulationStart && r.SyntheticTimestamp <= ranges.SimulationEnd);
        
        // Generate monthly counts for visualization
        var monthlyCounts = records
            .GroupBy(r => new { r.SyntheticTimestamp.Year, r.SyntheticTimestamp.Month })
            .Select(g => {
                var groupDate = new DateTime(g.Key.Year, g.Key.Month, 1);
                string type = "Other";
                if (groupDate >= ranges.TrainStart.Date && groupDate <= ranges.TrainEnd.Date) type = "Training";
                else if (groupDate >= ranges.TestStart.Date && groupDate <= ranges.TestEnd.Date) type = "Testing";
                else if (groupDate >= ranges.SimulationStart.Date && groupDate <= ranges.SimulationEnd.Date) type = "Simulation";

                return new MonthlyRecordCount {
                    Month = groupDate.ToString("MMM yyyy"),
                    Count = g.Count(),
                    Type = type
                };
            })
            .OrderBy(mc => DateTime.ParseExact(mc.Month, "MMM yyyy", CultureInfo.InvariantCulture))
            .ToList();


        return new DateRangeValidationResult
        {
            IsValid = true,
            Message = "Date ranges validated successfully!",
            TrainingRecordCount = trainingCount,
            TestingRecordCount = testingCount,
            SimulationRecordCount = simulationCount,
            MonthlyCounts = monthlyCounts
        };
    }

    public IEnumerable<DataRecord> GetSimulationData(DateTime start, DateTime end)
    {
        if (!_inMemoryData.TryGetValue(DefaultDataKey, out var records))
        {
            return Enumerable.Empty<DataRecord>();
        }
        return records.Where(r => r.SyntheticTimestamp >= start && r.SyntheticTimestamp <= end).OrderBy(r => r.SyntheticTimestamp);
    }
}

#endregion
