from uagents import Agent, Context
from models import Candidate, Job, DebateRequest, DebateResponse

print("anti_agent.py: loaded ✅")

anti_agent = Agent(
    name="anti_agent",
    seed="anti-hire-seed",
)

def summarize_risk(candidate: Candidate, job: Job):
    lines = []

    # 1. Missing required skills
    missing_required = [s for s in job.required_skills if s not in candidate.resume_skills]
    if missing_required:
        lines.append(f"❌ Missing required skills: {missing_required}")

    # 2. Experience shortfall
    if candidate.years_experience < job.min_years_experience:
        lines.append(
            f"❌ Only {candidate.years_experience} yrs experience, job needs {job.min_years_experience}+"
        )

    # 3. Behavioral red flags
    red_flags = []
    for qa in candidate.behavioral_transcript:
        ans = qa.answer.lower()

        # doesn't delegate / hero mode
        if (
            "i just did it myself" in ans
            or "i fixed it all myself" in ans
            or "i don't like delegating" in ans
        ):
            red_flags.append("Does not delegate; could bottleneck team.")

        # not collaborative
        if (
            "other people slow me down" in ans
            or "i prefer to work alone" in ans
        ):
            red_flags.append("Prefers solo work; might fight team process.")

        # conflict escalation
        if "blame" in ans and "i made them admit" in ans:
            red_flags.append("May escalate tension instead of calming it.")

    if red_flags:
        lines.append("⚠ Behavioral concerns:")
        for flag in red_flags:
            lines.append(f"- {flag}")

    # 4. Final framing
    if not lines:
        lines.append("⚠ Risk: not clearly proven in our exact environment. Onboarding cost unknown.")
        confidence = 0.5
    else:
        lines.append("🚫 Recommendation: Do NOT hire yet. Could require mentorship/oversight we can't spare.")
        confidence = 0.8

    return "\n".join(lines), confidence


@anti_agent.on_message(model=DebateRequest)
async def handle_request(ctx: Context, sender: str, msg: DebateRequest):
    ctx.logger.info("ANTI agent received request.")

    # FIXED: pass the pieces, not msg itself
    argument, conf = summarize_risk(msg.candidate, msg.job)

    response = DebateResponse(
        stance="ANTI",
        argument=argument,
        confidence=conf
    )

    await ctx.send(msg.reply_to, response)
    ctx.logger.info("ANTI agent sent argument to judge.")


if __name__ == "__main__":
    anti_agent.run()