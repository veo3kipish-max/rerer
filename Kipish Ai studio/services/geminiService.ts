import { PhotoshootPlan, UploadedImage } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment
const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || 'AIzaSyBfhvwy-mW4ze4HQrLhTPBcsqidB5SWAD4';
};

// Initialize AI client
const getAiClient = () => {
  const key = getApiKey();
  if (!key) {
    console.warn("API Key is missing!");
  }
  return new GoogleGenerativeAI(key);
};

// ... (imports and getAiClient are already set in previous step)

/**
 * Step 1: Analyze inputs to create a cohesive photoshoot plan.
 */
export const planPhotoshoot = async (
  userPhotos: UploadedImage[],
  locationPhotos: UploadedImage[],
  locationText: string,
  userPrompt: string,
  tattooPhotos: UploadedImage[],
  tattooLocation: string,
  hairstylePhotos: UploadedImage[],
  hairstyleText: string,
  makeupPhotos: UploadedImage[],
  makeupText: string,
  outfitPhotos: UploadedImage[],
  outfitText: string,
  posePhotos: UploadedImage[],
  poseText: string,
  cameraAngles: string[] = [],
  imageCount: number = 5,
  isSelfieMode: boolean = false,
  isReplicateMode: boolean = false
): Promise<PhotoshootPlan> => {
  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  // Prepare image parts helper
  const toPart = (img: UploadedImage) => ({
    inlineData: { mimeType: img.mimeType, data: img.base64Data }
  });

  let textPrompt = "";
  let imageParts = [
    ...userPhotos.map(toPart),
    ...locationPhotos.map(toPart),
    ...tattooPhotos.map(toPart),
    ...hairstylePhotos.map(toPart),
    ...makeupPhotos.map(toPart),
    ...outfitPhotos.map(toPart)
  ];

  if (isReplicateMode) {
    textPrompt = `
You are an expert AI photographer assistant. The user wants to perform a "Style Transfer" or "Subject Replacement".
They have provided "Location/Reference Photos" and "User Photos".

**Goal:** Create a plan to REPLICATE the "Location/Reference Photos" exactly (pose, composition, lighting, background) but replacing the person with the character from "User Photos".

**Instructions:**
1. **Analyze Subject:** Describe the person in the "User Photos" (physique, face features, tattoos).
2. **Analyze Reference Scenes:** Look at the "Location Photos". These are the EXACT scenes to be recreated.
3. **Create Scenarios:** Generate ${imageCount} scenarios.
   - If the user provided multiple Location Photos, map them to scenarios.
   - If there are fewer location photos than ${imageCount}, describe variations of the provided references.
   - The "Action", "Pose", and "Angle" MUST match the visual content of the Location Photos.

**Output Requirement:**
Return ONLY a single JSON object matching this structure:
{
  "characterDescription": "Detailed physical description of the person from User Photos.",
  "outfitDescription": "Description of the outfit worn in the Location Photos (or User Photos if specified).",
  "locationDescription": "Description of the background/scene in the Location Photos.",
  "scenarios": [
    { "angle": "Same as reference", "pose": "Same as reference", "action": "Same as reference", "lighting": "Same as reference" }
  ]
}
    `;
  } else if (isSelfieMode) {
    textPrompt = `
You are a creative assistant planning a ${imageCount}-image selfie series. Your task is to generate a JSON plan.

**Instructions:**
1. **Analyze Subject & Style:** Examine the user photos, general prompt ("${userPrompt}"), and any style add-ons (hairstyle, makeup, outfit, tattoos) to create a detailed description of the subject and a single, consistent style that will be used in ALL selfies.
2. **Analyze Background:** Use the location photos and text to describe a background setting for the selfies.
3. **Create Selfie Scenarios:** Design ${imageCount} scenarios. The "angle" must be a typical selfie angle (e.g., 'high-angle selfie', 'selfie in a mirror'). The "pose" and "action" must be natural for a person taking a selfie.

**Output Requirement:**
Return ONLY a single JSON object matching this structure:
{
  "characterDescription": "Detailed physical description of the person, including any tattoos.",
  "outfitDescription": "Highly detailed description of the full look (outfit, hairstyle, makeup).",
  "locationDescription": "Detailed description of the background location.",
  "scenarios": [
    { "angle": "selfie angle", "pose": "selfie pose", "action": "selfie action", "lighting": "natural lighting" }
  ]
}
    `;
  } else {
    imageParts.push(...posePhotos.map(toPart));
    const hasPoseInput = posePhotos.length > 0 || poseText.trim() !== '';
    const hasCameraAngles = cameraAngles.length > 0;

    textPrompt = `
You are a professional fashion art director planning a ${imageCount}-image photoshoot. Your task is to generate a JSON plan.

**CRITICAL INSTRUCTION - "7 PECAN USE":**
You MUST use EVERY piece of information provided by the user. Do not ignore any text or image input.
- User Prompt: "${userPrompt}"
- Tattoo Details: "${tattooLocation}" (Image provided: ${tattooPhotos.length > 0})
- Hairstyle Details: "${hairstyleText}" (Image provided: ${hairstylePhotos.length > 0})
- Makeup Details: "${makeupText}" (Image provided: ${makeupPhotos.length > 0})
- Outfit Details: "${outfitText}" (Image provided: ${outfitPhotos.length > 0})
- Location Text: "${locationText}" (Image provided: ${locationPhotos.length > 0})
- Pose Details: "${poseText}" (Image provided: ${posePhotos.length > 0})

**LOCATION RULES:**
1. If the user provided Location Text (atmosphere, style, elements), it must be fully integrated into the "locationDescription".
2. If the user provided Location Photos, they must be treated as DIRECT VISUAL REFERENCES. The "locationDescription" must describe these photos exactly (lighting, colors, objects).
3. Do not ignore partial data. Merge text and photo details into a single cohesive setting.

**Instructions:**
1. **Analyze Subject & Style:** Integrate the user photos, general prompt, and ALL style add-ons (hairstyle, makeup, outfit, tattoos) into a comprehensive subject/style description.
2. **Analyze Location:** Use the location photos and text to define a unified background setting, strictly following the LOCATION RULES.
3. **Analyze Pose:** ${hasPoseInput ? "Examine the provided pose references/text. This specific pose MUST be the core basis for all scenarios." : "Decide on natural poses fitting the context."}
4. **Create Photoshoot Scenarios:** Design ${imageCount} detailed scenarios.
   ${hasCameraAngles ? `MANDATORY: You MUST use these camera angles across the scenarios: ${cameraAngles.join(', ')}.` : ""}

**Output Requirement:**
Return ONLY a single JSON object matching this structure:
{
  "characterDescription": "Detailed physical description of the person, including any tattoos.",
  "outfitDescription": "Highly detailed description of the full look (outfit, hairstyle, makeup).",
  "locationDescription": "Detailed atmospheric description of the location.",
  "scenarios": [
    { "angle": "Camera angle", "pose": "Specific pose", "action": "What the subject is doing", "lighting": "Lighting specifics" }
  ]
}
    `;
  }

  try {
    const result = await model.generateContent([textPrompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Model returned empty response.");
    }

    const plan: PhotoshootPlan = JSON.parse(text);
    return plan;
  } catch (error: any) {
    console.error("Plan Photoshoot Error:", error);
    throw new Error(`Failed to plan photoshoot: ${error.message}`);
  }
};

/**
 * Step 2: Generate a single image based on the plan and a reference photo.
 */
// Helper to call AI Model for Image Generation
// Helper to call AI Model for Image Generation
// Helper to call AI Model for Image Generation
async function generateImage(prompt: string, modelName: string = "gemini-2.5-flash-image", aspectRatio: string = "3:4", referenceImage?: UploadedImage, locationImage?: UploadedImage): Promise<string> {
  const apiKey = getApiKey();

  // 1. Handle Gemini Models (via generateContent)
  if (modelName.startsWith("gemini-")) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // Inject aspect ratio into prompt since generationConfig isn't reliable for it
    const enhancedPrompt = `${prompt} --aspect_ratio ${aspectRatio.replace(':', ':')}`;

    // Prepare parts array with text prompt
    const parts: any[] = [{ text: enhancedPrompt }];

    // If reference image (FACE) exists, add it
    if (referenceImage) {
      parts.push({
        inlineData: {
          mimeType: referenceImage.mimeType,
          data: referenceImage.base64Data
        }
      });
      parts.push({ text: "Reference Image 1: Use this face/person as the subject." });
    }

    // If location image exists, add it
    if (locationImage) {
      parts.push({
        inlineData: {
          mimeType: locationImage.mimeType,
          data: locationImage.base64Data
        }
      });
      parts.push({ text: "Reference Image 2: Use this image as the background/location style." });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: parts }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Image API error: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (inlineData && inlineData.data) {
      return inlineData.data;
    }
    throw new Error("No image data in Gemini response");
  }

  // 2. Handle Imagen Models (via predict)
  else {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: prompt, aspectRatio: aspectRatio }],
        parameters: { sampleCount: 1 }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Imagen API error: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      return data.predictions[0].bytesBase64Encoded;
    }
    throw new Error("No image data in Imagen response");
  }
}

export const generateScenarioImage = async (
  plan: PhotoshootPlan,
  scenarioIndex: number,
  referencePhoto: UploadedImage,
  positivePrompt: string,
  negativePrompt: string,
  useProModel: boolean = false,
  sceneReferencePhoto?: UploadedImage,
  isReplicateMode: boolean = false
): Promise<{ base64: string, prompt: string }> => {

  const safeIndex = scenarioIndex % plan.scenarios.length;
  const scenario = plan.scenarios[safeIndex];

  // 1. Construct a powerful prompt for Imagen
  // We can trust Plan + User inputs. 
  // Optionally use Gemini to refine it, but usually Plan is already good.

  let finalPrompt = "";

  // Basic Prompt Construction
  const subjectDesc = plan.characterDescription || "A person";
  const outfitDesc = plan.outfitDescription || "";
  const sceneDesc = isReplicateMode && sceneReferencePhoto
    ? `matching the exact composition, lighting, and style of the reference scene`
    : `${scenario.action} at ${plan.locationDescription}`;

  const style = `Professional photography, 8k, highly detailed, realistic texture, ${positivePrompt}, ${scenario.lighting}, ${scenario.angle}`;
  const negative = `cartoon, painting, illustration, ${negativePrompt}`;

  finalPrompt = `Photo of ${subjectDesc} wearing ${outfitDesc}, ${sceneDesc}. ${style}. --negative_prompt: ${negative}`;

  // If we want to use Gemini to "Refine" prompt further or check safety, we can do it here.
  // But to save time and tokens, let's construct directly or do a quick pass if needed.
  // Let's do a quick pass with Gemini to combine everything into one "Perfect Imagen Prompt".

  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const enhancementPrompt = `
    Create a single, highly descriptive prompt for an AI image generator (Imagen 3) based on these details:
    Subject: ${subjectDesc}
    Outfit: ${outfitDesc}
    Context: ${plan.locationDescription}
    Action: ${scenario.action}
    Pose: ${scenario.pose}
    Mood: ${scenario.lighting}
    Style: ${positivePrompt}

    MANDATORY RULES:
    1. LOCATION CONSISTENCY: ALL location text descriptions AND location photos provided by the user must be used on 100%. If a photo is provided, copy its style/background exactly.
    2. FULL INPUT UTILIZATION: You MUST use ALL provided details from the Subject, Outfit, and Context descriptions. Every element must be visual in the final image.
    3. IDENTITY TRANSFER (MOST IMPORTANT): You MUST transfer the face from the reference description/image exactly. The generated person MUST BE THE SAME person as described.
    2. REALISM: Realistic full-body (or portrait) photograph, high resolution (8 K), ultra-realistic skin texture, visible pores, natural skin tone, realistic eye color, true hair color and hair texture, natural eyelashes and eyebrows, fine detail.
    3. FACE DETAILS: Maintain exact facial features: shape of eyes, nose, lips, cheekbones, jawline — no stylization, no smoothing, no “improvement”, no exaggeration.
    4. BODY: Preserve body proportions exactly: height, limb length, posture, body build, realistic anatomy.
    5. ADAPTATION: If changing pose, angle or clothing — adapt body and face anatomically correctly, preserving identity, proportions and natural look.
    6. LIGHTING: realistic — soft or studio-style natural light, with natural shadows and highlights; skin shading should reflect realistic light physics (not flat or “CG-like”).
    7. IDENTITY INTEGRITY: Background / clothes / environment may change, but do not alter face or body identity. Clothes should drape naturally, follow anatomy.
    8. PHOTO STYLE: ultra-realistic portrait or full-body photo (studio portrait, natural light indoor/outdoor, soft daylight, dramatic studio light). Use realistic camera settings: e.g. 50 mm or 85 mm lens, shallow/depth-of-field if portrait.
    9. NO STYLIZATION: Avoid any stylized art style — no cartoon, no painting, no “fantasy art look”, no surreal effects. Only realistic photography style, like taken by a professional photographer.
    10. CONSISTENCY: Use multiple reference cues to help AI preserve identity and proportions in different angles and poses.

    OUTPUT ONLY THE PROMPT TEXT. No explanations.
  `;

  let bestPrompt = finalPrompt;

  try {
    const result = await model.generateContent(enhancementPrompt);
    const response = await result.response;
    const text = response.text();
    if (text && text.length > 10) { // Check for a meaningful response
      bestPrompt = text.trim();
    }
  } catch (e) {
    console.warn("Gemini prompt enhancement failed, using fallback prompt", e);
  }

  // 2. Call Imagen 3 (via REST, as SDK support varies)
  try {
    console.log("Generating image with prompt:", bestPrompt);
    // Always use Nano Banana Pro (Gemini 3 Pro) for maximum quality
    const modelName = "gemini-3-pro-image-preview";
    const base64 = await generateImage(bestPrompt, modelName, "3:4", referencePhoto, sceneReferencePhoto);
    return { base64, prompt: bestPrompt };
  } catch (error: any) {
    console.error("Imagen generation failed:", error);
    throw error;
  }
};