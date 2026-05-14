using QRCoder;

namespace Scout.Identity.Api.Services;

/// <summary>
/// Gera QR Codes em PNG como base64 sem dependência de GDI+ (compatível com Linux/Docker).
/// </summary>
public class QrCodeService
{
    public string GeneratePngBase64(string data)
    {
        using var generator = new QRCodeGenerator();
        using var qrData    = generator.CreateQrCode(data, QRCodeGenerator.ECCLevel.Q);
        using var qrCode    = new PngByteQRCode(qrData);
        var bytes = qrCode.GetGraphic(pixelsPerModule: 20);
        return Convert.ToBase64String(bytes);
    }
}
