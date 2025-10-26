import os
from supabase import create_client, Client
from dotenv import load_dotenv
from models import Candidate, Job, QAPair

# Load environment variables from .env.local
load_dotenv(".env.local")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def _normalize(val):
    """Normalize text/list fields for consistent processing."""
    if val is None:
        return []
    if isinstance(val, list):
        return val
    return [v.strip() for v in str(val).split(",") if v.strip()]


def fetch_candidate_by_app_id(app_id: str) -> Candidate:
    """Fetch candidate info + behavioral transcript for given app_id."""
    # 1. Fetch application row
    app_resp = (
        supabase.table("application")
        .select("app_id, name, email, job_id")
        .eq("app_id", app_id)
        .execute()
    )

    if not app_resp.data:
        raise ValueError(f"No application found for app_id={app_id}")

    app_row = app_resp.data[0]

    # 2. Fetch most recent interview (if any)
    intv_resp = (
        supabase.table("interview")
        .select("interview_id, created_at")
        .eq("app_id", app_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    interview_row = intv_resp.data[0] if intv_resp.data else None
    interview_id = interview_row["interview_id"] if interview_row else None

    # 3. Fetch all agent responses for that interview (if any)
    behavioral_transcript = []
    if interview_id:
        agent_resp = (
            supabase.table("agent")
            .select("round, type, response")
            .eq("interview_id", interview_id)
            .execute()
        )

        for row in agent_resp.data or []:
            question_label = f"{row.get('type', 'unknown')} (round {row.get('round', '?')})"
            answer_text = row.get("response", "")
            behavioral_transcript.append(QAPair(question=question_label, answer=answer_text))

    # Build Candidate object
    candidate_obj = Candidate(
        name=app_row.get("name", "Unknown Candidate"),
        resume_skills=["placeholder-skill"],
        years_experience=2,
        projects=["placeholder-project"],
        behavioral_transcript=behavioral_transcript,
    )

    return candidate_obj


def fetch_job_by_app_id(app_id: str) -> Job:
    """Fetch job info associated with a given app_id."""
    # 1. Find job_id from application
    app_resp = (
        supabase.table("application")
        .select("job_id")
        .eq("app_id", app_id)
        .execute()
    )

    if not app_resp.data or not app_resp.data[0].get("job_id"):
        raise ValueError(f"No job_id found for app_id={app_id}")

    job_id = app_resp.data[0]["job_id"]

    # 2. Fetch job details
    job_resp = (
        supabase.table("job")
        .select("title, required_skills, preferred_skills, description")
        .eq("job_id", job_id)
        .execute()
    )

    if not job_resp.data:
        raise ValueError(f"No job found for job_id={job_id}")

    job_row = job_resp.data[0]

    job_obj = Job(
        title=job_row.get("title", "Unknown Role"),
        required_skills=_normalize(job_row.get("required_skills")),
        culture_traits=_normalize(job_row.get("preferred_skills")),
        min_years_experience=2,  # placeholder until added to DB
    )

    return job_obj