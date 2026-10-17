from dotenv import load_dotenv
load_dotenv()

import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import base64
from typing import Optional

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are MechAI, an expert automotive diagnostic co-pilot and trusted mechanic's friend created by TorqueIQ.
Your job is to assist workshop technicians and mechanics in diagnosing vehicle faults quickly, accurately, and safely.

ALWAYS respond with clear, practical, workshop-ready English. Explain technical details simply and directly.
Structure your response EXACTLY in this JSON format:

{
  "summary": "One sentence plain English explanation of the fault",
  "obd_code_analysis": {
    "code": "The OBD-II code analyzed or 'N/A'",
    "technical_meaning": "Official SAE definition of the DTC",
    "symptom_correlation": "How this code correlates directly with the vehicle's symptoms and telemetry"
  },
  "root_causes": [
    {"rank": 1, "cause": "Most likely reason", "probability": "85%", "explanation": "Simple explanation"},
    {"rank": 2, "cause": "Second likely reason", "probability": "10%", "explanation": "Simple explanation"},
    {"rank": 3, "cause": "Third possible reason", "probability": "5%", "explanation": "Simple explanation"}
  ],
  "fix_steps": [
    {"step": 1, "action": "What to do", "tool_needed": "Tool required", "time_estimate": "X mins"},
    {"step": 2, "action": "What to do next", "tool_needed": "Tool required", "time_estimate": "X mins"}
  ],
  "parts_needed": [
    {"part": "Part name", "estimated_cost": "$XX - $XX", "urgency": "Immediate/Soon/Optional"}
  ],
  "labor_hours_estimate": "1.5 hours",
  "safe_to_drive": "YES / NO / DRIVE WITH CAUTION",
  "safety_warning": "Any safety concerns in plain English",
  "escalate_to_expert": false,
  "escalation_reason": "Reason if escalation needed"
}"""

model = genai.GenerativeModel(
    model_name="gemini-3.8-flash",
    system_instruction=SYSTEM_PROMPT,
    generation_config={
        "temperature": 0.2,
        "top_p": 0.8,
        "max_output_tokens": 4096,
        "response_mime_type": "application/json"
    },
    safety_settings={
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE
    }
)

async def analyze_fault(
    car_brand: str,
    car_model: str,
    car_year: int,
    issue_description: str,
    obd_code: Optional[str] = None,
    language: str = "en",
    image_data: Optional[bytes] = None,
    video_data: Optional[bytes] = None,
    image_mime: str = "image/jpeg",
    video_mime: str = "video/mp4"
) -> dict:
    """
    Core multimodal analysis function using Gemini.
    Accepts text description + optional image/video + language preference.
    """
    prompt_text = f"""
    VEHICLE INFORMATION:
    - Brand: {car_brand}
    - Model: {car_model}
    - Year: {car_year}

    REPORTED ISSUE:
    {issue_description}
    """
    if obd_code:
        prompt_text += f"\n    OBD-II / DTC FAULT CODE:\n    {obd_code}\n"
        prompt_text += "\n    Correlate this specific OBD-II code with the reported symptoms and explain the failure mechanism in detail."

    if language in ["hi", "hindi"]:
        prompt_text += """
    LANGUAGE INSTRUCTION (MANDATORY):
    The technician requested HINDI. 
    Provide all explanations, summary, root cause explanations, fix step actions, and safety warnings in natural, clear, workshop-friendly HINDI (Devanagari script) so a Hindi-speaking Indian mechanic can easily follow it. You can keep technical part names (e.g., Spark Plug, Fuel Injector, Brake Rotor, Sensor) in English or common garage vocabulary, but explain all steps and diagnoses in Hindi!
    """

    prompt_text += """
    Please analyze this automotive fault and provide a complete diagnosis.
    Provide clear, practical, and actionable workshop instructions for the technician.
    """

    content_parts = [prompt_text]

    if image_data:
        content_parts.append({
            "mime_type": image_mime,
            "data": base64.b64encode(image_data).decode("utf-8")
        })

    if video_data:
        content_parts.append({
            "mime_type": video_mime,
            "data": base64.b64encode(video_data).decode("utf-8")
        })

    response = model.generate_content(content_parts)

    import json
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {"raw_response": response.text, "parse_error": True}


# Chat model optimized for ultra-fast, conversational voice interaction
chat_model = genai.GenerativeModel(
    model_name="gemini-3.8-flash",
    system_instruction="""You are MechAI, the mechanic's trusted workshop co-pilot created by TorqueIQ.
You are communicating directly via real-time VOICE with a busy technician working on a car in a garage.
RULES FOR YOUR VOICE REPLIES:
1. Be ultra-concise, conversational, and direct (1 to 2 crisp sentences max, strictly under 25 words).
2. Answer the question immediately without disclaimers, preamble, or filler.
3. NEVER use markdown symbols, asterisks (**), bullet points, or numbered lists, because your answer is spoken out loud through text-to-speech.
4. If Hindi is requested, speak in natural garage Hindi using common mechanic terminology.""",
    generation_config={
        "temperature": 0.2,
        "top_p": 0.8,
        "max_output_tokens": 100
    }
)

async def chat_followup(conversation_history: list, new_message: str, language: str = "en") -> str:
    """Handle follow-up chat questions after initial diagnosis with ultra-fast latency."""
    formatted_history = []
    # Keep only the last 4 exchanges to keep context compact and super fast
    for msg in conversation_history[-4:]:
        formatted_history.append({
            "role": msg["role"],
            "parts": msg["parts"]
        })

    chat = chat_model.start_chat(history=formatted_history)
    
    msg_to_send = new_message
    if language in ["hi", "hindi"]:
        msg_to_send += "\n[Reply in 1-2 punchy sentences in clear, natural Hindi for voice speech. Under 25 words.]"
    else:
        msg_to_send += "\n[Reply in 1-2 punchy sentences in clear, direct English for voice speech. Under 25 words.]"

    response = chat.send_message(msg_to_send)
    cleaned = response.text.replace('*', '').replace('#', '').strip()
    return cleaned
