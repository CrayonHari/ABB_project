# ============================
# PowerShell script to test ML Service end-to-end
# ============================

$mlUrl = "http://127.0.0.1:8000"
$datasetPath = "D:\coding\project\ml_service\production_data.csv"

Write-Host "1️⃣ Uploading dataset..."
if (-Not (Test-Path $datasetPath)) {
    Write-Host "❌ Dataset not found at $datasetPath"
    exit
}

# ✅ Upload the file using multipart/form-data
$uploadResponse = Invoke-RestMethod -Uri "$mlUrl/upload-dataset/" `
    -Method Post `
    -Form @{ file = Get-Item $datasetPath }

Write-Host "Upload Response:"
$uploadResponse | ConvertTo-Json -Depth 5
Start-Sleep -Seconds 1

# ============================

Write-Host "`n2️⃣ Training the model..."
$body = @{
    trainStart = "2023-01-01T00:00:00"
    trainEnd   = "2023-01-01T00:12:00"
    testStart  = "2023-01-01T00:12:01"
    testEnd    = "2023-01-01T00:16:39"
} | ConvertTo-Json

$trainResponse = Invoke-RestMethod -Uri "$mlUrl/train-model" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

Write-Host "Train Response:"
$trainResponse | ConvertTo-Json -Depth 5
Start-Sleep -Seconds 1

# ============================

Write-Host "`n3️⃣ Predicting a sample row..."
$sampleRow = @{
    Temperature = 999
    Pressure = 0
    Vibration = 10.0
    Speed = 0
    Voltage = 999
} | ConvertTo-Json

$predictResponse = Invoke-RestMethod -Uri "$mlUrl/predict" `
    -Method Post `
    -Body $sampleRow `
    -ContentType "application/json"

Write-Host "Prediction Response:"
$predictResponse | ConvertTo-Json -Depth 5
