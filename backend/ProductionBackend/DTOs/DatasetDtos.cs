namespace ProductionBackend.DTOs
{
    // C# record for the request body sent to the ML service
    public record PeriodDto(DateTime StartDate, DateTime EndDate);

    public record ValidateRangesRequestDto(
        PeriodDto TrainingPeriod, 
        PeriodDto TestingPeriod, 
        PeriodDto SimulationPeriod
    );

    // C# record to deserialize the response from the ML service
    public class UploadResponseDto
    {
        public required string Message { get; set; }
        public int TotalRecords { get; set; }
        public int ColumnCount { get; set; }
        public required string DateRangeStart { get; set; }
        public required string DateRangeEnd { get; set; }
        public double PassRate { get; set; }
    }
    
    public class RecordCountsDto
    {
        public int Training { get; set; }
        public int Testing { get; set; }
        public int Simulation { get; set; }
    }

    public class ValidateRangesResponseDto
    {
        public bool IsValid { get; set; }
        public required string Message { get; set; }
        public required RecordCountsDto RecordCounts { get; set; }
    }
}