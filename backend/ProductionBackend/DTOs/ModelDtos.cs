namespace ProductionBackend.DTOs;

public class TrainModelRequestDto
{
    public required string TrainStart { get; set; }
    public required string TrainEnd { get; set; }
    public required string TestStart { get; set; }
    public required string TestEnd { get; set; }
}

public class TrainModelResponseDto
{
    public required string Status { get; set; }
    public string? ModelId { get; set; } // ModelId can be null on failure
    public required MetricsDto Metrics { get; set; }
}

public class MetricsDto
{
    public double Accuracy { get; set; }
    public double Precision { get; set; }
    public double Recall { get; set; }
    public double F1Score { get; set; }
}

public class FeatureImportanceDto
{
    public required string FeatureName { get; set; }
    public double ImportanceScore { get; set; }
}