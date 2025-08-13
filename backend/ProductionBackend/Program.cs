using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ProductionBackend.Hubs;
using ProductionBackend.Services;
using Microsoft.AspNetCore.Authentication.Cookies;

var builder = WebApplication.CreateBuilder(args);
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
// --- Service Registration ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddScoped<SimulationService>(); // Correctly scoped, not singleton

builder.Services.AddHttpClient("MLServiceClient", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MLService:BaseUrl"] ?? "http://localhost:8000");
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyChangeMe!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MyBackend";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});


builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:4200")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

var app = builder.Build();

// --- Middleware Pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ==========================================================
// THE FIX: This line is now removed or commented out.
// app.UseHttpsRedirection(); 
// ==========================================================

app.UseRouting();
app.UseCors(MyAllowSpecificOrigins);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<SimulationHub>("/simulationHub");

app.Run(); // Let environment variables from docker-compose control the URL