namespace Scout.Vision.Api.Contracts;

public record AnalyzePhotoRequest(string PhotoBase64);

public record AnalyzePhotoResponse(
    string Label,
    double Confidence,
    string Engine,
    bool RequiresManualReview,
    string Summary,
    double Brightness,
    double Contrast,
    DateTime AnalyzedAtUtc);
