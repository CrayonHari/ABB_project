using Microsoft.AspNetCore.Mvc;
using ProductionBackend.DTOs;

namespace ProductionBackend.Controllers;
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    [HttpGet("stats")]
    public IActionResult GetStats()
    {
        var stats = new AdminStatsDto
        {
            TotalUsers = 150,
            TotalUploads = 452,
            SimulationsRunToday = 88,
            MostActiveUser = "admin@example.com"
        };
        return Ok(stats);
    }
}