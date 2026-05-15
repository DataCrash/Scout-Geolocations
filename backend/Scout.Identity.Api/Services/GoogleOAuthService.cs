using System.Net;
using System.Text;
using System.Text.Json;
using Google.Apis.Auth;

namespace Scout.Identity.Api.Services;

public class GoogleOAuthService(IConfiguration config, HttpClient httpClient)
{
    private readonly string _clientId = config["Google:ClientId"]
        ?? throw new InvalidOperationException("Google:ClientId não configurado");
    private readonly string _clientSecret = config["Google:ClientSecret"]
        ?? throw new InvalidOperationException("Google:ClientSecret não configurado");
    private readonly string _redirectUri = config["Google:RedirectUri"]
        ?? throw new InvalidOperationException("Google:RedirectUri não configurado");

    private const string GoogleAuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string GoogleTokenEndpoint = "https://oauth2.googleapis.com/token";

    /// <summary>
    /// Retorna a URL de autorização do Google para o fluxo de redirect.
    /// </summary>
    public string GetAuthorizationUrl(string state)
    {
        var parameters = new Dictionary<string, string>
        {
            { "client_id", _clientId },
            { "redirect_uri", _redirectUri },
            { "response_type", "code" },
            { "scope", "openid profile email" },
            { "state", state },
        };

        var query = string.Join("&", parameters.Select(p => $"{p.Key}={WebUtility.UrlEncode(p.Value)}"));
        return $"{GoogleAuthEndpoint}?{query}";
    }

    /// <summary>
    /// Troca o authorization code por um ID token do Google.
    /// </summary>
    public async Task<GoogleJsonWebSignature.Payload?> ExchangeCodeForTokenAsync(string code, CancellationToken ct)
    {
        var requestBody = new
        {
            client_id = _clientId,
            client_secret = _clientSecret,
            code = code,
            grant_type = "authorization_code",
            redirect_uri = _redirectUri,
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        try
        {
            var response = await httpClient.PostAsync(GoogleTokenEndpoint, content, ct);
            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);

            if (!doc.RootElement.TryGetProperty("id_token", out var idTokenElement))
                return null;

            var idToken = idTokenElement.GetString();
            if (string.IsNullOrWhiteSpace(idToken))
                return null;

            // Valida o ID token assinado pelo Google
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_clientId],
            };

            return await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (HttpRequestException)
        {
            return null;
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
