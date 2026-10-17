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
    image_data: Optional[bytes] = None,
    video_data: Optional[bytes] = None,
    image_mime: str = "image/jpeg",
    video_mime: str = "video/mp4"
) -> dict:
    """
    Core multimodal analysis function using Gemini.
    Accepts text description + optional image/video.
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


# Chat model without the strict JSON requirement
chat_model = genai.GenerativeModel(
    model_name="gemini-3.5-flash",
    system_instruction="You are MechAI, a helpful automotive diagnostic assistant. The user is asking follow-up questions about a diagnosis. Answer in plain, helpful English. Keep responses short and directly address the user's question.",
    generation_config={
        "temperature": 0.3,
        "top_p": 0.8,
    }
)

async def chat_followup(conversation_history: list, new_message: str) -> str:
    """Handle follow-up chat questions after initial diagnosis."""
    formatted_history = []
    for msg in conversation_history:
        formatted_history.append({
            "role": msg["role"],
            "parts": msg["parts"]
        })

    chat = chat_model.start_chat(history=formatted_history)
    response = chat.send_message(new_message)
    return response.text
