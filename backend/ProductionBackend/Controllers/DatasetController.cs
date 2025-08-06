using Microsoft.AspNetCore.Mvc;
using ProductionBackend.DTOs;
using System.Net.Http.Json;

namespace ProductionBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatasetController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<DatasetController> _logger;

    public DatasetController(IHttpClientFactory httpClientFactory, ILogger<DatasetController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        using var content = new MultipartFormDataContent();
        using var stream = file.OpenReadStream();
        content.Add(new StreamContent(stream), "file", file.FileName);

        var client = _httpClientFactory.CreateClient("MLServiceClient");
        var response = await client.PostAsync("/upload-dataset/", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, error);
        }
        
        var datasetInfo = await response.Content.ReadFromJsonAsync<UploadResponseDto>(); 
        return Ok(datasetInfo);
    }

    [HttpPost("validate-ranges")]
    [ProducesResponseType(typeof(ValidateRangesResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateRanges([FromBody] ValidateRangesRequestDto request)
    {
        // First, check for overlapping dates (logic that belongs in the .NET BFF)
        if (request.TestingPeriod.StartDate <= request.TrainingPeriod.EndDate ||
            request.SimulationPeriod.StartDate <= request.TestingPeriod.EndDate)
        {
            // Return a consistent error response DTO for invalid logic
            var errorResponse = new ValidateRangesResponseDto
            {
                IsValid = false,
                Message = "Error: Date periods must be sequential and non-overlapping.",
                RecordCounts = new RecordCountsDto { Training = 0, Testing = 0, Simulation = 0 }
            };
            return BadRequest(errorResponse);
        }
        
        var httpClient = _httpClientFactory.CreateClient("MLServiceClient");
        _logger.LogInformation("Forwarding date range validation request to ML Service.");
        
        var response = await httpClient.PostAsJsonAsync("/get-record-counts-for-ranges", request);

        // This block will now catch the new 400 error from Python for out-of-bounds dates
        if (!response.IsSuccessStatusCode)
        {
            var errorDetails = await response.Content.ReadFromJsonAsync<object>();
            _logger.LogError("ML Service failed to validate ranges. Status: {status}, Details: {details}", response.StatusCode, errorDetails);
            return StatusCode((int)response.StatusCode, errorDetails);
        }

        // This part only runs if Python returns a successful 200 OK
        var counts = await response.Content.ReadFromJsonAsync<RecordCountsDto>();
        var responseDto = new ValidateRangesResponseDto
        {
            IsValid = true,
            Message = "Date ranges validated successfully!",
            RecordCounts = counts!
        };
        
        return Ok(responseDto);
    }
}