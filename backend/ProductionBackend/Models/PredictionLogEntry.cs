namespace ProductionBackend.Models
{
    public class PredictionLogEntry
    {
        public DateTime Timestamp { get; set; }
        public required string SampleId { get; set; }
        public required string Prediction { get; set; }
        public double Confidence { get; set; }

        // THE CHANGE: Add a dictionary to hold the original sensor values.
        // This is flexible and can handle any number of features.
        public Dictionary<string, object> SensorData { get; set; } = new();
    }

    public class PredictionResponse
    {
        public required string Prediction { get; set; }
        public double Confidence { get; set; }
    }
}