from uagents import Agent, Context
from models import DebateRequest, QAPair
from pro_agent import pro_agent
from anti_agent import anti_agent
from judge_agent import judge_agent
from data_loader import fetch_candidate_by_app_id, fetch_job_by_app_id

print("orchestrator_agent.py: loaded ✅")

orchestrator_agent = Agent(
    name="orchestrator_agent",
    seed="orch-seed",
)

_sent = {"done": False}

APP_ID = "f7960521-0395-45bd-8814-614b66f4f90c"  # <- your real application.app_id

@orchestrator_agent.on_interval(period=1.0)
async def kickoff(ctx: Context):
    if _sent["done"]:
        return

    ctx.logger.info("Orchestrator kicking off debate ✅ (loading from Supabase)")

    try:
        candidate = fetch_candidate_by_app_id(APP_ID)
        job = fetch_job_by_app_id(APP_ID)
    except Exception as e:
        ctx.logger.error(f"Failed to load data for app_id={APP_ID}: {e}")
        return

    # 🔥 OVERRIDE: inject a fake behavioral transcript for testing
    candidate.behavioral_transcript = [
        QAPair(
            question="Tell me about a time you handled conflict on a team.",
            answer=(
                "We had a sev-1 outage and backend vs frontend were blaming each other. "
                "I got everyone on a single zoom, split tasks calmly, and we fixed it in 40 minutes. "
                "No finger-pointing."
            ),
        ),
        QAPair(
            question="What's a weakness you're working on?",
            answer=(
                "I grab too much myself instead of delegating. "
                "Lately I've been writing clear handoff docs and pairing juniors so I'm not the bottleneck."
            ),
        ),
        QAPair(
            question="Why do you want to work here?",
            answer=(
                "I like small teams where I can ship fast and own outcomes, "
                "not get stuck in approval chains."
            ),
        ),
    ]

    debate_request = DebateRequest(
        candidate=candidate,
        job=job,
        reply_to=judge_agent.address,
    )

    # send to both sides of the debate
    await ctx.send(pro_agent.address, debate_request)
    await ctx.send(anti_agent.address, debate_request)

    ctx.logger.info("Orchestrator sent debate_request ✅ (with injected transcript)")
    _sent["done"] = True