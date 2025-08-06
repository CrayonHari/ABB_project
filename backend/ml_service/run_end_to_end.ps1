# =================================================================
# PowerShell Script for Docker Environment
#
# HOW TO USE:
# 1. Make sure your application is running via `docker-compose up`.
# 2. Open PowerShell, navigate to this directory, and run:
#    .\run_end_to_end.ps1
# =================================================================

# --- Configuration for Docker ---
# FIX: Updated URLs to match the ports exposed by Docker Compose
$fastApiBaseUrl = "http://localhost:8001" # Port mapped for ml-service
$dotNetBaseUrl = "http://localhost:8082"  # Port mapped for production-backend
# ---

# Use $PSScriptRoot to build a full, unambiguous path to the dataset.
$datasetPath = Join-Path $PSScriptRoot "production_data.csv"

# Function to print a formatted header
function Write-SectionHeader {
    param($Title)
    Write-Host "`n" + ("=" * 50)
    Write-Host $Title -ForegroundColor Cyan
    Write-Host ("=" * 50)
}

# --- Script Start ---

# 1. VERIFY DATASET EXISTS
Write-Host "Looking for dataset at: $datasetPath" -ForegroundColor Gray
if (-not (Test-Path $datasetPath)) {
    Write-Host "FATAL ERROR: Dataset file not found at '$datasetPath'. Please ensure 'production_data.csv' is in the same directory as this script." -ForegroundColor Red
    exit
}

# 2. UPLOAD DATASET
Write-SectionHeader "1. UPLOADING DATASET TO FASTAPI"
try {
    $webClient = New-Object System.Net.WebClient
    $uri = "$fastApiBaseUrl/upload-dataset/"
    $responseBytes = $webClient.UploadFile($uri, "POST", $datasetPath)
    $responseText = [System.Text.Encoding]::UTF8.GetString($responseBytes)
    $uploadResponse = $responseText | ConvertFrom-Json
    
    Write-Host "✅ Upload Successful!" -ForegroundColor Green
    $uploadResponse | ConvertTo-Json -Depth 3 | Write-Output
}
catch {
    Write-Host "❌ Upload FAILED!" -ForegroundColor Red
    Write-Host "Error Details: $($_.Exception.Message)"
    Write-Host "Please ensure the Docker containers are running and accessible at '$fastApiBaseUrl'."
    exit
}

Start-Sleep -Seconds 1

# 3. TRAIN MODEL ON A SUBSET OF DATA
Write-SectionHeader "2. TRAINING MODEL ON INITIAL DATA (First 950 records)"
$trainBody = @{
    trainStart = "2023-01-01T00:00:00" 
    trainEnd   = "2023-01-01T00:13:19" 
    testStart  = "2023-01-01T00:13:20" 
    testEnd    = "2023-01-01T00:15:49" 
} | ConvertTo-Json

try {
    $trainResponse = Invoke-RestMethod `
        -Uri "$fastApiBaseUrl/train-model" `
        -Method Post `
        -Body $trainBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    Write-Host "✅ Model Training Request Successful!" -ForegroundColor Green
    $trainResponse | ConvertTo-Json -Depth 3 | Write-Output
}
catch {
    Write-Host "❌ Model Training FAILED!" -ForegroundColor Red
    Write-Host "Error Details: $($_.Exception.Message)"
    exit
}

# 4. SIMULATE REAL-WORLD PRODUCTION
Write-SectionHeader "3. SIMULATING REAL-WORLD PRODUCTION"
Write-Host "The model will now predict on data it has never seen before (records 951-1000)." -ForegroundColor Yellow

$fullDataset = Import-Csv -Path $datasetPath
$productionData = $fullDataset | Where-Object { [int]$_.Sample_ID -ge 951 }

foreach ($record in $productionData) {
    Write-Host "`n[SIMULATION] Sending production sample #$($record.Sample_ID)..." -ForegroundColor Yellow
    
    $predictionPayload = @{
        Temperature = [float]$record.Temperature
        Pressure    = [float]$record.Pressure
        Vibration   = [float]$record.Vibration
        Speed       = [float]$record.Speed
        Voltage     = [float]$record.Voltage
    } | ConvertTo-Json

    try {
        $predictionResult = Invoke-RestMethod `
            -Uri "$dotNetBaseUrl/api/production/predict" `
            -Method Post `
            -Body $predictionPayload `
            -ContentType "application/json" `
            -ErrorAction Stop
            
        Write-Host "✅ Prediction Response:" -ForegroundColor Green
        $predictionResult | ConvertTo-Json -Depth 3 | Write-Output
    }
    catch {
        Write-Host "❌ Prediction FAILED for sample #$($record.Sample_ID)!" -ForegroundColor Red
        Write-Host "Error Details: $($_.Exception.Message)"
    }
    
    Start-Sleep -Seconds 1
}

Write-SectionHeader "END-TO-END SIMULATION COMPLETE"
