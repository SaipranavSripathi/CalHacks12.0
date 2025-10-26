from uagents import Bureau
from pro_agent import pro_agent
from anti_agent import anti_agent
from judge_agent import judge_agent
from orchestrator_agent import orchestrator_agent

print("RUN_ALL: starting up ✅")
print("PRO address:", pro_agent.address)
print("ANTI address:", anti_agent.address)
print("JUDGE address:", judge_agent.address)
print("ORCH address:", orchestrator_agent.address)

# Build the bureau with all 4 agents
bureau = Bureau()

bureau.add(pro_agent)
bureau.add(anti_agent)
bureau.add(judge_agent)
bureau.add(orchestrator_agent)

print("RUN_ALL: all agents added to bureau ✅")

# Run the bureau. This call should block and let agents talk.
bureau.run()