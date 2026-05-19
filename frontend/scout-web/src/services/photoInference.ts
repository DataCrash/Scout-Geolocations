import * as tf from "@tensorflow/tfjs";

export type PhotoInferenceResult = {
  label: string;
  confidence: number;
  brightness: number;
  contrast: number;
  requiresBackendFallback: boolean;
  engine: "tfjs-baseline";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = dataUrl;
  await image.decode();
  return image;
}

function inferLabel(brightness: number, contrast: number) {
  if (contrast >= 0.22 && brightness >= 0.35 && brightness <= 0.78) {
    return "Marco urbano detectado";
  }

  if (brightness < 0.28) {
    return "Imagem escura demais";
  }

  if (contrast < 0.12) {
    return "Cena com pouco detalhe";
  }

  return "Cena urbana provável";
}

export async function analyzePhotoLocally(
  dataUrl: string,
): Promise<PhotoInferenceResult> {
  await tf.ready();

  const image = await loadImage(dataUrl);
  const pixels = tf.browser.fromPixels(image).toFloat().div(255);
  const grayscale = pixels.mean(2);
  const meanTensor = grayscale.mean();
  const varianceTensor = grayscale.sub(meanTensor).square().mean();

  const brightness = (await meanTensor.data())[0] ?? 0;
  const variance = (await varianceTensor.data())[0] ?? 0;
  const contrast = Math.sqrt(variance);
  const confidence = clamp(0.45 + contrast * 1.1 - Math.abs(brightness - 0.55), 0.15, 0.96);

  tf.dispose([pixels, grayscale, meanTensor, varianceTensor]);

  return {
    label: inferLabel(brightness, contrast),
    confidence,
    brightness,
    contrast,
    requiresBackendFallback: confidence < 0.72,
    engine: "tfjs-baseline",
  };
}
