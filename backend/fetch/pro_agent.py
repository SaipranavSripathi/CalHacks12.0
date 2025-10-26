from uagents import Agent, Context
from models import Candidate, Job, DebateRequest, DebateResponse

print("pro_agent.py: loaded ✅")

pro_agent = Agent(
    name="pro_agent",
    seed="pro-hire-seed",
)


def summarize_strength(candidate: Candidate, job: Job) -> str:
    # 1. Required skills match
    matched = [s for s in job.required_skills if s in candidate.resume_skills]
    match_ratio = len(matched) / max(len(job.required_skills), 1)

    # 2. Experience check
    exp_ok = candidate.years_experience >= job.min_years_experience

    # 3. Culture traits evidence from transcript
    culture_hits = []
    for trait in job.culture_traits:
        for qa in candidate.behavioral_transcript:
            ans_lower = qa.answer.lower()

            # simple heuristic: trait phrase appears in answer
            if trait in ans_lower:
                culture_hits.append((trait, qa.answer))
                break

            # special heuristics for traits we care about
            if trait == "collaboration under pressure":
                if (
                    "conflict" in ans_lower
                    or "blam" in ans_lower  # blame/blaming
                    or "tension" in ans_lower
                    or "de-escalat" in ans_lower
                ):
                    culture_hits.append((trait, qa.answer))
                    break

            if trait == "bias for action":
                if (
                    "i jumped in" in ans_lower
                    or "i stepped in" in ans_lower
                    or "i just fixed it" in ans_lower
                ):
                    culture_hits.append((trait, qa.answer))
                    break

    lines = []
    lines.append(f"SKILL MATCH: {len(matched)}/{len(job.required_skills)} required skills => {matched}")
    lines.append(f"EXPERIENCE: {candidate.years_experience} yrs (job asks for {job.min_years_experience}+)")
    if culture_hits:
        lines.append("CULTURE FIT EXAMPLES:")
        for trait, evidence in culture_hits:
            lines.append(f"- {trait}: shown in answer -> \"{evidence}\"")

    # Projects / impact
    if candidate.projects:
        lines.append("IMPACTFUL PROJECTS:")
        for proj in candidate.projects:
            lines.append(f"- {proj}")

    # Final pitch logic
    if match_ratio >= 0.6 and exp_ok:
        conclusion = "✅ Strong match. Can execute with low hand-holding. We should hire."
        confidence = 0.8
    else:
        conclusion = "⚠ Slight gaps but high upside and strong behaviors. Worth hiring consideration."
        confidence = 0.6

    lines.append(conclusion)
    return "\n".join(lines), confidence


@pro_agent.on_message(model=DebateRequest)
async def handle_request(ctx: Context, sender: str, msg: DebateRequest):
    ctx.logger.info("PRO agent received request.")

    candidate = msg.candidate
    job = msg.job

    argument, conf = summarize_strength(candidate, job)

    response = DebateResponse(
        stance="PRO",
        argument=argument,
        confidence=conf
    )

    # send back to judge
    await ctx.send(msg.reply_to, response)
    ctx.logger.info("PRO agent sent argument to judge.")