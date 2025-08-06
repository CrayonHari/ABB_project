using ProductionBackend.Models;
using System.Collections.Generic;

namespace ProductionBackend.Services
{
    public class SimulationLogService
    {
        private readonly List<PredictionLogEntry> _log = new List<PredictionLogEntry>();

        public void AddEntry(PredictionLogEntry entry) => _log.Add(entry);
        public List<PredictionLogEntry> GetLog() => _log;
        public void ClearLog() => _log.Clear();
    }
}
