using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Collections.Concurrent;
using ProductionBackend.DTOs;
using Microsoft.Extensions.Configuration; // Required for IConfiguration
using System;

namespace ProductionBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // A thread-safe dictionary for demo purposes.
    // In a real application, this would be a database or another user store.
    private static readonly ConcurrentDictionary<string, string> RegisteredUsers = new ConcurrentDictionary<string, string>();
    private readonly IConfiguration _config;

    // Constructor for dependency injection of IConfiguration
    public AuthController(IConfiguration config)
    {
        _config = config;
        
        // Add a dummy user for the demo if none exist
        if (RegisteredUsers.IsEmpty)
        {
            RegisteredUsers.TryAdd("user", "pass");
        }
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequestDto loginDto)
    {
        // Validate credentials against the registered users
        if (RegisteredUsers.TryGetValue(loginDto.Username, out var storedPassword) && storedPassword == loginDto.Password)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, loginDto.Username)
            };
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(2),
                Issuer = _config["Jwt:Issuer"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            return Ok(new LoginResponseDto
            {
                Token = jwt,
                Username = loginDto.Username,
                ExpiresIn = 7200 // 2 hours in seconds
            });
        }
        
        return Unauthorized(new { message = "Invalid credentials." });
    }
}