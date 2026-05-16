using Microsoft.ML.OnnxRuntime;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using Scout.Vision.Api.Contracts;

namespace Scout.Vision.Api.Services;

public class VisionAnalysisService(IConfiguration configuration)
{
    public AnalyzePhotoResponse Analyze(string photoBase64)
    {
        var imageBytes = DecodePhoto(photoBase64);

        using var image = Image.Load<Rgba32>(imageBytes);
        var (brightness, contrast) = ComputeImageStats(image);

        var onnxConfigured = IsOnnxConfigured();
        var confidence = Math.Clamp(0.42 + contrast * 1.15 - Math.Abs(brightness - 0.55), 0.18, 0.95);
        var label = InferLabel(brightness, contrast);

        return new AnalyzePhotoResponse(
            Label: label,
            Confidence: confidence,
            Engine: onnxConfigured ? "onnx-runtime-configured-fallback" : "heuristic-fallback",
            RequiresManualReview: confidence < 0.75,
            Summary: onnxConfigured
                ? "ONNX configurado no backend; usando fallback heurístico até o modelo ser plugado."
                : "Fallback heurístico executado no backend para triagem inicial.",
            Brightness: brightness,
            Contrast: contrast,
            AnalyzedAtUtc: DateTime.UtcNow);
    }

    private bool IsOnnxConfigured()
    {
        var enabled = configuration.GetValue<bool>("Vision:Onnx:Enabled");
        var modelPath = configuration["Vision:Onnx:ModelPath"];

        if (!enabled || string.IsNullOrWhiteSpace(modelPath))
        {
            return false;
        }

        return File.Exists(modelPath);
    }

    private static byte[] DecodePhoto(string photoBase64)
    {
        if (string.IsNullOrWhiteSpace(photoBase64))
        {
            throw new ArgumentException("PhotoBase64 é obrigatório.");
        }

        var normalized = photoBase64;
        var commaIndex = normalized.IndexOf(',');
        if (normalized.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && commaIndex >= 0)
        {
            normalized = normalized[(commaIndex + 1)..];
        }

        return Convert.FromBase64String(normalized);
    }

    private static (double Brightness, double Contrast) ComputeImageStats(Image<Rgba32> image)
    {
        double sum = 0;
        double sumSquares = 0;
        long count = 0;

        for (var y = 0; y < image.Height; y += 2)
        {
            for (var x = 0; x < image.Width; x += 2)
            {
                var pixel = image[x, y];
                var brightness = (0.2126 * pixel.R + 0.7152 * pixel.G + 0.0722 * pixel.B) / 255.0;
                sum += brightness;
                sumSquares += brightness * brightness;
                count++;
            }
        }

        if (count == 0)
        {
            return (0, 0);
        }

        var mean = sum / count;
        var variance = Math.Max(0, (sumSquares / count) - (mean * mean));
        return (mean, Math.Sqrt(variance));
    }

    private static string InferLabel(double brightness, double contrast)
    {
        if (contrast >= 0.22 && brightness >= 0.35 && brightness <= 0.78)
        {
            return "Marco urbano detectado";
        }

        if (brightness < 0.28)
        {
            return "Imagem escura demais";
        }

        if (contrast < 0.12)
        {
            return "Cena com pouco detalhe";
        }

        return "Cena urbana provável";
    }
}
