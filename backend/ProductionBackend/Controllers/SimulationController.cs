using Microsoft.AspNetCore.Mvc;
using ProductionBackend.Models;
using ProductionBackend.Services;

namespace ProductionBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PredictionController : ControllerBase
{
    private readonly SimulationService _simulationService;

    public PredictionController(SimulationService simulationService)
    {
        _simulationService = simulationService;
    }

    /// <summary>
    /// Submit one simulation data row and get a prediction immediately.
    /// </summary>
    [HttpPost("predict-single")]
public async Task<IActionResult> PredictSingle([FromBody] SimulationDataRow input)
{
    if (input == null || !input.TryGetValue("Sample_ID", out var sampleIdElement) || string.IsNullOrEmpty(sampleIdElement.GetString()))
        return BadRequest("Sample_ID is required for prediction.");

    var prediction = await _simulationService.PredictSingleAsync(input);

    if (prediction == null)
        return StatusCode(500, "ML service did not return a prediction.");

    return Ok(new
    {
        Sample_ID = sampleIdElement.GetString(),
        Prediction = prediction.Prediction,
        Confidence = prediction.Confidence
    });
}

}
