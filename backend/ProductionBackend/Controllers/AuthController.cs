// using Microsoft.AspNetCore.Mvc;
using ProductionBackend.DTOs;

// namespace ProductionBackend.Controllers;

// [ApiController]
// [Route("api/[controller]")]
// public class AuthController : ControllerBase
// {
//     [HttpPost("login")]
//     public IActionResult Login([FromBody] LoginRequestDto loginRequest)
//     {
//         if (loginRequest.Username == "user@example.com" && loginRequest.Password == "securepassword123")
//         {
//             var response = new LoginResponseDto
//             {
//                 Token = "mock.jwt.token.string.for.dotnet8",
//                 Username = loginRequest.Username,
//                 ExpiresIn = 3600
//             };
//             return Ok(response);
//         }
//         return Unauthorized("Invalid credentials.");
//     }
// }
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Concurrent;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, string> RegisteredUsers = new();

    private readonly IConfiguration _config;

    public AuthController(IConfiguration config)
    {
        _config = config;
    }

    [HttpPost("register")]
    [AllowAnonymous] // Anyone can call
    public IActionResult Register([FromBody] RegisterRequestDto regDto)
    {
        // Simple check for existing user
        if (RegisteredUsers.ContainsKey(regDto.Username))
        {
            return Conflict(new { message = "User already exists" });
        }

        // (For demo: store username & plain password. In real code, hash passwords!)
        RegisteredUsers.TryAdd(regDto.Username, regDto.Password);
        return Ok(new { message = "Registration successful" });
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequestDto loginDto)
    {
        // Demo hardcoded user—replace with DB/user-store lookup for real systems
        //if (loginDto.Username == "user" && loginDto.Password == "pass")
        if (RegisteredUsers.TryGetValue(loginDto.Username, out var pwd) && pwd == loginDto.Password)
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
