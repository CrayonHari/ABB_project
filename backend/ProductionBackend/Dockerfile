FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ProductionBackend.csproj", "."]
RUN dotnet restore "./ProductionBackend.csproj"
COPY . .
RUN dotnet publish "ProductionBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
# No EXPOSE needed here, as ASPNETCORE_URLS handles it.
ENTRYPOINT ["dotnet", "ProductionBackend.dll"]