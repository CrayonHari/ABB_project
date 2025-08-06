namespace ProductionBackend.DTOs;

public class TrainModelRequestDto
{
    public required string TrainStart { get; set; }
    public required string TrainEnd { get; set; }
    public required string TestStart { get; set; }
    public required string TestEnd { get; set; }
}

// --- CHANGE 1: Add a new class for the history data points ---
public class TrainingHistoryEntryDto
{
    public int Epoch { get; set; }
    public double TrainLoss { get; set; }
    public double TrainAccuracy { get; set; }
}

public class MetricsDto
{
    public double Accuracy { get; set; }
    public double Precision { get; set; }
    public double Recall { get; set; }
    public double F1Score { get; set; }
    // --- CHANGE 2: Add the new properties ---
    public required List<List<int>> ConfusionMatrix { get; set; }
    public required List<TrainingHistoryEntryDto> TrainingHistory { get; set; }
}

public class TrainModelResponseDto
{
    public required string Status { get; set; }
    public string? ModelId { get; set; }
    public required MetricsDto Metrics { get; set; }
}

public class FeatureImportanceDto
{
    public required string FeatureName { get; set; }
    public double ImportanceScore { get; set; }
}
