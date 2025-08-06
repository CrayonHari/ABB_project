using Microsoft.AspNetCore.Mvc;
using ProductionBackend.DTOs;

namespace ProductionBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequestDto loginRequest)
    {
        if (loginRequest.Username == "user@example.com" && loginRequest.Password == "securepassword123")
        {
            var response = new LoginResponseDto
            {
                Token = "mock.jwt.token.string.for.dotnet8",
                Username = loginRequest.Username,
                ExpiresIn = 3600
            };
            return Ok(response);
        }
        return Unauthorized("Invalid credentials.");
    }
}