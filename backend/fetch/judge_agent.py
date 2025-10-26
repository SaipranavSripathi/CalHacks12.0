from uagents import Agent, Context
from models import DebateResponse

print("judge_agent.py: loaded ✅")

judge_agent = Agent(
    name="judge_agent",
    seed="judge-seed",
)

state = {
    "PRO": None,
    "ANTI": None,
}

@judge_agent.on_message(model=DebateResponse)
async def handle_responses(ctx: Context, sender: str, msg: DebateResponse):
    # record the latest message
    if msg.stance == "PRO":
        state["PRO"] = msg
        ctx.logger.info(f"\n🟩 PRO Agent says:\n{msg.argument}\n(conf: {msg.confidence})\n")
    elif msg.stance == "ANTI":
        state["ANTI"] = msg
        ctx.logger.info(f"\n🟥 ANTI Agent says:\n{msg.argument}\n(conf: {msg.confidence})\n")

    # once we have both sides, judge
    if state["PRO"] and state["ANTI"]:
        pro_msg = state["PRO"]
        anti_msg = state["ANTI"]

        # decision rule:
        # hire if PRO confidence is at least 0.1 higher than ANTI confidence
        hire = pro_msg.confidence >= anti_msg.confidence + 0.1

        if hire:
            verdict_header = "FINAL VERDICT: ✅ HIRE"
        else:
            verdict_header = "FINAL VERDICT: ❌ REJECT / HOLD"

        # Print full debate transcript
        ctx.logger.info(
            f"\n--- 🧠 DEBATE TRANSCRIPT ---\n"
            f"[PRO]: {pro_msg.argument}\n\n"
            f"[ANTI]: {anti_msg.argument}\n"
            f"-----------------------------\n"
        )

        # Final summary
        summary = (
            f"{verdict_header}\n\n"
            f"--- PRO (conf {pro_msg.confidence}): ---\n"
            f"{pro_msg.argument}\n\n"
            f"--- ANTI (conf {anti_msg.confidence}): ---\n"
            f"{anti_msg.argument}\n"
        )

        ctx.logger.info(summary)

        # reset for next candidate
        state["PRO"] = None
        state["ANTI"] = None


if __name__ == "__main__":
    judge_agent.run()
