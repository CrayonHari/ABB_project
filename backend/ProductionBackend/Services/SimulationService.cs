using Microsoft.Extensions.Logging;
using ProductionBackend.DTOs;
using ProductionBackend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace ProductionBackend.Services
{
    public class SimulationDataRow : Dictionary<string, JsonElement> { }

    public class SimulationService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<SimulationService> _logger;
        private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

        public SimulationService(IHttpClientFactory httpClientFactory, ILogger<SimulationService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async IAsyncEnumerable<PredictionLogEntry> RunSimulationStreamAsync(
            PeriodDto simulationPeriod,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("=== Simulation Started: {start} to {end} ===",
                simulationPeriod.StartDate, simulationPeriod.EndDate);

            var httpClient = _httpClientFactory.CreateClient("MLServiceClient");
            var simulationData = await GetSimulationDataAsync(httpClient, simulationPeriod);

            if (simulationData == null || !simulationData.Any())
            {
                _logger.LogWarning("No data returned from ML service for the simulation period.");
                yield break;
            }

            // --- START OF THE CHANGE ---
            // Initialize a counter for the SampleId
            int sampleCounter = 1;
            // --- END OF THE CHANGE ---

            foreach (var row in simulationData)
            {
                cancellationToken.ThrowIfCancellationRequested();
                await Task.Delay(1000, cancellationToken); // 1-second delay

                var predictionPayload = new Dictionary<string, JsonElement>(row);
                predictionPayload.Remove("synthetic_timestamp");
                predictionPayload.Remove("Response");
                
                var predictionResponse = await GetPredictionAsync(httpClient, predictionPayload);

                if (predictionResponse == null)
                {
                    _logger.LogWarning("ML service failed to predict for a row, using fallback.");
                    predictionResponse = new PredictionResponse { Prediction = "Error", Confidence = 0 };
                }

                var logEntry = new PredictionLogEntry
                {
                    Timestamp = DateTime.UtcNow,
                    // --- START OF THE CHANGE ---
                    // Use the counter for the SampleId and then increment it
                    SampleId = sampleCounter.ToString(),
                    // --- END OF THE CHANGE ---
                    Prediction = predictionResponse.Prediction,
                    Confidence = predictionResponse.Confidence,
                    SensorData = row.ToDictionary(kvp => kvp.Key, kvp => (object)kvp.Value)
                };
                
                sampleCounter++; // Increment for the next loop
                
                yield return logEntry;
            }

            _logger.LogInformation("=== Simulation Data Stream Completed ===");
        }

        private async Task<List<SimulationDataRow>?> GetSimulationDataAsync(HttpClient client, PeriodDto period)
        {
            try
            {
                var response = await client.PostAsJsonAsync("get-data-for-range", new
                {
                    startDate = period.StartDate.ToString("o"),
                    endDate = period.EndDate.ToString("o")
                });
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to get simulation data. Status: {status}, Body: {body}", response.StatusCode, await response.Content.ReadAsStringAsync());
                    return null;
                }
                return await response.Content.ReadFromJsonAsync<List<SimulationDataRow>>(_jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception while fetching simulation data.");
                return null;
            }
        }

        private async Task<PredictionResponse?> GetPredictionAsync(HttpClient client, Dictionary<string, JsonElement> data)
        {
            try
            {
                var response = await client.PostAsJsonAsync("predict", data);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Prediction request failed with status code: {statusCode}", response.StatusCode);
                    return null;
                }
                return await response.Content.ReadFromJsonAsync<PredictionResponse>(_jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Prediction failed due to an exception.");
                return null;
            }
        }

        public async Task<PredictionResponse?> PredictSingleAsync(SimulationDataRow input)
        {
            var httpClient = _httpClientFactory.CreateClient("MLServiceClient");
            try
            {
                var response = await httpClient.PostAsJsonAsync("predict", input);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("PredictSingleAsync: ML service responded with status code {code}", response.StatusCode);
                    return null;
                }
                return await response.Content.ReadFromJsonAsync<PredictionResponse>(_jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PredictSingleAsync: Error calling ML service.");
                return null;
            }
        }
    }
}