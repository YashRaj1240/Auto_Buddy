from dotenv import load_dotenv
load_dotenv()

import os
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import base64
from typing import Optional

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are MechAI, an expert automotive diagnostic assistant created by TorqueIQ.
Your job is to help technicians — including those with limited ECU knowledge — diagnose vehicle faults quickly and accurately.

ALWAYS respond in simple, plain English. No jargon unless you explain it.
Structure your response EXACTLY in this JSON format:

{
  "summary": "One sentence plain English explanation of the fault",
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
  "safe_to_drive": "YES / NO / DRIVE WITH CAUTION",
  "safety_warning": "Any safety concerns in plain English",
  "escalate_to_expert": true or false,
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
    image_data: Optional[bytes] = None,
    video_data: Optional[bytes] = None,
    image_mime: str = "image/jpeg",
    video_mime: str = "video/mp4"
) -> dict:
    """
    Core multimodal analysis function using Gemini 1.5 Pro.
    Accepts text description + optional image/video.
    """
    prompt_text = f"""
    VEHICLE INFORMATION:
    - Brand: {car_brand}
    - Model: {car_model}
    - Year: {car_year}

    REPORTED ISSUE:
    {issue_description}

    Please analyze this automotive fault and provide a complete diagnosis.
    Remember: the technician may have limited ECU knowledge, so keep explanations simple.
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
    model_name="gemini-3.8-flash",
    system_instruction="You are MechAI, a helpful automotive diagnostic assistant. The user is asking follow-up questions about a diagnosis. Answer in plain, helpful English. Keep responses short and directly address the user's question.",
    generation_config={
        "temperature": 0.3,
        "top_p": 0.8,
    }
)

async def chat_followup(conversation_history: list, new_message: str) -> str:
    """Handle follow-up chat questions after initial diagnosis."""
    # Convert custom history format to Gemini format if needed
    formatted_history = []
    for msg in conversation_history:
        formatted_history.append({
            "role": msg["role"],
            "parts": msg["parts"]
        })
        
    chat = chat_model.start_chat(history=formatted_history)
    response = chat.send_message(new_message)
    return response.text
