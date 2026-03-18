# ── Stage 1: Build ─────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/CollegeLMS.sln ./
COPY backend/CollegeLMS.API/CollegeLMS.API.csproj CollegeLMS.API/
RUN dotnet restore CollegeLMS.API/CollegeLMS.API.csproj

COPY backend/ .
RUN dotnet publish CollegeLMS.API/CollegeLMS.API.csproj \
    -c Release -o /app/publish --no-restore

# ── Stage 2: Runtime ────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "CollegeLMS.API.dll"]
