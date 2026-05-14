using Google.Apis.Auth;

namespace Scout.Identity.Api.Services;

public class GoogleAuthService(IConfiguration config)
{
    public async Task<GoogleJsonWebSignature.Payload?> ValidateAsync(string idToken)
    {
        var clientId = config["Google:ClientId"]
            ?? throw new InvalidOperationException("Google:ClientId não configurado");

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [clientId],
        };

        try
        {
            return await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
