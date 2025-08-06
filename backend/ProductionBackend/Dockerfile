FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ProductionBackend.csproj", "."]
RUN dotnet restore "./ProductionBackend.csproj"
COPY . .
RUN dotnet build "ProductionBackend.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ProductionBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

EXPOSE 80

# Add curl and a healthcheck for docker-compose
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# The correct entrypoint to run your application
ENTRYPOINT ["dotnet", "ProductionBackend.dll"]