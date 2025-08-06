using Microsoft.AspNetCore.SignalR;
using ProductionBackend.DTOs;
using ProductionBackend.Services;

namespace ProductionBackend.Hubs;

public class SimulationHub : Hub
{
    private readonly SimulationService _simulationService;
    private readonly ILogger<SimulationHub> _logger;
    
    public SimulationHub(SimulationService simulationService, ILogger<SimulationHub> logger)
    {
        _simulationService = simulationService;
        _logger = logger;
    }

    public async Task StartSimulation(PeriodDto simulationPeriod)
    {
        _logger.LogInformation("SignalR client {connectionId} requested a simulation.", Context.ConnectionId);
        try
        {
            await Clients.Caller.SendAsync("SimulationStatus", "Simulation started. Receiving data...");

            // THE CHANGE #1: Add variables to track statistics
            int passCount = 0;
            int failCount = 0;
            double totalConfidence = 0;
            int totalPredictions = 0;

            await foreach (var logEntry in _simulationService.RunSimulationStreamAsync(simulationPeriod, Context.ConnectionAborted))
            {
                await Clients.Caller.SendAsync("ReceivePrediction", logEntry);
                
                // THE CHANGE #2: Update stats with each prediction
                if (logEntry.Prediction.Equals("Pass", StringComparison.OrdinalIgnoreCase))
                {
                    passCount++;
                }
                else if (logEntry.Prediction.Equals("Fail", StringComparison.OrdinalIgnoreCase))
                {
                    failCount++;
                }
                totalConfidence += logEntry.Confidence;
                totalPredictions++;
            }
            
            // THE CHANGE #3: Create and send the final summary object
            var finalStats = new
            {
                Message = $"Simulation finished. Processed {totalPredictions} records.",
                TotalPredictions = totalPredictions,
                PassCount = passCount,
                FailCount = failCount,
                AverageConfidence = totalPredictions > 0 ? Math.Round(totalConfidence / totalPredictions, 2) : 0
            };
            
            // Send a different message for completion with the final stats
            await Clients.Caller.SendAsync("SimulationComplete", finalStats);
            
            _logger.LogInformation("Finished streaming {count} simulation results to client {connectionId}.", totalPredictions, Context.ConnectionId);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Client {connectionId} disconnected. Simulation cancelled.", Context.ConnectionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred during simulation for client {connectionId}.", Context.ConnectionId);
            await Clients.Caller.SendAsync("SimulationError", "An unexpected error occurred during the simulation. Check the server logs.");
        }
    }
}