using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using Scout.Vision.Api.Contracts;

namespace Scout.Vision.Api.Services;

public class VisionAnalysisService(IConfiguration configuration)
{
    public AnalyzePhotoResponse Analyze(string photoBase64)
    {
        var imageBytes = DecodePhoto(photoBase64);

        using var image = Image.Load<Rgba32>(imageBytes);
        var (brightness, contrast) = ComputeImageStats(image);

        if (TryAnalyzeWithOnnx(image, out var onnxResult))
        {
            return new AnalyzePhotoResponse(
                Label: onnxResult.Label,
                Confidence: onnxResult.Confidence,
                Engine: "onnx-runtime",
                RequiresManualReview: onnxResult.Confidence < 0.75,
                Summary: "Inferência ONNX executada no backend com sucesso.",
                Brightness: brightness,
                Contrast: contrast,
                AnalyzedAtUtc: DateTime.UtcNow);
        }

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

    private bool TryAnalyzeWithOnnx(Image<Rgba32> image, out (string Label, double Confidence) result)
    {
        result = default;

        var enabled = configuration.GetValue<bool>("Vision:Onnx:Enabled");
        var modelPath = configuration["Vision:Onnx:ModelPath"];
        if (!enabled || string.IsNullOrWhiteSpace(modelPath) || !File.Exists(modelPath))
        {
            return false;
        }

        try
        {
            using var session = new InferenceSession(modelPath);

            var configuredWidth = Math.Max(1, configuration.GetValue("Vision:Onnx:InputWidth", 224));
            var configuredHeight = Math.Max(1, configuration.GetValue("Vision:Onnx:InputHeight", 224));

            var inputName = configuration["Vision:Onnx:InputName"]
                ?? session.InputMetadata.Keys.First();
            var outputName = configuration["Vision:Onnx:OutputName"]
                ?? session.OutputMetadata.Keys.First();

            var tensor = CreateInputTensor(image, configuredWidth, configuredHeight);
            var inputs = new List<NamedOnnxValue>
            {
                NamedOnnxValue.CreateFromTensor(inputName, tensor),
            };

            using IDisposableReadOnlyCollection<DisposableNamedOnnxValue> outputs = session.Run(inputs);
            var output = outputs.FirstOrDefault(o => o.Name == outputName) ?? outputs.First();
            var values = output.AsEnumerable<float>().ToArray();
            if (values.Length == 0)
            {
                return false;
            }

            var probabilities = Softmax(values);
            var topIndex = 0;
            var topValue = probabilities[0];
            for (var i = 1; i < probabilities.Length; i++)
            {
                if (probabilities[i] > topValue)
                {
                    topValue = probabilities[i];
                    topIndex = i;
                }
            }

            var labels = LoadLabels();
            var label = topIndex < labels.Length
                ? labels[topIndex]
                : $"class_{topIndex}";

            result = (label, Math.Clamp(topValue, 0.0, 1.0));
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static DenseTensor<float> CreateInputTensor(Image<Rgba32> image, int width, int height)
    {
        using var resized = image.Clone(ctx => ctx.Resize(width, height));
        var data = new float[1 * 3 * height * width];

        var indexR = 0;
        var indexG = height * width;
        var indexB = 2 * height * width;

        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                var pixel = resized[x, y];
                data[indexR++] = pixel.R / 255f;
                data[indexG++] = pixel.G / 255f;
                data[indexB++] = pixel.B / 255f;
            }
        }

        return new DenseTensor<float>(data, [1, 3, height, width]);
    }

    private static float[] Softmax(float[] values)
    {
        var max = values.Max();
        var exps = new float[values.Length];
        double sum = 0;

        for (var i = 0; i < values.Length; i++)
        {
            exps[i] = (float)Math.Exp(values[i] - max);
            sum += exps[i];
        }

        if (sum <= 0)
        {
            return values.Select(_ => 1f / values.Length).ToArray();
        }

        for (var i = 0; i < exps.Length; i++)
        {
            exps[i] = (float)(exps[i] / sum);
        }

        return exps;
    }

    private string[] LoadLabels()
    {
        var labelsPath = configuration["Vision:Onnx:LabelsPath"];
        if (string.IsNullOrWhiteSpace(labelsPath) || !File.Exists(labelsPath))
        {
            return [];
        }

        return File.ReadAllLines(labelsPath)
            .Select(line => line.Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToArray();
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
