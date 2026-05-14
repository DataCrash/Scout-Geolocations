FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Scout.Cache.Api.csproj", "."]
RUN dotnet restore "Scout.Cache.Api.csproj"
COPY . .
RUN dotnet build "Scout.Cache.Api.csproj" -c Release -o /app/build --nologo

FROM build AS publish
RUN dotnet publish "Scout.Cache.Api.csproj" -c Release -o /app/publish --no-restore --nologo

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Scout.Cache.Api.dll"]
