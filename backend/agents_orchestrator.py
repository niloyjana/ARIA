"""
ARIA — Multi-Agent Orchestration Engine
Handles specialized agent definitions, task delegation, and collaborative synthesis.
"""

import os
import asyncio
import json
from typing import List, Dict, Any

class Agent:
    def __init__(self, name: str, role: str, goal: str, backstory: str):
        self.name = name
        self.role = role
        self.goal = goal
        self.backstory = backstory

    def build_prompt(self, context: str, user_query: str) -> str:
        return f"""
        PERSONALITY: {self.role}
        MISSION: {self.goal}
        BACKGROUND: {self.backstory}
        
        ---
        INPUT DATA / CONTEXT:
        {context}
        ---
        USER'S CURRENT REQUEST: {user_query}
        
        Provide your specialized report below. Focus strictly on your domain expertise.
        """

class AgentOrchestrator:
    def __init__(self, ask_ai_fn):
        self.ask_ai = ask_ai_fn
        
        # Define the ARIA Workforce
        self.auditor = Agent(
            name="Auditor",
            role="ARIA Senior Financial Auditor (Internal Data Specialist)",
            goal="Analyze the user's internal documents, Net Worth history, and financial stability.",
            backstory="You excel at finding hidden patterns in messy financial data and identifying risks in life insurance or tax adequacy."
        )
        
        self.market_intel = Agent(
            name="MarketIntel",
            role="ARIA Market Intelligence Specialist (External Data Specialist)",
            goal="Interpret live market shifts, NIFTY trends, and global indices to contextualize advice.",
            backstory="You are a quant trader who understands how macroeconomic shifts (inflation, rates) impact personal asset allocation."
        )
        
        self.manager = Agent(
            name="Manager",
            role="ARIA Chief Strategy Officer (Strategic Synthesis Agent)",
            goal="Synthesize reports from specialized agents into a single, cohesive, high-impact advice roadmap.",
            backstory="You ensure that the advice is not just accurate, but empathetic and actionable for the user."
        )

    async def run_chat_workflow(self, message: str, doc_context: str, market_data: Dict[str, Any]) -> str:
        """Sequential Multi-Agent Workflow: Auditor -> MarketIntel -> Strategic Synthesis."""
        
        print(f"🕵️ Agent Workforce activated for: {message[:30]}...")

        # 1. Auditor Analysis (Doc context + Message)
        auditor_prompt = self.auditor.build_prompt(doc_context, message)
        auditor_report = await self.ask_ai(auditor_prompt)
        print("✅ Auditor Agent finished analysis.")

        # 2. Market Intel Contextualization (Market Data + Auditor Report)
        market_context = f"Live Market Data: {json.dumps(market_data)}\n\nAuditor's Internal Findings:\n{auditor_report}"
        market_prompt = self.market_intel.build_prompt(market_context, message)
        market_report = await self.ask_ai(market_prompt)
        print("✅ Market Intelligence Agent finished contextualization.")

        # 3. Strategic Synthesis (User Message + Both Reports)
        final_context = f"AUDITOR REPORT: {auditor_report}\n\nMARKET INTEL REPORT: {market_report}"
        manager_prompt = self.manager.build_prompt(final_context, message)
        final_advice = await self.ask_ai(manager_prompt)
        print("🚀 Strategic Synthesis complete. Dispatching advice.")

        return final_advice

