using ProductionBackend.Hubs;
using ProductionBackend.Services;

var builder = WebApplication.CreateBuilder(args);
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// --- Service Registration ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddScoped<SimulationService>();

// ML Service Client
builder.Services.AddHttpClient("MLServiceClient", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["MLService:BaseUrl"] ?? "http://localhost:8000");
});

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

// **DO NOT** use HTTPS redirection in Docker
// app.UseHttpsRedirection();

app.UseRouting();

// Enable CORS before controllers
app.UseCors(MyAllowSpecificOrigins);

app.UseAuthorization();

// Map Controllers & SignalR
app.MapControllers();
app.MapHub<SimulationHub>("/simulationHub");

// Health Check
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();  // Let docker-compose control the host/port
