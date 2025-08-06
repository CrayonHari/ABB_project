namespace ProductionBackend.DTOs;

public class AdminStatsDto 
{
    public int TotalUsers { get; set; }
    public int TotalUploads { get; set; }
    public int SimulationsRunToday { get; set; }
    // Add 'required' to fix the warning
    public required string MostActiveUser { get; set; }
}