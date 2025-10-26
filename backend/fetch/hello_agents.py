from uagents import Agent

agent = Agent(name="hello_agent", seed="test-seed")

@agent.on_interval(period=5.0)
async def say_hello(ctx):
    ctx.logger.info("Hello from Fetch.ai agent!")

if __name__ == "__main__":
    agent.run()
    