using Microsoft.AspNetCore.Mvc;
using ProductionBackend.DTOs;
using System.Net.Http.Json;

namespace ProductionBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModelController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public ModelController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("train")]
    public async Task<IActionResult> Train([FromBody] TrainModelRequestDto request)
    {
        var httpClient = _httpClientFactory.CreateClient("MLServiceClient");
        var response = await httpClient.PostAsJsonAsync("/train-model", request);

        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());
        }

        var trainResponse = await response.Content.ReadFromJsonAsync<TrainModelResponseDto>();
        return Ok(trainResponse);
    }

    [HttpGet("feature-importance")]
    public async Task<IActionResult> GetFeatureImportance()
    {
        var httpClient = _httpClientFactory.CreateClient("MLServiceClient");
        var response = await httpClient.GetAsync("/feature-importance");

        if (!response.IsSuccessStatusCode)
        {
            return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());
        }

        var importanceData = await response.Content.ReadFromJsonAsync<List<FeatureImportanceDto>>();
        return Ok(importanceData);
    }
}