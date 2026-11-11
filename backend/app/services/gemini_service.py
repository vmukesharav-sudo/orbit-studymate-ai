import os
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from fastapi import HTTPException

from app.core.config import settings

class GeminiService:
    def __init__(self):
        self._client = None
        self._cached_api_key = None

    def get_client(self, api_key_override: Optional[str] = None):
        """
        Initializes and returns the Google Gen AI client.
        Supports dynamic runtime API key updates from settings/user.
        """
        api_key = api_key_override or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise HTTPException(
                status_code=400,
                detail="Google Gemini API key is not configured. Please add GEMINI_API_KEY in your backend/.env file or through the ORBIT Settings page."
            )
        
        # If client already cached with same key, return it
        if self._client and self._cached_api_key == api_key:
            return self._client

        try:
            from google import genai
            self._client = genai.Client(api_key=api_key)
            self._cached_api_key = api_key
            return self._client
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="google-genai SDK is not installed properly. Please run 'pip install google-genai'."
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize Gemini client: {str(e)}"
            )

    def _clean_json_response(self, text: str) -> str:
        """Strips markdown code fences and extraneous text to parse clean JSON."""
        text = text.strip()
        # Find json block inside ```json ... ``` or ``` ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1).strip()
        return text

    def _call_gemini(self, prompt: str, system_instruction: Optional[str] = None, json_mode: bool = False, api_key_override: Optional[str] = None) -> str:
        client = self.get_client(api_key_override)
        model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"

        try:
            config = {}
            if system_instruction:
                config["system_instruction"] = system_instruction
            if json_mode:
                config["response_mime_type"] = "application/json"

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config if config else None
            )

            if not response or not response.text:
                raise HTTPException(status_code=502, detail="Empty response received from Gemini API.")
            
            return response.text
        except HTTPException:
            raise
        except Exception as e:
            err_msg = str(e)
            if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
                raise HTTPException(status_code=429, detail="Gemini API rate limit exceeded. Please wait a moment before trying again.")
            if "API_KEY_INVALID" in err_msg or "PERMISSION_DENIED" in err_msg:
                raise HTTPException(status_code=401, detail="Invalid Gemini API key. Please check your credentials in Settings or .env.")
            raise HTTPException(status_code=502, detail=f"Gemini API error: {err_msg}")

    # 1. explain_topic
    def explain_topic(self, topic: str, study_mode: str = "technical", conversation_history: Optional[List[Dict[str, str]]] = None, api_key_override: Optional[str] = None) -> str:
        mode_instructions = {
            "beginner": "Explain this academic concept in very clear, simple English. Use intuitive everyday analogies, avoid technical jargon without immediately explaining it in plain words, and provide concrete examples.",
            "exam": "Provide a high-scoring, structured, university examination-style answer. Structure your response with: 1) Formal Definition, 2) Core Principles/Components, 3) Key Steps or Architecture, 4) Advantages & Disadvantages, and 5) An illustrative ASCII diagram or table if applicable.",
            "technical": "Provide an in-depth engineering explanation. Cover foundational theory, algorithmic complexity, architectural trade-offs, internal mechanics, and real-world industrial implementations.",
            "revision": "Provide high-density rapid revision notes. Use bullet points, bold key terms, list critical formulas/equations, highlight common exam pitfalls, and give 3 memory hooks/mnemonics.",
            "coding": "Explain this concept from a software engineering perspective. Provide clean, production-grade code examples with syntax comments, edge-case considerations, time/space complexity, and practical usage examples."
        }

        mode_prompt = mode_instructions.get(study_mode.lower(), mode_instructions["technical"])
        system_instruction = (
            "You are ORBIT, an elite Gemini-powered academic tutor and learning companion for college and university students. "
            f"Current Study Mode: {study_mode.upper()}.\n"
            f"{mode_prompt}\n"
            "Format your answers with clean markdown headings, bold accents, bullet points, and code blocks where helpful."
        )

        history_context = ""
        if conversation_history:
            formatted_history = []
            for item in conversation_history[-6:]:
                role = "Student" if item.get("sender") == "user" else "ORBIT"
                formatted_history.append(f"{role}: {item.get('content', '')}")
            history_context = "Recent conversation context:\n" + "\n".join(formatted_history) + "\n\n"

        prompt = f"{history_context}Student Question:\n{topic}"
        return self._call_gemini(prompt, system_instruction=system_instruction, api_key_override=api_key_override)

    # 2. answer_document_question
    def answer_document_question(self, question: str, document_context: str, study_mode: str = "technical", conversation_history: Optional[List[Dict[str, str]]] = None, api_key_override: Optional[str] = None) -> Tuple[str, List[int]]:
        """
        Answers questions strictly grounded in uploaded document context.
        Returns (response_text, cited_pages).
        """
        system_instruction = (
            "You are ORBIT Document Intelligence AI. Your task is to assist the student by answering questions based on their uploaded document.\n"
            "CRITICAL GROUNDING RULES:\n"
            "1. Ground your answer primarily in the provided document excerpts. When referencing facts, definitions, or formulas, cite the specific page using format [Page X].\n"
            "2. If the user asks about something NOT mentioned anywhere in the document excerpts, explicitly state: '⚠️ Note: This specific topic is not covered in your uploaded document excerpts. However, here is the conceptual explanation based on general knowledge:' and then answer.\n"
            "3. Never hallucinate page numbers. Only cite page numbers present in the provided document headers.\n"
            "4. Format your answer with clean markdown, clear sections, and readable typography."
        )

        history_context = ""
        if conversation_history:
            formatted_history = []
            for item in conversation_history[-4:]:
                role = "Student" if item.get("sender") == "user" else "ORBIT"
                formatted_history.append(f"{role}: {item.get('content', '')}")
            history_context = "Recent conversation context:\n" + "\n".join(formatted_history) + "\n\n"

        prompt = (
            f"{history_context}"
            f"=== DOCUMENT CONTEXT ===\n{document_context}\n=========================\n\n"
            f"Student Question: {question}\n\n"
            f"Provide a thorough, grounded answer adhering to the study mode '{study_mode}' and citing page references wherever appropriate."
        )

        response_text = self._call_gemini(prompt, system_instruction=system_instruction, api_key_override=api_key_override)

        # Extract cited pages from response like [Page 3], [Page 12]
        cited_pages = []
        matches = re.findall(r"\[Page\s*(\d+)\]", response_text, re.IGNORECASE)
        for m in matches:
            try:
                page_int = int(m)
                if page_int not in cited_pages:
                    cited_pages.append(page_int)
            except ValueError:
                pass

        return response_text, sorted(cited_pages)

    # 3. generate_summary
    def generate_summary(self, text_content: str, summary_type: str = "detailed", title: Optional[str] = None, api_key_override: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates structured summary including key definitions, key formulas, and main points.
        Returns a dict matching Summary schema.
        """
        system_instruction = (
            "You are ORBIT's Academic Summary Synthesizer. Analyze the provided study material and generate a comprehensive, high-yield summary.\n"
            "You must respond in valid JSON format with the following keys:\n"
            "{\n"
            '  "title": "Clear concise topic title",\n'
            '  "summary_type": "short | detailed | chapter | definitions | key_points | exam",\n'
            '  "content": "Rich markdown text containing the complete structured summary with Introduction, Core Concepts, In-Depth Breakdown, and Academic Conclusion.",\n'
            '  "key_definitions": ["Definition 1 with term in bold", "Definition 2..."],\n'
            '  "key_formulas": ["Formula 1: Description", "Formula 2..."],\n'
            '  "important_points": ["Key takeaway point 1", "Key takeaway point 2..."]\n'
            "}"
        )

        prompt = (
            f"Generate a {summary_type.upper()} summary for the following academic text:\n"
            f"Document Title: {title or 'Study Document'}\n"
            f"Content:\n{text_content[:20000]}\n\n"
            f"Return ONLY valid JSON."
        )

        raw_output = self._call_gemini(prompt, system_instruction=system_instruction, json_mode=True, api_key_override=api_key_override)
        clean_json = self._clean_json_response(raw_output)

        try:
            data = json.loads(clean_json)
            # Ensure required fields exist
            if not isinstance(data.get("key_definitions"), list):
                data["key_definitions"] = []
            if not isinstance(data.get("key_formulas"), list):
                data["key_formulas"] = []
            if not isinstance(data.get("important_points"), list):
                data["important_points"] = []
            if not data.get("content"):
                data["content"] = clean_json
            if not data.get("title"):
                data["title"] = title or "Academic Summary"
            return data
        except Exception:
            return {
                "title": title or "Academic Summary",
                "summary_type": summary_type,
                "content": raw_output,
                "key_definitions": [],
                "key_formulas": [],
                "important_points": []
            }

    # 4. generate_quiz
    def generate_quiz(self, topic_or_doc: str, difficulty: str = "medium", question_count: int = 5, question_type: str = "mcq", api_key_override: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Generates interactive quiz questions with options, correct answer, explanation, and topic tag.
        """
        system_instruction = (
            "You are ORBIT's Adaptive Quiz Engine. Generate high-quality college-level assessment questions.\n"
            "You must respond with a JSON array of questions, formatted exactly as:\n"
            "[\n"
            "  {\n"
            '    "question_text": "The question prompt",\n'
            '    "question_type": "mcq",\n'
            '    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],\n'
            '    "correct_answer": "Option A text",\n'
            '    "explanation": "Detailed explanation of why this answer is correct and why other options are incorrect.",\n'
            '    "topic_tag": "Specific subtopic name"\n'
            "  }\n"
            "]\n"
            "For 'true_false' questions, options must be ['True', 'False'].\n"
            "Ensure the correct_answer EXACTLY matches one of the options in the options array."
        )

        prompt = (
            f"Generate exactly {question_count} {difficulty.upper()} difficulty questions for college examination prep.\n"
            f"Question Type: {question_type}\n"
            f"Topic/Material:\n{topic_or_doc[:12000]}\n\n"
            f"Respond ONLY with a JSON array of questions."
        )

        raw_output = self._call_gemini(prompt, system_instruction=system_instruction, json_mode=True, api_key_override=api_key_override)
        clean_json = self._clean_json_response(raw_output)

        try:
            questions = json.loads(clean_json)
            if isinstance(questions, dict) and "questions" in questions:
                questions = questions["questions"]
            if not isinstance(questions, list):
                raise ValueError("Expected JSON array of questions")
            return questions
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to parse quiz questions from Gemini: {str(e)}")

    # 5. generate_study_plan
    def generate_study_plan(self, subject_name: str, exam_date: str, daily_hours: float, units_count: int, topics_list: Optional[str] = None, difficulty: str = "medium", api_key_override: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates a realistic day-by-day exam preparation timetable with tasks, durations, and revision intervals.
        """
        system_instruction = (
            "You are ORBIT's AI Academic Strategist. Create a realistic, high-efficiency examination preparation plan.\n"
            "Do NOT exceed the student's daily available study hours.\n"
            "Include phased preparation: 1) Initial Learning, 2) Practice & Problem Solving, 3) Active Recall & Revision, 4) Full Mock Test.\n"
            "Respond in JSON format with keys:\n"
            "{\n"
            '  "overview": "Comprehensive strategic study advice and timetable overview",\n'
            '  "tasks": [\n'
            "    {\n"
            '      "day_offset": 0,\n'
            '      "title": "Unit 1: Foundations & Architecture",\n'
            '      "description": "Read core notes and complete 5 practice questions",\n'
            '      "duration_minutes": 90,\n'
            '      "task_type": "study"\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "task_type must be one of: 'study', 'revision', 'practice', 'mock'."
        )

        prompt = (
            f"Create an exam preparation timetable for:\n"
            f"Subject: {subject_name}\n"
            f"Exam Date: {exam_date}\n"
            f"Daily Available Hours: {daily_hours} hours/day\n"
            f"Units/Modules Count: {units_count}\n"
            f"Key Topics/Syllabus: {topics_list or 'Standard college curriculum for this subject'}\n"
            f"Difficulty Level: {difficulty}\n\n"
            f"Respond ONLY in valid JSON format."
        )

        raw_output = self._call_gemini(prompt, system_instruction=system_instruction, json_mode=True, api_key_override=api_key_override)
        clean_json = self._clean_json_response(raw_output)

        try:
            plan_data = json.loads(clean_json)
            return plan_data
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Failed to parse study plan from Gemini: {str(e)}")

    # 6. analyze_learning_progress
    def analyze_learning_progress(self, user_name: str, stats_summary: Dict[str, Any], api_key_override: Optional[str] = None) -> List[str]:
        """
        Generates personalized AI insights and improvement recommendations based on actual student activity.
        """
        system_instruction = (
            "You are ORBIT's Learning Analytics Advisor. Analyze the student's real metrics and generate 3 to 4 sharp, actionable, encouraging insights.\n"
            "Respond with a JSON array of strings, e.g. ['Insight 1...', 'Insight 2...']"
        )

        prompt = (
            f"Student: {user_name}\n"
            f"Metrics:\n"
            f"- Total Documents Uploaded: {stats_summary.get('total_documents', 0)}\n"
            f"- Quizzes Completed: {stats_summary.get('quizzes_completed', 0)}\n"
            f"- Average Quiz Score: {stats_summary.get('average_score', 0)}%\n"
            f"- Total Study Hours: {stats_summary.get('study_hours', 0)}\n"
            f"- Recent Weak Topics: {stats_summary.get('weak_topics', [])}\n"
            f"- Study Tasks Completed: {stats_summary.get('completed_tasks', 0)} of {stats_summary.get('total_tasks', 0)}\n\n"
            f"Provide 3-4 personalized recommendations."
        )

        raw_output = self._call_gemini(prompt, system_instruction=system_instruction, json_mode=True, api_key_override=api_key_override)
        clean_json = self._clean_json_response(raw_output)

        try:
            insights = json.loads(clean_json)
            if isinstance(insights, list):
                return insights
            if isinstance(insights, dict) and "insights" in insights:
                return insights["insights"]
            return [clean_json]
        except Exception:
            return [
                "Maintain your active study streak by scheduling a 25-minute focused session today.",
                "Review your recent quiz performance to turn identified weak areas into strong concepts.",
                "Use the Document Intelligence workspace to generate targeted revision notes before examinations."
            ]

gemini_service = GeminiService()

