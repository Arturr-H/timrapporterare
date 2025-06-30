from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import json
import os
from typing import List, Optional, Dict
from datetime import datetime
import re
import openai
from typing import Dict, List
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
import asyncio
from openai import AsyncOpenAI

async_openai_client = None
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8085"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Filvägar
FAVORITES_FILE = "favorites.json"
REPOS_FILE = "saved_repos.json"

class RepoRequest(BaseModel):
    url: str

class FavoriteRequest(BaseModel):
    repo_id: str
    action: str  # "add" eller "remove"

def load_json_file(filename, default=[]):
    """Ladda data från JSON-fil"""
    if os.path.exists(filename):
        with open(filename, 'r') as f:
            return json.load(f)
    return default

def save_json_file(filename, data):
    """Spara data till JSON-fil"""
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def parse_github_url(url: str) -> Dict[str, str]:
    """Parsa GitHub URL och extrahera owner och repo"""
    # Matcha olika GitHub URL-format
    patterns = [
        r"github\.com[/:]([^/]+)/([^/\.]+)",
        r"^([^/]+)/([^/\.]+)$"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return {
                "owner": match.group(1),
                "repo": match.group(2).replace(".git", ""),
                "full_name": f"{match.group(1)}/{match.group(2).replace('.git', '')}"
            }
    
    raise ValueError("Invalid GitHub URL format")

# Global variabel för AI prompt (laddas en gång)
AI_PROMPT = None

def load_ai_prompt():
    """Ladda AI prompt från fil (körs vid startup)"""
    global AI_PROMPT
    try:
        with open("ai-time-report-prompt.txt", "r", encoding="utf-8") as f:
            AI_PROMPT = f.read().strip()
    except FileNotFoundError:
        AI_PROMPT = "Du är en hjälpsam assistent som sammanställer timrapporter baserat på Git-commits."

# Lägg till i app startup event
@app.on_event("startup")
async def startup_event():
    global async_openai_client
    load_ai_prompt()
    # Sätt OpenAI API key från env
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        async_openai_client = AsyncOpenAI(api_key=api_key)

@app.get("/api/saved-repos")
async def get_saved_repos(authorization: Optional[str] = Header(None)):
    """Hämta sparade repositories med metadata"""
    if not authorization:
        raise HTTPException(status_code=401, detail="GitHub token saknas")
    
    saved_repos = load_json_file(REPOS_FILE, [])
    repos_with_metadata = []
    
    headers = {
        "Authorization": authorization,
        "Accept": "application/vnd.github.v3+json"
    }
    
    async with httpx.AsyncClient() as client:
        for repo_url in saved_repos:
            try:
                parsed = parse_github_url(repo_url)
                # Hämta repo metadata från GitHub
                response = await client.get(
                    f"https://api.github.com/repos/{parsed['full_name']}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    repo_data = response.json()
                    repos_with_metadata.append({
                        "id": repo_data["id"],
                        "name": repo_data["name"],
                        "full_name": repo_data["full_name"],
                        "owner": repo_data["owner"]["login"],
                        "organization": repo_data["owner"]["login"] if repo_data["owner"]["type"] == "Organization" else None,
                        "private": repo_data["private"],
                        "url": repo_data["html_url"],
                        "description": repo_data["description"]
                    })
                else:
                    # Om vi inte kan hämta metadata, använd basic info
                    repos_with_metadata.append({
                        "id": repo_url,
                        "name": parsed["repo"],
                        "full_name": parsed["full_name"],
                        "owner": parsed["owner"],
                        "organization": parsed["owner"],
                        "private": True,  # Anta privat om vi inte kan hämta
                        "url": repo_url,
                        "description": None
                    })
            except Exception as e:
                print(f"Error processing repo {repo_url}: {e}")
                continue
    
    # Lägg till favorit-status
    favorites = load_json_file(FAVORITES_FILE, [])
    for repo in repos_with_metadata:
        repo['is_favorite'] = str(repo['id']) in [str(f) for f in favorites]
    
    return repos_with_metadata

@app.post("/api/saved-repos")
async def add_saved_repo(request: RepoRequest):
    """Lägg till ett nytt repository"""
    try:
        parsed = parse_github_url(request.url)
        saved_repos = load_json_file(REPOS_FILE, [])
        
        # Normalisera URL
        normalized_url = f"https://github.com/{parsed['full_name']}"
        
        if normalized_url not in saved_repos:
            saved_repos.append(normalized_url)
            save_json_file(REPOS_FILE, saved_repos)
        
        return {"message": "Repository added", "repo": parsed['full_name']}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/saved-repos/{owner}/{repo}")
async def remove_saved_repo(owner: str, repo: str):
    """Ta bort ett sparat repository"""
    saved_repos = load_json_file(REPOS_FILE, [])
    full_name = f"{owner}/{repo}"
    url_to_remove = f"https://github.com/{full_name}"
    
    if url_to_remove in saved_repos:
        saved_repos.remove(url_to_remove)
        save_json_file(REPOS_FILE, saved_repos)
        return {"message": "Repository removed"}
    
    raise HTTPException(status_code=404, detail="Repository not found")

@app.get("/api/repos/{owner}/{repo}/pulls")
async def get_pull_requests(owner: str, repo: str, authorization: Optional[str] = Header(None)):
    """Hämta pull requests för ett specifikt repo"""
    if not authorization:
        raise HTTPException(status_code=401, detail="GitHub token saknas")
    
    headers = {
        "Authorization": authorization,
        "Accept": "application/vnd.github.v3+json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls",
            headers=headers,
            params={"state": "all", "per_page": 50, "sort": "created", "direction": "desc"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Kunde inte hämta PRs")
        
        return response.json()

@app.get("/api/repos/{owner}/{repo}/pulls/{pull_number}/commits")
async def get_pr_commits(owner: str, repo: str, pull_number: int, authorization: Optional[str] = Header(None)):
    """Hämta commits för en specifik pull request med detaljerad info"""
    if not authorization:
        raise HTTPException(status_code=401, detail="GitHub token saknas")
    
    headers = {
        "Authorization": authorization,
        "Accept": "application/vnd.github.v3+json"
    }
    
    async with httpx.AsyncClient() as client:
        # Hämta PR info först
        pr_response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}",
            headers=headers
        )
        
        if pr_response.status_code != 200:
            raise HTTPException(status_code=pr_response.status_code, detail="Kunde inte hämta PR info")
        
        pr_data = pr_response.json()
        
        # Hämta commits
        commits_response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/commits",
            headers=headers
        )
        
        if commits_response.status_code != 200:
            raise HTTPException(status_code=commits_response.status_code, detail="Kunde inte hämta commits")
        
        commits = commits_response.json()
        
        # Formatera commit-data
        formatted_commits = []
        for commit in commits:
            formatted_commits.append({
                "sha": commit["sha"][:7],  # Kort SHA
                "message": commit["commit"]["message"].split('\n')[0],  # Första raden
                "author": commit["commit"]["author"]["name"],
                "date": commit["commit"]["author"]["date"],
                "url": commit["html_url"]
            })
        
        return {
            "pull_number": pull_number,
            "pull_title": pr_data["title"],
            "pull_url": pr_data["html_url"],
            "repo_name": repo,
            "commit_count": len(commits),
            "commits": formatted_commits
        }

@app.get("/api/favorites")
async def get_favorites():
    """Hämta lista med favorit-repo IDs"""
    return {"favorites": load_json_file(FAVORITES_FILE, [])}

@app.post("/api/favorites")
async def update_favorite(request: FavoriteRequest):
    """Lägg till eller ta bort en favorit"""
    favorites = load_json_file(FAVORITES_FILE, [])
    repo_id = str(request.repo_id)
    
    # Konvertera alla favoriter till strings för konsistens
    string_favorites = [str(f) for f in favorites]
    
    if request.action == "add" and repo_id not in string_favorites:
        string_favorites.append(repo_id)
    elif request.action == "remove":
        string_favorites = [f for f in string_favorites if f != repo_id]
    
    save_json_file(FAVORITES_FILE, string_favorites)
    return {"favorites": string_favorites}

# Asana endpoints
@app.get("/api/asana/me")
async def get_asana_user(asana_token: Optional[str] = Header(None)):
    """Hämta current Asana user"""
    if not asana_token:
        raise HTTPException(status_code=401, detail="Asana token saknas")
    
    headers = {
        "Authorization": f"Bearer {asana_token}",
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://app.asana.com/api/1.0/users/me",
            headers=headers
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Kunde inte hämta Asana user")
        
        return response.json()

# I backend/main.py - ersätt get_asana_tasks funktionen med denna:

@app.get("/api/asana/tasks")
async def get_asana_tasks(asana_token: Optional[str] = Header(None)):
    """Hämta tasks assigned to current user"""
    if not asana_token:
        raise HTTPException(status_code=401, detail="Asana token saknas")
    
    headers = {
        "Authorization": f"Bearer {asana_token}",
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        # Först hämta user ID
        user_response = await client.get(
            "https://app.asana.com/api/1.0/users/me",
            headers=headers
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=user_response.status_code, detail="Kunde inte hämta user info")
        
        user_data = user_response.json()["data"]
        user_gid = user_data["gid"]
        workspace_gid = user_data["workspaces"][0]["gid"]  # Hämta första workspace

        tasks_response = await client.get(
            "https://app.asana.com/api/1.0/tasks",
            headers=headers,
            params={
                "assignee": user_gid,
                "workspace": workspace_gid,
                "completed_since": "now",
                "opt_fields": "name,completed,due_on,projects,permalink_url,created_at,modified_at,memberships.section.name"
            }
        )
        
        if tasks_response.status_code != 200:
            raise HTTPException(status_code=tasks_response.status_code, detail="Kunde inte hämta tasks")
        
        # Process tasks to extract section info
        tasks_data = tasks_response.json()["data"]
        processed_tasks = []
        
        for task in tasks_data:
            # Extract section from memberships
            section = None
            if "memberships" in task and task["memberships"]:
                for membership in task["memberships"]:
                    if "section" in membership and membership["section"]:
                        section = membership["section"].get("name", None)
                        break
            
            processed_task = {
                "gid": task["gid"],
                "name": task["name"],
                "due_on": task.get("due_on"),
                "permalink_url": task["permalink_url"],
                "section": section
            }
            processed_tasks.append(processed_task)
        
        return {"data": processed_tasks}

from typing import Dict, List, Optional

class AsanaTaskData(BaseModel):
    gid: str
    name: str
    due_on: Optional[str] = None
    permalink_url: str

class PRData(BaseModel):
    pull_title: str
    pull_url: str
    repo_name: str
    commit_count: int
    commits: List[Dict]
    asana_tasks: List[AsanaTaskData] = []  # Ny field för Asana tasks

class TimeReportRequest(BaseModel):
    commits: List[str]  # Lista med commit hashes
    pr_data: Dict[str, PRData]  # PR nummer -> PR data med commits och tasks

@app.post("/api/generate-time-report")
async def generate_time_report(request: TimeReportRequest):
    """Generera timrapport med AI baserat på valda commits och Asana tasks"""
    try:
        # Validera att vi har data
        if not request.commits:
            raise HTTPException(status_code=400, detail="Inga commits valda")
        
        if not request.pr_data:
            raise HTTPException(status_code=400, detail="Ingen PR data tillgänglig")
        
        # Skapa sammanställning
        pr_data_dict = {k: v.dict() for k, v in request.pr_data.items()}
        report_text = create_commit_summary(request.commits, pr_data_dict)
        
        # Logga för debugging
        print(f"Genererar rapport för {len(request.commits)} commits från {len(request.pr_data)} PRs")
        full_prompt = f"{AI_PROMPT}\n\n{report_text}"
        print(f"Full prompt:\n{full_prompt}\n")
        # Anropa ChatGPT
        try:
            ai_response = await call_chatgpt(report_text)
        
            return {
                "success": True,
                "report": ai_response,
                "original_summary": report_text,  # För debugging
                "stats": {
                    "total_commits": len(request.commits),
                    "total_prs": len(request.pr_data),
                    "total_tasks": sum(len(pr.asana_tasks) for pr in request.pr_data.values())
                }
            }
        except Exception as e:
            return {
                "success": True,
                "report": report_text,
                "original_summary": report_text,  # För debugging
                "stats": {
                    "total_commits": len(request.commits),
                    "total_prs": len(request.pr_data),
                    "total_tasks": sum(len(pr.asana_tasks) for pr in request.pr_data.values())
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_time_report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internt fel: {str(e)}")

@app.post("/api/generate-time-report-stream")
async def generate_time_report_stream(request: TimeReportRequest):
    """Generera timrapport med streaming AI respons"""
    try:
        if not request.commits:
            raise HTTPException(status_code=400, detail="Inga commits valda")
        
        if not request.pr_data:
            raise HTTPException(status_code=400, detail="Ingen PR data tillgänglig")
        
        # Skapa sammanställning
        pr_data_dict = {k: v.dict() for k, v in request.pr_data.items()}
        report_text = create_commit_summary(request.commits, pr_data_dict)
        
        async def generate():
            try:
                # Skicka initial metadata
                yield f"data: {json.dumps({'type': 'start', 'stats': {'total_commits': len(request.commits), 'total_prs': len(request.pr_data), 'total_tasks': sum(len(pr.asana_tasks) for pr in request.pr_data.values())}})}\n\n"
                
                # Anropa ChatGPT med streaming
                stream = await async_openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": AI_PROMPT},
                        {"role": "user", "content": report_text}
                    ],
                    temperature=0.7,
                    max_tokens=1000,
                    stream=True
                )
                
                async for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        # Escape newlines for SSE format
                        content = content.replace('\n', '\\n')
                        yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
                
                # Skicka complete signal
                yield f"data: {json.dumps({'type': 'complete'})}\n\n"
                
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        
        return EventSourceResponse(generate())
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in generate_time_report_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internt fel: {str(e)}")

def create_commit_summary(selected_commits: List[str], pr_data: Dict) -> str:
    """Skapa textsammanställning av valda commits grupperade per PR med Asana tasks"""
    summary_parts = []
    
    # Gruppera commits per PR
    for pr_number, pr_info in pr_data.items():
        pr_commits = []
        
        # Hitta alla commits som är valda för denna PR
        for commit in pr_info.get("commits", []):
            # Hantera både full SHA och kort SHA
            commit_sha = commit.get("sha", "")
            if commit_sha in selected_commits or commit_sha[:7] in selected_commits:
                pr_commits.append(commit)
        
        if pr_commits:
            # PR rubrik
            summary_parts.append(f"PULL REQUEST: {pr_info.get('pull_title', 'Untitled PR')} ({pr_info.get('pull_url', '')})")
            
            # Lägg till Asana tasks om de finns
            asana_tasks = pr_info.get("asana_tasks", [])
            for task in asana_tasks:
                task_name = task.get("name", "Untitled task")
                task_url = task.get("permalink_url", "")
                summary_parts.append(f'* Resolves task "{task_name}" ({task_url})')
            
            # Lägg till commits
            for commit in pr_commits:
                # Ta första raden av commit message
                message = commit.get("message", "No message").split('\n')[0]
                # sha = commit.get("sha", "")[:7]
                summary_parts.append(f"* Commit: {message}")
            
            summary_parts.append("\n\n")  # Tom rad mellan PRs
    
    return "\n".join(summary_parts)

async def call_chatgpt(report_text: str) -> str:
    """Anropa ChatGPT med rapport och prompt"""
    try:
        # Anropa OpenAI API (asynkront)
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",  # eller "gpt-4" om du har tillgång
            messages=[
                {"role": "system", "content": AI_PROMPT},
                {"role": "user", "content": report_text}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"ChatGPT API error: {str(e)}")



@app.get("/api/health")
async def health_check():
    """Hälsokontroll"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8086)
