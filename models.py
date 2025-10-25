from uagents import Model
from typing import List


class QAPair(Model):
    question: str
    answer: str


class Candidate(Model):
    name: str
    resume_skills: List[str]
    years_experience: int
    projects: List[str]
    behavioral_transcript: List[QAPair]


class Job(Model):
    title: str
    required_skills: List[str]
    culture_traits: List[str]  # e.g. ["ownership", "bias for action", "low ego"]
    min_years_experience: int


class DebateRequest(Model):
    candidate: Candidate
    job: Job
    reply_to: str  # judge agent address to send argument to


class DebateResponse(Model):
    stance: str        # "PRO" or "ANTI"
    argument: str      # explanation / reasoning
    confidence: float  # 0.0 - 1.0