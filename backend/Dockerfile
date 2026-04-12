# ============================================================
# Base runtime image — non-root, with curl for healthcheck
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
EXPOSE 8080

# Create non-root user and writable log/data directories
RUN groupadd -r mscashier && useradd -r -g mscashier -d /app -s /sbin/nologin mscashier \
 && mkdir -p /app/logs \
 && chown -R mscashier:mscashier /app

# ============================================================
# Build stage
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["MsCashier.API/MsCashier.API.csproj", "MsCashier.API/"]
COPY ["MsCashier.Application/MsCashier.Application.csproj", "MsCashier.Application/"]
COPY ["MsCashier.Domain/MsCashier.Domain.csproj", "MsCashier.Domain/"]
COPY ["MsCashier.Infrastructure/MsCashier.Infrastructure.csproj", "MsCashier.Infrastructure/"]
RUN dotnet restore "MsCashier.API/MsCashier.API.csproj"
COPY . .
WORKDIR "/src/MsCashier.API"
RUN dotnet build "MsCashier.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

# ============================================================
# Publish stage
# ============================================================
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "MsCashier.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# ============================================================
# Final image
# ============================================================
FROM base AS final
WORKDIR /app
COPY --from=publish --chown=mscashier:mscashier /app/publish .
USER mscashier
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "MsCashier.API.dll"]
