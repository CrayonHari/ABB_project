using Microsoft.AspNetCore.Mvc;
using ProductionBackend.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace ProductionBackend.Controllers;
[Authorize] // <--- Add this line
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