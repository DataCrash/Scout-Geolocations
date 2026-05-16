FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["Scout.Vision.Api.csproj", "."]
RUN dotnet restore "Scout.Vision.Api.csproj"
COPY . .
RUN dotnet build "Scout.Vision.Api.csproj" -c Release -o /app/build --nologo

FROM build AS publish
RUN dotnet publish "Scout.Vision.Api.csproj" -c Release -o /app/publish --no-restore --nologo

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Scout.Vision.Api.dll"]
