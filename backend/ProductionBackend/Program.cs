using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ProductionBackend.Hubs;
using ProductionBackend.Services;
using System;

var builder = WebApplication.CreateBuilder(args);
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// --- Configuration for Large File Uploads ---
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 209715200; // 200 MB
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 209715200; // 200 MB
});

// --- Service Registration ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddScoped<SimulationService>();

// --- START OF THE FIX ---
// ML Service Client Configuration
builder.Services.AddHttpClient("MLServiceClient", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MLService:BaseUrl"] ?? "http://localhost:8000");
    
    // Increase the timeout to 20 minutes to allow for long model training times.
    // The default is ~100 seconds, which was causing the premature error.
    client.Timeout = TimeSpan.FromMinutes(20); 
});
// --- END OF THE FIX ---

// --- CORS Policy ---
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins(
                              "http://localhost:8080"  // Angular frontend
                          )
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                      });
});

var app = builder.Build();

// --- Middleware ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors(MyAllowSpecificOrigins);

// IMPORTANT: Authentication has been removed as per your request.
app.UseAuthorization();

// Map Controllers & SignalR
app.MapControllers();
app.MapHub<SimulationHub>("/simulationHub");

// Health Check
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
