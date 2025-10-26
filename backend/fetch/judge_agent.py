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
    elif msg.stance == "ANTI":
        state["ANTI"] = msg

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

        summary = (
            f"{verdict_header}\n\n"
            f"--- PRO (conf {pro_msg.confidence}): ---\n"
            f"{pro_msg.argument}\n\n"
            f"--- ANTI (conf {anti_msg.confidence}): ---\n"
            f"{anti_msg.argument}\n"
        )

        ctx.logger.info(summary)

        # reset so we're ready for another candidate later
        state["PRO"] = None
        state["ANTI"] = None


if __name__ == "__main__":
    judge_agent.run()